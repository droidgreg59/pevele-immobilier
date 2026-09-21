import { prisma } from "./prisma";
import { villages } from "@/data/villages";
import type { TransactionType } from "@prisma/client";

const TRANSACTIONS: TransactionType[] = ["VENTE", "LOCATION"];

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/** Minuit UTC du jour courant — clé stable pour l'unicité villageSlug+transaction+date. */
function today(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Instantané quotidien du stock d'annonces actives, une ligne par commune ×
 * transaction (même pour un stock à 0, voir le commentaire du modèle
 * `ListingSnapshot`). Fondation de l'historisation — appelée par le cron
 * /api/cron/listing-snapshot. Idempotent (upsert sur la journée courante) :
 * un second passage le même jour écrase la ligne au lieu de la dupliquer.
 */
export async function runListingSnapshot(): Promise<{ rows: number }> {
  const date = today();
  const since24h = new Date(date.getTime() - 24 * 60 * 60 * 1000);

  const listings = await prisma.listing.findMany({
    where: { statut: "PUBLIEE" },
    select: {
      villageSlug: true,
      transaction: true,
      typeBien: true,
      prix: true,
      surface: true,
      createdAt: true,
    },
  });

  let rows = 0;
  for (const transaction of TRANSACTIONS) {
    for (const village of villages) {
      const forCommune = listings.filter(
        (l) => l.villageSlug === village.slug && l.transaction === transaction
      );
      const prices = forCommune.map((l) => l.prix);
      const prixM2 = forCommune.filter((l) => l.surface > 0).map((l) => l.prix / l.surface);
      const surfaces = forCommune.map((l) => l.surface);

      const stats = {
        totalCount: forCommune.length,
        maisonCount: forCommune.filter((l) => l.typeBien === "MAISON").length,
        appartementCount: forCommune.filter((l) => l.typeBien === "APPARTEMENT").length,
        terrainCount: forCommune.filter((l) => l.typeBien === "TERRAIN").length,
        avgPrix: average(prices),
        medianPrix: median(prices),
        avgPrixM2: average(prixM2),
        surfaceMoyenne: average(surfaces),
        nouvellesAnnonces: forCommune.filter((l) => l.createdAt >= since24h).length,
      };

      await prisma.listingSnapshot.upsert({
        where: {
          villageSlug_transaction_date: { villageSlug: village.slug, transaction, date },
        },
        create: { villageSlug: village.slug, transaction, date, ...stats },
        update: stats,
      });
      rows += 1;
    }
  }

  return { rows };
}
