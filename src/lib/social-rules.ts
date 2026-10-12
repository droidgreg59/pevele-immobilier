/**
 * Règles pures de la file de publication réseaux (testées sans base ni Meta).
 */

/** Limites Instagram documentées : légende ≤ 2 200 caractères, ≤ 30 hashtags. */
export const IG_CAPTION_MAX = 2200;
export const IG_HASHTAGS_MAX = 30;
export const FB_CAPTION_MAX = 63206;

export function validateCaptions(captionFacebook: string, captionInstagram: string): string | null {
  if (!captionFacebook.trim()) return "Le texte Facebook est vide.";
  if (!captionInstagram.trim()) return "Le texte Instagram est vide.";
  if (captionFacebook.length > FB_CAPTION_MAX) return "Texte Facebook trop long.";
  if (captionInstagram.length > IG_CAPTION_MAX) return `Texte Instagram trop long (${captionInstagram.length}/${IG_CAPTION_MAX} caractères).`;
  const tags = captionInstagram.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (tags.length > IG_HASHTAGS_MAX) return `Trop de hashtags Instagram (${tags.length}/${IG_HASHTAGS_MAX}).`;
  return null;
}

/**
 * Convertit une date/heure saisie à Paris (« 2026-10-12T18:30 », valeur d'un
 * <input type="datetime-local">) en instant UTC, heure d'été comprise.
 */
export function parisLocalToUtc(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Décalage de Paris à cet instant (deux passes pour les changements d'heure).
  let guess = asUtc;
  for (let i = 0; i < 2; i++) guess = asUtc - parisOffsetMs(new Date(guess));
  return new Date(guess);
}

/** Inverse de parisLocalToUtc : valeur pour un <input type="datetime-local">. */
export function utcToParisLocal(date: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function parisOffsetMs(date: Date): number {
  const local = parisLocalToUtcNaive(utcToParisLocal(date));
  return local - Math.floor(date.getTime() / 60000) * 60000;
}

function parisLocalToUtcNaive(local: string): number {
  const [d, t] = local.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  return Date.UTC(y, mo - 1, da, h, mi);
}

type DueCandidate = { statut: string; scheduledAt: Date };

/** Une publication part si elle est validée (ou en cours de reprise) et que son heure est passée. */
export function isDue(post: DueCandidate, now: Date): boolean {
  return (post.statut === "VALIDEE" || post.statut === "EN_COURS") && post.scheduledAt.getTime() <= now.getTime();
}

type DoneState = {
  facebook: boolean;
  instagram: boolean;
  fbPublishedAt: Date | null;
  igPublishedAt: Date | null;
};

/** Vrai quand chaque réseau demandé a été publié. */
export function isFullyPublished(p: DoneState): boolean {
  return (!p.facebook || p.fbPublishedAt !== null) && (!p.instagram || p.igPublishedAt !== null);
}
