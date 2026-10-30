import { villages } from "@/data/villages";
import { normalizeName } from "./ac3-import";
import type { Parsed4mListing } from "./site-4m";
import type { TransactionType, TypeBien, TypeMaison } from "@prisma/client";

/**
 * Reprise des annonces d'un mandataire MeilleursBiens depuis sa page publique
 * (meilleursbiens.com/site/<id>-<nom>), avec son autorisation — le réseau ne
 * fournit pas de flux XML à ses mandataires. Pas de pare-feu : un simple
 * fetch suffit (contrairement au site 4M), donc la reprise tourne dans le
 * cron quotidien (src/lib/meilleursbiens-sync.ts).
 *
 * Chaque fiche (/annonce/<uuid>) est une page Next.js : l'objet `property`
 * complet (celui de leur logiciel NEO) est dans le flux RSC embarqué
 * (`self.__next_f.push`). Champs et valeurs relevés en direct sur les 12
 * fiches de Christophe Lemaire le 2026-10-30 — ne jamais en deviner d'autres.
 */

export const MB_ORIGIN = "https://meilleursbiens.com";
export const MB_IMPORT_SOURCE = "SITE_MB";

/** Page publique d'un mandataire MeilleursBiens (siteWeb du compte). */
export function isMeilleursBiensAgentPage(url: string | null | undefined): boolean {
  return /^https:\/\/(www\.)?meilleursbiens\.com\/site\/\d+-[a-z0-9-]+\/?$/i.test(url ?? "");
}

/** Identifiants des fiches listées sur la page du mandataire. */
export function annonceIdsFromAgentPage(html: string): string[] {
  return [...new Set([...html.matchAll(/href="\/annonce\/([0-9a-f-]{36})"/g)].map((m) => m[1]))];
}

/**
 * Flux RSC concaténé → lignes indexées. Format : `id:<json>\n`, ou
 * `id:T<longueur hexadécimale en octets>,<texte>` (sans fin de ligne) pour
 * les longs textes — description, champs personnalisés — référencés
 * ailleurs par `"$id"`.
 */
export function parseRscRows(flight: string): Map<string, string> {
  const buf = Buffer.from(flight, "utf8");
  const rows = new Map<string, string>();
  let pos = 0;
  while (pos < buf.length) {
    const colon = buf.indexOf(0x3a, pos); // ':'
    if (colon < 0) break;
    const id = buf.toString("utf8", pos, colon);
    if (!/^[0-9a-f]+$/.test(id)) {
      // Ligne inattendue : on saute jusqu'à la fin de ligne.
      const nl = buf.indexOf(0x0a, pos);
      if (nl < 0) break;
      pos = nl + 1;
      continue;
    }
    if (buf[colon + 1] === 0x54) {
      // 'T'
      const comma = buf.indexOf(0x2c, colon); // ','
      const len = parseInt(buf.toString("utf8", colon + 2, comma), 16);
      rows.set(id, buf.toString("utf8", comma + 1, comma + 1 + len));
      pos = comma + 1 + len;
    } else {
      const nl = buf.indexOf(0x0a, colon);
      const end = nl < 0 ? buf.length : nl;
      rows.set(id, buf.toString("utf8", colon + 1, end));
      pos = end + 1;
    }
  }
  return rows;
}

/** Flux RSC d'une page : concaténation des `self.__next_f.push([1, "…"])`. */
export function flightFromHtml(html: string): string {
  let out = "";
  for (const m of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g)) {
    try {
      const arr = JSON.parse(m[1]);
      if (typeof arr[1] === "string") out += arr[1];
    } catch {
      // morceau illisible : ignoré
    }
  }
  return out;
}

export type MbProperty = Record<string, unknown> & {
  id: string;
  pictures?: { file_cache?: string; file?: string; order?: number; is_main_picture?: number }[];
};

