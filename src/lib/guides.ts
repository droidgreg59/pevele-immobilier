import "server-only";

/**
 * Guides éditoriaux (Sprint 4) — fichiers MDX versionnés dans content/guides/,
 * jamais un modèle Prisma (décision de l'audit initial : volume de publication
 * encore faible, pas de plomberie CMS à construire pour ça). Un guide expose
 * ses métadonnées via `export const metadata` (pas de frontmatter YAML,
 * @next/mdx ne le supporte pas nativement).
 */

export type GuideType = "guide" | "comparatif";

export type GuideMetadata = {
  title: string;
  description: string;
  /** État éditorial du texte — ISO, mis à jour à la main. Ne bouge jamais
   * automatiquement au gré des revalidations DVF (voir DataFreshnessNote). */
  publishedAt: string;
  updatedAt: string;
  author: string;
  /** Communes réellement couvertes/utilisées par le contenu. */
  scopeVillages: string[];
  /** Sous-ensemble de scopeVillages : communes où ce guide doit apparaître
   * dans le bloc « Guides utiles » de /villages/[slug] (maillage sélectif,
   * pas automatique sur toutes les communes citées). */
  relatedVillages: string[];
  type: GuideType;
  /**
   * Pour type "comparatif" uniquement : les deux communes dont ce guide est
   * LE contenu éditorial canonique (Sprint 5, src/lib/comparateur.ts). Champ
   * explicite plutôt que déduit de scopeVillages — un comparatif peut citer
   * d'autres communes en passant sans perdre son identité de comparaison
   * Cysoing/Templeuve, et scopeVillages ne devrait pas avoir à rester figé à
   * exactement 2 éléments pour que la relation guide↔paire reste détectée.
   */
  comparisonPair?: [string, string];
};

/** Identité éditoriale constante des guides — jamais une personne physique (voir AGENTS.md). */
export const GUIDE_AUTHOR = "Rédaction Pévèle-Immobilier.fr";

export const GUIDE_SLUGS = [
  "44-communes-comparees",
  "quel-budget-pour-acheter-en-pevele",
  "communes-pevele-avec-gare",
  "cysoing-ou-templeuve-en-pevele",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

function isGuideSlug(slug: string): slug is GuideSlug {
  return (GUIDE_SLUGS as readonly string[]).includes(slug);
}

type GuideModule = {
  default: (props: Record<string, unknown>) => React.JSX.Element;
  metadata: GuideMetadata;
};

/** Charge un guide par son slug — `null` si le slug ne correspond à aucun guide connu. */
export async function loadGuide(slug: string): Promise<GuideModule | null> {
  if (!isGuideSlug(slug)) return null;
  return import(`../../content/guides/${slug}.mdx`);
}

export type GuideSummary = { slug: GuideSlug; metadata: GuideMetadata };

/** Métadonnées de tous les guides, triées du plus récent au plus ancien (publishedAt). */
export async function getAllGuidesMetadata(): Promise<GuideSummary[]> {
  const all = await Promise.all(
    GUIDE_SLUGS.map(async (slug) => {
      const mod = await loadGuide(slug);
      return { slug, metadata: mod!.metadata };
    })
  );
  return all.sort((a, b) => (a.metadata.publishedAt < b.metadata.publishedAt ? 1 : -1));
}

/**
 * Guides à afficher dans le bloc « Guides utiles » d'une page village —
 * filtre sur `relatedVillages` (jamais `scopeVillages`, qui décrit la portée
 * du contenu, pas où le lier), les plus spécifiques (le moins de communes
 * liées) en premier, plafonné à `limit`.
 */
export async function getGuidesForVillage(villageSlug: string, limit = 3): Promise<GuideSummary[]> {
  const all = await getAllGuidesMetadata();
  return all
    .filter((g) => g.metadata.relatedVillages.includes(villageSlug))
    .sort((a, b) => a.metadata.relatedVillages.length - b.metadata.relatedVillages.length)
    .slice(0, limit);
}
