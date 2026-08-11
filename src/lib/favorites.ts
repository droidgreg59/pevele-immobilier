import "server-only";
import { prisma } from "./prisma";

export async function getFavoriteListingIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { listingId: true },
  });
  return new Set(rows.map((r) => r.listingId));
}

export async function isListingFavorited(
  userId: string,
  listingId: string
): Promise<boolean> {
  const row = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });
  return row !== null;
}
