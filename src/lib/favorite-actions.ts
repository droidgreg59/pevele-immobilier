"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { logEvent } from "./events";

export async function toggleFavoriteAction(listingId: string, next?: string) {
  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(next || "/")}`);
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: session.userId, listingId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({
      data: { userId: session.userId, listingId },
    });
    await logEvent("favorite_added", { userId: session.userId, path: next ?? null });
  }
}

const FAVORITE_TAGS = ["visite", "surveillePrix", "contacte"] as const;
export type FavoriteTag = (typeof FAVORITE_TAGS)[number];

export async function updateFavoriteTagAction(
  listingId: string,
  tag: FavoriteTag,
  value: boolean
) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (!FAVORITE_TAGS.includes(tag)) return;

  await prisma.favorite.update({
    where: { userId_listingId: { userId: session.userId, listingId } },
    data: { [tag]: value },
  });
}
