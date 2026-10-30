import { describe, it, expect } from "vitest";
import { listingHeading, listingMetaDescription, listingSeoTitle, META_DESCRIPTION_MAX } from "./listing-seo";

const maison = {
  transaction: "VENTE" as const,
  typeBien: "MAISON" as const,
  typeMaison: "INDIVIDUELLE" as const,
  commune: "Templeuve-en-Pévèle",
  prix: 320000,
  surface: 120,
  pieces: 5,
  chambres: 3,
  surfaceTerrain: 500,
  dpe: "C",
  description:
    "En exclusivité, belle maison familiale au calme, proche de la gare TER, avec jardin exposé sud, garage et grenier aménageable. À visiter sans tarder.",
};

const terrain = {
  transaction: "VENTE" as const,
  typeBien: "TERRAIN" as const,
  typeMaison: null,
  commune: "Cobrieux",
  prix: 169500,
  surface: 1250,
  pieces: 0,
  chambres: 0,
  surfaceTerrain: null,
  dpe: null,
  description: "Terrain viabilisé.",
};

const nbsp = (s: string) => s.replace(/[  ]/g, " ");

describe("listingHeading", () => {
  it("donne type, précision maison, transaction et commune", () => {
    expect(listingHeading(maison)).toBe("Maison individuelle à vendre à Templeuve-en-Pévèle");
    expect(listingHeading({ ...maison, transaction: "LOCATION", typeBien: "APPARTEMENT" })).toBe(
      "Appartement à louer à Templeuve-en-Pévèle"
    );
  });
});

describe("listingSeoTitle", () => {
  it("met pièces, surface, commune et prix dans le titre", () => {
    expect(nbsp(listingSeoTitle(maison))).toBe("Maison 5 pièces 120 m² à vendre à Templeuve-en-Pévèle — 320 000 €");
  });

  it("donne la surface du terrain sans pièces", () => {
    expect(nbsp(listingSeoTitle(terrain))).toBe("Terrain de 1 250 m² à vendre à Cobrieux — 169 500 €");
  });

  it("affiche un loyer mensuel et omet les valeurs nulles", () => {
    expect(
      nbsp(listingSeoTitle({ ...maison, transaction: "LOCATION", prix: 950, pieces: 0, surface: 0 }))
    ).toBe("Maison à louer à Templeuve-en-Pévèle — 950 €/mois");
  });
});

describe("listingMetaDescription", () => {
  it("commence par les faits du bien puis complète avec le texte de l'annonce", () => {
    const d = nbsp(listingMetaDescription({ ...maison, typeMaison: null, surfaceTerrain: null }));
    expect(d.startsWith(
      "Maison (120 m², 5 pièces dont 3 chambres) à vendre à Templeuve-en-Pévèle : 320 000 €. DPE C. En exclusivité"
    )).toBe(true);
    expect(d.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    expect(d.endsWith("…")).toBe(true);
  });

  it("s'en tient aux faits quand il reste trop peu de place pour un extrait", () => {
    expect(nbsp(listingMetaDescription(maison))).toBe(
      "Maison individuelle (120 m², 5 pièces dont 3 chambres, terrain de 500 m²) à vendre à Templeuve-en-Pévèle : 320 000 €. DPE C."
    );
  });

  it("n'ajoute ni DPE ni pièces pour un terrain", () => {
    expect(nbsp(listingMetaDescription(terrain))).toBe(
      "Terrain (1 250 m²) à vendre à Cobrieux : 169 500 €. Terrain viabilisé."
    );
  });

  it("ignore un DPE qui n'est pas une classe A à G", () => {
    expect(listingMetaDescription({ ...maison, dpe: "NC" })).not.toContain("DPE");
  });
});