/** Objet `property` d'une fiche, références `"$id"` vers des textes résolues. */
export function propertyFromHtml(html: string): MbProperty | null {
  const rows = parseRscRows(flightFromHtml(html));
  for (const line of rows.values()) {
    const i = line.indexOf('"property":{');
    if (i < 0) continue;
    let depth = 0;
    let inStr = false;
    let esc = false;
    const start = line.indexOf("{", i);
    for (let j = start; j < line.length; j++) {
      const c = line[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) {
        const property = JSON.parse(line.slice(start, j + 1)) as MbProperty;
        for (const key of ["description", "property_fields", "title"]) {
          const v = property[key];
          const ref = typeof v === "string" ? /^\$([0-9a-f]+)$/.exec(v)?.[1] : undefined;
          if (ref && rows.has(ref)) property[key] = rows.get(ref);
        }
        return property;
      }
    }
  }
  return null;
}

/** `property_fields` (JSON en texte) → code → valeur. */
export function mbFields(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string" || !raw.startsWith("[")) return {};
  try {
    const arr = JSON.parse(raw) as { code: string; value: unknown }[];
    return Object.fromEntries(arr.map((f) => [f.code, f.value]));
  } catch {
    return {};
  }
}

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const yes = (v: unknown) => v === true || v === "true" || v === 1 || v === "1";
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Code Ubiflow du type (`property_type_id`) → notre type. Préfixes observés : 11xx, 12xx, 13xx. */
function typeBienFrom(code: unknown): TypeBien | null {
  const prefix = String(code ?? "").slice(0, 2);
  if (prefix === "11") return "APPARTEMENT";
  if (prefix === "12") return "MAISON";
  if (prefix === "13") return "TERRAIN";
  return null;
}

/** `honoraires_type` : 1 = « Acquéreur », 2 = « Vendeur » (libellés affichés sur les fiches). */
function honorairesChargeFrom(code: unknown): string | null {
  if (code === 1) return "acquereur";
  if (code === 2) return "vendeur";
  return null;
}

const EXPOSITIONS = new Set(["nord", "sud", "est", "ouest", "nord-est", "nord-ouest", "sud-est", "sud-ouest"]);

function frDate(value: unknown): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str(value));
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseMbProperty(
  p: MbProperty,
  availability: string | null
): { listing: Parsed4mListing } | { externalRef: string; reason: string } {
  const externalRef = p.id;
  if (p.status !== 1 || p.is_archived) return { externalRef, reason: "annonce inactive ou archivée" };
  // Bien vendu / sous offre : la fiche n'est plus « InStock » (JSON-LD schema.org).
  if (availability && !/InStock$/.test(availability)) {
    return { externalRef, reason: `indisponible (${availability.split("/").pop()})` };
  }

  const transaction: TransactionType | null =
    p.ubiflow_type === "V" ? "VENTE" : p.ubiflow_type === "L" ? "LOCATION" : null;
  if (!transaction) return { externalRef, reason: `transaction inconnue (${String(p.ubiflow_type)})` };

  const typeBien = typeBienFrom(p.property_type_id);
  if (!typeBien) return { externalRef, reason: `type non pris en charge (${String(p.property_type_id)})` };

  const prix = Math.round(num(p.price_public) ?? 0);
  if (prix <= 0 || p.is_price_private) return { externalRef, reason: "prix non communiqué" };

  const city = str(p.city);
  const village =
    villages.find((v) => v.insee === str(p.insee_code)) ??
    villages.find((v) => normalizeName(v.nom) === normalizeName(city));
  if (!village) return { externalRef, reason: `hors Pévèle (${city || "ville inconnue"})` };

  const f = mbFields(p.property_fields);
  const surfaceTerrainField = num(f.surface_terrain) ?? num(p.surface_terrain);
  const surface = Math.round(num(p.surface) ?? 0);
  if (surface <= 0) return { externalRef, reason: "surface manquante" };
  const bati = typeBien !== "TERRAIN";

  const equipements = new Set<string>();
  if (f.type_jardin || yes(f.jardin)) equipements.add("Jardin");
  if (yes(f.garage) || (num(f.nb_garages) ?? 0) > 0) equipements.add("Garage");
  if (yes(f.avec_stationnement) || (num(f.nb_parkings) ?? 0) > 0) equipements.add("Parking");
  if (yes(f.terrasse)) equipements.add("Terrasse");
  if (yes(f.balcon)) equipements.add("Balcon");
  if (yes(f.cave)) equipements.add("Cave");
  if (yes(f.piscine)) equipements.add("Piscine");
  if (yes(f.cheminee)) equipements.add("Cheminée");
  if (!bati) equipements.clear();

  const exterieur: string[] = [];
  if (bati && surfaceTerrainField) exterieur.push(`${Math.round(surfaceTerrainField)} M² TERRAIN`);
  for (const eq of ["Jardin", "Balcon", "Terrasse"]) if (equipements.has(eq)) exterieur.push(eq.toUpperCase());

  // Consommation à 0 kWh (relevé : fermette de Bourghelles « A » à 0 kWh / 0 kg) :
  // DPE non renseigné dans leur logiciel, pas un bien classé A — rien affiché.
  const dpeApplicable =
    bati && !p.dpe_exempt && !p.dpe_not_applicable && !(p.dpe === 0 && (p.ges === 0 || p.ges == null));
  const classe = (v: unknown) => (dpeApplicable && /^[A-G]$/.test(str(v)) ? str(v) : undefined);
  const sdb = (num(p.nb_sdb) ?? 0) + (num(f.nb_salles_d_eau) ?? 0);
  const energie = str(f.chauffage_energie);
  const exposition = str(f.exposition).toLowerCase();
  const chauffageType = str(f.chauffage_type).toLowerCase();
  const annee = num(f.annee_construction);
  const vente = transaction === "VENTE";
  const typeMaison: TypeMaison | undefined =
    typeBien === "MAISON" && str(f.mitoyennete) === "non" ? "INDIVIDUELLE" : undefined;

  const pictures = [...(p.pictures ?? [])].sort(
    (a, b) => (b.is_main_picture ?? 0) - (a.is_main_picture ?? 0) || (a.order ?? 0) - (b.order ?? 0)
  );

  const titre =
    str(p.title) ||
    `${typeBien === "MAISON" ? "Maison" : typeBien === "APPARTEMENT" ? "Appartement" : "Terrain"} à ${village.nom}`;

  return {
    listing: {
      externalRef,
      transaction,
      typeBien,
      typeMaison,
      titre: titre.charAt(0).toUpperCase() + titre.slice(1),
      description: str(p.description) || titre,
      prix,
      villageSlug: village.slug,
      commune: village.nom,
      pieces: bati ? Math.round(num(p.nb_pieces) ?? 0) : 0,
      chambres: bati ? Math.round(num(p.nb_chambres) ?? 0) : 0,
      surface,
      exterieur: exterieur.length > 0 ? exterieur.join(", ") : "—",
      surfaceTerrain: bati && surfaceTerrainField ? Math.round(surfaceTerrainField) : null,
      equipements: [...equipements].join(","),
      dpe: classe(p.dpe_letter),
      ges: classe(p.ges_letter),
      dpeConsommation: dpeApplicable ? (num(p.dpe) ? Math.round(num(p.dpe)!) : null) : null,
      dpeEmissions: dpeApplicable ? (num(p.ges) ? Math.round(num(p.ges)!) : null) : null,
      dpeDate: dpeApplicable ? frDate(p.dpe_date) : null,
      modeChauffage: bati && energie ? energie.charAt(0).toUpperCase() + energie.slice(1) : null,
      chauffageType: bati && (chauffageType === "individuel" || chauffageType === "collectif") ? chauffageType : null,
      exposition: bati && EXPOSITIONS.has(exposition) ? exposition : null,
      anneeConstruction: bati && annee && annee > 1500 ? Math.round(annee) : null,
      nbSallesDeBain: bati && sdb > 0 ? Math.round(sdb) : null,
      // Montant des honoraires non publié par MeilleursBiens : seule la charge est connue.
      honoraires: null,
      honorairesCharge: vente ? honorairesChargeFrom(p.honoraires_type) : null,
      taxeFonciere: vente && bati ? (num(f.taxe_fonciere) ? Math.round(num(f.taxe_fonciere)!) : null) : null,
      videoUrl: str(p.video_url) || undefined,
      visiteVirtuelleUrl: str(p.virtual_visit_url) || undefined,
      photoUrls: pictures.map((pic) => pic.file_cache || pic.file || "").filter(Boolean),
    },
  };
}
