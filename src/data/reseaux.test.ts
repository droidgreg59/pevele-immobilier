import { describe, it, expect } from "vitest";
import {
  AUTRE_RESEAU,
  mandataireDisplayName,
  mandataireMention,
  normalizeReseau,
  rsacNumero,
} from "./reseaux";

describe("réseaux de mandataires", () => {
  it("retient un réseau connu ou une saisie libre, jamais un choix inventé", () => {
    expect(normalizeReseau("SAFTI", "")).toBe("SAFTI");
    expect(normalizeReseau(AUTRE_RESEAU, "  Mon   Réseau ")).toBe("Mon Réseau");
    expect(normalizeReseau(AUTRE_RESEAU, "  ")).toBeNull();
    expect(normalizeReseau("Inconnu", "")).toBeNull();
  });

  it("affiche « RÉSEAU – Prénom Nom »", () => {
    expect(mandataireDisplayName("SAFTI", " Jean ", "Dupont")).toBe("SAFTI – Jean Dupont");
    expect(mandataireDisplayName("IAD", null, "Martin")).toBe("IAD – Martin");
  });

  it("dérive le numéro RSAC du SIRET", () => {
    expect(rsacNumero("12345678900012")).toBe("123 456 789");
    expect(rsacNumero(null)).toBeNull();
    expect(rsacNumero("123")).toBeNull();
  });

  it("produit la mention d'agent commercial, avec le RSAC quand il est connu", () => {
    const base = { reseau: "SAFTI", prenom: "Jean", nom: "Dupont", rsacVille: null, siret: null };
    expect(mandataireMention(base)).toBe(
      "Jean Dupont, agent commercial immobilier, mandataire indépendant du réseau SAFTI."
    );
    expect(mandataireMention({ ...base, rsacVille: "Lille Métropole", siret: "12345678900012" })).toBe(
      "Jean Dupont, agent commercial immobilier, mandataire indépendant du réseau SAFTI, immatriculé(e) au RSAC de Lille Métropole sous le n° 123 456 789."
    );
  });
});
