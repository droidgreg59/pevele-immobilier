"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { isValidPhoneNumber, isDateAfterToday } from "./validation";
import { sendEmail } from "./email";
import { visitRequestReceivedEmail } from "./email-templates";
import { sendPushNotification } from "./push";
import { logEvent } from "./events";
import { verifyTurnstile } from "./turnstile";
import { fullName } from "./format";

export type VisitFormState = { error?: string; success?: boolean; ownerIsAgency?: boolean };

export async function createVisitRequestAction(
  _prevState: VisitFormState,
  formData: FormData
): Promise<VisitFormState> {
  const listingId = String(formData.get("listingId") ?? "");
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { owner: { select: { email: true, type: true } } },
  });
  if (!listing) return { error: "Annonce introuvable." };

  const detailPath = `/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listingId}`;
  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(detailPath)}`);
  }
  if (listing.ownerId === session.userId) {
    return { error: "Vous ne pouvez pas demander une visite pour votre propre annonce." };
  }
  if (!(await verifyTurnstile(formData, "visit_request"))) {
    return { error: "Vérification anti-robot échouée. Merci de réessayer." };
  }

  const message = String(formData.get("message") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const preferredDateRaw = String(formData.get("preferredDate") ?? "").trim();

  if (!message) {
    return { error: "Merci d'ajouter un message." };
  }
  if (!telephone) {
    return { error: "Merci d'indiquer votre téléphone." };
  }
  if (!isValidPhoneNumber(telephone)) {
    return { error: "Merci d'indiquer un numéro de téléphone valide." };
  }
  if (preferredDateRaw && !isDateAfterToday(preferredDateRaw)) {
    return { error: "La date souhaitée doit être postérieure à aujourd'hui." };
  }

  const preferredDate = preferredDateRaw ? new Date(preferredDateRaw) : null;
  if (preferredDate && Number.isNaN(preferredDate.getTime())) {
    return { error: "Date souhaitée invalide." };
  }

  await prisma.visitRequest.create({
    data: {
      listingId,
      authorId: session.userId,
      message,
      telephone,
      preferredDate,
    },
  });

  const author = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { prenom: true },
  });
  const authorNom = fullName(author?.prenom, session.nom);

  const { subject, html } = visitRequestReceivedEmail({
    listingTitre: listing.titre,
    listingHref: detailPath,
    authorNom,
    message,
  });
  await sendEmail({ to: listing.owner.email, subject, html });
  await sendPushNotification(listing.ownerId, {
    title: "Nouvelle demande de visite",
    body: `${authorNom} souhaite visiter « ${listing.titre} ».`,
    url: "/compte",
  });
  await logEvent("visit_requested", {
    userId: session.userId,
    path: detailPath,
    meta: { transaction: listing.transaction },
  });

  return { success: true, ownerIsAgency: listing.owner.type === "AGENCE" };
}

export async function updateVisitStatusAction(id: string, traite: boolean) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  await prisma.visitRequest.updateMany({
    where: { id, listing: { ownerId: session.userId } },
    data: { traite },
  });
}
