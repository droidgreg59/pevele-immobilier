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
