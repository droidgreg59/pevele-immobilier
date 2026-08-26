/**
 * Récupère, pour chacune des communes suivies, les commerces (supermarché /
 * épicerie / boulangerie) et arrêts de bus/gares réels depuis OpenStreetMap
 * (Overpass API), et les écoles/collèges/lycées réels depuis l'annuaire
 * officiel de l'Éducation nationale (data.education.gouv.fr). Aucune donnée
 * inventée : un résultat vide reste vide dans le fichier généré.
 *
 * Usage : npx tsx scripts/fetch-village-amenities.ts
 */
import { writeFileSync } from "node:fs";
import { villages } from "../src/data/villages";
import { villageAmenities } from "../src/data/village-amenities";
import type { Commerce, Ecole, VillageAmenities } from "../src/data/village-amenities";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const EDUCATION_URL =
  "https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-annuaire-education&rows=50";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SHOP_TYPE: Record<string, Commerce["type"]> = {
  supermarket: "Supermarché",
  convenience: "Épicerie",
  bakery: "Boulangerie",
};

type OverpassElement = {
  type: string;
  tags?: Record<string, string>;
};

async function fetchOverpass(insee: string, retries = 6): Promise<OverpassElement[]> {
  const query = `[out:json][timeout:30];area["ref:INSEE"="${insee}"]->.a;(nwr["shop"~"^(supermarket|convenience|bakery)$"](area.a);nwr["railway"~"^(station|halt)$"](area.a);nwr["highway"="bus_stop"](area.a););out tags;`;
  let lastError = "";
  for (let attempt = 0; attempt < retries; attempt++) {
    const url = OVERPASS_URLS[attempt % OVERPASS_URLS.length];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
          "User-Agent": "pevele-immobilier-village-amenities-script",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await res.text();
      if (!res.ok) {
        lastError = `HTTP ${res.status} (${url})`;
        await sleep(4000 * (attempt + 1));
        continue;
      }
      const data = JSON.parse(text);
      return data.elements as OverpassElement[];
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      await sleep(4000 * (attempt + 1));
    }
  }
  throw new Error(`Overpass : trop de tentatives pour ${insee} (${lastError})`);
}

type EducationRecord = {
  fields: {
    nom_etablissement: string;
    type_etablissement: string;
    statut_public_prive: "Public" | "Privé";
    etat: string;
    ecole_maternelle?: number;
    ecole_elementaire?: number;
  };
};

async function fetchEcoles(insee: string): Promise<Ecole[]> {
  const res = await fetch(`${EDUCATION_URL}&refine.code_commune=${insee}`);
  if (!res.ok) throw new Error(`Éducation nationale HTTP ${res.status} pour ${insee}`);
  const data = await res.json();
  const records: EducationRecord[] = data.records ?? [];
  return records
    .filter((r) => r.fields.etat === "OUVERT")
    .map((r) => {
      const f = r.fields;
      let type: Ecole["type"];
      if (f.type_etablissement === "Ecole") {
        const mat = f.ecole_maternelle === 1;
        const elem = f.ecole_elementaire === 1;
        type = mat && elem ? "École primaire" : mat ? "École maternelle" : elem ? "École élémentaire" : "École";
      } else if (f.type_etablissement === "Collège") {
        type = "Collège";
      } else if (f.type_etablissement === "Lycée") {
        type = "Lycée";
      } else {
        type = "École";
      }
      return { nom: f.nom_etablissement, type, secteur: f.statut_public_prive };
    });
}

function writeOutput(output: Record<string, VillageAmenities>) {
  const fileContent = `// Généré par scripts/fetch-village-amenities.ts — commerces (OpenStreetMap),
// écoles (annuaire officiel de l'Éducation nationale, data.education.gouv.fr)
// et transports (OpenStreetMap) réels par commune. Aucune donnée inventée :
// une liste vide signifie qu'aucun résultat n'a été trouvé dans la source,
// pas qu'elle a été omise. Ne pas éditer à la main : relancer le script si
// de nouvelles communes sont ajoutées ou pour rafraîchir les données.

export type Commerce = {
  nom: string;
  type: "Supermarché" | "Épicerie" | "Boulangerie";
};

export type Ecole = {
  nom: string;
  type: "École maternelle" | "École élémentaire" | "École primaire" | "École" | "Collège" | "Lycée";
  secteur: "Public" | "Privé";
};

export type Transports = {
  /** Noms des gares SNCF réellement situées dans la commune. */
  gares: string[];
  /** Nombre d'arrêts de bus recensés sur OpenStreetMap dans la commune. */
  arretsBus: number;
};

export type VillageAmenities = {
  commerces: Commerce[];
  ecoles: Ecole[];
  transports: Transports;
};

export const villageAmenities: Record<string, VillageAmenities> = ${JSON.stringify(output, null, 2)};
`;

  writeFileSync("src/data/village-amenities.ts", fileContent, "utf-8");
}

async function main() {
  const output: Record<string, VillageAmenities> = { ...villageAmenities };
  const failed: string[] = [];

  for (const v of villages) {
    if (output[v.insee]) {
      console.log(`${v.nom} (${v.insee})... déjà récupéré, ignoré`);
      continue;
    }
    process.stdout.write(`${v.nom} (${v.insee})... `);

    try {
      const elements = await fetchOverpass(v.insee);
      const commerces: Commerce[] = [];
      const gares: string[] = [];
      let arretsBus = 0;
      for (const el of elements) {
        const tags = el.tags ?? {};
        if (tags.shop && SHOP_TYPE[tags.shop] && tags.name) {
          commerces.push({ nom: tags.name, type: SHOP_TYPE[tags.shop] });
        } else if ((tags.railway === "station" || tags.railway === "halt") && tags.name) {
          gares.push(tags.name);
        } else if (tags.highway === "bus_stop") {
          arretsBus++;
        }
      }

      const ecoles = await fetchEcoles(v.insee);

      output[v.insee] = {
        commerces,
        ecoles,
        transports: { gares: [...new Set(gares)], arretsBus },
      };
      console.log(
        `${commerces.length} commerce(s), ${ecoles.length} école(s), ${gares.length} gare(s), ${arretsBus} arrêt(s) de bus`
      );
      writeOutput(output);
    } catch (e) {
      console.log(`ÉCHEC, ignoré pour l'instant (${e instanceof Error ? e.message : e})`);
      failed.push(`${v.nom} (${v.insee})`);
    }

    await sleep(1500);
  }

  if (failed.length > 0) {
    console.log(`\nTerminé avec ${failed.length} échec(s), relancer le script pour réessayer : ${failed.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("\nTerminé — écrit dans src/data/village-amenities.ts");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
