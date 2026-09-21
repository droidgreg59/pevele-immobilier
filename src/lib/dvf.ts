import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

/**
 * Les DVF ne changent qu'au rythme de l'import (`/api/cron/dvf-import`, ~1×/
 * semaine). Les lectures ci-dessous sont donc mises en cache d'un rendu à
 * l'autre via `unstable_cache`, tag `dvf` — l'import appelle
 * `revalidateTag("dvf")` pour rafraîchir immédiatement après réécriture.
 * `getRecentDvfTransactions` n'est PAS caché : il renvoie des `Date` (que le
 * cache sérialiserait) et reste une requête légère.
 */
const DVF_TAG = "dvf";
export const DVF_REVALIDATE = 60 * 60 * 24 * 7;

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

// ===========================================================================
// Filtrage des valeurs atypiques (Sprint 2) — voir /methodologie.
//
// Certaines ventes DVF, bien que réelles, ne sont pas comparables au marché
// courant (cession familiale sous-évaluée, propriété avec dépendances/terrain
// non comptées dans la surface bâtie déclarée...). DVF ne fournit aucun champ
// permettant de distinguer ces cas d'une vente ordinaire — les mutations
// multi-lots sont déjà exclues à l'import (src/lib/dvf-import.ts,
// `nombre_lots > 1`), ce qui couvre la cause la plus fréquente et
// identifiable, mais pas les cas restants.
//
// Règle retenue : exclure le 1er et le 99e centile du prix au m², calculés
// sur l'ensemble de la Pévèle et PAR TYPOLOGIE (jamais par commune — un petit
// échantillon rendrait le seuil lui-même instable). Une transaction hors
// bornes reste visible dans le détail (« dernières ventes ») ; elle n'entre
// simplement pas dans le calcul de la moyenne/médiane affichée comme
// indicateur de marché.
// ===========================================================================

export type DvfBienType = "Maison" | "Appartement";
const DVF_BIEN_TYPES: DvfBienType[] = ["Maison", "Appartement"];

const OUTLIER_LOWER_PERCENTILE = 0.01;
const OUTLIER_UPPER_PERCENTILE = 0.99;
/** En dessous de ce nombre de ventes retenues, on affiche « données insuffisantes » plutôt qu'un chiffre fragile. */
export const MIN_RETAINED_SAMPLE = 5;

/** Bornes [percentile bas, percentile haut] d'un tableau de nombres déjà trié. Pure — testée sans base. */
export function computePercentileBounds(
  sortedValues: number[],
  lowerPercentile: number,
  upperPercentile: number
): { min: number; max: number } {
  if (sortedValues.length === 0) return { min: 0, max: 0 };
  const lowerIndex = Math.floor(sortedValues.length * lowerPercentile);
  const upperIndex = Math.min(
    sortedValues.length - 1,
    Math.floor(sortedValues.length * upperPercentile)
  );
  return { min: sortedValues[lowerIndex], max: sortedValues[upperIndex] };
}

/** Médiane d'un tableau de nombres déjà trié. Pure — réutilisée par budget-brackets.ts. */
export function median(sortedValues: number[]): number {
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? Math.round((sortedValues[mid - 1] + sortedValues[mid]) / 2)
    : sortedValues[mid];
}

