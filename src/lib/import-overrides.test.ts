import { describe, it, expect } from "vitest";
import {
  detectManualOverrides,
  mergeOverrides,
  overrideLabels,
  parseOverrides,
  stripOverridden,
} from "./import-overrides";

const existing = {
  titre: "Titre du flux",
  description: "Desc",
  prix: 200000,
  chambres: 3,
  equipements: "Jardin,Garage",
  dpe: "D",
  videoUrl: null,
  surfaceTerrain: 500,
};

describe("detectManualOverrides", () => {
  it("ne signale rien quand la saisie reprend les valeurs enregistrées", () => {
    expect(
      detectManualOverrides(existing, {
        ...existing,
        equipements: "Garage,Jardin", // même ensemble, autre ordre
        videoUrl: "", // vide = null
        titre: "  Titre du flux ",
        description: "Desc",
      })
    ).toEqual([]);
  });

  it("ignore la différence \\r\\n / \\n d'un champ texte multiligne", () => {
    expect(
      detectManualOverrides({ ...existing, description: "a\nb" }, { ...existing, description: "a\r\nb" })
    ).toEqual([]);
  });

  it("signale les champs réellement modifiés, jamais le prix", () => {
    expect(
      detectManualOverrides(existing, { ...existing, titre: "Autre", chambres: 4, prix: 150000 })
    ).toEqual(["titre", "chambres"]);
  });
});

describe("overrides CSV", () => {
  it("fusionne sans doublon et renvoie null si vide", () => {
    expect(mergeOverrides(null, [])).toBeNull();
    expect(mergeOverrides("titre", ["titre", "photos"])).toBe("titre,photos");
    expect(parseOverrides("a,b")).toEqual(["a", "b"]);
    expect(parseOverrides(null)).toEqual([]);
  });

  it("dédoublonne les libellés (plusieurs champs DPE)", () => {
    expect(overrideLabels("dpe,ges,dpeConsommation,titre")).toEqual(["DPE", "GES", "titre"]);
  });
});

describe("stripOverridden", () => {
  it("retire les champs protégés mais jamais le prix", () => {
    expect(stripOverridden({ titre: "a", prix: 1, chambres: 2 }, ["titre", "prix"])).toEqual({
      prix: 1,
      chambres: 2,
    });
  });
});
