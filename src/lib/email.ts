import "server-only";
import { Resend } from "resend";

/**
 * Envoi d'emails transactionnels via Resend. Ne lève jamais d'exception —
 * un échec d'envoi (clé manquante, API indisponible…) ne doit jamais casser
 * l'action métier qui l'a déclenché (créer une visite, accepter un mandat…).
 * Chaque appelant peut ignorer la valeur de retour ; elle sert surtout aux
 * tests/diagnostics.
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Pévèle Immobilier <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY manquant — email non envoyé (${subject} → ${to})`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`[email] Échec d'envoi (${subject} → ${to}) :`, error);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[email] Échec d'envoi (${subject} → ${to}) :`, e);
    return false;
  }
}
