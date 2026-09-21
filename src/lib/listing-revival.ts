import type { ListingStatus } from "@prisma/client";

/**
 * Champs à appliquer lors de l'upsert d'une annonce importée déjà existante :
 * si elle était RETIREE et réapparaît dans le flux, elle redevient PUBLIEE et
 * son retiredAt est effacé. Sinon, aucun champ de statut à toucher (l'upsert
 * ne modifie déjà pas le statut par défaut). Pure — testée sans base de
 * données dans listing-revival.test.ts, conformément à la discipline de test
 * du projet (voir AGENTS.md).
 */
export function listingRevivalFields(
  existingStatut: ListingStatus
): { statut: "PUBLIEE"; retiredAt: null } | Record<string, never> {
  return existingStatut === "RETIREE" ? { statut: "PUBLIEE", retiredAt: null } : {};
}
