"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin";
import { prisma } from "./prisma";

export async function adminDeleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("reviewId") ?? "");
  if (!id) return;
  await prisma.review.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/avis");
}

export type OfficialReviewFormState = { error?: string };

export async function addOfficialReviewAction(
  _prevState: OfficialReviewFormState,
  formData: FormData
): Promise<OfficialReviewFormState> {
  const session = await requireAdmin();

  const agencyId = String(formData.get("agencyId") ?? "");
  const note = Number(formData.get("note"));
  const commentaire = String(formData.get("commentaire") ?? "").trim();

  if (!agencyId) return { error: "Merci de choisir une agence." };
  if (!Number.isInteger(note) || note < 1 || note > 5) {
    return { error: "Merci de choisir une note de 1 à 5." };
  }
  if (!commentaire) return { error: "Merci d'ajouter un commentaire." };

  const agency = await prisma.user.findFirst({ where: { id: agencyId, type: "AGENCE" } });
  if (!agency) return { error: "Agence introuvable." };

  await prisma.review.upsert({
    where: { agencyId_authorId: { agencyId, authorId: session.userId } },
    update: { note, commentaire, isOfficial: true },
    create: { agencyId, authorId: session.userId, note, commentaire, isOfficial: true },
  });

  revalidatePath("/admin/avis");
  revalidatePath(`/professionnels/${agencyId}`);
  return {};
}
