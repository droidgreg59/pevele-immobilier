/**
 * Reconnaissance des plans (2D/3D) parmi les photos d'une annonce, pour les
 * présenter à part comme le fait leboncoin. Un plan est un dessin : fond
 * majoritairement blanc, très peu saturé, peu de teintes distinctes — une
 * photo, même d'une pièce blanche, en a des centaines.
 *
 * Seuils calés sur les 176 photos réelles du site (octobre 2026) : les 33
 * plans avaient ≥ 69 % de blanc, une saturation ≤ 0,05 et ≤ 77 teintes ; la
 * première vraie photo (un visuel marketing) : 48 % de blanc et 393 teintes.
 * Les seuils retenus laissent de la marge des deux côtés. Fonctions pures.
 */
export type ImageStats = {
  /** Part des pixels quasi blancs (0-1). */
  white: number;
  /** Saturation moyenne (0-1). */
  sat: number;
  /** Nombre de teintes distinctes après réduction à 16 niveaux par canal. */
  colors: number;
};

/** Statistiques d'une image RVB brute (3 octets par pixel, sans alpha). */
export function imageStats(rgb: Uint8Array): ImageStats {
  let white = 0;
  let sat = 0;
  let n = 0;
  const colors = new Set<number>();
  for (let i = 0; i + 2 < rgb.length; i += 3) {
    const r = rgb[i];
    const g = rgb[i + 1];
    const b = rgb[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 228) white++;
    sat += max === 0 ? 0 : (max - min) / max;
    colors.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
    n++;
  }
  if (n === 0) return { white: 0, sat: 0, colors: 0 };
  return { white: white / n, sat: sat / n, colors: colors.size };
}

export function isFloorPlan(s: ImageStats): boolean {
  return s.white >= 0.55 && s.sat <= 0.1 && s.colors <= 200;
}

/** Photos à afficher en galerie : sans les plans (ou toutes, s'il n'y a que des plans). */
export function galleryPhotos<T extends { isPlan?: boolean }>(photos: T[]): T[] {
  const real = photos.filter((p) => !p.isPlan);
  return real.length > 0 ? real : photos;
}

export function planPhotos<T extends { isPlan?: boolean }>(photos: T[]): T[] {
  const real = photos.filter((p) => !p.isPlan);
  return real.length > 0 ? photos.filter((p) => p.isPlan) : [];
}
