/**
 * Constructeur du bloc de synthèse "MarketSummary" affiché sur /prix,
 * /prix/[commune] et /villages/[commune] — un paragraphe autoporteur
 * (intention → chiffre → période → échantillon → source) pensé pour être
 * repris tel quel par un moteur génératif, sans logique statistique ici :
 * toute la donnée est déjà calculée en amont par src/lib/dvf.ts.
 */

const STREET_CONNECTORS = new Set(["de", "la", "le", "du", "des", "et", "à", "l'", "en", "aux", "d'"]);

/**
 * "316 RUE SALVADOR ALLENDE" -> "Rue Salvador Allende". Retire le numéro de
 * voie (donnée de localisation précise, pas utile à l'affichage public) et
 * remet la voie en casse normale. DVF ne fournit pas les accents d'origine :
 * on ne les invente pas ("CROISEE" reste "Croisee").
 */
export function formatDvfStreet(adresse: string | null): string | null {
  if (!adresse) return null;
  const withoutNumber = adresse.replace(/^\d+\s*(?:bis|ter|quater)?\s*/i, "").trim();
  if (!withoutNumber) return null;

  return withoutNumber
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && STREET_CONNECTORS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export type MarketSummaryInput = {
  /** "à Cysoing", "en Pévèle" ... — sujet de la première phrase. */
  lieu: string;
  typeLocal: "Maison" | "Appartement";
  medianPrixM2: number;
  avgPrixM2: number;
  retainedCount: number;
  count: number;
  minAnnee: number;
  maxAnnee: number;
};

/**
 * Paragraphe de synthèse : intention, chiffre clé, période couverte, taille
 * d'échantillon, source. Une seule typologie par appel — jamais de moyenne
 * toutes-catégories mélangées (voir /methodologie).
 */
export function buildMarketSummaryText(input: MarketSummaryInput): string {
  const {
    lieu,
    typeLocal,
    medianPrixM2,
    avgPrixM2,
    retainedCount,
    count,
    minAnnee,
    maxAnnee,
  } = input;

  const typeLabel = typeLocal === "Maison" ? "une maison" : "un appartement";
  const typeLabelPluriel = typeLocal === "Maison" ? "maisons" : "appartements";
  const periode = minAnnee === maxAnnee ? `en ${minAnnee}` : `entre ${minAnnee} et ${maxAnnee}`;
  const echantillon =
    count === retainedCount
      ? `${retainedCount} vente${retainedCount > 1 ? "s" : ""}`
      : `${retainedCount} vente${retainedCount > 1 ? "s" : ""} retenue${retainedCount > 1 ? "s" : ""} sur ${count} recensée${count > 1 ? "s" : ""}`;

  return (
    `${lieu[0].toUpperCase()}${lieu.slice(1)}, le prix médian d'${typeLabel} se situe à ` +
    `${medianPrixM2.toLocaleString("fr-FR")} €/m² (moyenne : ${avgPrixM2.toLocaleString("fr-FR")} €/m²), ` +
    `d'après les ${typeLabelPluriel} vendues ${periode}. ` +
    `Ce chiffre s'appuie sur ${echantillon}, issues des données DVF (Demandes de Valeurs Foncières, ` +
    `ventes immobilières enregistrées par l'administration fiscale). Méthode de calcul détaillée sur la page Méthodologie.`
  );
}
