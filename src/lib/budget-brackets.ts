import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import {
  getDvfOutlierBounds,
  median,
  MIN_RETAINED_SAMPLE,
  DVF_REVALIDATE,
  type DvfBienType,
} from "./dvf";

/**
 * Statistiques "budget" (Sprint 4, guide /guides/quel-budget-pour-acheter-en-pevele) —
 * transactionnelles, jamais `budget ÷ prix médian/m²`. Réutilise les mêmes
 * bornes d'exclusion des valeurs atypiques que dvf.ts (1er/99e centile,
 * calculées Pévèle-entière par typologie — voir le commentaire de section
 * dans dvf.ts). `pct`/`count` restent affichés dès que la commune franchit
 * MIN_RETAINED_SAMPLE au global ; `medianSurface`/`medianPrix` d'un palier
 * particulier passent à `null` si CE palier a moins de MIN_RETAINED_SAMPLE
 * observations (une "médiane" sur 1-2 ventes serait trompeuse).
 */
export type BudgetBracketStat = {
  budget: number;
  /** Ventes retenues (hors valeurs atypiques) sur le périmètre entier, tous budgets confondus. */
  totalRetained: number;
  /** Ventes retenues à ce budget ou moins. */
  count: number;
  /** count / totalRetained, en %, 1 décimale. */
  pct: number;
  medianSurface: number | null;
  medianPrix: number | null;
};

type BracketRow = { valeurFonciere: number; surfaceBati: number };

/** Construit les paliers à partir de ventes déjà filtrées (retained). Pure — testée sans base. */
export function buildBudgetBrackets(retained: BracketRow[], budgets: number[]): BudgetBracketStat[] {
  const totalRetained = retained.length;
  return budgets.map((budget) => {
    const under = retained.filter((r) => r.valeurFonciere <= budget);
    const count = under.length;
    const pct = totalRetained > 0 ? Math.round((count / totalRetained) * 1000) / 10 : 0;
    const enoughForMedian = count >= MIN_RETAINED_SAMPLE;
    return {
      budget,
      totalRetained,
      count,
      pct,
      medianSurface: enoughForMedian
        ? median(under.map((r) => r.surfaceBati).sort((a, b) => a - b))
        : null,
      medianPrix: enoughForMedian
        ? median(under.map((r) => r.valeurFonciere).sort((a, b) => a - b))
        : null,
    };
  });
}

async function retainedRows(typeLocal: DvfBienType, villageSlug?: string): Promise<BracketRow[]> {
  const [rows, bounds] = await Promise.all([
    prisma.dvfTransaction.findMany({
      where: { typeLocal, ...(villageSlug ? { villageSlug } : {}) },
      select: { valeurFonciere: true, surfaceBati: true, prixM2: true },
    }),
    getDvfOutlierBounds(),
  ]);
  const b = bounds[typeLocal];
  return rows.filter((r) => r.prixM2 >= b.min && r.prixM2 <= b.max);
}

/** Paliers de budget sur l'ensemble de la Pévèle. `null` si l'échantillon total est insuffisant. */
export const getBudgetBracketStatsPevele = unstable_cache(
  async (budgets: number[], typeLocal: DvfBienType): Promise<BudgetBracketStat[] | null> => {
    const retained = await retainedRows(typeLocal);
    if (retained.length < MIN_RETAINED_SAMPLE) return null;
    return buildBudgetBrackets(retained, budgets);
  },
  ["budget-brackets-pevele"],
  { revalidate: DVF_REVALIDATE, tags: ["dvf"] }
);

/** Paliers de budget pour une commune. `null` si son échantillon retenu total est insuffisant. */
export const getBudgetBracketStatsForVillage = unstable_cache(
  async (
    villageSlug: string,
    budgets: number[],
    typeLocal: DvfBienType
  ): Promise<BudgetBracketStat[] | null> => {
    const retained = await retainedRows(typeLocal, villageSlug);
    if (retained.length < MIN_RETAINED_SAMPLE) return null;
    return buildBudgetBrackets(retained, budgets);
  },
  ["budget-brackets-village"],
  { revalidate: DVF_REVALIDATE, tags: ["dvf"] }
);
