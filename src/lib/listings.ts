import "server-only";
import { Prisma } from "@prisma/client";
import type { TransactionType } from "@prisma/client";
import { prisma } from "./prisma";

const listingWithOwner = Prisma.validator<Prisma.ListingDefaultArgs>()({
  include: { owner: { select: { nom: true, entreprise: true, type: true } } },
});

export type ListingWithOwner = Prisma.ListingGetPayload<typeof listingWithOwner>;

export async function getPublicListings(
  transaction: TransactionType
): Promise<ListingWithOwner[]> {
  return prisma.listing.findMany({
    where: { transaction, statut: "PUBLIEE" },
    orderBy: { createdAt: "desc" },
    ...listingWithOwner,
  });
}

export async function getPublicListingsByVillage(
  villageSlug: string
): Promise<ListingWithOwner[]> {
  return prisma.listing.findMany({
    where: { villageSlug, statut: "PUBLIEE" },
    orderBy: { createdAt: "desc" },
    ...listingWithOwner,
  });
}

export async function getListingById(
  id: string
): Promise<ListingWithOwner | null> {
  return prisma.listing.findUnique({ where: { id }, ...listingWithOwner });
}

export async function getListingsByUser(
  userId: string
): Promise<ListingWithOwner[]> {
  return prisma.listing.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    ...listingWithOwner,
  });
}

export type CreateListingInput = {
  ownerId: string;
  transaction: TransactionType;
  titre: string;
  description: string;
  prix: number;
  villageSlug: string;
  commune: string;
  pieces: number;
  chambres: number;
  surface: number;
  exterieur: string;
  dpe?: string;
};

export async function createListing(input: CreateListingInput) {
  return prisma.listing.create({
    data: { ...input, dpe: input.dpe || null },
  });
}
