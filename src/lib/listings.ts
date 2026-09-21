import "server-only";
import { Prisma } from "@prisma/client";
import type { TransactionType, TypeBien, TypeMaison } from "@prisma/client";
import { prisma } from "./prisma";
import { saveRemotePhotos, deletePhotoFilesByUrl } from "./photo-upload";
import { listingRevivalFields } from "./listing-revival";

export const listingWithOwner = Prisma.validator<Prisma.ListingDefaultArgs>()({
  include: {
    owner: { select: { nom: true, entreprise: true, type: true, logoUrl: true, verifStatut: true } },
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

/**
 * Biens comparables à afficher en bas de fiche : même transaction, même type,
 * budget proche (±35 %), dans la commune ou les communes voisines fournies,
 * en excluant l'annonce courante. Sert l'engagement et le maillage interne.
 */
export async function getSimilarListings(
  listing: Pick<
    ListingWithOwner,
    "id" | "transaction" | "typeBien" | "prix" | "villageSlug"
  >,
  nearbySlugs: string[],
  take = 4
): Promise<ListingWithOwner[]> {
  return prisma.listing.findMany({
    where: {
      id: { not: listing.id },
      statut: "PUBLIEE",
      transaction: listing.transaction,
      typeBien: listing.typeBien,
      villageSlug: { in: [listing.villageSlug, ...nearbySlugs] },
      prix: {
        gte: Math.round(listing.prix * 0.65),
        lte: Math.round(listing.prix * 1.35),
      },
    },
    orderBy: { createdAt: "desc" },
    take,
    ...listingWithOwner,
  });
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
  ges?: string;
  dpeConsommation?: number | null;
  dpeEmissions?: number | null;
  dpeCoutMin?: number | null;
  dpeCoutMax?: number | null;
  dpeCoutAnneeRef?: number | null;
  dpeDate?: Date | null;
  modeChauffage?: string | null;
  /**
   * Frais & charges (voir schema.prisma). Renseignés par le formulaire
   * d'annonce ; omis par l'import de flux tant que les balises AC3
   * correspondantes n'ont pas été inspectées.
   */
  honoraires?: number | null;
  honorairesCharge?: string | null;
  chargesCopro?: number | null;
  taxeFonciere?: number | null;
  chargesLoc?: number | null;
  depotGarantie?: number | null;
  meuble?: boolean | null;
  /** Caractéristiques détaillées (voir schema.prisma). Formulaire d'annonce uniquement. */
  anneeConstruction?: number | null;
  etat?: string | null;
  exposition?: string | null;
  surfaceTerrain?: number | null;
  etage?: number | null;
  ascenseur?: boolean | null;
  nbSallesDeBain?: number | null;
  stationnement?: string | null;
  chauffageType?: string | null;
  fibre?: boolean | null;
  assainissement?: string | null;
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
      ...dpeData(fields),
      ...fraisData(fields),
      ...caracData(fields),
      videoUrl: fields.videoUrl || null,
      visiteVirtuelleUrl: fields.visiteVirtuelleUrl || null,
      owner: { connect: { id: ownerId } },
      priceHistory: { create: [{ prix: fields.prix }] },
    },
  });
}

/**
 * Normalise le bloc « frais & charges » : `undefined` → `null` (efface en
 * mise à jour), et remet à `null` les champs hors périmètre de la transaction
 * (pas d'honoraires ni de taxe foncière sur une location, pas de dépôt de
 * garantie sur une vente).
 */
function fraisData(f: ListingFieldsInput) {
  const vente = f.transaction === "VENTE";
  return {
    honoraires: vente ? f.honoraires ?? null : null,
    honorairesCharge: vente ? f.honorairesCharge ?? null : null,
    chargesCopro: f.chargesCopro ?? null,
    taxeFonciere: vente ? f.taxeFonciere ?? null : null,
    chargesLoc: vente ? null : f.chargesLoc ?? null,
    depotGarantie: vente ? null : f.depotGarantie ?? null,
    meuble: vente ? null : f.meuble ?? null,
  };
}

