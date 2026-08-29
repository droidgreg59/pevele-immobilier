"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { devisRequestReceivedEmail } from "./email-templates";

export type DevisFormState = { error?: string; success?: boolean };

export async function createDevisRequestAction(
  _prevState: DevisFormState,
  formData: FormData
): Promise<DevisFormState> {
  const artisanId = String(formData.get("artisanId") ?? "");
  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(`/artisans/${artisanId}`)}`);
  }
  if (session.userId === artisanId) {
    return { error: "Vous ne pouvez pas demander un devis à votre propre fiche." };
  }

  const message = String(formData.get("message") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();

  if (!message) {
    return { error: "Merci de décrire votre besoin." };
  }

  const artisan = await prisma.user.findFirst({
    where: { id: artisanId, type: "ARTISAN" },
  });
  if (!artisan) return { error: "Artisan introuvable." };

  await prisma.devisRequest.create({
    data: {
      artisanId,
      authorId: session.userId,
      message,
      telephone: telephone || null,
    },
  });

  const { subject, html } = devisRequestReceivedEmail({ authorNom: session.nom, message });
  await sendEmail({ to: artisan.email, subject, html });

  return { success: true };
}

export async function updateDevisStatusAction(id: string, traite: boolean) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  await prisma.devisRequest.updateMany({
    where: { id, artisanId: session.userId },
    data: { traite },
  });
}
