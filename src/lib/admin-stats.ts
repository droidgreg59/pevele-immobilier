import "server-only";
import { prisma } from "./prisma";

export type AdminStats = {
  usersByType: { PARTICULIER: number; AGENCE: number; ARTISAN: number };
  totalUsers: number;
  listingsByStatut: { EN_VERIFICATION: number; PUBLIEE: number; REFUSEE: number };
  totalListings: number;
  totalReviews: number;
  officialReviews: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [
    particuliers,
    agences,
    artisans,
    enVerification,
    publiees,
    refusees,
    totalReviews,
    officialReviews,
  ] = await Promise.all([
    prisma.user.count({ where: { type: "PARTICULIER" } }),
    prisma.user.count({ where: { type: "AGENCE" } }),
    prisma.user.count({ where: { type: "ARTISAN" } }),
    prisma.listing.count({ where: { statut: "EN_VERIFICATION" } }),
    prisma.listing.count({ where: { statut: "PUBLIEE" } }),
    prisma.listing.count({ where: { statut: "REFUSEE" } }),
    prisma.review.count(),
    prisma.review.count({ where: { isOfficial: true } }),
  ]);

  return {
    usersByType: { PARTICULIER: particuliers, AGENCE: agences, ARTISAN: artisans },
    totalUsers: particuliers + agences + artisans,
    listingsByStatut: { EN_VERIFICATION: enVerification, PUBLIEE: publiees, REFUSEE: refusees },
    totalListings: enVerification + publiees + refusees,
    totalReviews,
    officialReviews,
  };
}
