/**
 * Recadrage automatique d'un logo : repère la zone utile (hors marges
 * transparentes ou blanches) pour la centrer dans un carré. Fonctions pures,
 * testées sans navigateur ; le dessin sur canvas est fait par LogoPicker.
 */
export type Box = { x: number; y: number; w: number; h: number };

/**
 * Boîte englobante du contenu d'une image RGBA. Si l'image a de la
 * transparence, seule l'opacité compte (un logo blanc sur fond transparent
 * est un vrai contenu) ; sinon le blanc quasi pur est traité comme marge.
 * Renvoie null si rien ne ressort (image vide ou entièrement blanche).
 */
export function findContentBox(rgba: Uint8ClampedArray, width: number, height: number): Box | null {
  let hasTransparency = false;
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] < 250) {
      hasTransparency = true;
      break;
    }
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const isContent = hasTransparency
        ? rgba[i + 3] > 16
        : !(rgba[i] > 240 && rgba[i + 1] > 240 && rgba[i + 2] > 240);
      if (!isContent) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Agrandit la boîte d'une marge proportionnelle (`ratio` de sa plus grande dimension), bornée à l'image. */
export function padBox(box: Box, ratio: number, width: number, height: number): Box {
  const pad = Math.round(Math.max(box.w, box.h) * ratio);
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  return {
    x,
    y,
    w: Math.min(width, box.x + box.w + pad) - x,
    h: Math.min(height, box.y + box.h + pad) - y,
  };
}
