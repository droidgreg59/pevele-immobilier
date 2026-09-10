import "server-only";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { listingDetailPath } from "./open-house";
import {
  savedSearchListingWhere,
  savedSearchLabel,
  savedSearchUrl,
} from "./saved-searches";
import {
  savedSearchAlertEmail,
  priceDropAlertEmail,
  type AlertListingRow,
} from "./email-templates";

/** Nombre d'annonces détaillées dans le corps de l'email (le reste est résumé « …et N autres »). */
const MAX_ROWS_PER_EMAIL = 6;

export type SavedSearchAlertResult = {
  searchId: string;
  matched: number;
  emailSent: boolean;
};

/**
 * Pour chaque recherche sauvegardée, envoie à son auteur un email listant les
 * annonces publiées depuis la dernière alerte (ou depuis la création de la
 * recherche si aucune alerte n'a encore été émise). `lastAlertedAt` n'avance
 * que sur un envoi réussi : un échec Resend transitoire est retenté au run
 * suivant.
 */
export async function runSavedSearchAlerts(): Promise<SavedSearchAlertResult[]> {
  const searches = await prisma.savedSearch.findMany({
    include: { user: { select: { email: true } } },
  });

  const results: SavedSearchAlertResult[] = [];

  for (const search of searches) {
    const since = search.lastAlertedAt ?? search.createdAt;
    const where = savedSearchListingWhere(search, since);

    const [matched, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS_PER_EMAIL,
        select: { id: true, titre: true, commune: true, prix: true, transaction: true },
      }),
    ]);

    if (matched === 0) {
      results.push({ searchId: search.id, matched: 0, emailSent: false });
      continue;
    }

    const rows: AlertListingRow[] = listings.map((l) => ({
      titre: l.titre,
      commune: l.commune,
      prix: l.prix,
      transaction: l.transaction,
      href: listingDetailPath(l.transaction, l.id),
    }));

    const { subject, html } = savedSearchAlertEmail({
      searchLabel: savedSearchLabel(search),
      searchUrl: savedSearchUrl(search),
      totalCount: matched,
      listings: rows,
    });

    const emailSent = await sendEmail({ to: search.user.email, subject, html });
    if (emailSent) {
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastAlertedAt: new Date() },
      });
    }

    results.push({ searchId: search.id, matched, emailSent });
  }

  return results;
}

export type PriceDropAlertResult = {
  favoriteId: string;
  from: number | null;
  to: number;
  emailSent: boolean;
  action: "baseline" | "notified" | "rebaseline-up" | "unchanged";
};

/**
 * Pour chaque favori marqué « surveiller la baisse de prix », compare le prix
 * courant de l'annonce au dernier prix notifié :
 *  - pas encore de référence → on l'initialise au prix courant (sans email) ;
 *  - prix courant plus bas → email de baisse, puis la référence descend ;
 *  - prix courant plus haut → la référence remonte en silence (une baisse
 *    ultérieure repartira de ce nouveau prix) ;
 *  - inchangé → rien.
 * Les annonces non publiées (en vérification / refusées) sont ignorées.
 */
export async function runPriceDropAlerts(): Promise<PriceDropAlertResult[]> {
  const favorites = await prisma.favorite.findMany({
    where: { surveillePrix: true, listing: { statut: "PUBLIEE" } },
    include: {
      user: { select: { email: true } },
      listing: {
        select: { id: true, titre: true, commune: true, prix: true, transaction: true },
      },
    },
  });

  const results: PriceDropAlertResult[] = [];

  for (const fav of favorites) {
    const prix = fav.listing.prix;
    const ref = fav.lastNotifiedPrix;

    if (ref == null) {
      await prisma.favorite.update({ where: { id: fav.id }, data: { lastNotifiedPrix: prix } });
      results.push({ favoriteId: fav.id, from: null, to: prix, emailSent: false, action: "baseline" });
      continue;
    }

    if (prix > ref) {
      await prisma.favorite.update({ where: { id: fav.id }, data: { lastNotifiedPrix: prix } });
      results.push({ favoriteId: fav.id, from: ref, to: prix, emailSent: false, action: "rebaseline-up" });
      continue;
    }

    if (prix === ref) {
      results.push({ favoriteId: fav.id, from: ref, to: prix, emailSent: false, action: "unchanged" });
      continue;
    }

    const { subject, html } = priceDropAlertEmail({
      listingTitre: fav.listing.titre,
      listingHref: listingDetailPath(fav.listing.transaction, fav.listing.id),
      commune: fav.listing.commune,
      ancienPrix: ref,
      nouveauPrix: prix,
      transaction: fav.listing.transaction,
    });
    const emailSent = await sendEmail({ to: fav.user.email, subject, html });
    if (emailSent) {
      await prisma.favorite.update({ where: { id: fav.id }, data: { lastNotifiedPrix: prix } });
    }
    results.push({ favoriteId: fav.id, from: ref, to: prix, emailSent, action: "notified" });
  }

  return results;
}
