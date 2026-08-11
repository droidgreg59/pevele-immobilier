import "server-only";
import { Prisma } from "@prisma/client";
import type { TransactionType } from "@prisma/client";
import { prisma } from "./prisma";

const listingWithOwner = Prisma.validator<Prisma.ListingDefaultArgs>()({
  include: {
    owner: { select: { nom: true, entreprise: true, type: true } },
    photos: { orderBy: { order: "asc" } },
    priceHistory: {
      orderBy: { changedAt: "asc" },
      take: 1,
      select: { prix: true },
    },
  },
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

export async function getListingsFavoritedBy(
  userId: string
): Promise<ListingWithOwner[]> {
  return prisma.listing.findMany({
    where: { favorites: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    ...listingWithOwner,
  });
}

export async function getListingForEdit(
  id: string,
  ownerId: string
): Promise<ListingWithOwner | null> {
  const listing = await prisma.listing.findUnique({
    where: { id },
    ...listingWithOwner,
  });
  if (!listing || listing.ownerId !== ownerId) return null;
  return listing;
}

export type ListingFieldsInput = {
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

export type CreateListingInput = ListingFieldsInput & { ownerId: string };

export async function createListing(input: CreateListingInput) {
  const { ownerId, ...fields } = input;
  return prisma.listing.create({
    data: {
      ...fields,
      dpe: fields.dpe || null,
      owner: { connect: { id: ownerId } },
      priceHistory: { create: [{ prix: fields.prix }] },
    },
  });
}

/** Renvoie `null` si l'annonce n'existe pas ou n'appartient pas à `ownerId`. */
export async function updateListing(
  id: string,
  ownerId: string,
  input: ListingFieldsInput
) {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.listing.update({
      where: { id },
      data: { ...input, dpe: input.dpe || null },
    });
    if (input.prix !== existing.prix) {
      await tx.priceHistory.create({ data: { listingId: id, prix: input.prix } });
    }
    return updated;
  });
}

/** Renvoie `null` si l'annonce n'existe pas ou n'appartient pas à `ownerId`. */
export async function deleteListing(id: string, ownerId: string) {
  const existing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!existing || existing.ownerId !== ownerId) return null;
  await prisma.listing.delete({ where: { id } });
  return existing;
}

export async function addListingPhotos(listingId: string, urls: string[]) {
  if (urls.length === 0) return;
  const startOrder = await prisma.listingPhoto.count({ where: { listingId } });
  await prisma.listingPhoto.createMany({
    data: urls.map((url, i) => ({ listingId, url, order: startOrder + i })),
  });
}

export async function removeListingPhotos(ids: string[]) {
  if (ids.length === 0) return [];
  const photos = await prisma.listingPhoto.findMany({ where: { id: { in: ids } } });
  await prisma.listingPhoto.deleteMany({ where: { id: { in: ids } } });
  return photos;
}

export type PriceHistoryEntry = { id: string; prix: number; changedAt: Date };

export async function getPriceHistory(
  listingId: string
): Promise<PriceHistoryEntry[]> {
  return prisma.priceHistory.findMany({
    where: { listingId },
    orderBy: { changedAt: "asc" },
    select: { id: true, prix: true, changedAt: true },
  });
}
