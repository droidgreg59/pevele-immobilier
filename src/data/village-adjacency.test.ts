import { describe, it, expect } from "vitest";
import { villageAdjacency } from "./village-adjacency";
import { villages } from "./villages";

const knownSlugs = new Set(villages.map((v) => v.slug));

describe("adjacence réelle des communes (village-adjacency.ts)", () => {
  it("a une entrée pour chacune des 44 communes suivies", () => {
    for (const v of villages) {
      expect(villageAdjacency[v.slug], `${v.nom} absente de villageAdjacency`).toBeDefined();
    }
  });

  it("n'a aucune clé ni aucun voisin hors des 44 communes connues", () => {
    for (const [slug, neighbors] of Object.entries(villageAdjacency)) {
      expect(knownSlugs.has(slug), `clé inconnue : ${slug}`).toBe(true);
      for (const n of neighbors) {
        expect(knownSlugs.has(n), `voisin inconnu ${n} pour ${slug}`).toBe(true);
      }
    }
  });

  it("n'a jamais une commune voisine d'elle-même", () => {
    for (const [slug, neighbors] of Object.entries(villageAdjacency)) {
      expect(neighbors.includes(slug), `${slug} se référence elle-même`).toBe(false);
    }
  });

  it("est symétrique : si A voisine de B, alors B voisine de A", () => {
    for (const [a, neighbors] of Object.entries(villageAdjacency)) {
      for (const b of neighbors) {
        expect(
          villageAdjacency[b]?.includes(a),
          `${a} liste ${b} comme voisin, mais pas l'inverse`
        ).toBe(true);
      }
    }
  });

  it("n'a pas de doublon dans la liste de voisins d'une commune", () => {
    for (const [slug, neighbors] of Object.entries(villageAdjacency)) {
      expect(new Set(neighbors).size, `doublon dans les voisins de ${slug}`).toBe(neighbors.length);
    }
  });

  it("chaque commune a au moins un voisin (aucune commune isolée dans le jeu de 44)", () => {
    for (const v of villages) {
      expect(villageAdjacency[v.slug].length, `${v.nom} n'a aucun voisin`).toBeGreaterThan(0);
    }
  });

  it("cas connus vérifiés manuellement — Cysoing et Templeuve-en-Pévèle sont limitrophes", () => {
    expect(villageAdjacency["cysoing"]).toContain("templeuve-en-pevele");
    expect(villageAdjacency["templeuve-en-pevele"]).toContain("cysoing");
  });

  it("cas connus vérifiés manuellement — Cysoing et Camphin-en-Pévèle sont limitrophes", () => {
    expect(villageAdjacency["cysoing"]).toContain("camphin-en-pevele");
  });

  it("cas connu vérifié manuellement — Cysoing et Wannehain ne sont PAS limitrophes (proches mais séparées par Bouvines/Gruson)", () => {
    expect(villageAdjacency["cysoing"]).not.toContain("wannehain");
  });
});
