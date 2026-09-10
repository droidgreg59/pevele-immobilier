import "server-only";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { listingDetailPath } from "./open-house";
import { getDvfAvgPrixM2Pevele } from "./dvf";
import { weeklyDigestEmail, type DigestListingRow } from "./email-templates";

const WINDOW_DAYS = 7;
/** Un abonné ne reçoit pas deux digests à moins de 6 jours d'intervalle. */
const MIN_GAP_DAYS = 6;
const MAX_ROWS = 5;

export type MarketSummary = {
  since: Date;
  activeListings: number;
  newListings: { total: number; rows: DigestListingRow[] };
  priceDrops: { total: number; rows: (DigestListingRow & { ancienPrix: number })[] };
  avgPrixM2Pevele: number | null;
};

/**
 * Instantané hebdomadaire du marché de la Pévèle, calculé une seule fois puis
 * envoyé à tous les abonnés du digest.
 */
export async function buildMarketSummary(): Promise<MarketSummary> {
  const since = new Date(Date.now() - WINDOW_DAYS * 864e5);

  const [activeListings, newTotal, newRows, recentHistory, dvf] = await Promise.all([
    prisma.listing.count({ where: { statut: "PUBLIEE" } }),
    prisma.listing.count({ where: { statut: "PUBLIEE", createdAt: { gte: since } } }),
    prisma.listing.findMany({
      where: { statut: "PUBLIEE", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      select: { id: true, titre: true, commune: true, prix: true, transaction: true },
    }),
    prisma.priceHistory.findMany({
      where: { changedAt: { gte: since }, listing: { statut: "PUBLIEE" } },
      orderBy: { changedAt: "desc" },
      select: {
        prix: true,
        listingId: true,
        listing: { select: { id: true, titre: true, commune: true, prix: true, transaction: true } },
      },
    }),
    getDvfAvgPrixM2Pevele(),
  ]);

  // Baisses : pour chaque annonce touchée cette semaine, comparer son prix
  // courant au dernier prix connu AVANT la fenêtre.
  const dropsByListing = new Map<string, (DigestListingRow & { ancienPrix: number })>();
  for (const h of recentHistory) {
    if (dropsByListing.has(h.listingId)) continue;
    const prior = await prisma.priceHistory.findFirst({
      where: { listingId: h.listingId, changedAt: { lt: since } },
      orderBy: { changedAt: "desc" },
      select: { prix: true },
    });
    if (prior && h.listing.prix < prior.prix) {
      dropsByListing.set(h.listingId, {
        titre: h.listing.titre,
        commune: h.listing.commune,
        prix: h.listing.prix,
        transaction: h.listing.transaction,
        href: listingDetailPath(h.listing.transaction, h.listing.id),
        ancienPrix: prior.prix,
      });
    }
  }
  const dropRows = [...dropsByListing.values()];

  return {
    since,
    activeListings,
    newListings: {
      total: newTotal,
      rows: newRows.map((l) => ({
        titre: l.titre,
        commune: l.commune,
        prix: l.prix,
        transaction: l.transaction,
        href: listingDetailPath(l.transaction, l.id),
      })),
    },
    priceDrops: { total: dropRows.length, rows: dropRows.slice(0, MAX_ROWS) },
    avgPrixM2Pevele: dvf?.avgPrixM2 ?? null,
  };
}

export type DigestRunResult = {
  eligible: number;
  emailsSent: number;
  skippedEmpty: boolean;
};

/**
 * Envoie le digest hebdo aux comptes qui l'ont activé et n'en ont pas reçu
 * depuis au moins `MIN_GAP_DAYS`. `lastDigestAt` n'avance que sur un envoi
 * réussi (un échec Resend est retenté au run suivant). Si la semaine n'a
 * produit aucune nouveauté ni baisse, on n'envoie rien (et on n'avance pas).
 */
export async function runWeeklyDigest(): Promise<DigestRunResult> {
  const cutoff = new Date(Date.now() - MIN_GAP_DAYS * 864e5);
  const users = await prisma.user.findMany({
    where: {
      digestOptIn: true,
      OR: [{ lastDigestAt: null }, { lastDigestAt: { lt: cutoff } }],
    },
    select: { id: true, email: true },
  });

  if (users.length === 0) return { eligible: 0, emailsSent: 0, skippedEmpty: false };

  const summary = await buildMarketSummary();
  if (summary.newListings.total === 0 && summary.priceDrops.total === 0) {
    return { eligible: users.length, emailsSent: 0, skippedEmpty: true };
  }

  const { subject, html } = weeklyDigestEmail(summary);

  let emailsSent = 0;
  for (const user of users) {
    const ok = await sendEmail({ to: user.email, subject, html });
    if (ok) {
      emailsSent++;
      await prisma.user.update({ where: { id: user.id }, data: { lastDigestAt: new Date() } });
    }
  }

  return { eligible: users.length, emailsSent, skippedEmpty: false };
}
