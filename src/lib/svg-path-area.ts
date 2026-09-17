/**
 * Aire d'un polygone SVG (attribut "d" simple, uniquement des commandes
 * M/L comme celles générées par scripts/fetch-village-boundaries.ts —
 * pas de courbes) via la formule du lacet. Sert à décider, sur les cartes
 * interactives, quelles communes sont assez grandes pour afficher leur
 * étiquette en permanence sans que le texte déborde de la forme.
 */
export function polygonAreaFromPath(path: string): number {
  const nums = (path.match(/-?[\d.]+/g) ?? []).map(Number);
  const points: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push([nums[i], nums[i + 1]]);
  }
  if (points.length < 3) return 0;

  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}
