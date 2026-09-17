import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("met en minuscules et retire les diacritiques", () => {
    expect(slugify("Templeuve-en-Pévèle")).toBe("templeuve-en-pevele");
    expect(slugify("Sainghin-en-Mélantois")).toBe("sainghin-en-melantois");
    expect(slugify("Péronne-en-Mélantois")).toBe("peronne-en-melantois");
  });

  it("remplace toute suite de non-alphanumériques par un seul tiret", () => {
    expect(slugify("Aix   en  Pévèle")).toBe("aix-en-pevele");
    expect(slugify("l'Abbaye (Saint-Pierre)")).toBe("l-abbaye-saint-pierre");
  });

  it("retire les tirets de début et de fin", () => {
    expect(slugify("  Bouvines  ")).toBe("bouvines");
    expect(slugify("--Genech--")).toBe("genech");
  });

  it("est idempotent", () => {
    const once = slugify("Mons-en-Pévèle");
    expect(slugify(once)).toBe(once);
  });
});
