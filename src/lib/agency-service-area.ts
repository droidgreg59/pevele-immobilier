import type { AccountType } from "@prisma/client";

/**
 * Logique de sécurité et de validation de la gestion des zones d'intervention
 * (Sprint 5) — extraite en fonctions pures pour être testée sans base ni
 * session réelle (même discipline que listing-revival.ts). La Server Action
 * (agency-actions.ts) ne fait jamais confiance à un agencyId ou une liste de
 * communes fournis par le client : agencyId vient toujours de la session
 * serveur, et chaque slug est revalidé ici contre la liste réelle des 44
 * communes avant toute écriture.
 */

/** Seul un compte de type AGENCE peut gérer ses zones d'intervention. */
export function canManageServiceAreas(
  session: { type: AccountType } | null
): boolean {
  return session?.type === "AGENCE";
}

/** Ne garde que les slugs réellement connus (jamais une valeur devinée/forgée côté client). Dédoublonne. */
export function filterValidVillageSlugs(requested: string[], knownSlugs: string[]): string[] {
  const known = new Set(knownSlugs);
  return [...new Set(requested.filter((s) => known.has(s)))];
}
