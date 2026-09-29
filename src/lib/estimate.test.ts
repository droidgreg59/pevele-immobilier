import { describe, it, expect } from "vitest";
import {
  estimateBien,
  chambresToPieces,
  terrainBand,
  selectComparables,
  medianSelection,
  type ComparableRow,
} from "./estimate";

describe("estimateBien", () => {
  it("calcule une fourchette centrée sur prix/m² × surface", () => {
    const e = estimateBien({ avgPrixM2: 3000, sampleCount: 50, surface: 100 });
    expect(e.mid).toBe(300_000);
    expect(e.prixM2).toBe(3000);
    expect(e.bandPct).toBe(8); // ≥ 30 ventes → ±8 %
    expect(e.low).toBe(276_000);
    expect(e.high).toBe(324_000);
    expect(e.low).toBeLessThan(e.mid);
    expect(e.high).toBeGreaterThan(e.mid);
  });

  it("préfère le prix/m² du type de bien quand il est fourni", () => {
    const e = estimateBien({
      avgPrixM2: 3000,
      typeAvgPrixM2: 2600,
      sampleCount: 40,
      surface: 100,
    });
    expect(e.prixM2).toBe(2600);
    expect(e.mid).toBe(260_000);
  });

  it("élargit la fourchette quand l'échantillon DVF est mince", () => {
    expect(estimateBien({ avgPrixM2: 3000, sampleCount: 40, surface: 100 }).bandPct).toBe(8);
    expect(estimateBien({ avgPrixM2: 3000, sampleCount: 15, surface: 100 }).bandPct).toBe(12);
    expect(estimateBien({ avgPrixM2: 3000, sampleCount: 5, surface: 100 }).bandPct).toBe(18);
  });

  it("applique une décote pour une passoire thermique, une prime pour A/B", () => {
    const g = estimateBien({ avgPrixM2: 3000, sampleCount: 50, surface: 100, dpe: "G" });
    expect(g.dpeAdjustPct).toBe(-13);
    expect(g.mid).toBe(261_000); // 3000 * 0.87 * 100

    const a = estimateBien({ avgPrixM2: 3000, sampleCount: 50, surface: 100, dpe: "a" });
    expect(a.dpeAdjustPct).toBe(6);
    expect(a.mid).toBe(318_000);

    const d = estimateBien({ avgPrixM2: 3000, sampleCount: 50, surface: 100, dpe: "D" });
    expect(d.dpeAdjustPct).toBe(0);
  });

  it("ignore une classe DPE inconnue ou absente", () => {
    expect(estimateBien({ avgPrixM2: 3000, sampleCount: 50, surface: 100, dpe: "Z" }).dpeAdjustPct).toBe(0);
    expect(estimateBien({ avgPrixM2: 3000, sampleCount: 50, surface: 100 }).dpeAdjustPct).toBe(0);
  });

  it("arrondit au millier d'euros", () => {
    const e = estimateBien({ avgPrixM2: 3147, sampleCount: 50, surface: 83 });
    expect(e.mid % 1000).toBe(0);
    expect(e.low % 1000).toBe(0);
    expect(e.high % 1000).toBe(0);
  });
});

describe("chambresToPieces", () => {
  it("rapproche N chambres de N + 1 pièces principales DVF (séjour inclus)", () => {
    expect(chambresToPieces(5)).toBe(6);
    expect(chambresToPieces(0)).toBe(1);
  });
});

describe("terrainBand", () => {
  it("classe une surface de terrain dans sa tranche, borne basse incluse", () => {
    expect(terrainBand(0).label).toBe("moins de 300 m²");
    expect(terrainBand(300).label).toBe("300 à 600 m²");
    expect(terrainBand(999).label).toBe("600 à 1 000 m²");
    expect(terrainBand(50_000).label).toBe("plus de 2 000 m²");
  });
});

describe("selectComparables", () => {
  const row = (prixM2: number, nombrePieces: number | null, surfaceTerrain: number | null): ComparableRow => ({
    prixM2,
    nombrePieces,
    surfaceTerrain,
  });

  it("renvoie null sans critère saisi", () => {
    expect(selectComparables([row(3000, 5, 400)], {}, 1)).toBeNull();
  });

  it("filtre sur pièces ±1 et tranche de terrain, et prend la médiane", () => {
    const rows = [
      row(2000, 4, 400), // 3 ch. → 4 pièces, terrain 300–600 : retenue
      row(3000, 5, 500), // retenue (5 pièces = 4 ± 1)
      row(4000, 3, 350), // retenue
      row(9000, 7, 450), // trop de pièces
      row(9000, 4, 1500), // mauvaise tranche de terrain
    ];
    const sel = selectComparables(rows, { chambres: 3, terrain: 420 }, 3);
    expect(sel).not.toBeNull();
    expect(sel!.count).toBe(3);
    expect(sel!.medianPrixM2).toBe(3000);
    expect(sel!.usedPieces).toEqual({ min: 3, max: 5 });
    expect(sel!.usedTerrain?.label).toBe("300 à 600 m²");
  });

  it("abandonne d'abord le critère pièces si l'échantillon combiné est trop mince", () => {
    const rows = [row(2000, 8, 400), row(2200, 9, 450), row(2400, 4, 500)];
    const sel = selectComparables(rows, { chambres: 3, terrain: 420 }, 3);
    expect(sel!.usedPieces).toBeNull();
    expect(sel!.usedTerrain?.label).toBe("300 à 600 m²");
    expect(sel!.count).toBe(3);
  });

  it("garde les pièces seules si le terrain ne donne rien", () => {
    const rows = [row(2000, 4, 5000), row(2200, 4, null), row(2400, 5, 3000)];
    const sel = selectComparables(rows, { chambres: 3, terrain: 420 }, 3);
    expect(sel!.usedTerrain).toBeNull();
    expect(sel!.usedPieces).toEqual({ min: 3, max: 5 });
  });

  it("renvoie null quand aucune combinaison n'atteint l'échantillon minimal", () => {
    expect(selectComparables([row(2000, 4, 400)], { chambres: 3, terrain: 420 }, 5)).toBeNull();
  });
});

describe("medianSelection", () => {
  const row = (prixM2: number): ComparableRow => ({ prixM2, nombrePieces: null, surfaceTerrain: null });

  it("prend la médiane (moyenne des deux valeurs centrales si effectif pair)", () => {
    expect(medianSelection([row(3000), row(1000), row(2000)])!.medianPrixM2).toBe(2000);
    expect(medianSelection([row(1000), row(2000), row(3000), row(10_000)])!.medianPrixM2).toBe(2500);
  });

  it("n'est pas tirée par une vente extrême, contrairement à la moyenne", () => {
    const sel = medianSelection([row(2500), row(2600), row(2700), row(9000)])!;
    expect(sel.medianPrixM2).toBe(2650);
    expect(sel.count).toBe(4);
    expect(sel.usedPieces).toBeNull();
  });

  it("renvoie null sans vente", () => {
    expect(medianSelection([])).toBeNull();
  });
});
