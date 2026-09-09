import { describe, it, expect } from "vitest";
import { parseBrowseSearchParams, browseListingWhere, browseOrderBy } from "./listing-query";

describe("parseBrowseSearchParams", () => {
  it("renvoie des valeurs par défaut saines quand rien n'est fourni", () => {
    const { criteria, tri, page } = parseBrowseSearchParams({});
    expect(tri).toBe("recent");
    expect(page).toBe(1);
    expect(criteria.filtre).toBe("tout");
    expect(criteria.typeBien).toBe("TOUS");
    expect(criteria.typeMaison).toBe("TOUS");
    expect(criteria.villageSlugs).toEqual([]);
    expect(criteria.equipements).toEqual([]);
  });

  it("lit type, tri, filtre, budget, chambres, villages, équipements", () => {
    const { criteria, tri, page } = parseBrowseSearchParams({
      type: "MAISON",
      typeMaison: "MITOYENNE",
      filtre: "agence",
      tri: "prix_asc",
      budgetMin: "100000",
      budget: "300000",
      chambresMin: "3",
      villages: "cysoing,orchies",
      equip: "garage,jardin",
      page: "2",
    });
    expect(tri).toBe("prix_asc");
    expect(page).toBe(2);
    expect(criteria.typeBien).toBe("MAISON");
    expect(criteria.typeMaison).toBe("MITOYENNE");
    expect(criteria.filtre).toBe("agence");
    expect(criteria.budgetMin).toBe(100000);
    expect(criteria.budgetMax).toBe(300000);
    expect(criteria.chambresMin).toBe(3);
    expect(criteria.villageSlugs).toEqual(["cysoing", "orchies"]);
    expect(criteria.equipements).toEqual(["garage", "jardin"]);
    expect(criteria.querySlug).toBeUndefined();
  });

  it("ignore typeMaison si le type de bien n'est pas MAISON", () => {
    const { criteria } = parseBrowseSearchParams({ type: "APPARTEMENT", typeMaison: "MITOYENNE" });
    expect(criteria.typeMaison).toBe("TOUS");
  });

  it("n'utilise `q` que sans villages sélectionnés, et rejette une valeur de tri inconnue", () => {
    expect(parseBrowseSearchParams({ q: "cysoing" }).criteria.querySlug).toBe("cysoing");
    expect(parseBrowseSearchParams({ q: "cysoing", villages: "orchies" }).criteria.querySlug).toBeUndefined();
    expect(parseBrowseSearchParams({ tri: "n_importe_quoi" }).tri).toBe("recent");
    expect(parseBrowseSearchParams({ page: "0" }).page).toBe(1);
    expect(parseBrowseSearchParams({ page: "-3" }).page).toBe(1);
  });
});

describe("browseListingWhere", () => {
  it("filtre toujours sur la transaction et le statut PUBLIEE", () => {
    const w = browseListingWhere("VENTE", {});
    expect(w.transaction).toBe("VENTE");
    expect(w.statut).toBe("PUBLIEE");
  });

  it("traduit villages, budget, chambres et équipements", () => {
    const w = browseListingWhere("LOCATION", {
      villageSlugs: ["cysoing", "orchies"],
      budgetMin: 500,
      budgetMax: 1200,
      chambresMin: 2,
      equipements: ["garage", "jardin"],
    });
    expect(w.villageSlug).toEqual({ in: ["cysoing", "orchies"] });
    expect(w.prix).toEqual({ gte: 500, lte: 1200 });
    expect(w.chambres).toEqual({ gte: 2 });
    expect(w.AND).toEqual([
      { equipements: { contains: "garage" } },
      { equipements: { contains: "jardin" } },
    ]);
  });

  it("utilise un `contains` sur le slug de la requête texte quand aucun village n'est coché", () => {
    const w = browseListingWhere("VENTE", { querySlug: "Templeuve en Pévèle" });
    expect(w.villageSlug).toEqual({ contains: "templeuve-en-pevele" });
  });

  it("filtre par type de propriétaire", () => {
    expect(browseListingWhere("VENTE", { filtre: "agence" }).owner).toEqual({ type: "AGENCE" });
    expect(browseListingWhere("VENTE", { filtre: "particulier" }).owner).toEqual({
      type: "PARTICULIER",
    });
    expect(browseListingWhere("VENTE", { filtre: "tout" }).owner).toBeUndefined();
  });
});

describe("browseOrderBy", () => {
  it("mappe chaque tri sur un orderBy Prisma", () => {
    expect(browseOrderBy("prix_asc")).toEqual({ prix: "asc" });
    expect(browseOrderBy("prix_desc")).toEqual({ prix: "desc" });
    expect(browseOrderBy("surface_desc")).toEqual({ surface: "desc" });
    expect(browseOrderBy("recent")).toEqual({ createdAt: "desc" });
  });
});
