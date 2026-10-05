import { describe, it, expect } from "vitest";
import { findDuplicateGroups, type DuplicateCandidate } from "./duplicate-listings";

const base: DuplicateCandidate = {
  id: "a",
  ownerId: "pvl",
  ownerLabel: "PVL",
  transaction: "VENTE",
  typeBien: "MAISON",
  prix: 410000,
  surface: 110,
  pieces: 6,
  chambres: 4,
  exterieur: "525 M² TERRAIN, JARDIN",
  villageSlug: "bachy",
  commune: "Bachy",
  titre: "Maison",
  createdAt: new Date("2026-10-02"),
};

describe("findDuplicateGroups", () => {
  it("regroupe un même bien publié dans deux communes par la même agence", () => {
    const groups = findDuplicateGroups([
      base,
      { ...base, id: "b", villageSlug: "cysoing", commune: "Cysoing", createdAt: new Date("2026-10-04") },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((l) => l.id)).toEqual(["b", "a"]);
  });

  it("ignore deux annonces identiques dans la même commune", () => {
    expect(findDuplicateGroups([base, { ...base, id: "b" }])).toEqual([]);
  });

  it("ignore des agences différentes ou un prix différent", () => {
    expect(
      findDuplicateGroups([
        base,
        { ...base, id: "b", ownerId: "autre", villageSlug: "cysoing" },
        { ...base, id: "c", prix: 395000, villageSlug: "cysoing" },
      ])
    ).toEqual([]);
  });

  it("insensible à la casse et aux espaces de l'extérieur", () => {
    const groups = findDuplicateGroups([
      base,
      { ...base, id: "b", villageSlug: "cysoing", exterieur: " 525 m² terrain, jardin " },
    ]);
    expect(groups).toHaveLength(1);
  });
});
