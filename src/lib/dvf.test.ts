import { describe, it, expect } from "vitest";
import { computePercentileBounds } from "./dvf";

describe("computePercentileBounds", () => {
  it("exclut le 1er et le 99e centile sur un grand échantillon", () => {
    // 100 valeurs, 1..100 déjà triées.
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const bounds = computePercentileBounds(values, 0.01, 0.99);
    expect(bounds).toEqual({ min: 2, max: 100 });
  });

  it("ne va jamais au-delà des bornes réelles du tableau", () => {
    const values = [10, 20, 30];
    const bounds = computePercentileBounds(values, 0.01, 0.99);
    expect(bounds.min).toBeGreaterThanOrEqual(10);
    expect(bounds.max).toBeLessThanOrEqual(30);
  });

  it("renvoie {0,0} sur un tableau vide plutôt que de planter", () => {
    expect(computePercentileBounds([], 0.01, 0.99)).toEqual({ min: 0, max: 0 });
  });

  it("exclut une queue basse plus large qu'une queue haute étroite (asymétrie réaliste)", () => {
    const values = [
      ...Array(20).fill(100), // queue basse, > 1 % de l'échantillon
      ...Array(975).fill(500), // le gros de la distribution
      ...Array(5).fill(900), // queue haute, < 1 % de l'échantillon
    ];
    const bounds = computePercentileBounds(values, 0.01, 0.99);
    expect(bounds.min).toBe(100);
    expect(bounds.max).toBe(500);
  });
});
