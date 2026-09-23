import { describe, it, expect } from "vitest";
import { formatPrix, formatPrixM2, dpeClassColor, formatPreferredDateTime } from "./format";

describe("formatPrix", () => {
  it("formate un prix de vente avec séparateur de milliers insécable", () => {
    // Intl utilise l'espace insécable étroit (U+202F) en fr-FR.
    expect(formatPrix(250000, "VENTE").replace(/ | /g, " ")).toBe("250 000 €");
  });

  it("ajoute /mois pour une location", () => {
    expect(formatPrix(850, "LOCATION").replace(/ | /g, " ")).toBe("850 €/mois");
  });
});

describe("formatPrixM2", () => {
  it("arrondit le prix au m² et le met en majuscules", () => {
    expect(formatPrixM2(300000, 90).replace(/ | /g, " ")).toBe("3 333 € / M²");
  });
});

describe("dpeClassColor", () => {
  it("renvoie la couleur officielle pour chaque classe A–G", () => {
    expect(dpeClassColor("A")).toBe("#0f8a4a");
    expect(dpeClassColor("G")).toBe("#e30613");
  });

  it("renvoie un gris neutre pour une valeur inconnue", () => {
    expect(dpeClassColor("Z")).toBe("#e9e9ec");
    expect(dpeClassColor("")).toBe("#e9e9ec");
  });
});

describe("formatPreferredDateTime", () => {
  it("renvoie null en l'absence de date", () => {
    expect(formatPreferredDateTime(null)).toBeNull();
  });

  it("inclut l'heure quand elle est renseignée", () => {
    // Comparé au formatage direct (plutôt qu'à une chaîne figée) pour rester
    // indépendant du fuseau horaire de la machine qui exécute le test —
    // formatPreferredDateTime ne force volontairement aucun `timeZone`
    // explicite, par cohérence avec le reste du site (VisitRequestList,
    // mes-demarches...), qui affiche déjà les dates via l'heure locale du
    // serveur sans conversion.
    const d = new Date("2026-10-05T14:30:00Z");
    const expectedDate = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const expectedTime = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    expect(formatPreferredDateTime(d)).toBe(`${expectedDate} à ${expectedTime}`);
  });

  it("affiche la date seule pour un enregistrement à minuit UTC pile (pas d'heure choisie)", () => {
    const d = new Date("2026-10-05T00:00:00Z");
    const expectedDate = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    expect(formatPreferredDateTime(d)).toBe(expectedDate);
  });
});
