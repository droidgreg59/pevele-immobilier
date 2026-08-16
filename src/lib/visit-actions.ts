"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";

export type VisitFormState = { error?: string; success?: boolean };

export async function createVisitRequestAction(
  _prevState: VisitFormState,
  formData: FormData
): Promise<VisitFormState> {
  const listingId = String(formData.get("listingId") ?? "");
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Annonce introuvable." };

  const detailPath = `/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listingId}`;
  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(detailPath)}`);
  }
  if (listing.ownerId === session.userId) {
    return { error: "Vous ne pouvez pas demander une visite pour votre propre annonce." };
  }

  const message = String(formData.get("message") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const preferredDateRaw = String(formData.get("preferredDate") ?? "").trim();

  if (!message) {
    return { error: "Merci d'ajouter un message." };
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
      telephone: telephone || null,
      preferredDate,
    },
  });

  return { success: true };
}

export async function updateVisitStatusAction(id: string, traite: boolean) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  await prisma.visitRequest.updateMany({
    where: { id, listing: { ownerId: session.userId } },
    data: { traite },
  });
}
