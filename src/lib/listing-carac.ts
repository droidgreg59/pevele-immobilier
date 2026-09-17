/**
 * Valeurs et libellés des caractéristiques détaillées d'une annonce.
 * Module de constantes pures (aucun import) : partagé par le formulaire
 * (`CaracFields`), l'affichage de la fiche (`CaracBlock`) et le parsing
 * serveur (`listing-fields.ts`).
 */

export const ETATS = ["neuf", "refait", "bon", "rafraichir", "renover"] as const;
export const EXPOSITIONS = [
  "nord",
  "sud",
  "est",
  "ouest",
  "nord-est",
  "nord-ouest",
  "sud-est",
  "sud-ouest",
  "traversant",
] as const;
export const CHAUFFAGE_TYPES = ["individuel", "collectif"] as const;
export const ASSAINISSEMENTS = ["tout-a-l-egout", "individuel"] as const;

export const ETAT_LABEL: Record<string, string> = {
  neuf: "Neuf",
  refait: "Refait à neuf",
  bon: "Bon état",
  rafraichir: "À rafraîchir",
  renover: "À rénover",
};

export const EXPOSITION_LABEL: Record<string, string> = {
  nord: "Nord",
  sud: "Sud",
  est: "Est",
  ouest: "Ouest",
  "nord-est": "Nord-Est",
  "nord-ouest": "Nord-Ouest",
  "sud-est": "Sud-Est",
  "sud-ouest": "Sud-Ouest",
  traversant: "Traversant",
};

export const CHAUFFAGE_TYPE_LABEL: Record<string, string> = {
  individuel: "Individuel",
  collectif: "Collectif",
};

export const ASSAINISSEMENT_LABEL: Record<string, string> = {
  "tout-a-l-egout": "Tout-à-l'égout",
  individuel: "Individuel (fosse / micro-station)",
};

/** Étage : 0 = rez-de-chaussée. */
export function etageLabel(n: number): string {
  if (n === 0) return "Rez-de-chaussée";
  return `${n}ᵉ étage`;
}
