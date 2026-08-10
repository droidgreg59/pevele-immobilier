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

export async function getDvfStatsForVillage(
  villageSlug: string
): Promise<DvfVillageStats | null> {
  const agg = await prisma.dvfTransaction.aggregate({
    where: { villageSlug },
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
