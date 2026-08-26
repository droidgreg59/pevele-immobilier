import "server-only";
import { prisma } from "./prisma";

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
  owner: { select: { nom: true, entreprise: true, type: true } },
} as const;

export type ListingSummary = {
  id: string;
  titre: string;
  statut: "EN_VERIFICATION" | "PUBLIEE" | "REFUSEE";
  statutRaison: string | null;
  transaction: "VENTE" | "LOCATION";
  typeBien: string;
  prix: number;
  commune: string;
  createdAt: Date;
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
    ownerLabel: l.owner.entreprise ?? l.owner.nom,
  }));
}
