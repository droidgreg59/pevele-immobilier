import { formatPrix } from "./format";

/**
 * Titre, H1 et meta description des fiches annonces, construits à partir des
 * données structurées du bien plutôt que du texte de l'annonceur : le titre
 * libre (« Magnifique terrain viabilisé ») ne dit ni le type ni la commune, et
 * la description est souvent le texte mot pour mot publié sur le site de
 * l'agence et sur les portails (audit SEO 2026-10-30).
 */

type ListingSeoInput = {
  transaction: "VENTE" | "LOCATION";
  typeBien: "MAISON" | "APPARTEMENT" | "TERRAIN";
  typeMaison?: "INDIVIDUELLE" | "SEMI_INDIVIDUELLE" | "MITOYENNE" | null;
  commune: string;
  prix: number;
  surface: number;
  pieces: number;
  chambres: number;
  surfaceTerrain?: number | null;
  dpe?: string | null;
  description: string;
};

const TYPE_LABEL = { MAISON: "Maison", APPARTEMENT: "Appartement", TERRAIN: "Terrain" } as const;

const TYPE_MAISON_LABEL = {
  INDIVIDUELLE: "individuelle",
  SEMI_INDIVIDUELLE: "semi-individuelle",
  MITOYENNE: "mitoyenne",
} as const;

export const META_DESCRIPTION_MAX = 160;

function action(l: ListingSeoInput): string {
  return l.transaction === "VENTE" ? "à vendre" : "à louer";
}

function typeLabel(l: ListingSeoInput): string {
  const base = TYPE_LABEL[l.typeBien];
  return l.typeBien === "MAISON" && l.typeMaison ? `${base} ${TYPE_MAISON_LABEL[l.typeMaison]}` : base;
}

/** « Maison individuelle à vendre à Templeuve-en-Pévèle » — ligne d'en-tête du H1. */
export function listingHeading(l: ListingSeoInput): string {
  return `${typeLabel(l)} ${action(l)} à ${l.commune}`;
}

/** « Maison 5 pièces 120 m² à vendre à Templeuve-en-Pévèle — 320 000 € ». */
export function listingSeoTitle(l: ListingSeoInput): string {
  const specs =
    l.typeBien === "TERRAIN"
      ? l.surface > 0
        ? ` de ${l.surface.toLocaleString("fr-FR")} m²`
        : ""
      : [l.pieces > 0 ? ` ${l.pieces} pièce${l.pieces > 1 ? "s" : ""}` : "", l.surface > 0 ? ` ${l.surface} m²` : ""].join("");
  return `${TYPE_LABEL[l.typeBien]}${specs} ${action(l)} à ${l.commune} — ${formatPrix(l.prix, l.transaction)}`;
}

/** Coupe au dernier mot entier qui tient dans `max` caractères (points de suspension compris). */
function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/**
 * Phrase factuelle (type, surface, pièces, terrain, prix, DPE) puis début du
 * texte de l'annonce pour compléter jusqu'à ~160 caractères.
 */
export function listingMetaDescription(l: ListingSeoInput): string {
  const details: string[] = [];
  if (l.typeBien === "TERRAIN") {
    if (l.surface > 0) details.push(`${l.surface.toLocaleString("fr-FR")} m²`);
  } else {
    if (l.surface > 0) details.push(`${l.surface} m²`);
    if (l.pieces > 0) {
      const ch = l.chambres > 0 ? ` dont ${l.chambres} chambre${l.chambres > 1 ? "s" : ""}` : "";
      details.push(`${l.pieces} pièce${l.pieces > 1 ? "s" : ""}${ch}`);
    }
    if (l.surfaceTerrain && l.surfaceTerrain > 0) {
      details.push(`terrain de ${l.surfaceTerrain.toLocaleString("fr-FR")} m²`);
    }
  }
  const dpe = l.typeBien !== "TERRAIN" && l.dpe && /^[A-G]$/.test(l.dpe) ? ` DPE ${l.dpe}.` : "";
  const lead = `${typeLabel(l)}${details.length ? ` (${details.join(", ")})` : ""} ${action(l)} à ${l.commune} : ${formatPrix(l.prix, l.transaction)}.${dpe}`;

  const room = META_DESCRIPTION_MAX - lead.length - 1;
  const excerpt = l.description.replace(/\s+/g, " ").trim();
  if (room < 40 || !excerpt) return truncateWords(lead, META_DESCRIPTION_MAX);
  return `${lead} ${truncateWords(excerpt, room)}`;
}
