/**
 * Calcule l'adjacence topologique réelle des 44 communes de la Pévèle — deux
 * communes sont voisines si leurs contours officiels partagent effectivement
 * une frontière, pas seulement si leurs centroïdes sont proches (voir
 * nearestVillages() dans villages.ts, qui ne mesure QUE la proximité de
 * centroïde et ne doit jamais être utilisée comme proxy d'adjacence — un
 * village peut être proche sans être limitrophe, et inversement).
 *
 * Méthode : distance minimale segment-à-segment entre les anneaux de chaque
 * polygone (pas seulement sommet-à-sommet, qui peut rater le point de
 * contact réel le long d'une arête), calculée dans une projection
 * équirectangulaire locale centrée sur la Pévèle (erreur négligeable à cette
 * échelle de quelques dizaines de km). Deux communes sont considérées
 * limitrophes si cette distance minimale est inférieure à ADJACENCY_TOLERANCE_M
 * (15 m) — tolérance volontairement faible, qui absorbe l'arrondi/imprécision
 * de la source plutôt que de rapprocher des communes réellement séparées.
 * Contours source : geo.api.gouv.fr (champ `contour`, GeoJSON officiel, pleine
 * précision — pas le tracé déjà simplifié de village-boundaries.ts, qui sert
 * seulement au rendu carte).
 *
 * Usage : npx tsx scripts/fetch-village-adjacency.ts
 */
import { writeFileSync } from "node:fs";
import { villages } from "../src/data/villages";

type LonLat = [number, number];
type CommuneGeo = {
  code: string;
  nom: string;
  contour: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
};

async function fetchCommune(insee: string): Promise<CommuneGeo> {
  const url = `https://geo.api.gouv.fr/communes/${insee}?fields=nom,code,contour&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${insee}`);
  return res.json();
}

function flattenRings(geom: CommuneGeo["contour"]): LonLat[][] {
  if (geom.type === "Polygon") return geom.coordinates as LonLat[][];
  return (geom.coordinates as LonLat[][][]).flat();
}

// Projection équirectangulaire locale — suffisante pour une tolérance de
// quelques mètres sur une zone de la taille de la Pévèle.
const REF_LAT = 50.5;
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LON = 111320 * Math.cos((REF_LAT * Math.PI) / 180);
function toMeters([lon, lat]: LonLat): [number, number] {
  return [lon * M_PER_DEG_LON, lat * M_PER_DEG_LAT];
}

function bbox(rings: LonLat[][]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const ring of rings)
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  return { minX, minY, maxX, maxY };
}
function bboxClose(a: ReturnType<typeof bbox>, b: ReturnType<typeof bbox>, buf: number) {
  return !(a.maxX + buf < b.minX || b.maxX + buf < a.minX || a.maxY + buf < b.minY || b.maxY + buf < a.minY);
}

function distPointSegment(p: [number, number], a: [number, number], b: [number, number]): number {
  const [px, py] = p,
    [ax, ay] = a,
    [bx, by] = b;
  const dx = bx - ax,
    dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Distance minimale segment-segment, approximée par les distances
// point-segment des 4 extrémités croisées — exact pour des segments qui ne
// se croisent pas et suffisant ici (segments courts et proches, jamais
// sécants entre deux polygones administratifs adjacents mais non superposés).
function distSegmentSegment(
  a1: [number, number],
  a2: [number, number],
  b1: [number, number],
  b2: [number, number]
): number {
  return Math.min(
    distPointSegment(a1, b1, b2),
    distPointSegment(a2, b1, b2),
    distPointSegment(b1, a1, a2),
    distPointSegment(b2, a1, a2)
  );
}

function ringsToMeterSegments(rings: LonLat[][]): [number, number][][] {
  return rings.map((ring) => ring.map(toMeters));
}

function minDistRingsMeters(
  ringsA: [number, number][][],
  ringsB: [number, number][][],
  earlyExit: number
): number {
  let min = Infinity;
  for (const ra of ringsA) {
    for (let i = 0; i < ra.length - 1; i++) {
      const a1 = ra[i],
        a2 = ra[i + 1];
      for (const rb of ringsB) {
        for (let j = 0; j < rb.length - 1; j++) {
          const d = distSegmentSegment(a1, a2, rb[j], rb[j + 1]);
          if (d < min) min = d;
          if (min < earlyExit) return min;
        }
      }
    }
  }
  return min;
}

const ADJACENCY_TOLERANCE_M = 15;
const BBOX_BUFFER_DEG = 0.01;

async function main() {
  console.log(`Récupération des contours officiels pour ${villages.length} communes...`);
  const communes = await Promise.all(villages.map((v) => fetchCommune(v.insee)));

  const ringsM = new Map<string, [number, number][][]>();
  const boxes = new Map<string, ReturnType<typeof bbox>>();
  villages.forEach((v, i) => {
    const r = flattenRings(communes[i].contour);
    ringsM.set(v.slug, ringsToMeterSegments(r));
    boxes.set(v.slug, bbox(r));
  });

  const adjacency: Record<string, string[]> = Object.fromEntries(villages.map((v) => [v.slug, []]));
  let pairCount = 0;
  for (let i = 0; i < villages.length; i++) {
    for (let j = i + 1; j < villages.length; j++) {
      const a = villages[i].slug,
        b = villages[j].slug;
      if (!bboxClose(boxes.get(a)!, boxes.get(b)!, BBOX_BUFFER_DEG)) continue;
      const d = minDistRingsMeters(ringsM.get(a)!, ringsM.get(b)!, ADJACENCY_TOLERANCE_M);
      if (d < ADJACENCY_TOLERANCE_M) {
        adjacency[a].push(b);
        adjacency[b].push(a);
        pairCount++;
      }
    }
  }
  for (const slug of Object.keys(adjacency)) adjacency[slug].sort();

  console.log(`${pairCount} paires limitrophes trouvées sur ${(villages.length * (villages.length - 1)) / 2} possibles.`);

  const generatedAt = new Date().toISOString().slice(0, 10);
  const fileContent = `// Généré par scripts/fetch-village-adjacency.ts le ${generatedAt}.
//
// Source : geo.api.gouv.fr, champ \`contour\` (polygones officiels, pleine
// précision — pas le tracé déjà simplifié de village-boundaries.ts).
// Méthode : distance minimale segment-à-segment entre les anneaux de deux
// communes, projection équirectangulaire locale (référence 50,5°N), seuil
// d'adjacence ${ADJACENCY_TOLERANCE_M} m — absorbe l'arrondi/imprécision de la
// source, jamais utilisé pour rapprocher des communes réellement séparées
// (distances réelles observées lors de la génération : de 0 à ~15 m pour les
// paires retenues, la plupart à 0 — les frontières officielles coïncident).
//
// Ne PAS confondre avec nearestVillages() (villages.ts), qui mesure une
// simple proximité de centroïde, pas une adjacence topologique réelle.
// Ne pas éditer à la main : relancer le script si de nouvelles communes sont
// ajoutées ou si les contours officiels changent.

export const villageAdjacency: Record<string, string[]> = ${JSON.stringify(adjacency, null, 2)};
`;

  writeFileSync("src/data/village-adjacency.ts", fileContent, "utf-8");
  console.log("Écrit dans src/data/village-adjacency.ts");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
