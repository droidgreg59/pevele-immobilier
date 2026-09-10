// Pas de `import "server-only"` ici : ce module est aussi importé par le
// script CLI `scripts/import-dvf.ts` (exécuté via tsx, hors contexte
// Next.js), où ce garde-fou lèverait une erreur. Il n'est de toute façon
// jamais importé depuis un composant client.
import { gunzipSync } from "node:zlib";
import { parse } from "csv-parse/sync";
import { prisma } from "./prisma";
import { villages } from "@/data/villages";

/**
 * Import des transactions DVF (Demandes de Valeurs Foncières, data.gouv.fr /
 * Etalab) pour les communes suivies, à partir des fichiers départementaux
 * geo-dvf (Nord, 59). Logique partagée entre le script CLI
 * (`npm run dvf:import`) et la route cron `/api/cron/dvf-import`, pour ne
 * pas dupliquer le filtrage.
 */

const DEPARTEMENT = "59";
/** Nombre de millésimes DVF conservés (fenêtre glissante). */
const WINDOW_SIZE = 3;
/** On ne remonte pas plus loin que ça en cherchant des fichiers disponibles. */
const MAX_LOOKBACK = 5;
const TYPES_RETENUS = new Set(["Maison", "Appartement"]);
const PRIX_M2_MIN = 200;
const PRIX_M2_MAX = 15000;
const SURFACE_MIN = 9;

type DvfRow = {
  id_mutation: string;
  date_mutation: string;
  nature_mutation: string;
  valeur_fonciere: string;
  adresse_numero: string;
  adresse_nom_voie: string;
  code_commune: string;
  type_local: string;
  surface_reelle_bati: string;
  nombre_pieces_principales: string;
  nombre_lots: string;
};

/**
 * Télécharge le CSV DVF d'un département pour une année. Renvoie `null` si le
 * fichier n'existe pas encore (millésime pas publié — cas normal en début
 * d'année), lève une erreur pour toute autre défaillance.
 */
async function downloadDepartementCsv(year: number): Promise<string | null> {
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/departements/${DEPARTEMENT}.csv.gz`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Échec du téléchargement DVF ${year} : HTTP ${res.status}`);
  }
  const compressed = Buffer.from(await res.arrayBuffer());
  return gunzipSync(compressed).toString("utf-8");
}

function filterYear(csv: string, year: number, inseeToSlug: Map<string, string>) {
  const rows: DvfRow[] = parse(csv, { columns: true, skip_empty_lines: true });
  const seen = new Set<string>();
  const filtered: {
    villageSlug: string;
    dateMutation: Date;
    typeLocal: string;
    valeurFonciere: number;
    surfaceBati: number;
    prixM2: number;
    nombrePieces: number | null;
    adresse: string | null;
    sourceAnnee: number;
  }[] = [];

  for (const row of rows) {
    const villageSlug = inseeToSlug.get(row.code_commune);
    if (!villageSlug) continue;
    if (row.nature_mutation !== "Vente") continue;
    if (!TYPES_RETENUS.has(row.type_local)) continue;
    if (Number(row.nombre_lots) > 1) continue;

    const dedupeKey = `${row.id_mutation}|${row.type_local}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const valeurFonciere = Math.round(Number(row.valeur_fonciere));
    const surfaceBati = Math.round(Number(row.surface_reelle_bati));
    if (!valeurFonciere || !surfaceBati || surfaceBati < SURFACE_MIN) continue;

    const prixM2 = Math.round(valeurFonciere / surfaceBati);
    if (prixM2 < PRIX_M2_MIN || prixM2 > PRIX_M2_MAX) continue;

    const adresse =
      [row.adresse_numero, row.adresse_nom_voie].filter(Boolean).join(" ").trim() || null;

    filtered.push({
      villageSlug,
      dateMutation: new Date(row.date_mutation),
      typeLocal: row.type_local,
      valeurFonciere,
      surfaceBati,
      prixM2,
      nombrePieces: row.nombre_pieces_principales ? Number(row.nombre_pieces_principales) : null,
      adresse,
      sourceAnnee: year,
    });
  }

  return filtered;
}

export type DvfImportResult = { year: number; count: number }[];

/**
 * Réimporte les DVF sur une fenêtre glissante des `WINDOW_SIZE` millésimes les
 * plus récents réellement disponibles chez data.gouv (à partir de l'année en
 * cours, en descendant jusqu'à `MAX_LOOKBACK` ans). Aucune année codée en
 * dur : le jeu de données ne se périme plus tout seul.
 *
 * Tous les fichiers sont téléchargés et filtrés d'abord ; la table n'est
 * vidée puis réécrite qu'ensuite, dans une transaction — un échec réseau
 * laisse donc les anciennes données en place.
 */
export async function runDvfImport(): Promise<DvfImportResult> {
  const inseeToSlug = new Map(villages.map((v) => [v.insee, v.slug]));
  const currentYear = new Date().getFullYear();

  const batches: { year: number; rows: ReturnType<typeof filterYear> }[] = [];
  for (
    let year = currentYear;
    year >= currentYear - MAX_LOOKBACK && batches.length < WINDOW_SIZE;
    year--
  ) {
    const csv = await downloadDepartementCsv(year);
    if (csv === null) continue;
    batches.push({ year, rows: filterYear(csv, year, inseeToSlug) });
  }

  if (batches.length === 0) {
    throw new Error("Aucun millésime DVF disponible au téléchargement.");
  }

  await prisma.$transaction([
    prisma.dvfTransaction.deleteMany({}),
    ...batches
      .filter((b) => b.rows.length > 0)
      .map((b) => prisma.dvfTransaction.createMany({ data: b.rows })),
  ]);

  return batches.map((b) => ({ year: b.year, count: b.rows.length }));
}
