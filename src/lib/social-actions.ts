"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin";
import { prisma } from "./prisma";
import { parisLocalToUtc, validateCaptions } from "./social-rules";
import { processSocialPost } from "./social";

export type SocialActionState = { error?: string; ok?: string };

const PATH = "/admin/publications";

/** Enregistre les textes, la date, les réseaux — uniquement tant que rien n'est parti. */
export async function saveSocialPostAction(_prev: SocialActionState, formData: FormData): Promise<SocialActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const post = await prisma.socialPost.findUnique({ where: { id } });
  if (!post) return { error: "Publication introuvable." };
  if (post.fbPublishedAt || post.igPublishedAt || post.statut === "EN_COURS") {
    return { error: "Déjà (en partie) publiée : plus modifiable." };
  }
  const captionFacebook = String(formData.get("captionFacebook") ?? "").trim();
  const captionInstagram = String(formData.get("captionInstagram") ?? "").trim();
  const err = validateCaptions(captionFacebook, captionInstagram);
  if (err) return { error: err };
  const scheduledAt = parisLocalToUtc(String(formData.get("scheduledAt") ?? ""));
  if (!scheduledAt) return { error: "Date de publication invalide." };
  const facebook = formData.get("facebook") === "on";
  const instagram = formData.get("instagram") === "on";
  if (!facebook && !instagram) return { error: "Choisissez au moins un réseau." };

  await prisma.socialPost.update({
    where: { id },
    // Toute modification d'une publication validée la renvoie en brouillon : on revalide ce qu'on publie.
    data: { captionFacebook, captionInstagram, scheduledAt, facebook, instagram, statut: "BROUILLON", approvedAt: null, approvedBy: null, error: null },
  });
  revalidatePath(PATH);
  return { ok: "Enregistré (à valider de nouveau)." };
}

export async function approveSocialPostAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.socialPost.updateMany({
    where: { id, statut: { in: ["BROUILLON", "ECHEC"] } },
    data: { statut: "VALIDEE", approvedAt: new Date(), approvedBy: admin.userId, error: null },
  });
  revalidatePath(PATH);
}

export async function unapproveSocialPostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.socialPost.updateMany({
    where: { id, statut: "VALIDEE" },
    data: { statut: "BROUILLON", approvedAt: null, approvedBy: null },
  });
  revalidatePath(PATH);
}

/** Publie tout de suite une publication VALIDÉE (ou reprend une publication en cours). */
export async function publishNowSocialPostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const post = await prisma.socialPost.findUnique({ where: { id }, select: { statut: true } });
  if (post?.statut === "VALIDEE") {
    await prisma.socialPost.update({ where: { id }, data: { scheduledAt: new Date() } });
  }
  if (post?.statut === "VALIDEE" || post?.statut === "EN_COURS") {
    await processSocialPost(id, 50_000);
  }
  revalidatePath(PATH);
}

export async function deleteSocialPostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  // Jamais une publication déjà partie : elle resterait en ligne sans trace ici.
  await prisma.socialPost.deleteMany({ where: { id, fbPublishedAt: null, igPublishedAt: null, statut: { not: "EN_COURS" } } });
  revalidatePath(PATH);
}
