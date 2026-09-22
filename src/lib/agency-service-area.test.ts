import { describe, it, expect } from "vitest";
import { canManageServiceAreas, filterValidVillageSlugs } from "./agency-service-area";

describe("canManageServiceAreas", () => {
  it("autorise un compte AGENCE", () => {
    expect(canManageServiceAreas({ type: "AGENCE" })).toBe(true);
  });

  it("refuse un compte PARTICULIER", () => {
    expect(canManageServiceAreas({ type: "PARTICULIER" })).toBe(false);
  });

  it("refuse un compte ARTISAN", () => {
    expect(canManageServiceAreas({ type: "ARTISAN" })).toBe(false);
  });

  it("refuse l'absence de session", () => {
    expect(canManageServiceAreas(null)).toBe(false);
  });
});

describe("filterValidVillageSlugs", () => {
  const known = ["cysoing", "templeuve-en-pevele", "nomain"];

  it("garde uniquement les slugs réellement connus", () => {
    expect(filterValidVillageSlugs(["cysoing", "nomain"], known)).toEqual(["cysoing", "nomain"]);
  });

  it("rejette un slug forgé/inconnu, sans faire échouer les valides", () => {
    expect(filterValidVillageSlugs(["cysoing", "lille", "paris"], known)).toEqual(["cysoing"]);
  });

  it("rejette une valeur vide ou du texte quelconque", () => {
    expect(filterValidVillageSlugs(["", "<script>", "cysoing"], known)).toEqual(["cysoing"]);
  });

  it("dédoublonne", () => {
    expect(filterValidVillageSlugs(["cysoing", "cysoing", "nomain"], known)).toEqual(["cysoing", "nomain"]);
  });

  it("renvoie un tableau vide si rien n'est valide", () => {
    expect(filterValidVillageSlugs(["lille"], known)).toEqual([]);
  });
});
