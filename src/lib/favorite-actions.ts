"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";

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
  }
}
