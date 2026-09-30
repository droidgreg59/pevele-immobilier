/**
 * Source unique pour les liens de navigation principaux du site — utilisée
 * par Header.tsx (desktop) et BottomNav.tsx (feuille "Menu" mobile). Les
 * deux composants rendaient auparavant leur propre copie de cette liste ;
 * un ajout dans l'un sans l'autre (ex. "Vue du ciel d'hier") rendait la page
 * introuvable sur mobile sans qu'aucun test ne le révèle. Toute nouvelle
 * entrée ajoutée ici apparaît automatiquement des deux côtés.
 */
export const MAIN_NAV = [
  { label: "Acheter", href: "/acheter" },
  { label: "Louer", href: "/louer" },
  { label: "Vendre", href: "/vendre" },
];

export const PEVELE_NAV = [
  { label: "La carte", href: "/carte" },
  { label: "Vue du ciel d'hier", href: "/vue-du-ciel" },
  { label: "Les villages", href: "/villages" },
  { label: "Les agences", href: "/professionnels" },
  { label: "Prix de l'immobilier", href: "/prix" },
  { label: "Artisans & habitat", href: "/artisans" },
  { label: "Courtiers", href: "/courtiers" },
];
