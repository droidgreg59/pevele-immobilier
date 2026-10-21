import { villages } from "@/data/villages";
import { normalizeName, type ParsedAc3Listing } from "./ac3-import";
import type { TransactionType, TypeBien, TypeMaison } from "@prisma/client";

/**
 * Reprise des annonces publiées sur le site de l'agence 4M
 * (www.4mlagence.fr, site Immo-Facile), avec l'autorisation écrite de
 * l'agence — elle n'a pas de flux XML exploitable. Le site est servi derrière
 * un pare-feu applicatif : la collecte se fait dans un vrai navigateur
 * (scripts/scrape-4m.ts) qui extrait de chaque fiche un `Raw4mFiche` ; ce
 * module, pur, le convertit en annonce au même format que le flux AC3.
 *
 * Libellés et formats relevés en direct sur les fiches (tableau
 * « Caractéristiques détaillées ») le 2026-10-21 — ne jamais en deviner
 * d'autres : un libellé inconnu est simplement ignoré.
 */

export const SITE_4M_ORIGIN = "https://www.4mlagence.fr";
export const SITE_4M_IMPORT_SOURCE = "SITE_4M";
export const SITE_4M_AGENCY_ID = "cmufix3j10000jm04tm6cj42g";

/** Pages d'index des annonces, par transaction (paginées : `?page=N`). */
export const SITE_4M_INDEXES: { transaction: TransactionType; url: string }[] = [
  { transaction: "VENTE", url: `${SITE_4M_ORIGIN}/annonces/transaction/Vente.html` },
  { transaction: "LOCATION", url: `${SITE_4M_ORIGIN}/annonces/transaction/Location.html` },
];

export type Raw4mFiche = {
  url: string;
  /** Texte du `<h1 class="product-title">` sans la ville. */
  titre: string;
  /** Description (`.products-description`), mention d'honoraires retirée. */
  description: string;
  /** Mention d'honoraires ALUR (« 370 000 € honoraires inclus | … »), si présente. */
  honorairesTexte: string;
  /** Tableau « Caractéristiques détaillées » : libellé → valeur. */
  criteres: Record<string, string>;
  /** Toutes les URLs d'images catalogue de la page (biens similaires compris). */
  imageUrls: string[];
};

export type Parsed4mListing = ParsedAc3Listing & {
  honoraires?: number | null;
  honorairesCharge?: string | null;
  chargesCopro?: number | null;
  taxeFonciere?: number | null;
  chargesLoc?: number | null;
  depotGarantie?: number | null;
  meuble?: boolean | null;
  anneeConstruction?: number | null;
  etat?: string | null;
  exposition?: string | null;
  etage?: number | null;
  ascenseur?: boolean | null;
  nbSallesDeBain?: number | null;
  stationnement?: string | null;
  chauffageType?: string | null;
  assainissement?: string | null;
};

/** Identifiant Immo-Facile du bien, en fin de segment : /fiches/4-40-26_61585863/… */
export function affIdFromFicheUrl(url: string): string | null {
  return /\/fiches\/[^/]*_(\d+)\//.exec(url)?.[1] ?? null;
}

/** Nombre en tête d'une valeur (« 123 m2 », « 370000 EUR », « 65,8 m2 »). */
export function leadingNumber(value: string | undefined): number | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)/.exec((value ?? "").replace(/ |\s(?=\d{3}\b)/g, ""));
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function oui(value: string | undefined): boolean {
  return normalizeName(value ?? "") === "oui";
}

/** « Oui » / « Non » → booléen ; toute autre valeur (ou absence) → null. */
function ouiNon(value: string | undefined): boolean | null {
  const v = normalizeName(value ?? "");
  return v === "oui" ? true : v === "non" ? false : null;
}

function frDate(value: string | undefined): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((value ?? "").trim());
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function classe(value: string | undefined): string | undefined {
  const v = (value ?? "").trim().toUpperCase();
  return /^[A-G]$/.test(v) ? v : undefined;
}

function roundedOrNull(value: string | undefined): number | null {
  const n = leadingNumber(value);
  return n != null && n > 0 ? Math.round(n) : null;
}

const TYPES: Record<string, TypeBien> = {
  maison: "MAISON",
  appartement: "APPARTEMENT",
  terrain: "TERRAIN",
};

/**
 * Libellé normalisé du tableau → équipement de notre liste canonique. Valeur
 * « Oui » ou nombre > 0. Seul « Jardin » a été observé à ce jour ; les autres
 * suivent le nommage des champs Immo-Facile équivalents du flux AC3.
 */
const EQUIPEMENT_LABELS: Record<string, string> = {
  jardin: "Jardin",
  garage: "Garage",
  "nombre garages": "Garage",
  "nombre garages box": "Garage",
  parking: "Parking",
  "nombre parkings": "Parking",
  "nombre places parking": "Parking",
  balcon: "Balcon",
  "nombre balcons": "Balcon",
  terrasse: "Terrasse",
  "nombre terrasses": "Terrasse",
  cave: "Cave",
  "cave s": "Cave",
  piscine: "Piscine",
  cheminee: "Cheminée",
};

