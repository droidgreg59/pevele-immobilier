/**
 * Annonces importées d'un flux : champs modifiés à la main par l'agence.
 *
 * La synchro réécrit les champs fournis par le flux. Quand l'agence en change
 * un à la main, on le mémorise dans `Listing.manualOverrides` (liste CSV) et la
 * synchro ne le touche plus — sauf le prix, jamais modifiable à la main sur une
 * annonce importée : il vient toujours du flux. Fonctions pures, testées.
 */

/**
 * Champs que le flux fournit et que l'agence peut reprendre à la main (hors
 * prix). Seuls ceux qui ont un champ dans le formulaire d'édition : les coûts
 * et la date du DPE n'y figurent pas et restent toujours alimentés par le flux.
 */
export const FEED_MANAGED_FIELDS = [
  "transaction",
  "typeBien",
  "typeMaison",
  "titre",
  "description",
  "villageSlug",
  "commune",
  "pieces",
  "chambres",
  "surface",
  "exterieur",
  "equipements",
  "surfaceTerrain",
  "modeChauffage",
  "dpe",
  "ges",
  "dpeConsommation",
  "dpeEmissions",
  "videoUrl",
  "visiteVirtuelleUrl",
] as const;

/** Pseudo-champ : la liste de photos (ajout/retrait manuel). */
export const PHOTOS_FIELD = "photos";

export const OVERRIDE_LABEL: Record<string, string> = {
  transaction: "type de transaction",
  typeBien: "type de bien",
  typeMaison: "type de maison",
  titre: "titre",
  description: "description",
  villageSlug: "commune",
  commune: "commune",
  pieces: "pièces",
  chambres: "chambres",
  surface: "surface",
  exterieur: "extérieur",
  equipements: "équipements",
  surfaceTerrain: "surface du terrain",
  modeChauffage: "chauffage",
  dpe: "DPE",
  ges: "GES",
  dpeConsommation: "DPE",
  dpeEmissions: "DPE",
  videoUrl: "vidéo",
  visiteVirtuelleUrl: "visite virtuelle",
  photos: "photos",
};

export function parseOverrides(csv: string | null | undefined): string[] {
  return csv ? csv.split(",").filter(Boolean) : [];
}

export function mergeOverrides(current: string | null | undefined, added: string[]): string | null {
  const all = [...new Set([...parseOverrides(current), ...added])];
  return all.length > 0 ? all.join(",") : null;
}

/** Libellés lisibles (dédoublonnés) des champs protégés, pour l'affichage. */
export function overrideLabels(csv: string | null | undefined): string[] {
  return [...new Set(parseOverrides(csv).map((f) => OVERRIDE_LABEL[f] ?? f))];
}

function norm(field: string, v: unknown): string | number | boolean | null {
  if (v === undefined || v === null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") {
    // Un <textarea> renvoie ses retours à la ligne en \r\n, le flux en \n.
    const t = v.replace(/\r\n?/g, "\n").trim();
    if (t === "") return null;
    // Même ensemble d'équipements, quel que soit l'ordre dans lequel on les liste.
    if (field === "equipements") return t.split(",").map((s) => s.trim()).filter(Boolean).sort().join(",");
    return t;
  }
  return v as number | boolean;
}

/** Champs du flux dont la valeur saisie diffère de celle enregistrée. */
export function detectManualOverrides(
  existing: Record<string, unknown>,
  input: Record<string, unknown>
): string[] {
  return FEED_MANAGED_FIELDS.filter((f) => norm(f, existing[f]) !== norm(f, input[f]));
}

/** Retire d'un objet de données les champs protégés (le prix n'en fait jamais partie). */
export function stripOverridden<T extends Record<string, unknown>>(data: T, overrides: string[]): T {
  const out: Record<string, unknown> = { ...data };
  for (const f of overrides) {
    if (f !== "prix") delete out[f];
  }
  return out as T;
}
