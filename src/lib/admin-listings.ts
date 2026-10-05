import "server-only";
import { prisma } from "./prisma";
import type { DuplicateCandidate } from "./duplicate-listings";

const LISTING_SUMMARY_SELECT = {
  id: true,
  titre: true,
  statut: true,
  statutRaison: true,
  transaction: true,
  typeBien: true,
  prix: true,
  commune: true,
  createdAt: true,
  hiddenByAdminAt: true,
  owner: { select: { nom: true, entreprise: true, type: true } },
} as const;

export type ListingSummary = {
  id: string;
  titre: string;
  statut: "EN_VERIFICATION" | "PUBLIEE" | "REFUSEE" | "RETIREE";
  statutRaison: string | null;
  transaction: "VENTE" | "LOCATION";
  typeBien: string;
  prix: number;
  commune: string;
  createdAt: Date;
  hiddenByAdminAt: Date | null;
  ownerLabel: string;
};

export async function getAllListingsSummary(): Promise<ListingSummary[]> {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    select: LISTING_SUMMARY_SELECT,
  });
  return listings.map((l) => ({
    id: l.id,
    titre: l.titre,
    statut: l.statut,
    statutRaison: l.statutRaison,
    transaction: l.transaction,
    typeBien: l.typeBien,
    prix: l.prix,
    commune: l.commune,
    createdAt: l.createdAt,
    hiddenByAdminAt: l.hiddenByAdminAt,
    ownerLabel: l.owner.entreprise ?? l.owner.nom,
  }));
}

/** Annonces publiées, sous la forme minimale nécessaire à la détection de doublons. */
export async function getPublishedForDuplicateCheck(): Promise<DuplicateCandidate[]> {
  const rows = await prisma.listing.findMany({
    where: { statut: "PUBLIEE" },
    select: {
      id: true,
      ownerId: true,
      transaction: true,
      typeBien: true,
      prix: true,
      surface: true,
      pieces: true,
      chambres: true,
      exterieur: true,
      villageSlug: true,
      commune: true,
      titre: true,
      createdAt: true,
      owner: { select: { nom: true, entreprise: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    ownerId: r.ownerId,
    ownerLabel: r.owner.entreprise ?? r.owner.nom,
    transaction: r.transaction,
    typeBien: r.typeBien,
    prix: r.prix,
    surface: r.surface,
    pieces: r.pieces,
    chambres: r.chambres,
    exterieur: r.exterieur,
    villageSlug: r.villageSlug,
    commune: r.commune,
    titre: r.titre,
    createdAt: r.createdAt,
  }));
}
