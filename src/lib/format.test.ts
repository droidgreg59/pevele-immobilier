import { describe, it, expect } from "vitest";
import { formatPrix, formatPrixM2, dpeClassColor } from "./format";

describe("formatPrix", () => {
  it("formate un prix de vente avec séparateur de milliers insécable", () => {
    // Intl utilise l'espace insécable étroit (U+202F) en fr-FR.
    expect(formatPrix(250000, "VENTE").replace(/ | /g, " ")).toBe("250 000 €");
  });

  it("ajoute /mois pour une location", () => {
    expect(formatPrix(850, "LOCATION").replace(/ | /g, " ")).toBe("850 €/mois");
  });
});

describe("formatPrixM2", () => {
  it("arrondit le prix au m² et le met en majuscules", () => {
    expect(formatPrixM2(300000, 90).replace(/ | /g, " ")).toBe("3 333 € / M²");
  });
});

describe("dpeClassColor", () => {
  it("renvoie la couleur officielle pour chaque classe A–G", () => {
    expect(dpeClassColor("A")).toBe("#0f8a4a");
    expect(dpeClassColor("G")).toBe("#e30613");
  });

  it("renvoie un gris neutre pour une valeur inconnue", () => {
    expect(dpeClassColor("Z")).toBe("#e9e9ec");
    expect(dpeClassColor("")).toBe("#e9e9ec");
  });
});
