"use server";

import { getSession } from "./session";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { logEvent } from "./events";
import { getAgencyService } from "@/data/agency-services";
import { agencyServiceRequestEmail, agencyServiceConfirmationEmail } from "./email-templates";

export type ServiceRequestState = { error?: string; success?: boolean };

const ADMIN_EMAIL = "contact@pevele-immobilier.fr";

/**
 * Une agence demande un rendez-vous pour un service (site web, réseaux
 * sociaux). Alerte envoyée à l'exploitant + accusé de réception à l'agence.
 * Une même demande renvoyée dans les 24 h n'est pas redoublée (double clic,
 * retour arrière) : l'agence voit simplement la confirmation.
 */
export async function requestAgencyServiceAction(
  _prev: ServiceRequestState,
  formData: FormData
): Promise<ServiceRequestState> {
  const session = await getSession();
  if (!session || session.type !== "AGENCE") {
    return { error: "Réservé aux comptes agence. Reconnectez-vous." };
  }

  const service = getAgencyService(String(formData.get("service") ?? ""));
  if (!service) return { error: "Service inconnu." };

  const message = String(formData.get("message") ?? "").trim().slice(0, 1500) || null;
  const disponibilites = String(formData.get("disponibilites") ?? "").trim().slice(0, 300) || null;
  const telephone = String(formData.get("telephone") ?? "").trim().slice(0, 30) || null;

  const recent = await prisma.event.findFirst({
    where: {
      name: "agency_service_requested",
      userId: session.userId,
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      meta: { contains: `"service":"${service.id}"` },
    },
    select: { id: true },
  });
  if (recent) return { success: true };

  const agency = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { entreprise: true, nom: true, email: true, contactEmail: true, telephone: true },
  });
  if (!agency) return { error: "Compte introuvable." };
  const agenceNom = agency.entreprise ?? agency.nom;
  const replyTo = agency.contactEmail ?? agency.email;

  const admin = agencyServiceRequestEmail({
    service: service.nom,
    prix: service.bientot ? "à venir — demande à être prévenu" : `${service.prix} ${service.rythme}`,
    agence: agenceNom,
    email: replyTo,
    telephone: telephone ?? agency.telephone,
    message,
    disponibilites,
  });
  const sent = await sendEmail({ to: ADMIN_EMAIL, subject: admin.subject, html: admin.html });
  if (!sent) {
    return { error: "L'envoi a échoué. Réessayez dans un instant, ou écrivez-nous à contact@pevele-immobilier.fr." };
  }

  const confirmation = agencyServiceConfirmationEmail({
    service: service.nom,
    agence: agenceNom,
    interet: Boolean(service.bientot),
  });
  await sendEmail({ to: replyTo, subject: confirmation.subject, html: confirmation.html });

  await logEvent("agency_service_requested", {
    userId: session.userId,
    path: "/compte/agence/services",
    meta: { service: service.id },
  });

  return { success: true };
}
