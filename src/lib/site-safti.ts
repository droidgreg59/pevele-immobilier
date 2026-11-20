import { villages } from "@/data/villages";
import { EQUIPEMENTS } from "@/data/equipements";
import { normalizeName } from "./ac3-import";
import { rscObjectFromHtml } from "./site-meilleursbiens";
import type { Parsed4mListing } from "./site-4m";
import type { TransactionType, TypeBien } from "@prisma/client";

/**
 * Reprise des annonces d'un mandataire SAFTI depuis sa page publique
 * (safti.fr/votre-conseiller-safti/<slug>), avec son autorisation (case
 * cochée à l'inscription). Simple fetch, pas de pare-feu.
 *
 * - Page de l'agent : Next.js « pages », `__NEXT_DATA__` → `properties`
 *   (ses 25 annonces disponibles les plus récentes, sans pagination — d'où
 *   la vérification de la fiche avant tout retrait, voir network-site-sync).
 * - Fiche : Next.js « app », objet `annonce` dans le flux RSC.
 * Champs relevés en direct sur la page et les fiches de Véronique Lenglart
 * le 2026-11-20 — ne jamais en deviner d'autres. SAFTI signale lui-même les
 * biens sous compromis (`underCompromise`) et vendus (`sold`).
 */

export const SAFTI_ORIGIN = "https://www.safti.fr";
export const SAFTI_IMPORT_SOURCE = "SITE_SAFTI";

export function isSaftiAgentPage(url: string | null | undefined): boolean {
  return /^https:\/\/(www\.)?safti\.fr\/votre-conseiller-safti\/[a-z0-9-]+\/?$/i.test(url ?? "");
}

type SaftiSummary = {
  propertyReference: string | number;
  propertyType: string;
  adType: string;
  city: string;
  cityPath: string;
  underCompromise: boolean | string;
  sold: boolean | string;
};

const truthy = (v: unknown) => v === true || v === "true" || v === "True";

function villageOf(city: string) {
  return villages.find((v) => normalizeName(v.nom) === normalizeName(city)) ?? null;
}

/** URL d'une fiche : SAFTI ne vérifie que la référence (le reste du chemin est libre). */
export function saftiDetailUrl(ref: string, transaction: TransactionType, propertyType = "bien", cityPath = "x"): string {
  return `${SAFTI_ORIGIN}/annonces/${transaction === "LOCATION" ? "location" : "achat"}/${propertyType}/${cityPath}/${ref}`;
}

export function saftiRefFromUrl(url: string): string | null {
  return /\/annonces\/(?:achat|location)\/[^/]+\/[^/]+\/(\d+)/.exec(url)?.[1] ?? null;
}

/**
 * Fiches à ouvrir depuis la page de l'agent : en Pévèle, ni vendues ni sous
 * compromis (inutile de les ouvrir — absentes, elles seront retirées).
 */
export function saftiListingUrls(html: string): string[] | null {
  const m = /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  const props = (JSON.parse(m[1])?.props?.pageProps?.properties ?? []) as SaftiSummary[];
  return props
    .filter((p) => !truthy(p.sold) && !truthy(p.underCompromise) && villageOf(p.city))
    .map((p) =>
      saftiDetailUrl(String(p.propertyReference), p.adType === "location" ? "LOCATION" : "VENTE", p.propertyType, p.cityPath)
    );
}

type SaftiAnnonce = Record<string, unknown> & {
  propertyReference: number;
  photos?: { urlPhotoLarge?: string }[];
  plans?: unknown[];
  amenagements?: Record<string, string[]>;
};

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

const TYPES: Record<string, TypeBien> = { maison: "MAISON", appartement: "APPARTEMENT", terrain: "TERRAIN" };
const EXPOSITIONS = new Set(["nord", "sud", "est", "ouest", "nord-est", "nord-ouest", "sud-est", "sud-ouest"]);
/** `heaterType` (relevé : « electrique_individuel ») → source d'énergie. */
const ENERGIES: Record<string, string> = { electrique: "Électrique", gaz: "Gaz", fioul: "Fioul", bois: "Bois" };

function textFromHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseSaftiListing(
  html: string,
  url: string
): { listing: Parsed4mListing } | { externalRef: string; reason: string } | null {
  const a = rscObjectFromHtml<SaftiAnnonce>(html, "annonce", ["description"]);
  if (!a || !a.propertyReference) return null; // page illisible
  const externalRef = String(a.propertyReference);
  if (saftiRefFromUrl(url) !== externalRef) return null;

  if (truthy(a.sold)) return { externalRef, reason: "vendu" };
  if (truthy(a.underCompromise)) return { externalRef, reason: "sous compromis" };
  if (truthy(a.retraitDiffusion)) return { externalRef, reason: "retiré de la diffusion" };

  const transaction: TransactionType | null =
    a.adType === "vente" ? "VENTE" : a.adType === "location" ? "LOCATION" : null;
  if (!transaction) return { externalRef, reason: `transaction inconnue (${str(a.adType)})` };
  const typeBien = TYPES[str(a.propertyType)];
  if (!typeBien) return { externalRef, reason: `type non pris en charge (${str(a.propertyType)})` };

  const prix = Math.round(num(a.price) ?? 0);
  if (!prix) return { externalRef, reason: "prix non communiqué" };
  const village = villageOf(str(a.city));
  if (!village) return { externalRef, reason: `hors Pévèle (${str(a.city)})` };
  const surface = Math.round(num(a.propertySurface) ?? 0);
  if (!surface) return { externalRef, reason: "surface manquante" };
  const bati = typeBien !== "TERRAIN";
  const vente = transaction === "VENTE";

  // Aménagements : « Exposition » et listes de libellés comparés à nos équipements.
  const equipements = new Set<string>();
  let exposition: string | null = null;
  for (const [groupe, valeurs] of Object.entries(a.amenagements ?? {})) {
    for (const v of valeurs ?? []) {
      if (normalizeName(groupe) === "exposition") {
        const e = normalizeName(v).replace(/ /g, "-");
        if (EXPOSITIONS.has(e)) exposition = e;
        continue;
      }
      const eq = EQUIPEMENTS.find((x) => normalizeName(x) === normalizeName(v));
      if (eq) equipements.add(eq);
    }
  }
  if (a.garden === true) equipements.add("Jardin");
  if ((num(a.carParkNumber) ?? 0) > 0) equipements.add("Parking");
  if (!bati) equipements.clear();

  const terrain = bati ? num(a.areaSurface) : null;
  const exterieur = [
    ...(terrain ? [`${Math.round(terrain)} M² TERRAIN`] : []),
    ...["Jardin", "Balcon", "Terrasse"].filter((e) => equipements.has(e)).map((e) => e.toUpperCase()),
  ];

  const dpeApplicable = bati && str(a.dpeStatus) === "mandatory";
  const lettre = (v: unknown) => (dpeApplicable && /^[A-G]$/.test(str(v)) ? str(v) : undefined);
  const dpeDate = dpeApplicable ? /^(\d{4}-\d{2}-\d{2})/.exec(str(a.dpeExecutionDate))?.[1] : undefined;
  const [energie, mode] = str(a.heaterType).split("_");
  const sdb = (num(a.bathroomNumber) ?? 0) + (num(a.showerRoomNumber) ?? 0);
  const annee = num(a.yearConstruction);
  // Honoraires : `agencyFees` (« 10237,50 ») et `agencyFeesType` (relevé : « seller »).
  const charge = a.agencyFeesType === "seller" ? "vendeur" : a.agencyFeesType === "buyer" ? "acquereur" : null;

  const planUrls = (a.plans ?? [])
    .map((p) => (typeof p === "string" ? p : str((p as { urlPhotoLarge?: string })?.urlPhotoLarge)))
    .filter(Boolean);

  const titreGenerique = `${typeBien === "MAISON" ? "Maison" : typeBien === "APPARTEMENT" ? "Appartement" : "Terrain"} à ${village.nom}`;

  return {
    listing: {
      externalRef,
      transaction,
      typeBien,
      titre: str(a.catchphrase) || titreGenerique,
      description: textFromHtml(str(a.description)) || titreGenerique,
      prix,
      villageSlug: village.slug,
      commune: village.nom,
      pieces: bati ? Math.round(num(a.roomNumber) ?? 0) : 0,
      chambres: bati ? Math.round(num(a.bedroomNumber) ?? 0) : 0,
      surface,
      exterieur: exterieur.join(", ") || "—",
      surfaceTerrain: terrain ? Math.round(terrain) : null,
      equipements: [...equipements].join(","),
      dpe: lettre(a.dpeNote),
      ges: lettre(a.gesNote),
      dpeConsommation: dpeApplicable ? (num(a.dpeValue) ? Math.round(num(a.dpeValue)!) : null) : null,
      dpeEmissions: dpeApplicable ? (num(a.gesValue) ? Math.round(num(a.gesValue)!) : null) : null,
      dpeCoutMin: dpeApplicable ? (num(a.dpeConsumptionMin) ? Math.round(num(a.dpeConsumptionMin)!) : null) : null,
      dpeCoutMax: dpeApplicable ? (num(a.dpeConsumptionMax) ? Math.round(num(a.dpeConsumptionMax)!) : null) : null,
      dpeCoutAnneeRef: dpeApplicable ? num(a.dpeConsumptionRefYear) : null,
      dpeDate: dpeDate ? new Date(`${dpeDate}T00:00:00Z`) : null,
      modeChauffage: bati ? (ENERGIES[energie] ?? null) : null,
      chauffageType: bati && (mode === "individuel" || mode === "collectif") ? mode : null,
      exposition: bati ? exposition : null,
      anneeConstruction: bati && annee && annee > 1500 ? Math.round(annee) : null,
      nbSallesDeBain: bati && sdb > 0 ? Math.round(sdb) : null,
      honoraires: vente && charge ? (num(a.agencyFees) ? Math.round(num(a.agencyFees)!) : null) : null,
      honorairesCharge: vente ? charge : null,
      taxeFonciere: vente && bati ? (num(a.propertyTax) ? Math.round(num(a.propertyTax)!) : null) : null,
      videoUrl: str(a.video) || undefined,
      visiteVirtuelleUrl: str(a.virtualVideoLink) || undefined,
      photoUrls: [...(a.photos ?? []).map((p) => str(p.urlPhotoLarge)).filter(Boolean), ...planUrls],
    },
  };
}