/** Valeurs observées sur les fiches → nos valeurs contraintes (voir listing-carac.ts). */
const MITOYENNETE: Record<string, TypeMaison> = {
  independant: "INDIVIDUELLE",
  "1 cote": "SEMI_INDIVIDUELLE",
  "2 cotes": "MITOYENNE",
};
const ETAT: Record<string, string> = {
  neuf: "neuf",
  "refait a neuf": "refait",
  "bon etat": "bon",
  "tres bon etat": "bon",
  "a rafraichir": "rafraichir",
  "a renover": "renover",
};
const EXPOSITIONS = new Set(["nord", "sud", "est", "ouest", "nord-est", "nord-ouest", "sud-est", "sud-ouest"]);

function exposition(value: string | undefined): string | null {
  const v = normalizeName(value ?? "").replace(/ /g, "-");
  return EXPOSITIONS.has(v) ? v : null;
}

function assainissement(value: string | undefined): string | null {
  const v = normalizeName(value ?? "");
  if (v === "tout a l egout") return "tout-a-l-egout";
  if (/fosse|micro station|individuel/.test(v)) return "individuel";
  return null;
}

/** Photos du bien lui-même (`…/<AFF_ID><lettre>.jpg`), dans l'ordre a, b, c… */
export function fichePhotoUrls(affId: string, imageUrls: string[]): string[] {
  const re = new RegExp(`/${affId}([a-z]+)\\.(?:jpe?g|png|webp)$`, "i");
  const byLetter = new Map<string, string>();
  for (const url of imageUrls) {
    const letter = re.exec(url)?.[1]?.toLowerCase();
    if (letter && !byLetter.has(letter)) byLetter.set(letter, url);
  }
  return [...byLetter.entries()]
    .sort(([a], [b]) => a.length - b.length || a.localeCompare(b))
    .map(([, url]) => url);
}

/** Honoraires TTC = prix honoraires inclus − prix hors honoraires (mention ALUR). */
export function parseHonoraires(texte: string): { honoraires: number; charge: string } | null {
  const t = texte.replace(/ /g, " ");
  const inclus = /([\d ]+)\s*€\s*honoraires inclus/i.exec(t)?.[1];
  const net = /([\d ]+)\s*€\s*hors honoraires/i.exec(t)?.[1];
  if (!inclus || !net) return null;
  const diff = Number(inclus.replace(/\s/g, "")) - Number(net.replace(/\s/g, ""));
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const charge = /charge de l'acqu[ée]reur/i.test(t)
    ? "acquereur"
    : /charge du vendeur/i.test(t)
      ? "vendeur"
      : null;
  return charge ? { honoraires: diff, charge } : null;
}

