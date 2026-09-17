import { describe, it, expect } from "vitest";
import { villages, getVillageBySlug, getVillageByInsee, nearestVillages } from "./villages";
import { villageBoundaries } from "./village-boundaries";
import { villageCoords } from "./village-coords";
import { villageAmenities } from "./village-amenities";

describe("jeu de communes suivies", () => {
  it("compte 38 communes", () => {
    expect(villages.length).toBe(38);
  });

  it("a des slugs et des codes INSEE uniques", () => {
    expect(new Set(villages.map((v) => v.slug)).size).toBe(villages.length);
    expect(new Set(villages.map((v) => v.insee)).size).toBe(villages.length);
  });

  it("attribue à chaque commune un code INSEE du Nord (59xxx)", () => {
    for (const v of villages) expect(v.insee).toMatch(/^59\d{3}$/);
  });

  it("a un contour, des coordonnées et des équipements pour CHAQUE commune", () => {
    for (const v of villages) {
      expect(villageBoundaries[v.insee], `contour manquant pour ${v.nom}`).toBeDefined();
      expect(villageCoords[v.insee], `coordonnées manquantes pour ${v.nom}`).toBeDefined();
      expect(villageAmenities[v.insee], `équipements manquants pour ${v.nom}`).toBeDefined();
    }
  });

  it("n'a pas de contour/coordonnées orphelins (clé sans commune correspondante)", () => {
    const inseeSet = new Set(villages.map((v) => v.insee));
    for (const insee of Object.keys(villageBoundaries)) expect(inseeSet.has(insee)).toBe(true);
    for (const insee of Object.keys(villageCoords)) expect(inseeSet.has(insee)).toBe(true);
  });

  it("place chaque commune dans la bounding box de la Pévèle", () => {
    for (const c of Object.values(villageCoords)) {
      expect(c.lat).toBeGreaterThan(50.4);
      expect(c.lat).toBeLessThan(50.7);
      expect(c.lng).toBeGreaterThan(2.9);
      expect(c.lng).toBeLessThan(3.4);
    }
  });
});

describe("getVillageBySlug / getVillageByInsee", () => {
  it("retrouve une commune connue et renvoie undefined sinon", () => {
    expect(getVillageBySlug("cysoing")?.nom).toBe("Cysoing");
    expect(getVillageByInsee("59168")?.slug).toBe("cysoing");
    expect(getVillageBySlug("montcuq")).toBeUndefined();
  });

  it("inclut les 3 communes ajoutées (Anstaing, Bouvines, Péronne-en-Mélantois)", () => {
    expect(getVillageBySlug("anstaing")?.insee).toBe("59013");
    expect(getVillageBySlug("bouvines")?.insee).toBe("59106");
    expect(getVillageBySlug("peronne-en-melantois")?.insee).toBe("59458");
  });
});

describe("nearestVillages", () => {
  it("renvoie N communes, triées par proximité, sans l'origine", () => {
    const near = nearestVillages("cysoing", 4);
    expect(near).toHaveLength(4);
    expect(near.map((v) => v.slug)).not.toContain("cysoing");
    // distances croissantes sur le repère carte
    const origin = getVillageBySlug("cysoing")!;
    const d = near.map((v) => (v.mapX - origin.mapX) ** 2 + (v.mapY - origin.mapY) ** 2);
    expect([...d]).toEqual([...d].sort((a, b) => a - b));
  });

  it("renvoie une liste vide pour un slug inconnu", () => {
    expect(nearestVillages("nulle-part")).toEqual([]);
  });
});
