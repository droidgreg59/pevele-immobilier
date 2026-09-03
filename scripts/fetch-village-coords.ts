/**
 * Récupère le centre géographique (lat/lng WGS84) réel de chaque commune
 * suivie depuis geo.api.gouv.fr et écrit src/data/village-coords.ts. Sert au
 * balisage `geo` des annonces (JSON-LD RealEstateListing) et à tout futur
 * centrage de carte. Ne pas éditer à la main.
 *
 * Usage : npx tsx scripts/fetch-village-coords.ts
 */
import { writeFileSync } from "node:fs";
import { villages } from "../src/data/villages";

async function main() {
  const out: Record<string, { lat: number; lng: number }> = {};

  for (const v of villages) {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?code=${v.insee}&fields=centre&format=json`
    );
    if (!res.ok) throw new Error(`geo.api.gouv.fr HTTP ${res.status} pour ${v.insee}`);
    const data = (await res.json()) as { centre?: { coordinates: [number, number] } }[];
    const coords = data[0]?.centre?.coordinates;
    if (!coords) throw new Error(`Pas de centre pour ${v.nom} (${v.insee})`);
    const [lng, lat] = coords;
    out[v.insee] = { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
    console.log(`${v.nom} (${v.insee}) → ${out[v.insee].lat}, ${out[v.insee].lng}`);
  }

  const file = `// Généré par scripts/fetch-village-coords.ts — centre géographique réel
// (WGS84) de chaque commune, depuis geo.api.gouv.fr. Ne pas éditer à la main.

export const villageCoords: Record<string, { lat: number; lng: number }> = ${JSON.stringify(out, null, 2)};
`;
  writeFileSync("src/data/village-coords.ts", file, "utf-8");
  console.log("\nÉcrit dans src/data/village-coords.ts");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
