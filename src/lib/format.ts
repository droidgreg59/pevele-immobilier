import type { TransactionType } from "@prisma/client";

export function formatPrix(prix: number, transaction: TransactionType): string {
  const euros = prix.toLocaleString("fr-FR") + " €";
  return transaction === "LOCATION" ? euros + "/mois" : euros;
}

export function formatPrixM2(prix: number, surface: number): string {
  return Math.round(prix / surface).toLocaleString("fr-FR") + " € / M²";
}