export function parse4mFiche(
  raw: Raw4mFiche
): { listing: Parsed4mListing } | { externalRef: string; reason: string } {
  const externalRef = affIdFromFicheUrl(raw.url) ?? "?";
  if (externalRef === "?") return { externalRef, reason: "identifiant introuvable dans l'URL" };

  const c = raw.criteres;
  const typeBien = TYPES[normalizeName(c["Type de bien"] ?? "")];
  if (!typeBien) return { externalRef, reason: `type non pris en charge (${c["Type de bien"] ?? "?"})` };

  const transactionRaw = normalizeName(c["Type de transaction"] ?? "");
  const transaction: TransactionType | null =
    transactionRaw === "a vendre" ? "VENTE" : transactionRaw === "a louer" ? "LOCATION" : null;
  if (!transaction) return { externalRef, reason: `transaction inconnue (${c["Type de transaction"] ?? "?"})` };

  // Location : le champ « Prix » est absent, le loyer charges comprises fait foi.
  const prix = Math.round(
    leadingNumber(c["Prix"]) ??
      leadingNumber(c["Loyer charges comprises"]) ??
      leadingNumber(c["Loyer mensuel HC"]) ??
      0
  );
  if (prix <= 0) return { externalRef, reason: "prix manquant" };

  const villeRaw = c["Ville"] ?? "";
  const village = villages.find((v) => normalizeName(v.nom) === normalizeName(villeRaw));
  if (!village) return { externalRef, reason: `hors Pévèle (${villeRaw || "ville inconnue"})` };

  const surfaceHabitable = leadingNumber(c["Surface"]) ?? 0;
  const surfaceTerrain = leadingNumber(c["Surface terrain"]) ?? 0;
  const surface = Math.round(
    typeBien === "TERRAIN" ? surfaceTerrain || surfaceHabitable : surfaceHabitable || surfaceTerrain
  );
  if (surface <= 0) return { externalRef, reason: "surface manquante" };

  const equipements = new Set<string>();
  for (const [label, value] of Object.entries(c)) {
    const eq = EQUIPEMENT_LABELS[normalizeName(label)];
    if (eq && (oui(value) || (leadingNumber(value) ?? 0) > 0)) equipements.add(eq);
  }
  if (/garage/i.test(c["Type de Stationnement"] ?? "")) equipements.add("Garage");

  const exterieur: string[] = [];
  if (typeBien !== "TERRAIN" && surfaceTerrain > 0) exterieur.push(`${Math.round(surfaceTerrain)} M² TERRAIN`);
  for (const eq of ["Jardin", "Balcon", "Terrasse"]) if (equipements.has(eq)) exterieur.push(eq.toUpperCase());

  const titre =
    raw.titre.replace(/\s+/g, " ").trim() ||
    `${typeBien === "MAISON" ? "Maison" : typeBien === "APPARTEMENT" ? "Appartement" : "Terrain"} à ${village.nom}`;
  const vente = transaction === "VENTE";
  const fees = vente ? parseHonoraires(raw.honorairesTexte) : null;
  // Honoraires repris en champs structurés quand on sait les lire ; sinon la
  // mention de l'agence est conservée telle quelle en fin de description.
  const description = [raw.description.trim() || titre, fees ? "" : raw.honorairesTexte.trim()]
    .filter(Boolean)
    .join("\n\n");
  const bati = typeBien !== "TERRAIN";
  const sallesDeBain = (leadingNumber(c["Salle(s) de bains"]) ?? 0) + (leadingNumber(c["Salle(s) d'eau"]) ?? 0);
  const annee = leadingNumber(c["Année construction"]);
  const anneeRef = /^01\/01\/(\d{4})$/.exec((c[
    "Année de référence des prix de l'énergie (DPE réalisés jusqu'au 30/06/2024)"
  ] ?? "").trim())?.[1];
  const chargesAnnuelles = leadingNumber(c["Charges annuelles (ALUR)"]);
  const etage = ouiNon(c["Rez de chaussée"]) ? 0 : leadingNumber(c["Etage"]);
  const chauffageType = normalizeName(c["Type Chauffage"] ?? "");

  return {
    listing: {
      externalRef,
      transaction,
      typeBien,
      typeMaison: typeBien === "MAISON" ? MITOYENNETE[normalizeName(c["Mitoyenneté"] ?? "")] : undefined,
      modeChauffage: bati ? c["Mode Chauffage"]?.trim() || null : null,
      titre,
      description,
      prix,
      villageSlug: village.slug,
      commune: village.nom,
      pieces: Math.round(leadingNumber(c["Nombre pièces"]) ?? 0),
      chambres: Math.round(leadingNumber(c["Chambres"]) ?? 0),
      surface,
      exterieur: exterieur.length > 0 ? exterieur.join(", ") : "—",
      surfaceTerrain: typeBien !== "TERRAIN" && surfaceTerrain > 0 ? Math.round(surfaceTerrain) : null,
      equipements: [...equipements].join(","),
      dpe: classe(c["Consommation énergie primaire"]),
      ges: classe(c["Gaz Effet de Serre"]),
      dpeConsommation: roundedOrNull(c["Valeur consommation énergie primaire"]),
      dpeEmissions: roundedOrNull(c["Valeur Gaz Effet de serre"]),
      dpeCoutMin: roundedOrNull(
        c["Montant minimum estimé des dépenses annuelles d'énergie pour un usage standard"]
      ),
      dpeCoutMax: roundedOrNull(
        c["Montant maximum estimé des dépenses annuelles d'énergie pour un usage standard"]
      ),
      dpeDate: frDate(c["Date établissement Diagnostic Energétique"]),
      dpeCoutAnneeRef: anneeRef ? Number(anneeRef) : null,
      honoraires: fees?.honoraires ?? null,
      honorairesCharge: fees?.charge ?? null,
      chargesCopro: vente && chargesAnnuelles ? Math.round(chargesAnnuelles / 12) : null,
      taxeFonciere: vente ? roundedOrNull(c["Taxe Foncière"]) : null,
      chargesLoc: vente ? null : roundedOrNull(c["Provision sur charges"]),
      depotGarantie: vente ? null : roundedOrNull(c["Dépôt de Garantie"]),
      meuble: vente ? null : ouiNon(c["Meublé"]),
      anneeConstruction: bati && annee && annee > 1500 ? Math.round(annee) : null,
      etat: bati ? (ETAT[normalizeName(c["Etat général"] ?? "")] ?? null) : null,
      exposition: bati ? exposition(c["Exposition Séjour"]) : null,
      etage: typeBien === "APPARTEMENT" && etage != null ? Math.round(etage) : null,
      ascenseur: typeBien === "APPARTEMENT" ? ouiNon(c["Ascenseur"]) : null,
      nbSallesDeBain: bati && sallesDeBain > 0 ? Math.round(sallesDeBain) : null,
      stationnement: c["Type de Stationnement"]?.trim() || null,
      chauffageType: bati && (chauffageType === "individuel" || chauffageType === "collectif") ? chauffageType : null,
      assainissement: assainissement(c["Assainissement"]),
      photoUrls: fichePhotoUrls(externalRef, raw.imageUrls),
    },
  };
}
