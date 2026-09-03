import "server-only";
import { prisma } from "./prisma";

export type DvfVillageStats = {
  villageSlug: string;
  count: number;
  avgPrixM2: number;
  minAnnee: number;
  maxAnnee: number;
};

export type DvfTransactionSummary = {
  id: string;
  dateMutation: Date;
  typeLocal: string;
  valeurFonciere: number;
  surfaceBati: number;
  prixM2: number;
  nombrePieces: number | null;
  adresse: string | null;
};

const MIN_SAMPLE_FOR_TYPE_FILTER = 3;

/**
 * Si `typeLocal` est fourni (ex. "Maison") et qu'il reste assez de ventes de
 * ce type pour être fiable, la moyenne est calculée sur ce seul type.
 * Sinon, on retombe sur la moyenne toutes catégories confondues plutôt que
 * d'afficher « données insuffisantes » alors qu'on a des données utilisables.
 */
export async function getDvfStatsForVillage(
  villageSlug: string,
  typeLocal?: string
): Promise<DvfVillageStats | null> {
  if (typeLocal) {
    const filtered = await aggregateVillageStats(villageSlug, typeLocal);
    if (filtered && filtered.count >= MIN_SAMPLE_FOR_TYPE_FILTER) return filtered;
  }
  return aggregateVillageStats(villageSlug);
}

async function aggregateVillageStats(
  villageSlug: string,
  typeLocal?: string
): Promise<DvfVillageStats | null> {
  const agg = await prisma.dvfTransaction.aggregate({
    where: { villageSlug, ...(typeLocal ? { typeLocal } : {}) },
    _count: { _all: true },
    _avg: { prixM2: true },
    _min: { sourceAnnee: true },
    _max: { sourceAnnee: true },
  });

  if (agg._count._all === 0 || agg._avg.prixM2 === null) return null;

  return {
    villageSlug,
    count: agg._count._all,
    avgPrixM2: Math.round(agg._avg.prixM2),
    minAnnee: agg._min.sourceAnnee ?? 0,
    maxAnnee: agg._max.sourceAnnee ?? 0,
  };
}

export async function getRecentDvfTransactions(
  villageSlug: string,
  limit = 6
): Promise<DvfTransactionSummary[]> {
  return prisma.dvfTransaction.findMany({
    where: { villageSlug },
    orderBy: { dateMutation: "desc" },
    take: limit,
    select: {
      id: true,
      dateMutation: true,
      typeLocal: true,
      valeurFonciere: true,
      surfaceBati: true,
      prixM2: true,
      nombrePieces: true,
      adresse: true,
    },
  });
}

export type DvfYearPoint = { year: number; count: number; avgPrixM2: number };

/** Prix moyen /m² par millésime DVF pour une commune (ordre chronologique). */
export async function getDvfPriceByYear(
  villageSlug: string,
  typeLocal?: string
): Promise<DvfYearPoint[]> {
  const rows = await prisma.dvfTransaction.groupBy({
    by: ["sourceAnnee"],
    where: { villageSlug, ...(typeLocal ? { typeLocal } : {}) },
    _count: { _all: true },
    _avg: { prixM2: true },
    orderBy: { sourceAnnee: "asc" },
  });
  return rows
    .filter((r) => r._avg.prixM2 !== null)
    .map((r) => ({
      year: r.sourceAnnee,
      count: r._count._all,
      avgPrixM2: Math.round(r._avg.prixM2 as number),
    }));
}

export type DvfTypeBreakdown = {
  typeLocal: string;
  count: number;
  avgPrixM2: number;
  medianPrixM2: number;
  minPrixM2: number;
  maxPrixM2: number;
};

/** Détail par type de bien (Maison / Appartement) : moyenne, médiane, fourchette du prix/m². */
export async function getDvfBreakdownByType(
  villageSlug: string
): Promise<DvfTypeBreakdown[]> {
  const rows = await prisma.dvfTransaction.findMany({
    where: { villageSlug },
    select: { typeLocal: true, prixM2: true },
  });

  const byType = new Map<string, number[]>();
  for (const r of rows) {
    const arr = byType.get(r.typeLocal) ?? [];
    arr.push(r.prixM2);
    byType.set(r.typeLocal, arr);
  }

  return [...byType.entries()]
    .map(([typeLocal, values]) => {
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      const medianPrixM2 =
        values.length % 2 === 0
          ? Math.round((values[mid - 1] + values[mid]) / 2)
          : values[mid];
      return {
        typeLocal,
        count: values.length,
        avgPrixM2: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
        medianPrixM2,
        minPrixM2: values[0],
        maxPrixM2: values[values.length - 1],
      };
    })
    .sort((a, b) => b.count - a.count);
}

export async function getDvfStatsForAllVillages(): Promise<DvfVillageStats[]> {
  const rows = await prisma.dvfTransaction.groupBy({
    by: ["villageSlug"],
    _count: { _all: true },
    _avg: { prixM2: true },
    _min: { sourceAnnee: true },
    _max: { sourceAnnee: true },
  });

  return rows
    .filter((r) => r._avg.prixM2 !== null)
    .map((r) => ({
      villageSlug: r.villageSlug,
      count: r._count._all,
      avgPrixM2: Math.round(r._avg.prixM2 as number),
      minAnnee: r._min.sourceAnnee ?? 0,
      maxAnnee: r._max.sourceAnnee ?? 0,
    }));
}
