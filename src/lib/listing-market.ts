import {
  selectComparables,
  medianSelection,
  type ComparableRow,
  type TerrainBand,
} from "./estimate";

/**
 * Position du prix demandé d'une annonce par rapport aux ventes DVF
 * réellement constatées de biens comparables (même commune, même type, nombre
 * de pièces voisin, même tranche de terrain pour une maison). Remplace la
 * comparaison à la moyenne toutes ventes confondues, trompeuse dès que le
 * terrain ou la taille du bien s'écartent de la moyenne de la commune.
 * Fonction pure : les lignes DVF (valeurs atypiques déjà exclues) lui sont
 * passées par la page.
 */
export type MarketPosition = {
  /** Médiane du prix /m² des ventes retenues. */
  medianPrixM2: number;
  /** 1er et 3e quartile du prix /m² : la fourchette où se situe la moitié des ventes. */
  p25: number;
  p75: number;
  count: number;
  minAnnee: number;
  maxAnnee: number;
  listingPrixM2: number;
  /** Écart du prix /m² demandé à la médiane, en %. */
  diffPct: number;
  position: "below" | "within" | "above";
  /** Critères réellement appliqués ; `scope: "commune"` = repli sur toutes les ventes du type faute de comparables assez nombreux. */
  scope: "comparables" | "commune";
  pieces: { min: number; max: number } | null;
  terrain: string | null;
  /** Terrain du bien (m²) quand il n'a PAS pu servir de critère faute de ventes comparables assez nombreuses. */
  terrainIgnored: number | null;
};

export type MarketListingInput = {
  typeBien: "MAISON" | "APPARTEMENT" | "TERRAIN";
  prix: number;
  surface: number;
  chambres: number;
  surfaceTerrain?: number | null;
  exterieur?: string | null;
};

/** Terrain en m² : champ dédié, à défaut le libellé « 525 M² TERRAIN » des anciens imports. */
export function listingTerrainM2(l: Pick<MarketListingInput, "surfaceTerrain" | "exterieur">): number | null {
  if (l.surfaceTerrain && l.surfaceTerrain > 0) return l.surfaceTerrain;
  const m = /(\d[\d\s]*)\s*m²\s*terrain/i.exec(l.exterieur ?? "");
  const n = m ? Number(m[1].replace(/\s/g, "")) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
}

export type MarketRow = ComparableRow & { dateMutation: string };

export function positionListing(
  listing: MarketListingInput,
  rows: MarketRow[],
  minSample: number
): MarketPosition | null {
  if (listing.typeBien === "TERRAIN" || listing.surface <= 0) return null;

  const terrain = listing.typeBien === "MAISON" ? listingTerrainM2(listing) : null;
  const comparables = selectComparables(
    rows,
    { chambres: listing.chambres > 0 ? listing.chambres : null, terrain },
    minSample
  );
  const selection =
    comparables ?? (rows.length >= minSample ? medianSelection(rows) : null);
  if (!selection) return null;

  const prices = selection.rows.map((r) => r.prixM2); // déjà triés croissant
  const years = selection.rows.map((r) => new Date(r.dateMutation).getFullYear());
  const p25 = quantile(prices, 0.25);
  const p75 = quantile(prices, 0.75);
  const listingPrixM2 = Math.round(listing.prix / listing.surface);

  return {
    medianPrixM2: selection.medianPrixM2,
    p25,
    p75,
    count: selection.count,
    minAnnee: Math.min(...years),
    maxAnnee: Math.max(...years),
    listingPrixM2,
    diffPct: Math.round(((listingPrixM2 - selection.medianPrixM2) / selection.medianPrixM2) * 100),
    position: listingPrixM2 < p25 ? "below" : listingPrixM2 > p75 ? "above" : "within",
    scope: comparables ? "comparables" : "commune",
    pieces: comparables?.usedPieces ?? null,
    terrain: comparables?.usedTerrain ? (comparables.usedTerrain as TerrainBand).label : null,
    terrainIgnored: terrain && !comparables?.usedTerrain ? terrain : null,
  };
}

