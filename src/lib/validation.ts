/** Numéro français : 10 chiffres commençant par 0, ou +33 suivi de 9 chiffres. Espaces, points et tirets tolérés. */
export function isValidPhoneNumber(raw: string): boolean {
  const digits = raw.replace(/[\s.\-()]/g, "");
  return /^(0[1-9]\d{8}|\+33[1-9]\d{8})$/.test(digits);
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
