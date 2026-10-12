/**
 * Pages d'atterrissage /immobilier/<commune>/<intention> : seules celles qui
 * ont au moins une annonce en ligne sont indexables (les autres sont en
 * noindex). Cette liste sert au sitemap ET aux liens internes, pour ne jamais
 * pointer — ni demander à Google d'explorer — une page vide.
 */
export const INTENT_SLUG: Record<string, Record<string, string>> = {
  MAISON: { VENTE: "maisons-a-vendre", LOCATION: "maisons-a-louer" },
  APPARTEMENT: { VENTE: "appartements-a-vendre", LOCATION: "appartements-a-louer" },
  TERRAIN: { VENTE: "terrains-a-vendre", LOCATION: "terrains-a-louer" },
};

export function intentKeysFromListings(
  listings: { villageSlug: string; typeBien: string; transaction: string }[]
): Set<string> {
  const keys = new Set<string>();
  for (const l of listings) {
    const intent = INTENT_SLUG[l.typeBien]?.[l.transaction];
    if (intent) keys.add(`${l.villageSlug}/${intent}`);
  }
  return keys;
}
