import "server-only";

/**
 * Interrogation de l'API publique Géorisques (georisques.gouv.fr) pour
 * afficher un aperçu « État des risques » sur la fiche d'un bien — même
 * esprit que l'ERP (État des Risques et Pollutions) annexé aux ventes et
 * aux locations. Aucune donnée inventée : tout vient de l'API, un appel qui
 * échoue est simplement omis (rendu partiel), jamais remplacé par une
 * valeur plausible.
 *
 * Endpoints utilisés (inspectés en direct avant mapping) :
 *   GET /api/v1/gaspar/risques?code_insee=   → catégories de risques de la commune
 *   GET /api/v1/zonage_sismique?code_insee=  → zone de sismicité (1 à 5)
 *   GET /api/v1/radon?code_insee=            → potentiel radon (classe 1 à 3)
 *   GET /api/v1/rga?latlon=<lon>,<lat>       → exposition retrait-gonflement des argiles
 *   GET /api/v1/gaspar/catnat?code_insee=    → arrêtés de catastrophe naturelle
 */

const BASE = "https://www.georisques.gouv.fr/api/v1";
/** Données quasi statiques côté Géorisques → revalidation hebdomadaire. */
const REVALIDATE = 60 * 60 * 24 * 7;

async function georisquesGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

type GasparRisquesResponse = {
  data?: {
    libelle_commune?: string | null;
    risques_detail?: { num_risque?: string; libelle_risque_long?: string }[];
  }[];
};
type ZonageSismiqueResponse = {
  data?: { code_zone?: string; zone_sismicite?: string }[];
};
type RadonResponse = { data?: { classe_potentiel?: string }[] };
type RgaResponse = { codeExposition?: string; exposition?: string };
type CatnatResponse = {
  results?: number;
  data?: { libelle_risque_jo?: string; date_debut_evt?: string }[];
};

export type CommuneRisques = {
  insee: string;
  commune: string | null;
  /** Catégories de risques recensées sur la commune (GASPAR). */
  categories: string[];
  /** Zone de sismicité, ex. « 2 - Faible » (échelle 1 à 5). */
  sismicite: string | null;
  /** Potentiel radon : classe « 1 » à « 3 ». */
  radonClasse: string | null;
  /** Exposition au retrait-gonflement des argiles au point du bien. */
  argile: string | null;
  /** Arrêtés de catastrophe naturelle : total + libellés distincts. */
  catnat: { total: number; libelles: string[] } | null;
  /** Y a-t-il au moins une information à afficher ? */
  hasData: boolean;
};

const RADON_LABEL: Record<string, string> = {
  "1": "faible",
  "2": "faible, sur des formations géologiques particulières",
  "3": "significatif",
};

/** Normalise « 2 - FAIBLE » → « 2 - Faible ». */
function titleCaseZone(raw: string): string {
  return raw.replace(/[A-ZÀ-Ú]{2,}/g, (w) => w[0] + w.slice(1).toLowerCase());
}

export function radonLabel(classe: string): string {
  return RADON_LABEL[classe] ?? `classe ${classe}`;
}

export async function getCommuneRisques(
  insee: string,
  coords?: { lat: number; lng: number } | null
): Promise<CommuneRisques | null> {
  if (!insee) return null;

  const [gaspar, sismique, radon, rga, catnat] = await Promise.all([
    georisquesGet<GasparRisquesResponse>(`gaspar/risques?code_insee=${insee}`),
    georisquesGet<ZonageSismiqueResponse>(`zonage_sismique?code_insee=${insee}`),
    georisquesGet<RadonResponse>(`radon?code_insee=${insee}`),
    coords
      ? georisquesGet<RgaResponse>(`rga?latlon=${coords.lng},${coords.lat}`)
      : Promise.resolve(null),
    georisquesGet<CatnatResponse>(
      `gaspar/catnat?code_insee=${insee}&page=1&page_size=25`
    ),
  ]);

  const gasparRow = gaspar?.data?.[0];
  const categories = (gasparRow?.risques_detail ?? [])
    .map((r) => r.libelle_risque_long?.trim())
    .filter((v): v is string => Boolean(v));

  const sismiciteRaw = sismique?.data?.[0]?.zone_sismicite?.trim();
  const sismicite = sismiciteRaw ? titleCaseZone(sismiciteRaw) : null;

  const radonClasse = radon?.data?.[0]?.classe_potentiel?.trim() || null;

  const argile = rga?.exposition?.trim() || null;

  let catnatOut: CommuneRisques["catnat"] = null;
  if (catnat && typeof catnat.results === "number" && catnat.results > 0) {
    const libelles = [
      ...new Set(
        (catnat.data ?? [])
          .map((c) => c.libelle_risque_jo?.trim())
          .filter((v): v is string => Boolean(v))
      ),
    ];
    catnatOut = { total: catnat.results, libelles };
  }

  const hasData =
    categories.length > 0 ||
    sismicite !== null ||
    radonClasse !== null ||
    argile !== null ||
    catnatOut !== null;

  return {
    insee,
    commune: gasparRow?.libelle_commune?.trim() || null,
    categories,
    sismicite,
    radonClasse,
    argile,
    catnat: catnatOut,
    hasData,
  };
}
