import { describe, expect, it } from "vitest";
import {
  affIdFromFicheUrl,
  fichePhotoUrls,
  leadingNumber,
  parse4mFiche,
  parseHonoraires,
  type Raw4mFiche,
} from "./site-4m";

const IMG = "https://www.4mlagence.fr/office5/4mimmo_050525/catalog/images/pr_p";

// Valeurs relevées sur la fiche réelle « Maison Wannehain 6 pièces 123 m2 » (2026-10-21).
const wannehain: Raw4mFiche = {
  url: "https://www.4mlagence.fr/fiches/4-40-26_61585863/maison-wannehain-6-pieces-123-m2.html",
  titre: "Maison Wannehain 6 pièces 123 m2",
  description: "Votre agence 4M de Templeuve-en-Pévèle vous propose cette maison semi-mitoyenne…",
  honorairesTexte:
    "370 000 € honoraires inclus | 355 000 € hors honoraires | Honoraires : 4.23% TTC à la charge de l'acquéreur",
  criteres: {
    "Type de bien": "Maison",
    "Type de transaction": "A vendre",
    "Code postal": "59830",
    Ville: "WANNEHAIN",
    Prix: "370000 EUR",
    Surface: "123 m2",
    "Surface terrain": "540 m2",
    Jardin: "Oui",
    "Nombre pièces": "6",
    Chambres: "4",
    "Date établissement Diagnostic Energétique": "30/05/2026",
    "Consommation énergie primaire": "D",
    "Valeur consommation énergie primaire": "187 kWh/m2 par an",
    "Gaz Effet de Serre": "B",
    "Valeur Gaz Effet de serre": "6 Kg CO2/m2/an",
    "Montant minimum estimé des dépenses annuelles d'énergie pour un usage standard": "2110 EUR",
    "Montant maximum estimé des dépenses annuelles d'énergie pour un usage standard": "2860 EUR",
  },
  imageUrls: [
    `${IMG}/6/1/5/8/5/8/6/3/61585863b.jpg`,
    `${IMG}/6/1/5/8/5/8/6/3/61585863a.jpg`,
    `${IMG}/6/0/2/9/4/7/5/7/60294757a.jpg`, // bien similaire
    `${IMG}/6/1/5/8/5/8/6/3/61585863a.jpg`,
  ],
};

describe("site 4M", () => {
  it("lit l'identifiant Immo-Facile dans l'URL de la fiche", () => {
    expect(affIdFromFicheUrl(wannehain.url)).toBe("61585863");
    expect(affIdFromFicheUrl("https://www.4mlagence.fr/fiches/8_61578683/immeuble.html")).toBe("61578683");
    expect(affIdFromFicheUrl("https://www.4mlagence.fr/annonces/")).toBeNull();
  });

  it("lit les nombres en tête de valeur", () => {
    expect(leadingNumber("123 m2")).toBe(123);
    expect(leadingNumber("65,8 m2")).toBe(65.8);
    expect(leadingNumber("370 000 EUR")).toBe(370000);
    expect(leadingNumber("Oui")).toBeNull();
  });

  it("ne garde que les photos du bien, dans l'ordre", () => {
    expect(fichePhotoUrls("61585863", wannehain.imageUrls)).toEqual([
      `${IMG}/6/1/5/8/5/8/6/3/61585863a.jpg`,
      `${IMG}/6/1/5/8/5/8/6/3/61585863b.jpg`,
    ]);
  });

  it("calcule les honoraires depuis la mention ALUR", () => {
    expect(parseHonoraires(wannehain.honorairesTexte)).toEqual({ honoraires: 15000, charge: "acquereur" });
    expect(parseHonoraires("")).toBeNull();
  });

  it("convertit une fiche en annonce", () => {
    const res = parse4mFiche(wannehain);
    expect("listing" in res).toBe(true);
    if (!("listing" in res)) return;
    expect(res.listing).toMatchObject({
      externalRef: "61585863",
      transaction: "VENTE",
      typeBien: "MAISON",
      prix: 370000,
      villageSlug: "wannehain",
      surface: 123,
      surfaceTerrain: 540,
      pieces: 6,
      chambres: 4,
      equipements: "Jardin",
      exterieur: "540 M² TERRAIN, JARDIN",
      dpe: "D",
      ges: "B",
      dpeConsommation: 187,
      dpeEmissions: 6,
      dpeCoutMin: 2110,
      dpeCoutMax: 2860,
      honoraires: 15000,
      honorairesCharge: "acquereur",
    });
    expect(res.listing.dpeDate?.toISOString()).toBe("2026-05-30T00:00:00.000Z");
    // Honoraires lus en champs structurés : pas de doublon dans la description.
    expect(res.listing.description).not.toContain("honoraires inclus");
  });

  it("lit les caractéristiques détaillées et les loyers", () => {
    const res = parse4mFiche({
      ...wannehain,
      criteres: {
        ...wannehain.criteres,
        Mitoyenneté: "Indépendant",
        "Mode Chauffage": "Pompe à chaleur air/eau",
        "Type Chauffage": "Individuel",
        "Année construction": "1995",
        "Etat général": "Très bon état",
        "Exposition Séjour": "SUD OUEST",
        "Salle(s) de bains": "1",
        "Salle(s) d'eau": "1",
        "Type de Stationnement": "Extérieur, Garage Simple",
        Assainissement: "Tout à l'égout",
        "Taxe Foncière": "1216 EUR",
        "Année de référence des prix de l'énergie (DPE réalisés jusqu'au 30/06/2024)": "01/01/2021",
      },
    });
    if (!("listing" in res)) throw new Error("fiche écartée");
    expect(res.listing).toMatchObject({
      typeMaison: "INDIVIDUELLE",
      modeChauffage: "Pompe à chaleur air/eau",
      chauffageType: "individuel",
      anneeConstruction: 1995,
      etat: "bon",
      exposition: "sud-ouest",
      nbSallesDeBain: 2,
      stationnement: "Extérieur, Garage Simple",
      assainissement: "tout-a-l-egout",
      taxeFonciere: 1216,
      dpeCoutAnneeRef: 2021,
      equipements: "Jardin,Garage",
    });

    const location = parse4mFiche({
      ...wannehain,
      honorairesTexte: "",
      criteres: {
        ...wannehain.criteres,
        "Type de transaction": "A louer",
        Prix: "",
        "Loyer mensuel HC": "900 EUR",
        "Provision sur charges": "100 EUR",
        "Loyer charges comprises": "1000 EUR",
        "Dépôt de Garantie": "900 EUR",
        Meublé: "Non",
        "Taxe Foncière": "1216 EUR",
      },
    });
    if (!("listing" in location)) throw new Error("fiche écartée");
    expect(location.listing).toMatchObject({
      transaction: "LOCATION",
      prix: 1000,
      chargesLoc: 100,
      depotGarantie: 900,
      meuble: false,
      taxeFonciere: null,
      honoraires: null,
    });
  });

  it("écarte les biens hors Pévèle et les types non gérés", () => {
    const lille = parse4mFiche({ ...wannehain, criteres: { ...wannehain.criteres, Ville: "LILLE" } });
    expect(lille).toMatchObject({ reason: "hors Pévèle (LILLE)" });
    const immeuble = parse4mFiche({
      ...wannehain,
      criteres: { ...wannehain.criteres, "Type de bien": "Immeuble" },
    });
    expect(immeuble).toMatchObject({ reason: "type non pris en charge (Immeuble)" });
  });
});
