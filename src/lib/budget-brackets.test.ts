import { describe, it, expect } from "vitest";
import { buildBudgetBrackets } from "./budget-brackets";

describe("buildBudgetBrackets", () => {
  it("calcule count/pct/médianes pour un palier avec assez d'observations", () => {
    const retained = [
      { valeurFonciere: 150000, surfaceBati: 70, surfaceTerrain: 300 },
      { valeurFonciere: 180000, surfaceBati: 80, surfaceTerrain: 350 },
      { valeurFonciere: 200000, surfaceBati: 85, surfaceTerrain: 400 },
      { valeurFonciere: 220000, surfaceBati: 90, surfaceTerrain: 450 },
      { valeurFonciere: 250000, surfaceBati: 95, surfaceTerrain: 500 },
      { valeurFonciere: 400000, surfaceBati: 140, surfaceTerrain: 900 },
    ];
    const [bracket] = buildBudgetBrackets(retained, [250000]);
    expect(bracket.totalRetained).toBe(6);
    expect(bracket.count).toBe(5);
    expect(bracket.pct).toBeCloseTo(83.3, 1);
    expect(bracket.medianSurface).toBe(85);
    expect(bracket.medianPrix).toBe(200000);
    expect(bracket.medianTerrain).toBe(400);
  });

  it("renvoie medianSurface/medianPrix/medianTerrain à null sous le seuil minimum, mais garde count/pct", () => {
    const retained = [
      { valeurFonciere: 100000, surfaceBati: 60, surfaceTerrain: 200 },
      { valeurFonciere: 500000, surfaceBati: 150, surfaceTerrain: 800 },
      { valeurFonciere: 520000, surfaceBati: 155, surfaceTerrain: 820 },
      { valeurFonciere: 540000, surfaceBati: 160, surfaceTerrain: 840 },
      { valeurFonciere: 560000, surfaceBati: 165, surfaceTerrain: 860 },
    ];
    const [bracket] = buildBudgetBrackets(retained, [200000]);
    expect(bracket.count).toBe(1);
    expect(bracket.pct).toBe(20);
    expect(bracket.medianSurface).toBeNull();
    expect(bracket.medianPrix).toBeNull();
    expect(bracket.medianTerrain).toBeNull();
  });

  it("renvoie medianTerrain à null si trop de ventes du palier n'ont pas de surface de terrain renseignée, même quand medianSurface/medianPrix sont valides", () => {
    const retained = [
      { valeurFonciere: 150000, surfaceBati: 70, surfaceTerrain: 300 },
      { valeurFonciere: 180000, surfaceBati: 80, surfaceTerrain: null },
      { valeurFonciere: 200000, surfaceBati: 85, surfaceTerrain: null },
      { valeurFonciere: 220000, surfaceBati: 90, surfaceTerrain: null },
      { valeurFonciere: 250000, surfaceBati: 95, surfaceTerrain: null },
    ];
    const [bracket] = buildBudgetBrackets(retained, [250000]);
    expect(bracket.count).toBe(5);
    expect(bracket.medianSurface).not.toBeNull();
    expect(bracket.medianTerrain).toBeNull();
  });

  it("gère plusieurs paliers indépendamment", () => {
    const retained = [
      { valeurFonciere: 100000, surfaceBati: 60, surfaceTerrain: 200 },
      { valeurFonciere: 200000, surfaceBati: 80, surfaceTerrain: 400 },
      { valeurFonciere: 300000, surfaceBati: 100, surfaceTerrain: 600 },
    ];
    const brackets = buildBudgetBrackets(retained, [150000, 350000]);
    expect(brackets[0].count).toBe(1);
    expect(brackets[1].count).toBe(3);
  });

  it("ne plante pas sur un tableau vide (renvoie pct=0, count=0)", () => {
    const [bracket] = buildBudgetBrackets([], [300000]);
    expect(bracket.totalRetained).toBe(0);
    expect(bracket.count).toBe(0);
    expect(bracket.pct).toBe(0);
    expect(bracket.medianSurface).toBeNull();
    expect(bracket.medianTerrain).toBeNull();
  });
});
