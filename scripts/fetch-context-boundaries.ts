/**
 * Récupère les contours des communes VOISINES de nos communes suivies
 * (communes réellement adjacentes, hors périmètre interactif choisi par
 * l'utilisateur) pour combler visuellement les trous sur la carte, sans les
 * rendre cliquables ni leur donner de fiche/DVF. Réutilise EXACTEMENT la même
 * projection (bbox + échelle + offset) que scripts/fetch-village-boundaries.ts
 * pour que les deux calques s'alignent au pixel près dans le même viewBox
 * 440x600.
 *
 * Usage : npx tsx scripts/fetch-context-boundaries.ts
 */
import { writeFileSync } from "node:fs";
import { villages } from "../src/data/villages";

type LonLat = [number, number];

type CommuneGeo = {
  code: string;
  nom: string;
  centre: { coordinates: LonLat };
  contour: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
};

async function fetchCommune(insee: string): Promise<CommuneGeo> {
  const url = `https://geo.api.gouv.fr/communes/${insee}?fields=nom,code,centre,contour&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${insee}`);
  return res.json();
}

function perpDist(p: LonLat, a: LonLat, b: LonLat): number {
  const [x, y] = p;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(x - x1, y - y1);
  let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(x - projX, y - projY);
}

function douglasPeucker(points: LonLat[], epsilon: number): LonLat[] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIndex = i;
    }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function largestRing(geom: CommuneGeo["contour"]): LonLat[] {
  const rings: LonLat[][] =
    geom.type === "Polygon"
      ? (geom.coordinates as LonLat[][])
      : (geom.coordinates as LonLat[][][]).map((poly) => poly[0]);
  return rings.reduce((a, b) => (b.length > a.length ? b : a));
}

// Les communes réellement adjacentes à notre territoire suivi, trouvées
// par test de proximité de contour réel (pas juste une bbox élargie) —
// cf. session de debug des zones non cliquables. Anstaing, Bouvines et
// Péronne-en-Mélantois sont passées en communes suivies (villages.ts) et
// sont donc sorties de cette liste ; Forest-sur-Marque, nouvellement
// exposée au nord d'Anstaing, l'a rejointe.
const CONTEXT_COMMUNES: { insee: string; nom: string }[] = [
  { insee: "59009", nom: "Villeneuve-d'Ascq" },
  { insee: "59105", nom: "Bouvignies" },
  { insee: "59222", nom: "Faumont" },
  { insee: "59239", nom: "Flines-lez-Raches" },
  { insee: "59247", nom: "Forest-sur-Marque" },
  { insee: "59256", nom: "Fretin" },
  { insee: "59299", nom: "Hem" },
  { insee: "59335", nom: "Lecelles" },
  { insee: "59343", nom: "Lesquin" },
  { insee: "59346", nom: "Lezennes" },
  { insee: "59375", nom: "Marchiennes" },
  { insee: "59511", nom: "Rosult" },
  { insee: "59519", nom: "Rumegies" },
  { insee: "59522", nom: "Sailly-lez-Lannoy" },
  { insee: "59554", nom: "Sars-et-Rosières" },
  { insee: "59560", nom: "Seclin" },
  { insee: "59585", nom: "Templemars" },
  { insee: "59596", nom: "Tilloy-lez-Marchiennes" },
  { insee: "59602", nom: "Tressin" },
  { insee: "59609", nom: "Vendeville" },
];

async function main() {
  console.log(`Recalcul de la projection partagée à partir des ${villages.length} communes suivies...`);
  const trackedGeos: CommuneGeo[] = [];
  for (const v of villages) {
    trackedGeos.push(await fetchCommune(v.insee));
  }
  const trackedSimplified = trackedGeos.map((g) => douglasPeucker(largestRing(g.contour), 0.00012));
  const trackedPoints = trackedSimplified.flat();
  const lons = trackedPoints.map((p) => p[0]);
  const lats = trackedPoints.map((p) => p[1]);
  const lonMin = Math.min(...lons);
  const lonMax = Math.max(...lons);
  const latMax = Math.max(...lats);

  const CANVAS_W = 440;
  const CANVAS_H = 600;
  const MARGIN = 20;
  const kmPerDegLon = 111.32 * Math.cos((50.53 * Math.PI) / 180);
  const kmPerDegLat = 111.32;
  const realW = (lonMax - lonMin) * kmPerDegLon;
  const realH = (latMax - Math.min(...lats)) * kmPerDegLat;
  const drawW = CANVAS_W - 2 * MARGIN;
  const drawH = CANVAS_H - 2 * MARGIN;
  const scale = Math.min(drawW / realW, drawH / realH);
  const usedW = realW * scale;
  const usedH = realH * scale;
  const offsetX = MARGIN + (drawW - usedW) / 2;
  const offsetY = MARGIN + (drawH - usedH) / 2;

  function project([lon, lat]: LonLat): [number, number] {
    const x = offsetX + (lon - lonMin) * kmPerDegLon * scale;
    const y = offsetY + (latMax - lat) * kmPerDegLat * scale;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  }

  console.log(`Téléchargement des contours pour ${CONTEXT_COMMUNES.length} communes de contexte...`);
  const output: Record<string, { path: string; nom: string }> = {};
  for (const c of CONTEXT_COMMUNES) {
    const geo = await fetchCommune(c.insee);
    const ring = douglasPeucker(largestRing(geo.contour), 0.00012);
    const projected = ring.map(project);
    const path =
      `M ${projected[0][0]} ${projected[0][1]} ` +
      projected
        .slice(1)
        .map(([x, y]) => `L ${x} ${y}`)
        .join(" ") +
      " Z";
    output[c.insee] = { path, nom: c.nom };
    console.log(`  ${c.nom} (${c.insee}) : ${projected.length} points`);
  }

  const fileContent = `// Généré par scripts/fetch-context-boundaries.ts — communes réellement
// adjacentes à notre territoire suivi (communes de villages.ts), utilisées
// UNIQUEMENT pour combler visuellement la carte (pas de fiche, pas de DVF,
// pas d'interaction). Même projection 440x600 que village-boundaries.ts.
// Ne pas éditer à la main : relancer le script si le territoire suivi change.

export type ContextBoundary = {
  /** Tracé SVG (attribut "d") du contour de la commune. */
  path: string;
  nom: string;
};

export const contextBoundaries: Record<string, ContextBoundary> = ${JSON.stringify(output, null, 2)};
`;

  writeFileSync("src/data/context-boundaries.ts", fileContent, "utf-8");
  console.log("\nÉcrit dans src/data/context-boundaries.ts");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
