export type DuplicateCandidate = {
  id: string;
  ownerId: string;
  ownerLabel: string;
  transaction: string;
  typeBien: string;
  prix: number;
  surface: number;
  pieces: number;
  chambres: number;
  exterieur: string;
  villageSlug: string;
  commune: string;
  titre: string;
  createdAt: Date;
};

/**
 * Doublons probables : une même agence qui publie le même bien (mêmes
 * transaction, type, prix, surface, pièces, chambres, extérieur) dans
 * plusieurs communes différentes — un bien n'est que dans une commune. On ne
 * regroupe jamais deux annonces d'une même commune (deux appartements
 * identiques d'un même immeuble existent). Fonction pure : elle signale, ne
 * masque rien.
 */
export function findDuplicateGroups(listings: DuplicateCandidate[]): DuplicateCandidate[][] {
  const byKey = new Map<string, DuplicateCandidate[]>();
  for (const l of listings) {
    const key = [
      l.ownerId,
      l.transaction,
      l.typeBien,
      l.prix,
      l.surface,
      l.pieces,
      l.chambres,
      l.exterieur.trim().toLowerCase(),
    ].join("|");
    const group = byKey.get(key);
    if (group) group.push(l);
    else byKey.set(key, [l]);
  }
  return [...byKey.values()]
    .filter((g) => new Set(g.map((l) => l.villageSlug)).size >= 2)
    .map((g) => [...g].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
    .sort((a, b) => b[0].createdAt.getTime() - a[0].createdAt.getTime());
}
