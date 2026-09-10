import type { TransactionType } from "@prisma/client";

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
