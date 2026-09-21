import { describe, it, expect } from "vitest";
import { buildBudgetBrackets } from "./budget-brackets";

describe("buildBudgetBrackets", () => {
  it("calcule count/pct/médianes pour un palier avec assez d'observations", () => {
    const retained = [
      { valeurFonciere: 150000, surfaceBati: 70 },
      { valeurFonciere: 180000, surfaceBati: 80 },
      { valeurFonciere: 200000, surfaceBati: 85 },
      { valeurFonciere: 220000, surfaceBati: 90 },
      { valeurFonciere: 250000, surfaceBati: 95 },
      { valeurFonciere: 400000, surfaceBati: 140 },
    ];
    const [bracket] = buildBudgetBrackets(retained, [250000]);
    expect(bracket.totalRetained).toBe(6);
    expect(bracket.count).toBe(5);
    expect(bracket.pct).toBeCloseTo(83.3, 1);
    expect(bracket.medianSurface).toBe(85);
    expect(bracket.medianPrix).toBe(200000);
  });

  it("renvoie medianSurface/medianPrix à null sous le seuil minimum, mais garde count/pct", () => {
    const retained = [
      { valeurFonciere: 100000, surfaceBati: 60 },
      { valeurFonciere: 500000, surfaceBati: 150 },
      { valeurFonciere: 520000, surfaceBati: 155 },
      { valeurFonciere: 540000, surfaceBati: 160 },
      { valeurFonciere: 560000, surfaceBati: 165 },
    ];
    const [bracket] = buildBudgetBrackets(retained, [200000]);
    expect(bracket.count).toBe(1);
    expect(bracket.pct).toBe(20);
    expect(bracket.medianSurface).toBeNull();
    expect(bracket.medianPrix).toBeNull();
  });

  it("gère plusieurs paliers indépendamment", () => {
    const retained = [
      { valeurFonciere: 100000, surfaceBati: 60 },
      { valeurFonciere: 200000, surfaceBati: 80 },
      { valeurFonciere: 300000, surfaceBati: 100 },
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
  });
});
