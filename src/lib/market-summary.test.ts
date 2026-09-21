import { describe, it, expect } from "vitest";
import { formatDvfStreet, buildMarketSummaryText } from "./market-summary";

describe("formatDvfStreet", () => {
  it("retire le numéro et remet la voie en casse normale", () => {
    expect(formatDvfStreet("316 RUE SALVADOR ALLENDE")).toBe("Rue Salvador Allende");
  });

  it("met les connecteurs (de, la, du...) en minuscule sauf en tête", () => {
    expect(formatDvfStreet("66 RUE DE LA FROIDURE")).toBe("Rue de la Froidure");
  });

  it("gère les numéros avec suffixe bis/ter", () => {
    expect(formatDvfStreet("4 bis RUE NEUVE")).toBe("Rue Neuve");
  });

  it("renvoie null si l'adresse est null", () => {
    expect(formatDvfStreet(null)).toBeNull();
  });

  it("renvoie null si l'adresse ne contient qu'un numéro", () => {
    expect(formatDvfStreet("1985")).toBeNull();
  });
});

describe("buildMarketSummaryText", () => {
  it("mentionne le lieu, le chiffre médian, la période et l'échantillon", () => {
    const text = buildMarketSummaryText({
      lieu: "à Cysoing",
      typeLocal: "Maison",
      medianPrixM2: 2450,
      avgPrixM2: 2510,
      retainedCount: 157,
      count: 164,
      minAnnee: 2021,
      maxAnnee: 2025,
    });

    expect(text).toContain("À Cysoing");
    expect(text).toContain(`${(2450).toLocaleString("fr-FR")} €/m²`);
    expect(text).toContain("entre 2021 et 2025");
    expect(text).toContain("157 ventes retenues sur 164 recensées");
    expect(text).toContain("DVF");
  });

  it("ne mentionne pas de filtre quand rien n'a été exclu", () => {
    const text = buildMarketSummaryText({
      lieu: "en Pévèle",
      typeLocal: "Appartement",
      medianPrixM2: 1800,
      avgPrixM2: 1820,
      retainedCount: 12,
      count: 12,
      minAnnee: 2024,
      maxAnnee: 2024,
    });

    expect(text).toContain("12 ventes,");
    expect(text).not.toContain("retenues sur");
  });
});
