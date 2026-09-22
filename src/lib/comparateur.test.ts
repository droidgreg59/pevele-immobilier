import { describe, it, expect } from "vitest";
import { canonicalPairOrder, isLaunchPair, isRealAdjacent, buildComparisonSummary, LAUNCH_PAIRS } from "./comparateur";

describe("canonicalPairOrder", () => {
  it("trie toujours par ordre alphabétique, quel que soit l'ordre d'entrée", () => {
    expect(canonicalPairOrder("templeuve-en-pevele", "cysoing")).toEqual(["cysoing", "templeuve-en-pevele"]);
    expect(canonicalPairOrder("cysoing", "templeuve-en-pevele")).toEqual(["cysoing", "templeuve-en-pevele"]);
  });
});

describe("isLaunchPair", () => {
  it("reconnaît une paire de l'allowlist dans les deux ordres", () => {
    const [a, b] = LAUNCH_PAIRS[0];
    expect(isLaunchPair(a, b)).toBe(true);
    expect(isLaunchPair(b, a)).toBe(true);
  });

  it("rejette une paire hors allowlist, même si elle est par ailleurs limitrophe", () => {
    expect(isLaunchPair("cysoing", "camphin-en-pevele")).toBe(false);
  });
});

describe("isRealAdjacent", () => {
  it("confirme un cas réel connu (Cysoing / Templeuve-en-Pévèle)", () => {
    expect(isRealAdjacent("cysoing", "templeuve-en-pevele")).toBe(true);
  });

  it("infirme un cas réel connu (Cysoing / Wannehain, proches mais non limitrophes)", () => {
    expect(isRealAdjacent("cysoing", "wannehain")).toBe(false);
  });
});

describe("buildComparisonSummary", () => {
  const base = {
    stats: null,
    evolutionPct: null,
    gares: [] as string[],
    commercesCount: 0,
    ecolesCount: 0,
    arretsBus: 0,
  };

  it("ne dit jamais qu'une commune est meilleure — reste factuel sur l'écart de prix", () => {
    const a = { ...base, slug: "a", nom: "Alpha", stats: { typeLocal: "Maison" as const, count: 10, retainedCount: 10, medianPrixM2: 2000, avgPrixM2: 2000, minPrixM2: 1800, maxPrixM2: 2200, minAnnee: 2023, maxAnnee: 2025 } };
    const b = { ...base, slug: "b", nom: "Beta", stats: { typeLocal: "Maison" as const, count: 12, retainedCount: 12, medianPrixM2: 3000, avgPrixM2: 3000, minPrixM2: 2800, maxPrixM2: 3200, minAnnee: 2023, maxAnnee: 2025 } };
    const lines = buildComparisonSummary(a, b);
    expect(lines.join(" ")).not.toMatch(/meilleur|préférable|agréable|choix/i);
    expect(lines[0]).toContain("50 %");
  });

  it("signale une différence de gare, dans le bon sens, même en inversant l'ordre des arguments", () => {
    const a = { ...base, slug: "a", nom: "Alpha", gares: ["Gare Alpha"] };
    const b = { ...base, slug: "b", nom: "Beta", gares: [] };
    expect(buildComparisonSummary(a, b).join(" ")).toContain("Alpha dispose d'une gare");
    expect(buildComparisonSummary(b, a).join(" ")).toContain("Alpha dispose d'une gare");
  });

  it("dit explicitement qu'aucune des deux n'a de gare quand c'est le cas", () => {
    const a = { ...base, slug: "a", nom: "Alpha" };
    const b = { ...base, slug: "b", nom: "Beta" };
    expect(buildComparisonSummary(a, b).join(" ")).toContain("Aucune des deux communes n'a de gare");
  });

  it("varie réellement d'une paire à l'autre (pas le même texte générique)", () => {
    const a1 = { ...base, slug: "a", nom: "Alpha", gares: ["G"] };
    const b1 = { ...base, slug: "b", nom: "Beta" };
    const a2 = { ...base, slug: "c", nom: "Gamma" };
    const b2 = { ...base, slug: "d", nom: "Delta" };
    expect(buildComparisonSummary(a1, b1).join(" ")).not.toBe(buildComparisonSummary(a2, b2).join(" "));
  });

  it("mentionne l'écart de commerces recensés quand il existe, sans jugement de qualité de vie", () => {
    const a = { ...base, slug: "a", nom: "Alpha", commercesCount: 8 };
    const b = { ...base, slug: "b", nom: "Beta", commercesCount: 3 };
    const text = buildComparisonSummary(a, b).join(" ");
    expect(text).toContain("Alpha recense 5 commerces de plus que Beta");
    expect(text).toContain("(8 contre 3)");
    expect(text).not.toMatch(/qualité de vie/i);
  });

  it("garde le bon ordre dans la parenthèse même quand c'est le second argument qui a le plus de commerces (non-régression)", () => {
    const a = { ...base, slug: "a", nom: "Alpha", commercesCount: 5 };
    const b = { ...base, slug: "b", nom: "Beta", commercesCount: 10 };
    const text = buildComparisonSummary(a, b).join(" ");
    expect(text).toContain("Beta recense 5 commerces de plus que Alpha");
    expect(text).toContain("(10 contre 5)");
    expect(text).not.toContain("(5 contre 10)");
  });
});
