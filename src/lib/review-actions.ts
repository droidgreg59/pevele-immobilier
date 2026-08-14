"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";

export type ReviewFormState = { error?: string };

export async function upsertReviewAction(
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const agencyId = String(formData.get("agencyId") ?? "");
  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(`/professionnels/${agencyId}`)}`);
  }
  if (session.userId === agencyId) {
    return { error: "Vous ne pouvez pas noter votre propre agence." };
  }

  const note = Number(formData.get("note"));
  const commentaire = String(formData.get("commentaire") ?? "").trim();

  if (!Number.isInteger(note) || note < 1 || note > 5) {
    return { error: "Merci de choisir une note de 1 à 5." };
  }
  if (!commentaire) {
    return { error: "Merci d'ajouter un commentaire." };
  }

  const agency = await prisma.user.findFirst({
    where: { id: agencyId, type: "AGENCE" },
  });
  if (!agency) return { error: "Agence introuvable." };

  await prisma.review.upsert({
    where: { agencyId_authorId: { agencyId, authorId: session.userId } },
    update: { note, commentaire },
    create: { agencyId, authorId: session.userId, note, commentaire },
  });

  redirect(`/professionnels/${agencyId}`);
}

export async function deleteReviewAction(formData: FormData) {
  const agencyId = String(formData.get("agencyId") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");

  await prisma.review.deleteMany({
    where: { agencyId, authorId: session.userId },
  });

  redirect(`/professionnels/${agencyId}`);
}
