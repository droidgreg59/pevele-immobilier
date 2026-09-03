import "server-only";
import { Prisma } from "@prisma/client";
import type { TransactionType, TypeBien, TypeMaison } from "@prisma/client";
import { prisma } from "./prisma";
import { saveRemotePhotos, deletePhotoFilesByUrl } from "./photo-upload";

export const listingWithOwner = Prisma.validator<Prisma.ListingDefaultArgs>()({
  include: {
    owner: { select: { nom: true, entreprise: true, type: true, logoUrl: true } },
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

/** Annonces publiées d'un type et d'une transaction donnés dans une commune — pages d'atterrissage SEO. */
export async function getListingsForIntent(
  villageSlug: string,
  typeBien: TypeBien,
  transaction: TransactionType
): Promise<ListingWithOwner[]> {
  return prisma.listing.findMany({
    where: { villageSlug, typeBien, transaction, statut: "PUBLIEE" },
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

export async function getPublicListingsByOwner(
  ownerId: string
): Promise<ListingWithOwner[]> {
  return prisma.listing.findMany({
    where: { ownerId, statut: "PUBLIEE" },
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

/** Comme `getListingForEdit`, mais sans vérification de propriétaire — réservé au back-office admin. */
export async function getListingForEditAsAdmin(
  id: string
): Promise<ListingWithOwner | null> {
  return prisma.listing.findUnique({ where: { id }, ...listingWithOwner });
}

export type ListingFieldsInput = {
  transaction: TransactionType;
  typeBien: TypeBien;
  typeMaison?: TypeMaison | null;
  titre: string;
  description: string;
  prix: number;
  villageSlug: string;
  commune: string;
  pieces: number;
  chambres: number;
  surface: number;
  exterieur: string;
  equipements: string;
  dpe?: string;
  modeChauffage?: string | null;
  videoUrl?: string;
  visiteVirtuelleUrl?: string;
  /**
   * Modes de visite. Omis par l'import de flux (les valeurs par défaut Prisma
   * s'appliquent à la création, l'existant est laissé tel quel en mise à jour) ;
   * toujours renseignés explicitement depuis le formulaire d'annonce.
   */
  visitesIndividuelles?: boolean;
  visitesGroupees?: boolean;
};

export type CreateListingInput = ListingFieldsInput & { ownerId: string };

export async function createListing(input: CreateListingInput) {
  const { ownerId, ...fields } = input;
  return prisma.listing.create({
    data: {
      ...fields,
      dpe: fields.dpe || null,
      videoUrl: fields.videoUrl || null,
      visiteVirtuelleUrl: fields.visiteVirtuelleUrl || null,
      owner: { connect: { id: ownerId } },
      priceHistory: { create: [{ prix: fields.prix }] },
    },
  });
}

async function applyListingUpdate(
  id: string,
  existing: { statut: string; prix: number },
  input: ListingFieldsInput
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.listing.update({
      where: { id },
      data: {
        ...input,
        dpe: input.dpe || null,
        videoUrl: input.videoUrl || null,
        visiteVirtuelleUrl: input.visiteVirtuelleUrl || null,
        // Une annonce refusée repasse en vérification après correction.
        ...(existing.statut === "REFUSEE"
          ? { statut: "EN_VERIFICATION" as const, statutRaison: null }
          : {}),
      },
    });
    if (input.prix !== existing.prix) {
      await tx.priceHistory.create({ data: { listingId: id, prix: input.prix } });
    }
    return updated;
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
  return applyListingUpdate(id, existing, input);
}

/** Comme `updateListing`, mais sans vérification de propriétaire — réservé au back-office admin. */
export async function adminUpdateListing(id: string, input: ListingFieldsInput) {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) return null;
  return applyListingUpdate(id, existing, input);
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

/** Comme `deleteListing`, mais sans vérification de propriétaire — réservé au back-office admin. */
export async function adminDeleteListing(id: string) {
  const existing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!existing) return null;
  await prisma.listing.delete({ where: { id } });
  return existing;
}

export type ImportedListingInput = ListingFieldsInput & {
  externalRef: string;
  importSource: string;
  photoUrls: string[];
};

/**
 * Crée ou met à jour une annonce issue d'un flux XML d'agence, identifiée
 * par (ownerId, externalRef). Contrairement aux annonces saisies à la main,
 * publiée directement (statut PUBLIEE) : l'agence est déjà un compte
 * vérifié et le flux est sa propre source officielle, donc la vérification
 * manuelle habituelle ne s'applique pas ici.
 */
export async function upsertImportedListing(
  ownerId: string,
  input: ImportedListingInput
): Promise<{ id: string; created: boolean }> {
  const { externalRef, importSource, photoUrls, ...fields } = input;
  const fieldsData = {
    ...fields,
    typeMaison: fields.typeMaison ?? null,
    modeChauffage: fields.modeChauffage || null,
    dpe: fields.dpe || null,
    videoUrl: fields.videoUrl || null,
    visiteVirtuelleUrl: fields.visiteVirtuelleUrl || null,
  };

  const existing = await prisma.listing.findUnique({
    where: { ownerId_externalRef: { ownerId, externalRef } },
  });

  if (!existing) {
    const created = await prisma.listing.create({
      data: {
        ...fieldsData,
        statut: "PUBLIEE",
        externalRef,
        importSource,
        owner: { connect: { id: ownerId } },
        priceHistory: { create: [{ prix: fields.prix }] },
      },
    });
    const savedUrls = await saveRemotePhotos(created.id, photoUrls);
    await addListingPhotos(created.id, savedUrls);
    return { id: created.id, created: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.listing.update({ where: { id: existing.id }, data: fieldsData });
    if (fields.prix !== existing.prix) {
      await tx.priceHistory.create({ data: { listingId: existing.id, prix: fields.prix } });
    }
  });

  const savedUrls = await saveRemotePhotos(existing.id, photoUrls);
  if (savedUrls.length > 0) {
    const oldPhotos = await prisma.listingPhoto.findMany({ where: { listingId: existing.id } });
    await prisma.listingPhoto.deleteMany({ where: { listingId: existing.id } });
    await deletePhotoFilesByUrl(oldPhotos.map((p) => p.url));
    await addListingPhotos(existing.id, savedUrls);
  }

  return { id: existing.id, created: false };
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
