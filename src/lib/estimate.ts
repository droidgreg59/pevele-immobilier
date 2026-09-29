/**
 * Estimation indicative d'un bien à partir des prix DVF réellement constatés.
 * Fonction pure (testable, sans accès base) : la page `/estimer` lui passe les
 * agrégats DVF déjà chargés. Volontairement conservatrice — une estimation ne
 * remplace pas une visite.
 */

export type EstimateInput = {
  /** Prix moyen /m² de la commune (toutes catégories) — socle de calcul. */
  avgPrixM2: number;
  /** Nombre de ventes DVF derrière `avgPrixM2` — pilote la largeur de la fourchette. */
  sampleCount: number;
  /** Prix moyen /m² pour le type de bien précis, si l'échantillon est suffisant. */
  typeAvgPrixM2?: number | null;
  surface: number;
  /** Classe énergie A–G, si connue. */
  dpe?: string | null;
};

export type Estimate = {
  low: number;
  mid: number;
  high: number;
  /** Prix /m² retenu (après ajustement DPE). */
  prixM2: number;
  /** Demi-largeur de la fourchette, en %. */
  bandPct: number;
  /** Ajustement appliqué pour la classe énergie, en % (négatif = décote). */
  dpeAdjustPct: number;
};

/**
 * « Valeur verte » : impact indicatif de la classe énergie sur le prix, dans
 * la fourchette des études notaires / ADEME (~±5–15 % entre extrêmes). C/D
 * neutres (référence marché).
 */
const DPE_ADJUSTMENT: Record<string, number> = {
  A: 0.06,
  B: 0.04,
  C: 0.01,
  D: 0,
  E: -0.03,
  F: -0.09,
  G: -0.13,
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

// ─── Biens comparables (chambres, terrain) ───────────────────────────────────
//
// DVF ne connaît pas les chambres mais `nombre_pieces_principales` (séjour +
// chambres, hors cuisine et pièces d'eau) : un bien de N chambres est
// rapproché des ventes de N + 1 pièces, à ±1 pièce près. Le terrain est
// comparé par tranche (bornes choisies sur la distribution réelle des ventes
// de maisons en Pévèle : médiane ≈ 420 m², 9 ventes sur 10 sous ~1 000 m²).

/** Nombre de pièces principales DVF correspondant à un nombre de chambres. */
export function chambresToPieces(chambres: number): number {
  return chambres + 1;
}

export const TERRAIN_BANDS = [
  { min: 0, max: 300, label: "moins de 300 m²" },
  { min: 300, max: 600, label: "300 à 600 m²" },
  { min: 600, max: 1000, label: "600 à 1 000 m²" },
  { min: 1000, max: 2000, label: "1 000 à 2 000 m²" },
  { min: 2000, max: Infinity, label: "plus de 2 000 m²" },
] as const;

export type TerrainBand = (typeof TERRAIN_BANDS)[number];

export function terrainBand(surfaceTerrain: number): TerrainBand {
  return TERRAIN_BANDS.find((b) => surfaceTerrain >= b.min && surfaceTerrain < b.max) ?? TERRAIN_BANDS[TERRAIN_BANDS.length - 1];
}

export type ComparableRow = {
  prixM2: number;
  nombrePieces: number | null;
  surfaceTerrain: number | null;
};

export type ComparableCriteria = {
  /** Nombre de chambres saisi (converti en pièces DVF ±1). */
  chambres?: number | null;
  /** Surface du terrain saisie, en m² (maisons uniquement). */
  terrain?: number | null;
};

export type ComparableSelection<T extends ComparableRow = ComparableRow> = {
  /** Ventes comparables retenues, triées par prix /m² croissant. */
  rows: T[];
  /** Médiane du prix /m² des ventes comparables retenues. */
  medianPrixM2: number;
  count: number;
  /** Critères effectivement appliqués (un critère peut être abandonné faute d'échantillon). */
  usedPieces: { min: number; max: number } | null;
  usedTerrain: TerrainBand | null;
};

/**
 * Sélectionne les ventes comparables en élargissant progressivement : pièces +
 * terrain, puis terrain seul (effet prix le plus marqué dans les données),
 * puis pièces seules. Renvoie null si aucun critère n'est saisi ou si aucune
 * combinaison n'atteint `minSample` ventes — l'appelant retombe alors sur la
 * moyenne du type de bien dans la commune.
 */
export function selectComparables<T extends ComparableRow>(
  rows: T[],
  criteria: ComparableCriteria,
  minSample: number
): ComparableSelection<T> | null {
  const pieces =
    criteria.chambres != null && criteria.chambres >= 0
      ? (() => {
          const p = chambresToPieces(criteria.chambres);
          return { min: Math.max(1, p - 1), max: p + 1 };
        })()
      : null;
  const band = criteria.terrain != null && criteria.terrain >= 0 ? terrainBand(criteria.terrain) : null;
  if (!pieces && !band) return null;

  const attempts: [typeof pieces, typeof band][] = [];
  if (pieces && band) attempts.push([pieces, band], [null, band], [pieces, null]);
  else attempts.push([pieces, band]);

  for (const [p, b] of attempts) {
    const selected = rows
      .filter(
        (r) =>
          (!p || (r.nombrePieces != null && r.nombrePieces >= p.min && r.nombrePieces <= p.max)) &&
          (!b || (r.surfaceTerrain != null && r.surfaceTerrain >= b.min && r.surfaceTerrain < b.max))
      )
      .sort((x, y) => x.prixM2 - y.prixM2);
    if (selected.length >= minSample) {
      return { ...medianSelection(selected)!, usedPieces: p, usedTerrain: b };
    }
  }
  return null;
}

export function estimateBien(input: EstimateInput): Estimate {
  const base =
    input.typeAvgPrixM2 && input.typeAvgPrixM2 > 0 ? input.typeAvgPrixM2 : input.avgPrixM2;

  const dpeAdj = input.dpe ? DPE_ADJUSTMENT[input.dpe.trim().toUpperCase()] ?? 0 : 0;
  const prixM2 = base * (1 + dpeAdj);
  const mid = prixM2 * input.surface;

  // Fourchette plus large quand l'échantillon DVF est mince.
  const band = input.sampleCount >= 30 ? 0.08 : input.sampleCount >= 12 ? 0.12 : 0.18;

  return {
    low: roundTo(mid * (1 - band), 1000),
    mid: roundTo(mid, 1000),
    high: roundTo(mid * (1 + band), 1000),
    prixM2: Math.round(prixM2),
    bandPct: Math.round(band * 100),
    dpeAdjustPct: Math.round(dpeAdj * 100),
  };
}

/**
 * Base sans critère : médiane du prix /m² de toutes les ventes fournies —
 * même statistique que `selectComparables`, pour que préciser chambres ou
 * terrain ne change pas la méthode de calcul, seulement l'échantillon.
 */
export function medianSelection<T extends ComparableRow>(rows: T[]): ComparableSelection<T> | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((x, y) => x.prixM2 - y.prixM2);
  const mid = Math.floor(sorted.length / 2);
  const medianPrixM2 =
    sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1].prixM2 + sorted[mid].prixM2) / 2)
      : sorted[mid].prixM2;
  return { rows: sorted, medianPrixM2, count: sorted.length, usedPieces: null, usedTerrain: null };
}
