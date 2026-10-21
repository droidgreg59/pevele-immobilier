import { describe, it, expect } from "vitest";
import { imageStats, isFloorPlan, galleryPhotos, planPhotos } from "./photo-classify";

/** Image synthétique de n pixels : `fill(i)` renvoie [r, g, b]. */
function img(n: number, fill: (i: number) => [number, number, number]): Uint8Array {
  const a = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) a.set(fill(i), i * 3);
  return a;
}

describe("isFloorPlan", () => {
  it("reconnaît un plan : fond blanc, traits gris, quelques étiquettes orange", () => {
    const plan = img(9216, (i) =>
      i % 10 === 0 ? [70, 70, 90] : i % 97 === 0 ? [230, 120, 40] : [252, 252, 252]
    );
    const s = imageStats(plan);
    expect(s.white).toBeGreaterThan(0.8);
    expect(isFloorPlan(s)).toBe(true);
  });

  it("rejette une photo : couleurs variées, peu de blanc pur", () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 255;
    const photo = img(9216, () => [rand(), rand() * 0.8, rand() * 0.6]);
    expect(isFloorPlan(imageStats(photo))).toBe(false);
  });

  it("rejette une pièce très claire mais photographiée (dégradés, nombreuses teintes)", () => {
    const room = img(9216, (i) => {
      const v = 180 + (i % 70);
      return [v, v - 8 + (i % 5), v - 20 + (i % 9)];
    });
    expect(isFloorPlan(imageStats(room))).toBe(false);
  });
});

describe("galleryPhotos / planPhotos", () => {
  const p = (id: string, isPlan: boolean) => ({ id, isPlan });
  it("sépare photos et plans", () => {
    const all = [p("a", false), p("plan", true), p("b", false)];
    expect(galleryPhotos(all).map((x) => x.id)).toEqual(["a", "b"]);
    expect(planPhotos(all).map((x) => x.id)).toEqual(["plan"]);
  });
  it("si l'annonce n'a que des plans, ils restent dans la galerie", () => {
    const all = [p("plan1", true), p("plan2", true)];
    expect(galleryPhotos(all)).toHaveLength(2);
    expect(planPhotos(all)).toHaveLength(0);
  });
});