/** Normalise le bloc « caractéristiques » : `undefined` → `null` (efface en MàJ). */
function caracData(f: ListingFieldsInput) {
  return {
    anneeConstruction: f.anneeConstruction ?? null,
    etat: f.etat ?? null,
    exposition: f.exposition ?? null,
    surfaceTerrain: f.surfaceTerrain ?? null,
    etage: f.etage ?? null,
    ascenseur: f.ascenseur ?? null,
    nbSallesDeBain: f.nbSallesDeBain ?? null,
    stationnement: f.stationnement ?? null,
    chauffageType: f.chauffageType ?? null,
    fibre: f.fibre ?? null,
    assainissement: f.assainissement ?? null,
  };
}

/** Normalise le bloc DPE : chaîne vide → null, nombre absent → null. */
function dpeData(f: ListingFieldsInput) {
  return {
    dpe: f.dpe || null,
    ges: f.ges || null,
    dpeConsommation: f.dpeConsommation ?? null,
    dpeEmissions: f.dpeEmissions ?? null,
    dpeCoutMin: f.dpeCoutMin ?? null,
    dpeCoutMax: f.dpeCoutMax ?? null,
    dpeCoutAnneeRef: f.dpeCoutAnneeRef ?? null,
    dpeDate: f.dpeDate ?? null,
  };
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
        ...dpeData(input),
        ...fraisData(input),
        ...caracData(input),
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
    ...dpeData(fields),
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
        lastSeenAt: new Date(),
        owner: { connect: { id: ownerId } },
        priceHistory: { create: [{ prix: fields.prix }] },
      },
    });
    const savedUrls = await saveRemotePhotos(created.id, photoUrls);
    await addListingPhotos(created.id, savedUrls);
    return { id: created.id, created: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.listing.update({
      where: { id: existing.id },
      data: {
        ...fieldsData,
        lastSeenAt: new Date(),
        // Une annonce RETIREE qui réapparaît dans le flux (republiée côté
        // agence) redevient active automatiquement — jamais l'inverse : on ne
        // déduit jamais un retrait ici, seulement dans retireStaleImportedListings.
        ...listingRevivalFields(existing.statut),
      },
    });
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

/**
 * Passe en RETIREE (soft-delete) les annonces importées (`importSource`)
 * d'une agence dont la référence n'apparaît plus dans le flux courant (bien
 * vendu/loué ou retiré côté CRM — on ne sait pas laquelle des deux sans
 * information explicite, donc le statut reste générique) — sans quoi une
 * synchro n'ajoute/actualise que les biens présents et laisse en ligne
 * indéfiniment ceux qui ont disparu du flux. N'efface plus rien : jusqu'au
 * 2026-09-21 cette fonction supprimait la ligne (et en cascade son
 * PriceHistory) via `deleteMany`, détruisant définitivement l'historique dont
 * dépendent les statistiques de durée d'exposition / taux de vente. Les
 * photos R2 ne sont pas purgées ici (elles restent tant qu'une purge
 * différée n'est pas explicitement décidée). Si la référence réapparaît plus
 * tard dans le flux, `upsertImportedListing` la republie automatiquement.
 * Renvoie les annonces retirées (compteur de la synchro).
 */
export async function retireStaleImportedListings(
  ownerId: string,
  importSource: string,
  currentExternalRefs: string[]
) {
  // Garde-fou : un flux vide (panne, réponse tronquée...) ne doit jamais se
  // traduire par le retrait de toutes les annonces déjà importées.
  if (currentExternalRefs.length === 0) return [];

  const stale = await prisma.listing.findMany({
    where: {
      ownerId,
      importSource,
      statut: "PUBLIEE",
      externalRef: { notIn: currentExternalRefs },
    },
    select: { id: true },
  });
  if (stale.length === 0) return [];
  await prisma.listing.updateMany({
    where: { id: { in: stale.map((l) => l.id) } },
    data: { statut: "RETIREE", retiredAt: new Date() },
  });
  return stale;
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
