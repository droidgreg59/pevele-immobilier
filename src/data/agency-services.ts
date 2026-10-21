/**
 * Services proposés aux comptes agence (onglet « Services » de l'espace
 * agence, invisible du public). Réalisés par Galt Lab, qui a conçu le site.
 * Prix fixes ; une demande déclenche un rendez-vous de cadrage.
 */
export type AgencyService = {
  id: "site-web" | "reseaux-sociaux";
  nom: string;
  accroche: string;
  pitch: string;
  prix: string;
  rythme: string;
  /** Pastille affichée à côté du prix (délai, engagement…). */
  badge: string | null;
  inclus: string[];
};

export const AGENCY_SERVICES: AgencyService[] = [
  {
    id: "site-web",
    nom: "Votre site web, par Galt Lab",
    accroche: "Un site moderne, trouvé sur Google et compris par les IA",
    pitch:
      "Modernisez votre vitrine : un site rapide, élégant et pensé pour être trouvé sur Google comme pour être compris et cité par les assistants IA (ChatGPT, Gemini, Perplexity…). Conçu par l'équipe qui a construit Pévèle-Immobilier.fr.",
    prix: "699 € TTC",
    rythme: "prix fixe",
    badge: "Livré 15 jours après le rendez-vous de cadrage",
    inclus: [
      "Design moderne à vos couleurs, parfait sur mobile",
      "Référencement local (SEO) : pages optimisées pour votre secteur",
      "Données structurées lisibles par les moteurs de recherche et les IA",
      "Vos annonces diffusées automatiquement sur votre site",
      "Prise de rendez-vous en ligne (visites, estimations)",
      "Formulaire d'estimation pour capter de nouveaux vendeurs",
      "Vos avis Google mis en avant",
      "Site rapide et sécurisé (HTTPS), statistiques de fréquentation",
    ],
  },
  {
    id: "reseaux-sociaux",
    nom: "Réseaux sociaux automatisés",
    accroche: "Des publications régulières à votre marque, sans y passer vos soirées",
    pitch:
      "Restez visible sur Facebook et Instagram toute l'année : vos annonces et l'actualité du marché local deviennent des publications soignées, à vos couleurs, publiées au bon rythme.",
    prix: "99 € TTC",
    rythme: "par mois",
    badge: "Sans engagement",
    inclus: [
      "Publications à votre marque : nouvelles annonces, biens à la une",
      "Statistiques du marché local (prix de vente constatés dans vos communes)",
      "Calendrier de publication régulier, défini avec vous",
      "Validation manuelle avant chaque publication, ou mode 100 % automatique",
      "Rapport mensuel : portée, interactions, publications les plus vues",
      "Publicité ciblée sur votre secteur en option (budget publicitaire en supplément)",
    ],
  },
];

export function getAgencyService(id: string): AgencyService | null {
  return AGENCY_SERVICES.find((s) => s.id === id) ?? null;
}
