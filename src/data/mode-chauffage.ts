/**
 * Modes de chauffage proposés au dépôt/à l'édition d'une annonce — catégories
 * usuelles de l'immobilier français. Champ texte libre côté données (voir
 * Listing.modeChauffage) : les flux agence (AC3/Immofacile, balise
 * MODE_CHAUFFAGE) peuvent renvoyer une valeur hors de cette liste, elle est
 * alors affichée telle quelle sans être forcée dans une de ces catégories.
 */
export const MODE_CHAUFFAGE_OPTIONS = [
  "Gaz",
  "Électrique",
  "Fioul",
  "Bois / Granulés",
  "Pompe à chaleur",
  "Autre",
] as const;
