import "server-only";
import { XMLParser } from "fast-xml-parser";
import { villages } from "@/data/villages";
import { EQUIPEMENTS } from "@/data/equipements";
import type { TransactionType, TypeBien, TypeMaison } from "@prisma/client";

/**
 * Import du flux XML "passerelle" AC3 / Immofacile utilisé par les agences
 * immobilières (ex. PVL Immobilier). Spécification : notice technique AC3
 * fournie par l'agence, format LISTEPA > BIEN > ... Seul un sous-ensemble
 * des balises est exploité — celles qui correspondent à des champs réels
 * de notre modèle Listing.
 */

const ACTIVE_STATUTS = new Set(["en cours", "bail en cours", "bailen cours"]);
const SUPPORTED_TYPES: TypeBien[] = ["MAISON", "APPARTEMENT", "TERRAIN"];

export type ParsedAc3Listing = {
  externalRef: string;
  transaction: TransactionType;
  typeBien: TypeBien;
  typeMaison?: TypeMaison | null;
  titre: string;
  description: string;
  prix: number;
  villageSlug: string;
  commune: string;
  pieces: number;
  chambres: number;
  surface: number;
  exterieur: string;
  equipements: string;
  dpe?: string;
  ges?: string;
  dpeConsommation?: number | null;
  dpeEmissions?: number | null;
  dpeCoutMin?: number | null;
  dpeCoutMax?: number | null;
  dpeCoutAnneeRef?: number | null;
  dpeDate?: Date | null;
  modeChauffage?: string | null;
  videoUrl?: string;
  visiteVirtuelleUrl?: string;
  photoUrls: string[];
};

export type SkippedAc3Listing = {
  externalRef: string;
  reason: string;
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function truthy(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "number") return value === 1;
  const s = String(value).trim().toLowerCase();
  return s === "1" || s === "oui" || s === "true";
}