/** Moyenne arrondie d'un tableau de nombres. Pure — réutilisée par budget-brackets.ts. */
export function average(values: number[]): number {
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export type DvfOutlierBounds = Record<DvfBienType, { min: number; max: number }>;

/**
 * Bornes d'exclusion des valeurs atypiques, par typologie, sur l'ensemble de
 * la Pévèle. Voir le commentaire de section ci-dessus pour la méthode.
 */
export const getDvfOutlierBounds = unstable_cache(
  async (): Promise<DvfOutlierBounds> => {
    const bounds = {} as DvfOutlierBounds;
    for (const typeLocal of DVF_BIEN_TYPES) {
      const rows = await prisma.dvfTransaction.findMany({
        where: { typeLocal },
        select: { prixM2: true },
        orderBy: { prixM2: "asc" },
      });
      bounds[typeLocal] = computePercentileBounds(
        rows.map((r) => r.prixM2),
        OUTLIER_LOWER_PERCENTILE,
        OUTLIER_UPPER_PERCENTILE
      );
    }
    return bounds;
  },
  ["dvf-outlier-bounds"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);

function isRetained(prixM2: number, bounds: { min: number; max: number }): boolean {
  return prixM2 >= bounds.min && prixM2 <= bounds.max;
}

/**
 * Si `typeLocal` est fourni (ex. "Maison") et qu'il reste assez de ventes de
 * ce type pour être fiable, la moyenne est calculée sur ce seul type.
 * Sinon, on retombe sur la moyenne toutes catégories confondues plutôt que
 * d'afficher « données insuffisantes » alors qu'on a des données utilisables.
 */
export const getDvfStatsForVillage = unstable_cache(
  async (villageSlug: string, typeLocal?: string): Promise<DvfVillageStats | null> => {
    if (typeLocal) {
      const filtered = await aggregateVillageStats(villageSlug, typeLocal);
      if (filtered && filtered.count >= MIN_SAMPLE_FOR_TYPE_FILTER) return filtered;
    }
    return aggregateVillageStats(villageSlug);
  },
  ["dvf-stats-village"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);

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

export type DvfYearPoint = { year: number; count: number; medianPrixM2: number; avgPrixM2: number };

/**
 * Médiane (principale) et moyenne (secondaire) /m² par millésime DVF, pour
 * une commune et une typologie, ventes atypiques exclues (voir
 * getDvfOutlierBounds). Signature resserrée à `typeLocal` obligatoire — plus
 * de repli toutes-typologies-mélangées : seul consommateur de cette fonction
 * dans le code, /prix/[commune], qui appelle toujours un type précis.
 */
export const getDvfPriceByYear = unstable_cache(
  async (villageSlug: string, typeLocal: DvfBienType): Promise<DvfYearPoint[]> => {
    const [rows, bounds] = await Promise.all([
      prisma.dvfTransaction.findMany({
        where: { villageSlug, typeLocal },
        select: { prixM2: true, sourceAnnee: true },
      }),
      getDvfOutlierBounds(),
    ]);

    const byYear = new Map<number, number[]>();
    for (const r of rows) {
      if (!isRetained(r.prixM2, bounds[typeLocal])) continue;
      const arr = byYear.get(r.sourceAnnee) ?? [];
      arr.push(r.prixM2);
      byYear.set(r.sourceAnnee, arr);
    }

    return [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, values]) => {
        const sorted = [...values].sort((a, b) => a - b);
        return { year, count: values.length, medianPrixM2: median(sorted), avgPrixM2: average(values) };
      });
  },
  ["dvf-price-by-year"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);

export type DvfTypeBreakdown = {
  typeLocal: string;
  count: number;
  avgPrixM2: number;
  medianPrixM2: number;
  minPrixM2: number;
  maxPrixM2: number;
};

/** Détail par type de bien (Maison / Appartement) : moyenne, médiane, fourchette du prix/m². */
export const getDvfBreakdownByType = unstable_cache(
  async (villageSlug: string): Promise<DvfTypeBreakdown[]> => {
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
  },
  ["dvf-breakdown-by-type"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);

/** Prix /m² moyen sur toute la Pévèle (toutes ventes DVF confondues). */
export const getDvfAvgPrixM2Pevele = unstable_cache(
  async (): Promise<{ avgPrixM2: number; count: number } | null> => {
    const agg = await prisma.dvfTransaction.aggregate({
      _avg: { prixM2: true },
      _count: { _all: true },
    });
    if (!agg._avg.prixM2 || agg._count._all === 0) return null;
    return { avgPrixM2: Math.round(agg._avg.prixM2), count: agg._count._all };
  },
  ["dvf-avg-pevele"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);

export const getDvfStatsForAllVillages = unstable_cache(
  async (): Promise<DvfVillageStats[]> => {
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
  },
  ["dvf-stats-all-villages"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);

// ===========================================================================
// Statistiques « marché » (Sprint 2 — Observatoire, /prix, /prix/[commune],
// /villages/[commune]) : médiane en métrique principale, une seule typologie
// à la fois, ventes atypiques exclues (getDvfOutlierBounds). Fonctions
// nouvelles et indépendantes des précédentes ci-dessus, qui restent
// utilisées telles quelles par /estimer, /carte, /immobilier/[commune]/
// [intent], /acheter/[id] et le digest — aucune d'elles n'est modifiée pour
// ne rien changer à un comportement déjà en production hors du périmètre
// validé pour ce sprint.
// ===========================================================================

export type DvfMarketStats = {
  typeLocal: DvfBienType;
  /** Ventes recensées pour cette commune/typologie, avant exclusion des valeurs atypiques. */
  count: number;
  /** Ventes effectivement utilisées pour medianPrixM2/avgPrixM2/min/max. */
  retainedCount: number;
  medianPrixM2: number;
  avgPrixM2: number;
  minPrixM2: number;
  maxPrixM2: number;
  minAnnee: number;
  maxAnnee: number;
};

function buildMarketStats(
  typeLocal: DvfBienType,
  rows: { prixM2: number; sourceAnnee: number }[],
  bounds: { min: number; max: number }
): DvfMarketStats | null {
  if (rows.length === 0) return null;
  const retained = rows.filter((r) => isRetained(r.prixM2, bounds));
  if (retained.length < MIN_RETAINED_SAMPLE) return null;

  const sorted = retained.map((r) => r.prixM2).sort((a, b) => a - b);
  const years = rows.map((r) => r.sourceAnnee);

  return {
    typeLocal,
    count: rows.length,
    retainedCount: retained.length,
    medianPrixM2: median(sorted),
    avgPrixM2: average(sorted),
    minPrixM2: sorted[0],
    maxPrixM2: sorted[sorted.length - 1],
    minAnnee: Math.min(...years),
    maxAnnee: Math.max(...years),
  };
}

/**
 * Statistiques de marché pour une commune et une typologie précise. Jamais
 * de repli sur une autre typologie si l'échantillon est faible — retourne
 * `null` (« données insuffisantes ») plutôt que de mélanger maison et
 * appartement.
 */
export const getDvfMarketStatsForVillage = unstable_cache(
  async (villageSlug: string, typeLocal: DvfBienType): Promise<DvfMarketStats | null> => {
    const [rows, bounds] = await Promise.all([
      prisma.dvfTransaction.findMany({
        where: { villageSlug, typeLocal },
        select: { prixM2: true, sourceAnnee: true },
      }),
      getDvfOutlierBounds(),
    ]);
    return buildMarketStats(typeLocal, rows, bounds[typeLocal]);
  },
  ["dvf-market-stats-village"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);

/** Même chose que getDvfMarketStatsForVillage, sur l'ensemble de la Pévèle — pour l'Observatoire. */
export const getDvfMarketStatsPevele = unstable_cache(
  async (typeLocal: DvfBienType): Promise<DvfMarketStats | null> => {
    const [rows, bounds] = await Promise.all([
      prisma.dvfTransaction.findMany({
        where: { typeLocal },
        select: { prixM2: true, sourceAnnee: true },
      }),
      getDvfOutlierBounds(),
    ]);
    return buildMarketStats(typeLocal, rows, bounds[typeLocal]);
  },
  ["dvf-market-stats-pevele"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);

export type DvfVillageMedianRow = {
  villageSlug: string;
  medianPrixM2: number;
  retainedCount: number;
  count: number;
};

/**
 * Médiane des maisons par commune, pour le tableau des 44 communes sur
 * /prix — remplace l'ancienne moyenne toutes-typologies-mélangées
 * (getDvfStatsForAllVillages, conservée mais plus utilisée par cette page).
 */
export const getDvfMedianMaisonForAllVillages = unstable_cache(
  async (): Promise<DvfVillageMedianRow[]> => {
    const [rows, bounds] = await Promise.all([
      prisma.dvfTransaction.findMany({
        where: { typeLocal: "Maison" },
        select: { villageSlug: true, prixM2: true },
      }),
      getDvfOutlierBounds(),
    ]);

    const byVillage = new Map<string, { all: number[]; retained: number[] }>();
    for (const r of rows) {
      const entry = byVillage.get(r.villageSlug) ?? { all: [], retained: [] };
      entry.all.push(r.prixM2);
      if (isRetained(r.prixM2, bounds.Maison)) entry.retained.push(r.prixM2);
      byVillage.set(r.villageSlug, entry);
    }

    const result: DvfVillageMedianRow[] = [];
    for (const [villageSlug, { all, retained }] of byVillage) {
      if (retained.length < MIN_RETAINED_SAMPLE) continue;
      result.push({
        villageSlug,
        medianPrixM2: median([...retained].sort((a, b) => a - b)),
        retainedCount: retained.length,
        count: all.length,
      });
    }
    return result;
  },
  ["dvf-median-maison-all-villages"],
  { revalidate: DVF_REVALIDATE, tags: [DVF_TAG] }
);
