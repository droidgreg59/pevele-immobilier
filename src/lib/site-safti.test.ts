import { describe, expect, it } from "vitest";
import { isSaftiAgentPage, parseSaftiListing, saftiDetailUrl, saftiListingUrls, saftiRefFromUrl } from "./site-safti";

const URL = "https://www.safti.fr/annonces/achat/maison/orchies-59310/1730060";

// Page de l'agent : `__NEXT_DATA__` (extrait de celle de Véronique Lenglart, 2026-11-20).
const summary = (ref: string, city: string, cityPath: string, extra: Record<string, unknown> = {}) => ({
  propertyReference: ref,
  propertyType: "maison",
  adType: "vente",
  city,
  cityPath,
  underCompromise: "False",
  sold: "False",
  ...extra,
});
const agentPage = `<script id="__NEXT_DATA__" type="application/json" nonce="x">${JSON.stringify({
  props: {
    pageProps: {
      properties: [
        summary("1730060", "ORCHIES", "orchies-59310"),
        summary("1700371", "TEMPLEUVE-EN-PEVELE", "templeuve-en-pevele-59242", { underCompromise: "True" }),
        summary("1697050", "LILLE", "lille-59000"),
      ],
    },
  },
})}</script>`;

// Fiche : objet `annonce` du flux RSC, description dans une ligne texte (relevé sur la fiche 1730060).
const description = "COUP DE CŒUR À ORCHIES<br /><br />Maison de ville d&#039;exception.";
const annonce = (extra: Record<string, unknown> = {}) => ({
  propertyReference: 1730060,
  propertyType: "maison",
  adType: "vente",
  amenagements: { Exposition: ["Sud-Est"], "Aménagements extérieurs": ["Terrasse", "Cave"] },
  price: 315000,
  propertyTax: 600,
  propertySurface: 136,
  areaSurface: 200,
  roomNumber: 4,
  bedroomNumber: 3,
  bathroomNumber: 1,
  showerRoomNumber: 1,
  carParkNumber: 0,
  description: "$3d",
  yearConstruction: 1930,
  underCompromise: false,
  sold: false,
  dpeNote: "C",
  dpeValue: 147,
  dpeStatus: "mandatory",
  gesNote: "A",
  gesValue: 5,
  catchphrase: "Belle maison de ville, 3 chambres",
  photos: [{ urlPhotoLarge: "https://cdn.safti.fr/bien-photo/71/30/1730060/a/rg_nobn-2.jpg" }],
  dpeConsumptionMin: "1860",
  dpeConsumptionMax: "2560",
  dpeConsumptionRefYear: "2021",
  dpeExecutionDate: "2026-09-28T00:00:00+02:00",
  agencyFees: "10237,50",
  agencyFeesType: "seller",
  garden: true,
  city: "ORCHIES",
  retraitDiffusion: false,
  heaterType: "electrique_individuel",
  plans: [],
  ...extra,
});
const fiche = (extra: Record<string, unknown> = {}) => {
  const len = Buffer.byteLength(description, "utf8").toString(16);
  const flight = `3d:T${len},${description}3a:["$","$L3c",null,${JSON.stringify({ annonce: annonce(extra) })}]\n`;
  return `<script>self.__next_f.push(${JSON.stringify([1, flight])})</script>`;
};

describe("SAFTI", () => {
  it("reconnaît la page d'un conseiller et les URLs de fiche", () => {
    expect(isSaftiAgentPage("https://www.safti.fr/votre-conseiller-safti/veronique-lenglart")).toBe(true);
    expect(isSaftiAgentPage("https://www.safti.fr/annonces/achat/maison/lille-59000/1")).toBe(false);
    expect(saftiRefFromUrl(URL)).toBe("1730060");
    expect(saftiDetailUrl("1730060", "VENTE")).toBe("https://www.safti.fr/annonces/achat/bien/x/1730060");
  });

  it("ne garde que les biens disponibles en Pévèle de la page", () => {
    expect(saftiListingUrls(agentPage)).toEqual([URL]);
    expect(saftiListingUrls("<html></html>")).toBeNull();
  });

  it("convertit une fiche en annonce", () => {
    const res = parseSaftiListing(fiche(), URL);
    if (!res || !("listing" in res)) throw new Error("écartée");
    expect(res.listing).toMatchObject({
      externalRef: "1730060",
      transaction: "VENTE",
      typeBien: "MAISON",
      titre: "Belle maison de ville, 3 chambres",
      prix: 315000,
      villageSlug: "orchies",
      pieces: 4,
      chambres: 3,
      surface: 136,
      surfaceTerrain: 200,
      exterieur: "200 M² TERRAIN, JARDIN, TERRASSE",
      equipements: "Terrasse,Cave,Jardin",
      exposition: "sud-est",
      dpe: "C",
      ges: "A",
      dpeConsommation: 147,
      dpeCoutMin: 1860,
      dpeCoutMax: 2560,
      dpeCoutAnneeRef: 2021,
      modeChauffage: "Électrique",
      chauffageType: "individuel",
      anneeConstruction: 1930,
      nbSallesDeBain: 2,
      honoraires: 10238,
      honorairesCharge: "vendeur",
      taxeFonciere: 600,
    });
    expect(res.listing.description).toBe("COUP DE CŒUR À ORCHIES\n\nMaison de ville d'exception.");
    expect(res.listing.dpeDate?.toISOString()).toBe("2026-09-28T00:00:00.000Z");
  });

  it("écarte les biens sous compromis, vendus ou hors Pévèle", () => {
    expect(parseSaftiListing(fiche({ underCompromise: true }), URL)).toMatchObject({ reason: "sous compromis" });
    expect(parseSaftiListing(fiche({ sold: true }), URL)).toMatchObject({ reason: "vendu" });
    expect(parseSaftiListing(fiche({ city: "LILLE" }), URL)).toMatchObject({ reason: "hors Pévèle (LILLE)" });
    expect(parseSaftiListing("<html>maintenance</html>", URL)).toBeNull();
  });

  it("ignore le DPE d'un bien qui n'y est pas soumis", () => {
    const res = parseSaftiListing(fiche({ propertyType: "terrain", dpeStatus: "notMandatory" }), URL);
    if (!res || !("listing" in res)) throw new Error("écartée");
    expect(res.listing).toMatchObject({ typeBien: "TERRAIN", dpe: undefined, pieces: 0, equipements: "" });
  });
});
