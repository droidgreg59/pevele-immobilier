import "server-only";
import { prisma } from "./prisma";
import type { EventName } from "./events";

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

export type EventStatRow = { name: EventName; total: number; last7: number; last30: number };

/** Libellés lisibles pour le tableau de bord — ordre = ordre d'affichage. */
export const EVENT_LABELS: { name: EventName; label: string }[] = [
  { name: "signup_completed", label: "Inscriptions" },
  { name: "saved_search_created", label: "Recherches sauvegardées" },
  { name: "favorite_added", label: "Favoris ajoutés" },
  { name: "visit_requested", label: "Demandes de visite" },
  { name: "open_house_registered", label: "Inscriptions portes ouvertes" },
  { name: "estimation_requested", label: "Demandes d'estimation" },
  { name: "mandate_created", label: "Mandats de recherche confiés" },
  { name: "devis_requested", label: "Demandes de devis artisan" },
  { name: "review_submitted", label: "Avis déposés" },
  { name: "listing_submitted", label: "Annonces déposées" },
  { name: "listing_published", label: "Annonces publiées (modération)" },
  { name: "agency_verification_submitted", label: "Vérifications agence soumises" },
];

/**
 * Compte chaque évènement produit sur trois fenêtres (7 j, 30 j, total). Une
 * seule requête `groupBy` par fenêtre — l'entonnoir se lit ensuite dans la
 * page en croisant les libellés de `EVENT_LABELS`.
 */
export async function getEventStats(): Promise<EventStatRow[]> {
  const now = Date.now();
  const d7 = new Date(now - 7 * 864e5);
  const d30 = new Date(now - 30 * 864e5);

  const [all, w30, w7] = await Promise.all([
    prisma.event.groupBy({ by: ["name"], _count: { _all: true } }),
    prisma.event.groupBy({ by: ["name"], _count: { _all: true }, where: { createdAt: { gte: d30 } } }),
    prisma.event.groupBy({ by: ["name"], _count: { _all: true }, where: { createdAt: { gte: d7 } } }),
  ]);

  const count = (
    rows: { name: string; _count: { _all: number } }[],
    name: string
  ): number => rows.find((r) => r.name === name)?._count._all ?? 0;

  return EVENT_LABELS.map(({ name }) => ({
    name,
    total: count(all, name),
    last30: count(w30, name),
    last7: count(w7, name),
  }));
}
