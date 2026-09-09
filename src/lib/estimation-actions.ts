"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { isValidPhoneNumber, isDateAfterToday } from "./validation";
import { sendEmail } from "./email";
import { estimationRequestReceivedEmail, estimationRequestRespondedEmail } from "./email-templates";
import { logEvent } from "./events";

export type EstimationFormState = { error?: string; success?: boolean };

export async function createEstimationRequestAction(
  _prevState: EstimationFormState,
  formData: FormData
): Promise<EstimationFormState> {
  const agencyId = String(formData.get("agencyId") ?? "");
  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(`/professionnels/${agencyId}`)}`);
  }
  if (session.userId === agencyId) {
    return { error: "Vous ne pouvez pas demander une estimation à votre propre agence." };
  }

  const adresse = String(formData.get("adresse") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const dateRaw = String(formData.get("preferredDate") ?? "").trim();
  const timeRaw = String(formData.get("preferredTime") ?? "").trim();

  if (!adresse) return { error: "Merci d'indiquer l'adresse du bien." };
  if (!nom) return { error: "Merci d'indiquer votre nom et prénom." };
  if (!telephone) return { error: "Merci d'indiquer votre téléphone." };
  if (!isValidPhoneNumber(telephone)) {
    return { error: "Merci d'indiquer un numéro de téléphone valide." };
  }
  if (!dateRaw || !timeRaw) return { error: "Merci d'indiquer une date et une heure souhaitées." };
  if (!isDateAfterToday(dateRaw)) {
    return { error: "La date souhaitée doit être postérieure à aujourd'hui." };
  }

  const preferredDate = new Date(`${dateRaw}T${timeRaw}`);
  if (Number.isNaN(preferredDate.getTime())) {
    return { error: "Date ou heure invalide." };
  }

  const agency = await prisma.user.findFirst({
    where: { id: agencyId, type: "AGENCE" },
  });
  if (!agency) return { error: "Agence introuvable." };

  await prisma.estimationRequest.create({
    data: {
      agencyId,
      authorId: session.userId,
      adresse,
      nom,
      telephone,
      preferredDate,
    },
  });

  const { subject, html } = estimationRequestReceivedEmail({ adresse, authorNom: session.nom });
  await sendEmail({ to: agency.email, subject, html });
  await logEvent("estimation_requested", {
    userId: session.userId,
    path: `/professionnels/${agencyId}`,
  });

  return { success: true };
}

export async function respondToEstimationRequestAction(formData: FormData) {
  const estimationRequestId = String(formData.get("estimationRequestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (decision !== "accept" && decision !== "refuse") redirect("/compte");

  const existing = await prisma.estimationRequest.findFirst({
    where: { id: estimationRequestId, agencyId: session.userId, statut: "EN_ATTENTE" },
    select: { author: { select: { email: true } }, agency: { select: { nom: true, entreprise: true } } },
  });

  await prisma.estimationRequest.updateMany({
    where: { id: estimationRequestId, agencyId: session.userId, statut: "EN_ATTENTE" },
    data: {
      statut: decision === "accept" ? "ACCEPTEE" : "REFUSEE",
      respondedAt: new Date(),
    },
  });

  if (existing) {
    const { subject, html } = estimationRequestRespondedEmail({
      agencyNom: existing.agency.entreprise ?? existing.agency.nom,
      accepted: decision === "accept",
    });
    await sendEmail({ to: existing.author.email, subject, html });
  }

  redirect("/compte");
}
