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
