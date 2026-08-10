export type Pack = {
  slug: string;
  nom: string;
  description: string;
  inclus: string[];
};

export const packs: Pack[] = [
  {
    slug: "annonce",
    nom: "Pack Annonce",
    description:
      "Le propriétaire réalise lui-même sa vente et utilise Pévèle-Immobilier.fr pour diffuser son annonce.",
    inclus: ["Diffusion de l'annonce", "Mise en ligne immédiate", "Aucune commission"],
  },
  {
    slug: "annonce-plus",
    nom: "Pack Annonce +",
    description:
      "Accompagnement pour réaliser une annonce professionnelle : photos, rédaction, optimisation, mise en valeur du bien.",
    inclus: ["Photos professionnelles", "Rédaction optimisée", "Mise en valeur du bien"],
  },
  {
    slug: "visites",
    nom: "Pack Visites",
    description:
      "Le propriétaire conserve la maîtrise de sa vente mais délègue les visites à un professionnel.",
    inclus: ["Organisation des visites", "Visites réalisées par un professionnel", "Qualification des visiteurs"],
  },
  {
    slug: "premium",
    nom: "Pack Premium",
    description:
      "Accompagnement beaucoup plus complet : photos, plans, visites, qualification des acquéreurs, accompagnement administratif.",
    inclus: [
      "Photos, plans 2D/3D",
      "Visites et qualification des acquéreurs",
      "Accompagnement administratif jusqu'à la vente",
    ],
  },
];
