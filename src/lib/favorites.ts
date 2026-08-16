import "server-only";
import { prisma } from "./prisma";
import { listingWithOwner, type ListingWithOwner } from "./listings";

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

export async function getFavoriteCount(userId: string): Promise<number> {
  return prisma.favorite.count({ where: { userId } });
}

export type FavoriteHubEntry = {
  id: string;
  visite: boolean;
  surveillePrix: boolean;
  contacte: boolean;
  createdAt: Date;
  listing: ListingWithOwner;
};

export async function getFavoritesHub(userId: string): Promise<FavoriteHubEntry[]> {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      visite: true,
      surveillePrix: true,
      contacte: true,
      createdAt: true,
      listing: listingWithOwner,
    },
  });
}