function numGtZero(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

/** Entier positif arrondi d'une balise numérique (« 153.8 » → 154), sinon `null`. */
function roundedIntOrNull(value: unknown): number | null {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Date d'une balise au format JJ/MM/AAAA (flux AC3), sinon `null`. */
function frDateOrNull(value: unknown): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value).trim());
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Récupère le flux XML AC3 et le décode (encodage ISO-8859-1 imposé par la spec). */
export async function fetchAc3Feed(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Le flux a répondu avec le statut ${res.status}.`);
  }
  const buffer = await res.arrayBuffer();
  return new TextDecoder("iso-8859-1").decode(buffer);
}

/**
 * Balise MITOYENNETE du flux AC3, propre à la fiche MAISON — valeurs
 * observées sur le flux réel de PVL Immobilier : "Indépendant", "1 côté",
 * "2 côtés". Toute autre valeur (absente, inattendue) reste non renseignée
 * plutôt que d'être devinée.
 */
function parseTypeMaison(typeNode: Record<string, unknown>): TypeMaison | undefined {
  const raw = textOf(typeNode.MITOYENNETE).toLowerCase();
  if (raw === "indépendant" || raw === "independant") return "INDIVIDUELLE";
  if (raw === "1 côté" || raw === "1 cote") return "SEMI_INDIVIDUELLE";
  if (raw === "2 côtés" || raw === "2 cotes") return "MITOYENNE";
  return undefined;
}

function buildExterieur(typeBien: TypeBien, typeNode: Record<string, unknown>): string {
  const parts: string[] = [];
  const surfaceTerrain = Number(typeNode.SURFACE_TERRAIN);
  if (typeBien !== "TERRAIN" && Number.isFinite(surfaceTerrain) && surfaceTerrain > 0) {
    parts.push(`${surfaceTerrain} M² TERRAIN`);
  }
  if (truthy(typeNode.JARDIN)) parts.push("JARDIN");
  if (numGtZero(typeNode.NBRE_BALCON)) parts.push("BALCON");
  if (numGtZero(typeNode.NBRE_TERRASSE)) parts.push("TERRASSE");
  return parts.length > 0 ? parts.join(", ") : "—";
}

function buildEquipements(typeNode: Record<string, unknown>): string {
  const eq: string[] = [];
  if (truthy(typeNode.JARDIN)) eq.push("Jardin");
  if (numGtZero(typeNode.NBRE_GARAGE)) eq.push("Garage");
  if (numGtZero(typeNode.NBRE_PARKING)) eq.push("Parking");
  if (numGtZero(typeNode.NBRE_BALCON)) eq.push("Balcon");
  if (numGtZero(typeNode.NBRE_TERRASSE)) eq.push("Terrasse");
  if (truthy(typeNode.PISCINE)) eq.push("Piscine");
  if (truthy(typeNode.CHEMINEE)) eq.push("Cheminée");
  // Ne garde que les tags reconnus par notre liste canonique.
  return eq.filter((tag) => (EQUIPEMENTS as readonly string[]).includes(tag)).join(",");
}

/** Parse le XML AC3 et renvoie les biens importables (Pévèle + type supporté + statut actif). */
export function parseAc3Feed(xml: string): {
  imported: ParsedAc3Listing[];
  skipped: SkippedAc3Listing[];
} {
  const parser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
    isArray: (name) => name === "BIEN" || name === "IMG" || name === "PIECE",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = parser.parse(xml);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biens: any[] = doc?.LISTEPA?.BIEN ?? [];

  const imported: ParsedAc3Listing[] = [];
  const skipped: SkippedAc3Listing[] = [];

  for (const bien of biens) {
    const externalRef = textOf(String(bien?.INFO_GENERALES?.AFF_ID ?? ""));
    if (!externalRef) {
      skipped.push({ externalRef: "?", reason: "AFF_ID manquant" });
      continue;
    }

    const statut = textOf(bien?.INFO_GENERALES?.STATUT).toLowerCase();
    if (!ACTIVE_STATUTS.has(statut)) {
      skipped.push({ externalRef, reason: `statut non actif (${statut || "inconnu"})` });
      continue;
    }

    const typeBien = SUPPORTED_TYPES.find((t) => bien?.[t]);
    if (!typeBien) {
      skipped.push({ externalRef, reason: "type de bien non pris en charge" });
      continue;
    }
    const typeNode = bien[typeBien] as Record<string, unknown>;

    let transaction: TransactionType;
    let prixRaw: unknown;
    if (bien.VENTE) {
      transaction = "VENTE";
      prixRaw = bien.VENTE.PRIX ?? bien.VENTE.PRIX_NET;
    } else if (bien.LOCATION) {
      transaction = "LOCATION";
      prixRaw = bien.LOCATION.LOYER ?? bien.LOCATION.PRIX;
    } else {
      skipped.push({ externalRef, reason: "ni vente ni location" });
      continue;
    }
    const prix = Math.round(Number(prixRaw));
    if (!Number.isFinite(prix) || prix <= 0) {
      skipped.push({ externalRef, reason: "prix manquant ou invalide" });
      continue;
    }

    const villeRaw = textOf(bien?.LOCALISATION?.VILLE);
    const village = villages.find((v) => normalizeName(v.nom) === normalizeName(villeRaw));
    if (!village) {
      skipped.push({ externalRef, reason: `village hors Pévèle (${villeRaw || "inconnu"})` });
      continue;
    }

    const surfaceHabitable = Number(typeNode.SURFACE_HABITABLE) || 0;
    const surfaceTerrain = Number(typeNode.SURFACE_TERRAIN) || 0;
    const surface =
      typeBien === "TERRAIN"
        ? surfaceTerrain || surfaceHabitable
        : surfaceHabitable || surfaceTerrain;
    if (!surface || surface <= 0) {
      skipped.push({ externalRef, reason: "surface manquante" });
      continue;
    }

    const titre =
      textOf(bien?.INTITULE?.FR) ||
      `${typeBien === "MAISON" ? "Maison" : typeBien === "APPARTEMENT" ? "Appartement" : "Terrain"} à ${village.nom}`;
    const description = textOf(bien?.COMMENTAIRES?.FR) || titre;

    // Bloc DPE du flux réel (balises inspectées en direct — cf. AGENTS.md) :
    // CONSOMMATIONENERGETIQUE = classe énergie, GAZEFFETDESERRE = classe climat,
    // CONSO_ANNUEL_ENERGIE = kWh/m²/an (énergie primaire), VALEUR_GES =
    // kgCO₂/m²/an, CHARGE_ENERGIE_MIN/MAX = coût annuel estimé, DATE_DPE et
    // ANNEE_REF_PRIX_ENERGIE = dates de référence.
    const dpeRaw = textOf(typeNode.CONSOMMATIONENERGETIQUE).toUpperCase();
    const dpe = /^[A-G]$/.test(dpeRaw) ? dpeRaw : undefined;
    const gesRaw = textOf(typeNode.GAZEFFETDESERRE).toUpperCase();
    const ges = /^[A-G]$/.test(gesRaw) ? gesRaw : undefined;
    const dpeConsommation = roundedIntOrNull(typeNode.CONSO_ANNUEL_ENERGIE);
    const dpeEmissions = roundedIntOrNull(typeNode.VALEUR_GES);
    const dpeCoutMin = roundedIntOrNull(typeNode.CHARGE_ENERGIE_MIN);
    const dpeCoutMax = roundedIntOrNull(typeNode.CHARGE_ENERGIE_MAX);
    const dpeCoutAnneeRef = roundedIntOrNull(typeNode.ANNEE_REF_PRIX_ENERGIE);
    const dpeDate = frDateOrNull(typeNode.DATE_DPE);
    const typeMaison = typeBien === "MAISON" ? parseTypeMaison(typeNode) : undefined;
    // Balise MODE_CHAUFFAGE (source d'énergie) du flux réel — valeurs
    // observées : "Gaz", "Electrique", "Fuel". Reprise telle quelle, sans
    // reformulation, absente pour un terrain (pas de bâti à chauffer).
    const modeChauffageRaw = textOf(typeNode.MODE_CHAUFFAGE);
    const modeChauffage = typeBien !== "TERRAIN" && modeChauffageRaw ? modeChauffageRaw : undefined;

    const videoUrl = textOf(bien?.INFO_GENERALES?.LIEN_VIDEO) || undefined;
    const visiteVirtuelleUrl = textOf(bien?.INFO_GENERALES?.VISITE_VIRTUELLE) || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imgs: any[] = Array.isArray(bien?.IMAGES?.IMG) ? bien.IMAGES.IMG : [];
    const photoUrls = imgs.map((img) => textOf(img)).filter(Boolean);

    imported.push({
      externalRef,
      transaction,
      typeBien,
      typeMaison,
      modeChauffage,
      titre,
      description,
      prix,
      villageSlug: village.slug,
      commune: village.nom,
      pieces: Number(typeNode.NBRE_PIECES) || 0,
      chambres: Number(typeNode.NBRE_CHAMBRES) || 0,
      surface,
      exterieur: buildExterieur(typeBien, typeNode),
      equipements: buildEquipements(typeNode),
      dpe,
      ges,
      dpeConsommation,
      dpeEmissions,
      dpeCoutMin,
      dpeCoutMax,
      dpeCoutAnneeRef,
      dpeDate,
      videoUrl,
      visiteVirtuelleUrl,
      photoUrls,
    });
  }

  return { imported, skipped };
}
