import type { TransactionType } from "@prisma/client";

/** Comptes créés avant le 2026-09-17 n'ont pas de prénom en base (champ ajouté après coup). */
export function fullName(prenom: string | null | undefined, nom: string): string {
  return prenom ? `${prenom} ${nom}` : nom;
}

export function formatPrix(prix: number, transaction: TransactionType): string {
  const euros = prix.toLocaleString("fr-FR") + " €";
  return transaction === "LOCATION" ? euros + "/mois" : euros;
}

export function formatPrixM2(prix: number, surface: number): string {
  return Math.round(prix / surface).toLocaleString("fr-FR") + " € / M²";
}

/**
 * Formate une date/heure de préférence (visite, RDV d'estimation...).
 * Les enregistrements créés avant l'ajout du sélecteur d'heure — ou où le
 * visiteur n'a renseigné qu'une date — sont stockés à minuit UTC pile ; on
 * les affiche donc en date seule plutôt que « à 00h00 », qui laisserait
 * croire à une heure choisie qui n'existe pas.
 */
export function formatPreferredDateTime(date: Date | null): string | null {
  if (!date) return null;
  const datePart = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0;
  if (!hasTime) return datePart;
  const timePart = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} à ${timePart}`;
}

/** Couleur officielle de l'étiquette DPE pour une classe A–G. */
const DPE_CLASS_COLOR: Record<string, string> = {
  A: "#0f8a4a",
  B: "#4fb04a",
  C: "#a6c63d",
  D: "#f2e30f",
  E: "#f0a400",
  F: "#eb6909",
  G: "#e30613",
};
export function dpeClassColor(letter: string): string {
  return DPE_CLASS_COLOR[letter] ?? "#e9e9ec";
}
