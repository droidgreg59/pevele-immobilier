import { describe, it, expect } from "vitest";
import { findContentBox, padBox } from "./logo-crop";

function image(w: number, h: number, pixel: (x: number, y: number) => [number, number, number, number]) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) d.set(pixel(x, y), (y * w + x) * 4);
  return d;
}

describe("findContentBox", () => {
  it("ignore les marges blanches d'une image opaque", () => {
    const d = image(10, 10, (x, y) =>
      x >= 3 && x < 7 && y >= 2 && y < 5 ? [0, 58, 180, 255] : [255, 255, 255, 255]
    );
    expect(findContentBox(d, 10, 10)).toEqual({ x: 3, y: 2, w: 4, h: 3 });
  });

  it("ignore les marges transparentes et garde un logo blanc", () => {
    const d = image(10, 10, (x, y) =>
      x >= 1 && x < 4 && y >= 1 && y < 3 ? [255, 255, 255, 255] : [0, 0, 0, 0]
    );
    expect(findContentBox(d, 10, 10)).toEqual({ x: 1, y: 1, w: 3, h: 2 });
  });

  it("renvoie null pour une image vide ou entièrement blanche", () => {
    expect(findContentBox(image(4, 4, () => [255, 255, 255, 255]), 4, 4)).toBeNull();
    expect(findContentBox(image(4, 4, () => [0, 0, 0, 0]), 4, 4)).toBeNull();
  });
});

describe("padBox", () => {
  it("ajoute une marge proportionnelle sans sortir de l'image", () => {
    expect(padBox({ x: 3, y: 2, w: 4, h: 3 }, 0.5, 10, 10)).toEqual({ x: 1, y: 0, w: 8, h: 7 });
    expect(padBox({ x: 0, y: 0, w: 10, h: 10 }, 0.1, 10, 10)).toEqual({ x: 0, y: 0, w: 10, h: 10 });
  });
});
