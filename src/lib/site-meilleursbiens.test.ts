import { describe, expect, it } from "vitest";
import {
  annonceIdsFromAgentPage,
  isMeilleursBiensAgentPage,
  parseMbProperty,
  parseRscRows,
  propertyFromHtml,
  type MbProperty,
} from "./site-meilleursbiens";

const push = (chunk: string) => `<script>self.__next_f.push(${JSON.stringify([1, chunk])})</script>`;

// Valeurs relevées sur la fiche réelle « Maison individuelle, 135 m² » à Wannehain (2026-10-30).
const fields = JSON.stringify([
  { code: "annee_construction", value: "2017" },
  { code: "surface_terrain", value: "483" },
  { code: "garage", value: true },
  { code: "taxe_fonciere", value: "1681" },
]);
const wannehain: MbProperty = {
  id: "a1f3107b-2296-416e-b306-7dcad5c2945a",
  ubiflow_type: "V",
  status: 1,
  is_archived: 0,
  property_type_id: 1200,
  title: "Maison individuelle, 135 m² sur terrain de 483 m²",
  description: "Belle maison familiale.",
  surface: 135,
  nb_pieces: 7,
  nb_chambres: 5,
  nb_sdb: -11, // valeur aberrante réellement présente sur une fiche : ignorée
  city: "Wannehain",
  insee_code: "59638",
  price_public: 499500,
  is_price_private: 0,
  honoraires_type: 1,
  dpe_date: "08/03/2017",
  dpe: 53,
  dpe_letter: "A",
  ges: 9,
  ges_letter: "B",
  dpe_exempt: false,
  dpe_not_applicable: false,
  property_fields: fields,
  pictures: [
    { file_cache: "https://neo.mbiens.pictures/p/b@2x.jpg", order: 2, is_main_picture: 0 },
    { file_cache: "https://neo.mbiens.pictures/p/a@2x.jpg", order: 5, is_main_picture: 1 },
  ],
};

describe("MeilleursBiens", () => {
  it("reconnaît une page de mandataire et ses fiches", () => {
    expect(isMeilleursBiensAgentPage("https://meilleursbiens.com/site/686-christophe-lemaire")).toBe(true);
    expect(isMeilleursBiensAgentPage("https://www.4mlagence.fr/")).toBe(false);
    const html = '<a href="/annonce/a1f3107b-2296-416e-b306-7dcad5c2945a">x</a>'.repeat(2);
    expect(annonceIdsFromAgentPage(html)).toEqual(["a1f3107b-2296-416e-b306-7dcad5c2945a"]);
  });

  it("découpe le flux RSC, textes longs en octets compris", () => {
    const texte = "Énergie : été 2026";
    const len = Buffer.byteLength(texte, "utf8").toString(16);
    const rows = parseRscRows(`1:["$","div"]\n2b:T${len},${texte}3:{"a":1}\n`);
    expect(rows.get("2b")).toBe(texte);
    expect(rows.get("3")).toBe('{"a":1}');
  });

  it("extrait la fiche et résout les références de texte", () => {
    const len = Buffer.byteLength(fields, "utf8").toString(16);
    const prop = { ...wannehain, property_fields: "$2b" };
    const html =
      push(`2b:T${len},${fields}`) + push(`7:["$","$L29",null,${JSON.stringify({ property: prop })}]\n`);
    const p = propertyFromHtml(html);
    expect(p?.id).toBe(wannehain.id);
    expect(p?.property_fields).toBe(fields);
  });

  it("convertit une fiche en annonce", () => {
    const res = parseMbProperty(wannehain, "https://schema.org/InStock");
    if (!("listing" in res)) throw new Error(res.reason);
    expect(res.listing).toMatchObject({
      transaction: "VENTE",
      typeBien: "MAISON",
      prix: 499500,
      villageSlug: "wannehain",
      surface: 135,
      surfaceTerrain: 483,
      exterieur: "483 M² TERRAIN",
      equipements: "Garage",
      dpe: "A",
      ges: "B",
      dpeConsommation: 53,
      anneeConstruction: 2017,
      nbSallesDeBain: null,
      honoraires: null,
      honorairesCharge: "acquereur",
      taxeFonciere: 1681,
    });
    // Photo principale d'abord.
    expect(res.listing.photoUrls[0]).toContain("/a@2x.jpg");
  });

  it("écarte les biens hors Pévèle, vendus, ou au DPE vide", () => {
    expect(parseMbProperty({ ...wannehain, city: "Lille", insee_code: "59350" }, null)).toMatchObject({
      reason: "hors Pévèle (Lille)",
    });
    expect(parseMbProperty(wannehain, "https://schema.org/SoldOut")).toMatchObject({
      reason: "indisponible (SoldOut)",
    });
    const vide = parseMbProperty({ ...wannehain, dpe: 0, ges: 0 }, null);
    if (!("listing" in vide)) throw new Error("écartée");
    expect(vide.listing.dpe).toBeUndefined();
  });

  it("traite un lotissement comme un terrain", () => {
    const res = parseMbProperty(
      { ...wannehain, property_type_id: 1330, city: "Cobrieux", insee_code: "92072", surface: 646, nb_pieces: 1, nb_chambres: 1, honoraires_type: 2 },
      null
    );
    if (!("listing" in res)) throw new Error(res.reason);
    expect(res.listing).toMatchObject({
      typeBien: "TERRAIN",
      villageSlug: "cobrieux",
      surface: 646,
      pieces: 0,
      chambres: 0,
      dpe: undefined,
      honorairesCharge: "vendeur",
    });
  });
});
