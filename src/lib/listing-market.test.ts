import { describe, it, expect } from "vitest";
import { positionListing, listingTerrainM2, type MarketRow } from "./listing-market";

const row = (prixM2: number, pieces: number, terrain: number | null, year = 2025): MarketRow => ({
  prixM2,
  nombrePieces: pieces,
  surfaceTerrain: terrain,
  dateMutation: `${year}-06-01T00:00:00.000Z`,
});

// 8 maisons 4-6 pièces avec 300-600 m² (≈ 2 800-3 200 €/m²) + 8 grandes parcelles bien moins chères au m²
const rows: MarketRow[] = [
  ...[2800, 2850, 2900, 3000, 3050, 3100, 3150, 3200].map((p) => row(p, 5, 450)),
  ...[1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200].map((p) => row(p, 5, 1500)),
];

const maison = { typeBien: "MAISON" as const, prix: 410000, surface: 110, chambres: 4 };

describe("positionListing", () => {
  it("compare à des ventes de même tranche de terrain, pas à toute la commune", () => {
    const withTerrain = positionListing({ ...maison, surfaceTerrain: 525 }, rows, 5)!;
    expect(withTerrain.scope).toBe("comparables");
    expect(withTerrain.terrain).toBe("300 à 600 m²");
    expect(withTerrain.count).toBe(8);
    expect(withTerrain.medianPrixM2).toBe(3025);
    // 410000/110 = 3727 €/m² : au-dessus de la fourchette de ces ventes
    expect(withTerrain.position).toBe("above");
    // Une grande parcelle serait comparée aux ventes de grandes parcelles
    const big = positionListing({ ...maison, surfaceTerrain: 1500 }, rows, 5)!;
    expect(big.terrain).toBe("1 000 à 2 000 m²");
    expect(big.medianPrixM2).toBe(1850);
  });

  it("signale un terrain qui n'a pas pu servir de critère", () => {
    const p = positionListing({ ...maison, surfaceTerrain: 11000 }, rows, 5)!;
    expect(p.terrain).toBeNull();
    expect(p.terrainIgnored).toBe(11000);
    expect(positionListing({ ...maison, surfaceTerrain: 450 }, rows, 5)!.terrainIgnored).toBeNull();
  });

  it("lit le terrain dans l'ancien libellé exterieur", () => {
    expect(listingTerrainM2({ exterieur: "1 453 M² TERRAIN, JARDIN" })).toBe(1453);
    expect(listingTerrainM2({ exterieur: "JARDIN" })).toBeNull();
    expect(listingTerrainM2({ surfaceTerrain: 600, exterieur: "10 M² TERRAIN" })).toBe(600);
  });

  it("se replie sur toute la commune si les comparables sont trop peu nombreux", () => {
    const few = [row(3000, 5, 450), row(3100, 5, 450), ...rows.slice(8).map((r) => ({ ...r, nombrePieces: 2 }))];
    const p = positionListing({ ...maison, surfaceTerrain: 450 }, few, 5)!;
    expect(p.scope).toBe("commune");
    expect(p.terrain).toBeNull();
  });

  it("ne donne rien sans échantillon suffisant ni pour un terrain", () => {
    expect(positionListing(maison, rows.slice(0, 3), 5)).toBeNull();
    expect(positionListing({ ...maison, typeBien: "TERRAIN" }, rows, 5)).toBeNull();
  });

  it("classe dans la fourchette quand le prix est entre les quartiles", () => {
    const p = positionListing({ ...maison, prix: 330000, surfaceTerrain: 450 }, rows, 5)!; // 3000 €/m²
    expect(p.position).toBe("within");
    expect(p.minAnnee).toBe(2025);
  });
});
