"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { financingRequestReceivedEmail } from "./email-templates";
import { sendPushNotification } from "./push";
import { logEvent } from "./events";
import { verifyTurnstile } from "./turnstile";

export type FinancingFormState = { error?: string; success?: boolean };

export async function createFinancingRequestAction(
  _prevState: FinancingFormState,
  formData: FormData
): Promise<FinancingFormState> {
  const courtierId = String(formData.get("courtierId") ?? "");
  const listingId = String(formData.get("listingId") ?? "").trim() || null;
  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(`/courtiers/${courtierId}`)}`);
  }
  if (session.userId === courtierId) {
    return { error: "Vous ne pouvez pas demander une étude à votre propre fiche." };
  }
  if (!(await verifyTurnstile(formData, "financing_request"))) {
    return { error: "Vérification anti-robot échouée. Merci de réessayer." };
  }

  const message = String(formData.get("message") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();

  if (!message) {
    return { error: "Merci de décrire votre projet." };
  }

  const courtier = await prisma.user.findFirst({
    where: { id: courtierId, type: "COURTIER", verifStatut: "VERIFIEE" },
  });
  if (!courtier) return { error: "Courtier introuvable." };

  const listing = listingId
    ? await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } })
    : null;

  await prisma.financingRequest.create({
    data: {
      courtierId,
      authorId: session.userId,
      listingId: listing?.id ?? null,
      message,
      telephone: telephone || null,
    },
  });

  const { subject, html } = financingRequestReceivedEmail({ authorNom: session.nom, message });
  await sendEmail({ to: courtier.email, subject, html });
  await sendPushNotification(courtierId, {
    title: "Nouvelle demande d'étude de financement",
    body: `${session.nom} vous a envoyé une demande d'étude de financement.`,
    url: "/compte",
  });
  await logEvent("financing_requested", {
    userId: session.userId,
    path: `/courtiers/${courtierId}`,
  });

  return { success: true };
}

export async function updateFinancingStatusAction(id: string, traite: boolean) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  await prisma.financingRequest.updateMany({
    where: { id, courtierId: session.userId },
    data: { traite },
  });
}
