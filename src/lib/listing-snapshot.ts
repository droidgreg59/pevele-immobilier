import { prisma } from "./prisma";
import { villages } from "@/data/villages";
import type { AccountType, SnapshotSourceType, TransactionType } from "@prisma/client";

const TRANSACTIONS: TransactionType[] = ["VENTE", "LOCATION"];

type SnapshotListing = {
  ownerId: string;
  owner: { type: AccountType; xmlLastSuccessAt: Date | null };
};

export type SnapshotSource = {
  sourceType: SnapshotSourceType;
  sourceId: string;
  count: number;
  sourceFreshAt: Date | null;
};

/**
 * Répartit un ensemble d'annonces (déjà filtrées par commune/transaction) par
 * source : une ligne par agence distincte (sourceId = son User.id), plus au
 * plus une ligne "direct" agrégeant tous les dépôts non-agence (particuliers,
 * artisans) — jamais un sourceId par personne, pour ne jamais exposer de
 * volumétrie individuelle. Pure — testée sans base dans listing-snapshot.test.ts.
 */
export function buildSnapshotSources(listings: SnapshotListing[]): SnapshotSource[] {
  const agencies = new Map<string, { count: number; freshAt: Date | null }>();
  let directCount = 0;
  for (const l of listings) {
    if (l.owner.type === "AGENCE") {
      const entry = agencies.get(l.ownerId) ?? { count: 0, freshAt: l.owner.xmlLastSuccessAt };
      entry.count += 1;
      agencies.set(l.ownerId, entry);
    } else {
      directCount += 1;
    }
  }

  const sources: SnapshotSource[] = [...agencies.entries()].map(([sourceId, { count, freshAt }]) => ({
    sourceType: "AGENCY" as const,
    sourceId,
    count,
    sourceFreshAt: freshAt,
  }));
  if (directCount > 0) {
    sources.push({ sourceType: "DIRECT" as const, sourceId: "direct", count: directCount, sourceFreshAt: null });
  }
  return sources;
}

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
export async function runListingSnapshot(): Promise<{ rows: number; sourceRows: number }> {
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
      ownerId: true,
      owner: { select: { type: true, xmlLastSuccessAt: true } },
    },
  });

  let rows = 0;
  let sourceRows = 0;
  for (const transaction of TRANSACTIONS) {
    for (const village of villages) {
      const forCommune = listings.filter(
        (l) => l.villageSlug === village.slug && l.transaction === transaction
      );
      const prices = forCommune.map((l) => l.prix);
      const prixM2 = forCommune.filter((l) => l.surface > 0).map((l) => l.prix / l.surface);
      const surfaces = forCommune.map((l) => l.surface);
      // Jamais calculé sur un simple ownerId : un ownerId peut être un
      // particulier, ce n'est pas une agence pour autant (voir /methodologie).
      const agencyIds = new Set(
        forCommune.filter((l) => l.owner.type === "AGENCE").map((l) => l.ownerId)
      );

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
        agencyCount: agencyIds.size,
      };

      await prisma.listingSnapshot.upsert({
        where: {
          villageSlug_transaction_date: { villageSlug: village.slug, transaction, date },
        },
        create: { villageSlug: village.slug, transaction, date, ...stats },
        update: stats,
      });
      rows += 1;

      // Répartition par source du même jour — remplace intégralement les
      // lignes du jour courant (idempotent, comme le upsert ci-dessus),
      // jamais celles des jours précédents.
      const sources = buildSnapshotSources(forCommune);
      await prisma.listingSnapshotSource.deleteMany({
        where: { villageSlug: village.slug, transaction, date },
      });
      if (sources.length > 0) {
        await prisma.listingSnapshotSource.createMany({
          data: sources.map((s) => ({ villageSlug: village.slug, transaction, date, ...s })),
        });
      }
      sourceRows += sources.length;
    }
  }

  return { rows, sourceRows };
}
