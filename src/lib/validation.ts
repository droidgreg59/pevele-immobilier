/** Numéro français : 10 chiffres commençant par 0, ou +33 suivi de 9 chiffres. Espaces, points et tirets tolérés. */
export function isValidPhoneNumber(raw: string): boolean {
  const digits = raw.replace(/[\s.\-()]/g, "");
  return /^(0[1-9]\d{8}|\+33[1-9]\d{8})$/.test(digits);
}

/** SIRET : 14 chiffres avec clé de Luhn valide (espaces tolérés). */
export function isValidSiret(raw: string): boolean {
  const digits = raw.replace(/\s/g, "");
  if (!/^\d{14}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = Number(digits[i]);
    // Position paire en partant de la droite → doubler.
    if ((14 - i) % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

/** Ne garde que les chiffres d'un SIRET saisi. */
export function normalizeSiret(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * ORIAS (immatriculation IOBSP des courtiers bancaires) : contrôle de format
 * souple — 5 à 10 chiffres une fois les espaces retirés. Contrairement au
 * SIRET, l'ORIAS n'a pas de clé de contrôle publique connue ; la validité
 * réelle du numéro reste vérifiée à la main par l'admin (annuaire ORIAS),
 * comme le SIRET et la carte T le sont déjà pour les agences.
 */
export function isValidOrias(raw: string): boolean {
  const digits = raw.replace(/\s/g, "");
  return /^\d{5,10}$/.test(digits);
}

/** Ne garde que les chiffres d'un numéro ORIAS saisi. */
export function normalizeOrias(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Ajoute `https://` devant une URL saisie sans schéma (ex. "www.site.fr" ou
 * "site.fr") — les champs `type="text"` (voir normalizeUrl côté formulaires)
 * n'imposent plus la saisie du schéma, très souvent omis par les utilisateurs.
 * Ne touche pas aux valeurs vides ni à celles qui ont déjà un schéma.
 */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value || /^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/** Vrai si `value` est une URL http(s) absolue et syntaxiquement valide. */
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Date du jour au format YYYY-MM-DD (heure locale du serveur), pour comparaison directe avec un <input type="date">. */
export function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Vrai si dateStr (YYYY-MM-DD) est strictement postérieure à aujourd'hui. */
export function isDateAfterToday(dateStr: string): boolean {
  return dateStr > todayDateString();
}

/** Lendemain au format YYYY-MM-DD — plus petite date valable pour un rendez-vous, utilisé comme `min` des champs date. */
export function tomorrowDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
