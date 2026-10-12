import { describe, it, expect } from "vitest";
import { intentKeysFromListings } from "./intent-keys";

describe("intentKeysFromListings", () => {
  it("ne garde que les combinaisons commune/type/transaction ayant une annonce", () => {
    const keys = intentKeysFromListings([
      { villageSlug: "cysoing", typeBien: "MAISON", transaction: "VENTE" },
      { villageSlug: "cysoing", typeBien: "MAISON", transaction: "VENTE" },
      { villageSlug: "bachy", typeBien: "TERRAIN", transaction: "LOCATION" },
    ]);
    expect([...keys].sort()).toEqual(["bachy/terrains-a-louer", "cysoing/maisons-a-vendre"]);
    expect(keys.has("cysoing/appartements-a-vendre")).toBe(false);
  });
});
