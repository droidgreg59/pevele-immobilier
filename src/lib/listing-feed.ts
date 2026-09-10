import "server-only";
import { XMLBuilder } from "fast-xml-parser";
import type { ListingWithOwner } from "./listings";
import { getPublicListings } from "./listings";
import { getVillageBySlug } from "@/data/villages";
import { villageCoords } from "@/data/village-coords";
import { SITE_URL } from "./seo";

/**
 * Flux d'annonces sortant (syndication) — XML UTF-8, une entrée par annonce
 * publiée, à `/annonces.xml`. Format maison, documenté dans le README :
 * volontairement simple et stable pour qu'un portail tiers puisse l'ingérer
 * sans deviner. Ne contient que des données déjà publiques sur le site.
 */

const TYPE_LABEL: Record<ListingWithOwner["typeBien"], string> = {
  MAISON: "maison",
  APPARTEMENT: "appartement",
  TERRAIN: "terrain",
};
const TYPE_MAISON_LABEL: Record<NonNullable<ListingWithOwner["typeMaison"]>, string> = {
  INDIVIDUELLE: "individuelle",
  SEMI_INDIVIDUELLE: "semi-individuelle",
  MITOYENNE: "mitoyenne",
};
const CONTACT_LABEL: Record<ListingWithOwner["owner"]["type"], string> = {
  AGENCE: "agence",
  PARTICULIER: "particulier",
  ARTISAN: "artisan",
};

const abs = (u: string) => (u.startsWith("http") ? u : `${SITE_URL}${u}`);

/** Objet « annonce » du flux pour un bien — mappage pur (testable). */
export function feedNodeForListing(l: ListingWithOwner): Record<string, unknown> {
  const village = getVillageBySlug(l.villageSlug);
  const coords = village ? villageCoords[village.insee] : undefined;
  const path = l.transaction === "VENTE" ? "acheter" : "louer";

  return {
    ref: l.id,
    url: `${SITE_URL}/${path}/${l.id}`,
    transaction: l.transaction === "VENTE" ? "vente" : "location",
    type: TYPE_LABEL[l.typeBien],
    ...(l.typeBien === "MAISON" && l.typeMaison
      ? { typeMaison: TYPE_MAISON_LABEL[l.typeMaison] }
      : {}),
    commune: l.commune,
    ...(village ? { codeInsee: village.insee } : {}),
    ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
    prix: l.prix,
    surface: l.surface,
    pieces: l.pieces,
    chambres: l.chambres,
    ...(l.dpe ? { dpe: l.dpe } : {}),
    ...(l.ges ? { ges: l.ges } : {}),
    ...(l.chargesCopro ? { chargesCopro: l.chargesCopro } : {}),
    ...(l.taxeFonciere ? { taxeFonciere: l.taxeFonciere } : {}),
    ...(l.honoraires
      ? { honoraires: { "@_charge": l.honorairesCharge ?? "", "#text": l.honoraires } }
      : {}),
    ...(l.chargesLoc ? { charges: l.chargesLoc } : {}),
    ...(l.depotGarantie ? { depotGarantie: l.depotGarantie } : {}),
    ...(l.meuble != null ? { meuble: l.meuble ? "oui" : "non" } : {}),
    titre: l.titre,
    description: l.description,
    publieeLe: l.createdAt.toISOString(),
    ...(l.photos.length > 0 ? { photos: { photo: l.photos.map((p) => abs(p.url)) } } : {}),
    contact: {
      "@_type": CONTACT_LABEL[l.owner.type],
      "#text": l.owner.entreprise ?? l.owner.nom,
    },
  };
}

export async function buildListingsFeed(): Promise<string> {
  const [ventes, locations] = await Promise.all([
    getPublicListings("VENTE"),
    getPublicListings("LOCATION"),
  ]);
  const all = [...ventes, ...locations].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const builder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    arrayNodeName: "photo",
  });

  const body = builder.build({
    annonces: {
      "@_source": SITE_URL,
      "@_genereLe": new Date().toISOString(),
      "@_total": all.length,
      annonce: all.map(feedNodeForListing),
    },
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}
