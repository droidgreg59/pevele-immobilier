import { describe, it, expect } from "vitest";
import { estimateBien } from "./estimate";

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
