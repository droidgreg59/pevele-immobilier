import "server-only";
import { prisma } from "./prisma";
import { getAgencyReviewStats } from "./reviews";

export type AgencyStats = {
  listings: {
    total: number;
    publiees: number;
    enVerification: number;
    prixMoyenVente: number | null;
    loyerMoyenLocation: number | null;
  };
  mandates: {
    enAttente: number;
    acceptees: number;
    refusees: number;
    tauxAcceptation: number | null;
  };
  proposals: {
    envoyees: number;
    interessees: number;
  };
  reviews: {
    count: number;
    average: number | null;
  };
};

export async function getAgencyStats(agencyId: string): Promise<AgencyStats> {
  const [
    listingsByStatut,
    venteAvg,
    locationAvg,
    mandatesByStatut,
    proposalsEnvoyees,
    proposalsInteressees,
    reviewStats,
  ] = await Promise.all([
    prisma.listing.groupBy({
      by: ["statut"],
      where: { ownerId: agencyId },
      _count: { _all: true },
    }),
    prisma.listing.aggregate({
      where: { ownerId: agencyId, transaction: "VENTE", statut: "PUBLIEE" },
      _avg: { prix: true },
    }),
    prisma.listing.aggregate({
      where: { ownerId: agencyId, transaction: "LOCATION", statut: "PUBLIEE" },
      _avg: { prix: true },
    }),
    prisma.searchMandate.groupBy({
      by: ["statut"],
      where: { agencyId },
      _count: { _all: true },
    }),
    prisma.listingProposal.count({ where: { mandate: { agencyId } } }),
    prisma.listingProposal.count({
      where: { mandate: { agencyId }, statut: "INTERESSE" },
    }),
    getAgencyReviewStats(agencyId),
  ]);

  const publiees = listingsByStatut.find((r) => r.statut === "PUBLIEE")?._count._all ?? 0;
  const enVerification =
    listingsByStatut.find((r) => r.statut === "EN_VERIFICATION")?._count._all ?? 0;

  const enAttente = mandatesByStatut.find((r) => r.statut === "EN_ATTENTE")?._count._all ?? 0;
  const acceptees = mandatesByStatut.find((r) => r.statut === "ACCEPTEE")?._count._all ?? 0;
  const refusees = mandatesByStatut.find((r) => r.statut === "REFUSEE")?._count._all ?? 0;
  const repondues = acceptees + refusees;

  return {
    listings: {
      total: publiees + enVerification,
      publiees,
      enVerification,
      prixMoyenVente: venteAvg._avg.prix != null ? Math.round(venteAvg._avg.prix) : null,
      loyerMoyenLocation:
        locationAvg._avg.prix != null ? Math.round(locationAvg._avg.prix) : null,
    },
    mandates: {
      enAttente,
      acceptees,
      refusees,
      tauxAcceptation: repondues > 0 ? Math.round((acceptees / repondues) * 100) : null,
    },
    proposals: {
      envoyees: proposalsEnvoyees,
      interessees: proposalsInteressees,
    },
    reviews: reviewStats,
  };
}
