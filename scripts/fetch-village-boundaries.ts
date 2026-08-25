/**
 * Récupère les vraies délimitations administratives (contours GeoJSON) des
 * 28 communes de la Pévèle depuis l'API officielle geo.api.gouv.fr, les
 * simplifie (Douglas-Peucker) et les projette dans le même repère 440x600
 * que villages.ts, pour un rendu carte avec de vraies frontières de commune.
 *
 * Usage : npx tsx scripts/fetch-village-boundaries.ts
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

// Distance perpendiculaire d'un point à un segment [a,b].
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

// Ne garde que le plus grand anneau (utile pour les rares MultiPolygon avec
// enclaves ou îlots cadastraux minuscules) — un seul contour extérieur par
// commune suffit pour une carte stylisée.
function largestRing(geom: CommuneGeo["contour"]): LonLat[] {
  const rings: LonLat[][] =
    geom.type === "Polygon"
      ? (geom.coordinates as LonLat[][])
      : (geom.coordinates as LonLat[][][]).map((poly) => poly[0]);
  return rings.reduce((a, b) => (b.length > a.length ? b : a));
}

async function main() {
  console.log(`Téléchargement des contours pour ${villages.length} communes...`);
  const geos: CommuneGeo[] = [];
  for (const v of villages) {
    const geo = await fetchCommune(v.insee);
    geos.push(geo);
    console.log(`  ${geo.nom} (${geo.code}) : contour brut ${largestRing(geo.contour).length} points`);
  }

  const simplified = geos.map((g) => ({
    insee: g.code,
    ring: douglasPeucker(largestRing(g.contour), 0.00012),
  }));

  // Bounding box réelle sur TOUS les sommets de TOUS les contours.
  const allPoints = simplified.flatMap((s) => s.ring);
  const lons = allPoints.map((p) => p[0]);
  const lats = allPoints.map((p) => p[1]);
  const lonMin = Math.min(...lons);
  const lonMax = Math.max(...lons);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);

  const CANVAS_W = 440;
  const CANVAS_H = 600;
  const MARGIN = 20;
  const kmPerDegLon = 111.32 * Math.cos((50.53 * Math.PI) / 180);
  const kmPerDegLat = 111.32;
  const realW = (lonMax - lonMin) * kmPerDegLon;
  const realH = (latMax - latMin) * kmPerDegLat;
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

  const output: Record<string, { path: string; cx: number; cy: number; points: number }> = {};
  for (const s of simplified) {
    const projected = s.ring.map(project);
    const path =
      `M ${projected[0][0]} ${projected[0][1]} ` +
      projected
        .slice(1)
        .map(([x, y]) => `L ${x} ${y}`)
        .join(" ") +
      " Z";
    // Centroïde du polygone (moyenne simple des sommets — suffisant pour un
    // point d'ancrage de label, pas besoin du vrai centroïde pondéré par aire).
    const cx = projected.reduce((sum, p) => sum + p[0], 0) / projected.length;
    const cy = projected.reduce((sum, p) => sum + p[1], 0) / projected.length;
    output[s.insee] = {
      path,
      cx: Math.round(cx * 10) / 10,
      cy: Math.round(cy * 10) / 10,
      points: projected.length,
    };
  }

  console.log(`\nviewBox: 0 0 ${CANVAS_W} ${CANVAS_H}`);
  for (const [insee, o] of Object.entries(output)) {
    console.log(`  ${insee}: ${o.points} points simplifiés`);
  }

  const fileContent = `// Généré par scripts/fetch-village-boundaries.ts — délimitations réelles des
// communes (geo.api.gouv.fr), simplifiées et projetées dans le repère
// 440x600 partagé avec villages.ts. Ne pas éditer à la main : relancer le
// script si de nouvelles communes sont ajoutées.

export type VillageBoundary = {
  /** Tracé SVG (attribut "d") du contour de la commune. */
  path: string;
  /** Centroïde approximatif du contour, pour ancrer le label. */
  cx: number;
  cy: number;
};

export const villageBoundaries: Record<string, VillageBoundary> = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(output).map(([insee, o]) => [insee, { path: o.path, cx: o.cx, cy: o.cy }])
    ),
    null,
    2
  )};
`;

  writeFileSync("src/data/village-boundaries.ts", fileContent, "utf-8");
  console.log("\nÉcrit dans src/data/village-boundaries.ts");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
