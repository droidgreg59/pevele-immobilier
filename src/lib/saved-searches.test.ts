import { describe, it, expect } from "vitest";
import {
  savedSearchListingWhere,
  savedSearchLabel,
  savedSearchUrl,
  type SavedSearchCriteria,
} from "./saved-searches";

const base: SavedSearchCriteria = {
  transaction: "VENTE",
  typeBien: null,
  typeMaison: null,
  q: null,
  villageSlugs: null,
  chambresMin: null,
  equipements: null,
  budgetMin: null,
  budgetMax: null,
};

describe("savedSearchListingWhere", () => {
  it("filtre a minima sur transaction + statut PUBLIEE", () => {
    const w = savedSearchListingWhere(base);
    expect(w.transaction).toBe("VENTE");
    expect(w.statut).toBe("PUBLIEE");
    expect(w.createdAt).toBeUndefined();
  });

  it("ajoute une borne createdAt quand `since` est fourni (fenêtre nouveaux biens)", () => {
    const since = new Date("2026-01-01T00:00:00Z");
    expect(savedSearchListingWhere(base, since).createdAt).toEqual({ gt: since });
  });

  it("traduit villages (liste), type, chambres, équipements et budget", () => {
    const w = savedSearchListingWhere({
      ...base,
      villageSlugs: "cysoing,orchies",
      typeBien: "MAISON",
      typeMaison: "MITOYENNE",
      chambresMin: 3,
      equipements: "garage,jardin",
      budgetMin: 100_000,
      budgetMax: 300_000,
    });
    expect(w.villageSlug).toEqual({ in: ["cysoing", "orchies"] });
    expect(w.typeBien).toBe("MAISON");
    expect(w.typeMaison).toBe("MITOYENNE");
    expect(w.chambres).toEqual({ gte: 3 });
    expect(w.AND).toEqual([
      { equipements: { contains: "garage" } },
      { equipements: { contains: "jardin" } },
    ]);
    expect(w.prix).toEqual({ gte: 100_000, lte: 300_000 });
  });

  it("retombe sur un `contains` du slug de `q` quand aucun village n'est listé", () => {
    expect(savedSearchListingWhere({ ...base, q: "Pont-à-Marcq" }).villageSlug).toEqual({
      contains: "pont-a-marcq",
    });
  });
});

/** Normalise les espaces insécables (fr-FR) pour des assertions lisibles. */
const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");

describe("savedSearchLabel", () => {
  it("compose un libellé lisible avec type, communes et budget", () => {
    const label = norm(
      savedSearchLabel({
        ...base,
        transaction: "VENTE",
        typeBien: "MAISON",
        typeMaison: "INDIVIDUELLE",
        villageSlugs: "cysoing",
        budgetMax: 300_000,
      })
    );
    expect(label).toContain("Achat");
    expect(label).toContain("Maison individuelle");
    expect(label).toContain("Cysoing");
    expect(label).toContain("≤ 300 000 €");
  });

  it("dit « toute la Pévèle » sans commune ni recherche texte, et « Location » pour une loc", () => {
    expect(savedSearchLabel({ ...base, transaction: "LOCATION" })).toBe("Location · toute la Pévèle");
  });

  it("affiche une fourchette quand min et max sont donnés", () => {
    const label = norm(savedSearchLabel({ ...base, budgetMin: 100_000, budgetMax: 250_000 }));
    expect(label).toContain("100 000 – 250 000 €");
  });
});

describe("savedSearchUrl", () => {
  it("pointe vers /acheter pour une vente et encode les critères", () => {
    const url = savedSearchUrl({
      transaction: "VENTE",
      typeBien: "MAISON",
      typeMaison: "MITOYENNE",
      q: null,
      villageSlugs: "cysoing,orchies",
      chambresMin: 3,
      equipements: "garage",
      budgetMin: 100_000,
      budgetMax: 300_000,
    });
    expect(url.startsWith("/acheter?")).toBe(true);
    const qs = new URLSearchParams(url.split("?")[1]);
    expect(qs.get("villages")).toBe("cysoing,orchies");
    expect(qs.get("type")).toBe("MAISON");
    expect(qs.get("typeMaison")).toBe("MITOYENNE");
    expect(qs.get("chambresMin")).toBe("3");
    expect(qs.get("equip")).toBe("garage");
    expect(qs.get("budgetMin")).toBe("100000");
    expect(qs.get("budget")).toBe("300000");
  });

  it("pointe vers /louer pour une location et retombe sur `q` sans villages", () => {
    const url = savedSearchUrl({
      transaction: "LOCATION",
      typeBien: null,
      typeMaison: null,
      q: "genech",
      villageSlugs: null,
      chambresMin: null,
      equipements: null,
      budgetMin: null,
      budgetMax: null,
    });
    expect(url).toBe("/louer?q=genech");
  });

  it("renvoie la base sans query string quand il n'y a aucun critère", () => {
    expect(
      savedSearchUrl({
        transaction: "VENTE",
        typeBien: null,
        typeMaison: null,
        q: null,
        villageSlugs: null,
        chambresMin: null,
        equipements: null,
        budgetMin: null,
        budgetMax: null,
      })
    ).toBe("/acheter");
  });
});
