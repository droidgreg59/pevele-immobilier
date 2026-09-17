import { describe, it, expect } from "vitest";
import { polygonAreaFromPath } from "./svg-path-area";

describe("polygonAreaFromPath", () => {
  it("calcule l'aire d'un carré 10x10", () => {
    expect(polygonAreaFromPath("M 0 0 L 10 0 L 10 10 L 0 10 Z")).toBe(100);
  });

  it("calcule l'aire d'un triangle rectangle", () => {
    expect(polygonAreaFromPath("M 0 0 L 4 0 L 0 3 Z")).toBe(6);
  });

  it("est indépendante du sens de parcours (horaire/antihoraire)", () => {
    const cw = polygonAreaFromPath("M 0 0 L 10 0 L 10 10 L 0 10 Z");
    const ccw = polygonAreaFromPath("M 0 0 L 0 10 L 10 10 L 10 0 Z");
    expect(cw).toBe(ccw);
  });

  it("renvoie 0 pour un tracé dégénéré (moins de 3 points)", () => {
    expect(polygonAreaFromPath("M 0 0 L 10 10 Z")).toBe(0);
    expect(polygonAreaFromPath("")).toBe(0);
  });
});
