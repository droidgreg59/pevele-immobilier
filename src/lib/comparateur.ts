import "server-only";
import { villageAdjacency } from "@/data/village-adjacency";
import { getAllGuidesMetadata, type GuideSummary } from "./guides";
import { getDvfMarketStatsForVillage, type DvfMarketStats } from "./dvf";

/**
 * Comparateur de communes (Sprint 5, Lot 5B) — /comparer/[a]/[b]. Logique de
 * canonicalisation, de détection d'un guide concurrent, et d'indexabilité,
 * séparée de la page pour rester testable sans base quand c'est possible
 * (canonicalPairKey, isLaunchPair sont pures).
 */

/** Ordre canonique déterministe d'une paire — toujours alphabétique. Pure. */
export function canonicalPairOrder(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function pairKey(a: string, b: string): string {
  return canonicalPairOrder(a, b).join("|");
}

/**
 * Allowlist éditoriale des paires indexables au lancement (Sprint 5) — un
 * volume DVF élevé est une CONDITION de qualité, jamais une preuve à lui
 * seul qu'une paire constitue une vraie alternative résidentielle. Chaque
 * paire ici a été retenue à la main pour une raison géographique/résidentielle
 * concrète (voir la proposition Sprint 5, section C) avant d'être vérifiée
 * statistiquement — jamais l'inverse. Étendre cette liste reste un choix
 * éditorial délibéré, pas un calcul automatique sur le volume de ventes.
 */
export const LAUNCH_PAIRS: [string, string][] = [
  ["flines-lez-raches", "marchiennes"],
  ["genech", "nomain"],
  ["baisieux", "willems"],
  ["bersee", "mons-en-pevele"],
];

const launchPairKeys = new Set(LAUNCH_PAIRS.map(([a, b]) => pairKey(a, b)));

/** Une paire fait-elle partie de l'allowlist éditoriale de lancement ? Pure. */
export function isLaunchPair(a: string, b: string): boolean {
  return launchPairKeys.has(pairKey(a, b));
}

/** Deux communes sont-elles réellement limitrophes (village-adjacency.ts) ? Pure. */
export function isRealAdjacent(a: string, b: string): boolean {
  return (villageAdjacency[a] ?? []).includes(b);
}

/** Le guide éditorial dédié à cette paire, s'il existe (comparisonPair, ordre indifférent). */
export async function findGuideForPair(a: string, b: string): Promise<GuideSummary | null> {
  const target = pairKey(a, b);
  const all = await getAllGuidesMetadata();
  return (
    all.find(
      (g) =>
        g.metadata.type === "comparatif" &&
        g.metadata.comparisonPair &&
        pairKey(...g.metadata.comparisonPair) === target
    ) ?? null
  );
}

const MIN_RETAINED_SAMPLE = 5; // même seuil que dvf.ts (Sprint 2), réutilisé tel quel

/**
 * Une paire est indexable seulement si TOUTES ces conditions sont vraies :
 * dans l'allowlist de lancement, réellement limitrophe, échantillon DVF
 * suffisant des deux côtés, et aucun guide éditorial concurrent sur
 * exactement cette paire (dans ce cas : noindex + lien vers le guide,
 * voir /comparer/[a]/[b]/page.tsx).
 */
export async function isIndexablePair(a: string, b: string): Promise<boolean> {
  if (!isLaunchPair(a, b)) return false;
  if (!isRealAdjacent(a, b)) return false;

  const guide = await findGuideForPair(a, b);
  if (guide) return false;

  const [statsA, statsB] = await Promise.all([
    getDvfMarketStatsForVillage(a, "Maison"),
    getDvfMarketStatsForVillage(b, "Maison"),
  ]);
  return Boolean(statsA && statsB && statsA.retainedCount >= MIN_RETAINED_SAMPLE && statsB.retainedCount >= MIN_RETAINED_SAMPLE);
}

/**
 * Paires du comparateur à lier depuis une page village — seulement celles
 * réellement indexables (jamais une paire noindex, jamais les 946 combinaisons,
 * voir Sprint 5 point 21 : pas de maillage combinatoire massif). Une paire
 * couverte par un guide dédié n'apparaît pas ici : elle est déjà proposée via
 * getGuidesForVillage() (le guide, pas l'outil, est le contenu à lier).
 */
export async function getIndexableComparateursForVillage(
  villageSlug: string
): Promise<{ a: string; b: string; otherSlug: string }[]> {
  const relevant = LAUNCH_PAIRS.filter(([a, b]) => a === villageSlug || b === villageSlug);
  const results = await Promise.all(
    relevant.map(async ([a, b]) => {
      const indexable = await isIndexablePair(a, b);
      if (!indexable) return null;
      const otherSlug = a === villageSlug ? b : a;
      return { a, b, otherSlug };
    })
  );
  return results.filter((r): r is { a: string; b: string; otherSlug: string } => r !== null);
}

export type ComparateurSide = {
  slug: string;
  nom: string;
  stats: DvfMarketStats | null;
  /** Évolution de la médiane entre le premier et le dernier millésime DVF disponible, en %. `null` si moins de 2 millésimes. */
  evolutionPct: number | null;
  gares: string[];
  commercesCount: number;
  ecolesCount: number;
  arretsBus: number;
};

/**
 * Phrases de comparaison strictement factuelles — jamais de jugement
 * ("meilleure", "plus agréable"). Chaque phrase découle d'un nombre réel des
 * deux côtés, jamais du même texte générique répété sur toutes les paires
 * (voir Sprint 5, point 17). Pure — testée sans base.
 */
export function buildComparisonSummary(a: ComparateurSide, b: ComparateurSide): string[] {
  const lines: string[] = [];

  if (a.stats && b.stats) {
    const [lower, higher] = a.stats.medianPrixM2 <= b.stats.medianPrixM2 ? [a, b] : [b, a];
    const gapPct =
      Math.round(
        ((higher.stats!.medianPrixM2 - lower.stats!.medianPrixM2) / lower.stats!.medianPrixM2) * 1000
      ) / 10;
    if (gapPct < 3) {
      lines.push(
        `Les niveaux de prix sont proches : ${a.nom} affiche une médiane de ${a.stats.medianPrixM2.toLocaleString("fr-FR")} €/m² et ${b.nom} de ${b.stats.medianPrixM2.toLocaleString("fr-FR")} €/m² (écart de ${gapPct} %), sur ${a.stats.retainedCount} ventes retenues contre ${b.stats.retainedCount}.`
      );
    } else {
      lines.push(
        `${higher.nom} présente un prix médian supérieur de ${gapPct} % à ${lower.nom} (${higher.stats!.medianPrixM2.toLocaleString("fr-FR")} €/m² contre ${lower.stats!.medianPrixM2.toLocaleString("fr-FR")} €/m²), sur ${higher.stats!.retainedCount} ventes retenues contre ${lower.stats!.retainedCount}.`
      );
    }
  } else {
    lines.push("Données de prix insuffisantes pour au moins l'une des deux communes.");
  }

  const aHasGare = a.gares.length > 0;
  const bHasGare = b.gares.length > 0;
  if (aHasGare && !bHasGare) {
    lines.push(`${a.nom} dispose d'une gare recensée (${a.gares.join(", ")}), ${b.nom} n'en a aucune dans nos données.`);
  } else if (bHasGare && !aHasGare) {
    lines.push(`${b.nom} dispose d'une gare recensée (${b.gares.join(", ")}), ${a.nom} n'en a aucune dans nos données.`);
  } else if (aHasGare && bHasGare) {
    lines.push(`Les deux communes ont une gare recensée : ${a.gares.join(", ")} à ${a.nom}, ${b.gares.join(", ")} à ${b.nom}.`);
  } else {
    lines.push(`Aucune des deux communes n'a de gare recensée dans nos données.`);
  }

  const commerceDiff = a.commercesCount - b.commercesCount;
  if (commerceDiff !== 0) {
    const [more, fewer, diff] =
      commerceDiff > 0 ? [a, b, commerceDiff] : [b, a, -commerceDiff];
    lines.push(
      `${more.nom} recense ${diff} commerce${diff > 1 ? "s" : ""} de plus que ${fewer.nom} dans les données OpenStreetMap (${more.commercesCount} contre ${fewer.commercesCount}).`
    );
  }

  return lines;
}
