// Généré par scripts/fetch-village-amenities.ts — commerces (OpenStreetMap),
// écoles (annuaire officiel de l'Éducation nationale, data.education.gouv.fr)
// et transports (OpenStreetMap) réels par commune. Aucune donnée inventée :
// une liste vide signifie qu'aucun résultat n'a été trouvé dans la source,
// pas qu'elle a été omise. Ne pas éditer à la main : relancer le script si
// de nouvelles communes sont ajoutées ou pour rafraîchir les données.

export type Commerce = {
  nom: string;
  type:
    | "Supermarché"
    | "Épicerie"
    | "Boulangerie"
    | "Boucherie"
    | "Primeur"
    | "Pharmacie"
    | "Marché";
};

export type Ecole = {
  nom: string;
  type: "École maternelle" | "École élémentaire" | "École primaire" | "École" | "Collège" | "Lycée";
  secteur: "Public" | "Privé";
};

export type Transports = {
  /** Noms des gares SNCF réellement situées dans la commune. */
  gares: string[];
  /** Nombre d'arrêts de bus recensés sur OpenStreetMap dans la commune. */
  arretsBus: number;
};

export type VillageAmenities = {
  commerces: Commerce[];
  ecoles: Ecole[];
  transports: Transports;
};

export const villageAmenities: Record<string, VillageAmenities> = {
  "59004": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire des Prés Verts",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 16
    }
  },
  "59013": {
    "commerces": [
      {
        "nom": "Pharmacie du Mélantois",
        "type": "Pharmacie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Andrée Chédid",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 8
    }
  },
  "59022": {
    "commerces": [
      {
        "nom": "Boulangerie Thomas",
        "type": "Boulangerie"
      },
      {
        "nom": "Pharmacie des Quatres Saisons",
        "type": "Pharmacie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole élémentaire Jules Ferry",
        "type": "École élémentaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole maternelle La Fontenelle",
        "type": "École maternelle",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 8
    }
  },
  "59029": {
    "commerces": [
      {
        "nom": "Verger de l'Obeau",
        "type": "Primeur"
      },
      {
        "nom": "Aux Délices d'Auchy",
        "type": "Boulangerie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire privée Sacré-Coeur",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire du Fleuri d'Alcy",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 8
    }
  },
  "59034": {
    "commerces": [
      {
        "nom": "La cueillette gourmande",
        "type": "Primeur"
      },
      {
        "nom": "Be Vrac",
        "type": "Épicerie"
      },
      {
        "nom": "Henri Boucher",
        "type": "Boucherie"
      },
      {
        "nom": "Boulangerie Louise",
        "type": "Boulangerie"
      },
      {
        "nom": "Total",
        "type": "Épicerie"
      },
      {
        "nom": "Otera",
        "type": "Primeur"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Alphonse Daudet",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Sacré-Coeur",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 7
    }
  },
  "59042": {
    "commerces": [
      {
        "nom": "Marché Couvert de Bachy",
        "type": "Marché"
      },
      {
        "nom": "Boulangerie de Bachy",
        "type": "Boulangerie"
      },
      {
        "nom": "Epicerie vrac de Nanie",
        "type": "Épicerie"
      }
    ],
    "ecoles": [
      {
        "nom": "Complexe scolaire Jacques Brel",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 8
    }
  },
  "59044": {
    "commerces": [
      {
        "nom": "Pharmacie d'Ogimont",
        "type": "Pharmacie"
      },
      {
        "nom": "Boulangerie Umamie",
        "type": "Boulangerie"
      },
      {
        "nom": "Henri Boucher",
        "type": "Boucherie"
      },
      {
        "nom": "Boucherie de la Gare",
        "type": "Boucherie"
      },
      {
        "nom": "Aldi",
        "type": "Supermarché"
      },
      {
        "nom": "Carrefour Market",
        "type": "Supermarché"
      },
      {
        "nom": "Pharmacie Nigault",
        "type": "Pharmacie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire privée Sacré-Coeur",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire Paul Emile Victor",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Saint Jean-Baptiste",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [
        "Baisieux"
      ],
      "arretsBus": 28
    }
  },
  "59071": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire publique des 2 Tilleuls",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Sainte Thérèse",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 17
    }
  },
  "59080": {
    "commerces": [
      {
        "nom": "Boulangerie Pâtisserie Mazingarbe",
        "type": "Boulangerie"
      },
      {
        "nom": "Pharmacie Martin",
        "type": "Pharmacie"
      },
      {
        "nom": "Ferme Dupont",
        "type": "Primeur"
      },
      {
        "nom": "Carrefour Contact",
        "type": "Supermarché"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole élémentaire les trois arbres",
        "type": "École élémentaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole maternelle de la souris verte",
        "type": "École maternelle",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 22
    }
  },
  "59096": {
    "commerces": [
      {
        "nom": "Pharmacie de Bourghelles",
        "type": "Pharmacie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire des Valettes",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 12
    }
  },
  "59106": {
    "commerces": [
      {
        "nom": "Epicerie",
        "type": "Épicerie"
      },
      {
        "nom": "Biocoop",
        "type": "Supermarché"
      },
      {
        "nom": "Sophie Lebreuilly",
        "type": "Boulangerie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Léonard de Vinci",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 2
    }
  },
  "59124": {
    "commerces": [
      {
        "nom": "Boulangerie Umamie",
        "type": "Boulangerie"
      },
      {
        "nom": "Super U",
        "type": "Supermarché"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire privée Sacré-Coeur",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Lycée Général et Technologique privé hors contrat LOSC Formation de CAMPHIN-EN-PEVELE",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire Pasteur",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 14
    }
  },
  "59129": {
    "commerces": [
      {
        "nom": "Pharmacie du Pévèle",
        "type": "Pharmacie"
      },
      {
        "nom": "Les Saveurs Fermières",
        "type": "Primeur"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Emilie Carles",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Collège Simone Veil",
        "type": "Collège",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 15
    }
  },
  "59146": {
    "commerces": [
      {
        "nom": "Boucherie Lecomte",
        "type": "Boucherie"
      },
      {
        "nom": "Carrefour City",
        "type": "Épicerie"
      },
      {
        "nom": "Hervé Delepierre",
        "type": "Boulangerie"
      },
      {
        "nom": "Boucherie Hervé Lecomte",
        "type": "Boucherie"
      },
      {
        "nom": "Pharmacie du Château",
        "type": "Pharmacie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Jules Ferry",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Sainte Marie",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 7
    }
  },
  "59150": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 3
    }
  },
  "59158": {
    "commerces": [
      {
        "nom": "Grande Pharmacie de Coutiches",
        "type": "Pharmacie"
      },
      {
        "nom": "Jardin des Bois",
        "type": "Primeur"
      },
      {
        "nom": "Marche fruits & légumes et poissonnerie",
        "type": "Marché"
      },
      {
        "nom": "Ferme de l4Houssoye",
        "type": "Primeur"
      },
      {
        "nom": "Boucherie Christophe",
        "type": "Boucherie"
      },
      {
        "nom": "Boulangerie Grande Saveur",
        "type": "Boulangerie"
      },
      {
        "nom": "Au Fruiti",
        "type": "Épicerie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Léon Lambert",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Saint Joseph",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 19
    }
  },
  "59168": {
    "commerces": [
      {
        "nom": "Pharmacie du Centre",
        "type": "Pharmacie"
      },
      {
        "nom": "Boulangerie Alvin",
        "type": "Boulangerie"
      },
      {
        "nom": "Marionvalle",
        "type": "Boucherie"
      },
      {
        "nom": "Ferme Lefebvre - Maraicher Cysoing",
        "type": "Primeur"
      },
      {
        "nom": "Les Songes",
        "type": "Boulangerie"
      },
      {
        "nom": "Ethique & Vrac",
        "type": "Épicerie"
      },
      {
        "nom": "Marché de Cysoing",
        "type": "Marché"
      },
      {
        "nom": "Pains & Gourmandises",
        "type": "Boulangerie"
      },
      {
        "nom": "Match",
        "type": "Supermarché"
      },
      {
        "nom": "Pharmacie Dantoing",
        "type": "Pharmacie"
      },
      {
        "nom": "Intermarché Super",
        "type": "Supermarché"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole maternelle Saint-Exupéry",
        "type": "École maternelle",
        "secteur": "Public"
      },
      {
        "nom": "Ecole élémentaire Yann Arthus-Bertrand",
        "type": "École élémentaire",
        "secteur": "Public"
      },
      {
        "nom": "Collège Paul Éluard",
        "type": "Collège",
        "secteur": "Public"
      },
      {
        "nom": "Collège Notre-Dame",
        "type": "Collège",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire privée Saint Joseph",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 20
    }
  },
  "59197": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire Daniel Devendeville",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 14
    }
  },
  "59258": {
    "commerces": [
      {
        "nom": "Boulangerie Au Moulin Monniez",
        "type": "Boulangerie"
      },
      {
        "nom": "Pharmacie du Verger",
        "type": "Pharmacie"
      },
      {
        "nom": "Van Wynsberghe Didier",
        "type": "Boulangerie"
      },
      {
        "nom": "Alimentation Générale",
        "type": "Épicerie"
      },
      {
        "nom": "Bonjour",
        "type": "Épicerie"
      }
    ],
    "ecoles": [
      {
        "nom": "Lycée polyvalent Charlotte Perriand",
        "type": "Lycée",
        "secteur": "Public"
      },
      {
        "nom": "Institut de Genech",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Lycée agricole privé de Genech",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire Le Petit Prince",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 32
    }
  },
  "59275": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire Pasteur",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Notre-Dame de La Visitation",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 6
    }
  },
  "59330": {
    "commerces": [
      {
        "nom": "Pharmacie Detavernier",
        "type": "Pharmacie"
      },
      {
        "nom": "Le Pain de nos Ancêtres",
        "type": "Boulangerie"
      },
      {
        "nom": "Menu",
        "type": "Boucherie"
      },
      {
        "nom": "Distributeur de Légumes",
        "type": "Primeur"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Jean Macé",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Sainte Bernadette - Saint Joseph",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [
        "Landas"
      ],
      "arretsBus": 11
    }
  },
  "59364": {
    "commerces": [
      {
        "nom": "Boucherie Ghysel",
        "type": "Boucherie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Henri Millez",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 6
    }
  },
  "59398": {
    "commerces": [
      {
        "nom": "Maison Lestoquoy",
        "type": "Boucherie"
      },
      {
        "nom": "Le relais de Mérignies",
        "type": "Boulangerie"
      },
      {
        "nom": "Boulangerie du Golf",
        "type": "Boulangerie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Jacques Brel",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 19
    }
  },
  "59408": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 16
    }
  },
  "59411": {
    "commerces": [
      {
        "nom": "Carrefour Contact",
        "type": "Supermarché"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 15
    }
  },
  "59419": {
    "commerces": [
      {
        "nom": "Pharmacie Van Welden",
        "type": "Pharmacie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Camille Desmoulins",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Sacré-Coeur",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 20
    }
  },
  "59427": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire la Clairière",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 6
    }
  },
  "59435": {
    "commerces": [
      {
        "nom": "Le Moulin Saint-Martin",
        "type": "Boulangerie"
      },
      {
        "nom": "Pharmacie Perche",
        "type": "Pharmacie"
      },
      {
        "nom": "Dernaucourt Guy",
        "type": "Boucherie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire privée Saint Martin",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire Léo Lagrange",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [
        "Nomain"
      ],
      "arretsBus": 16
    }
  },
  "59449": {
    "commerces": [
      {
        "nom": "Centre Commercial E. Leclerc",
        "type": "Supermarché"
      },
      {
        "nom": "Grande Pharmacie d'Orchies",
        "type": "Pharmacie"
      },
      {
        "nom": "Boulangerie Soleil du Midi",
        "type": "Boulangerie"
      },
      {
        "nom": "La Farinette",
        "type": "Boulangerie"
      },
      {
        "nom": "Sens du Goût",
        "type": "Boucherie"
      },
      {
        "nom": "Pharmacie de l'Hôtel de Ville",
        "type": "Pharmacie"
      },
      {
        "nom": "Boulangerie Louise",
        "type": "Boulangerie"
      },
      {
        "nom": "Pharmacie du Millenium",
        "type": "Pharmacie"
      },
      {
        "nom": "Un Autre Monde",
        "type": "Épicerie"
      },
      {
        "nom": "Naturéo",
        "type": "Supermarché"
      },
      {
        "nom": "Les Délices de Charlou",
        "type": "Boulangerie"
      },
      {
        "nom": "La Ferme des Tuileries",
        "type": "Primeur"
      },
      {
        "nom": "Addiction",
        "type": "Boulangerie"
      },
      {
        "nom": "Lidl",
        "type": "Supermarché"
      },
      {
        "nom": "Coeur de Pévèle",
        "type": "Boulangerie"
      },
      {
        "nom": "Mallard",
        "type": "Boucherie"
      },
      {
        "nom": "Au pré des Fermiers",
        "type": "Primeur"
      },
      {
        "nom": "E.Leclerc Express",
        "type": "Supermarché"
      },
      {
        "nom": "Auchan Supermarché",
        "type": "Supermarché"
      },
      {
        "nom": "Intermarché Super",
        "type": "Supermarché"
      },
      {
        "nom": "Henri Boucher",
        "type": "Boucherie"
      },
      {
        "nom": "Aldi",
        "type": "Supermarché"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole élémentaire Joliot-Curie",
        "type": "École élémentaire",
        "secteur": "Public"
      },
      {
        "nom": "Collège Notre-Dame de la Providence",
        "type": "Collège",
        "secteur": "Privé"
      },
      {
        "nom": "Section d'enseignement général et professionnel adapté du Collège du Pévèle",
        "type": "Collège",
        "secteur": "Public"
      },
      {
        "nom": "Ecole technologique privée hors contrat de production automobile du Pévèle (EPAP) d'ORCHIES",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Lycée Notre-Dame de la Providence",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire privée Notre-Dame de La Providence Saint Michel",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole élémentaire Jules Ferry",
        "type": "École élémentaire",
        "secteur": "Public"
      },
      {
        "nom": "Collège du Pévèle",
        "type": "Collège",
        "secteur": "Public"
      },
      {
        "nom": "Ecole maternelle Roger Salengro",
        "type": "École maternelle",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [
        "Orchies"
      ],
      "arretsBus": 27
    }
  },
  "59458": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire La Fontaine",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 2
    }
  },
  "59466": {
    "commerces": [
      {
        "nom": "La parenthèse Gourmande",
        "type": "Boulangerie"
      },
      {
        "nom": "Pharmacie de Pont à Marcq",
        "type": "Pharmacie"
      },
      {
        "nom": "Boulangerie Pâtisserie Catrisse",
        "type": "Boulangerie"
      },
      {
        "nom": "Intermarché Super",
        "type": "Supermarché"
      },
      {
        "nom": "Lidl",
        "type": "Supermarché"
      }
    ],
    "ecoles": [
      {
        "nom": "CRESDA (Centre Régional d'Education Spécialisée pour Déficients Auditifs)",
        "type": "École",
        "secteur": "Privé"
      },
      {
        "nom": "Groupe scolaire Philippe-Laurent Roland",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Collège Françoise Dolto",
        "type": "Collège",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 17
    }
  },
  "59523": {
    "commerces": [
      {
        "nom": "Pharmacie du Tilleul",
        "type": "Pharmacie"
      },
      {
        "nom": "Carrefour Express",
        "type": "Épicerie"
      },
      {
        "nom": "Boulangerie Dhaussy Patrice",
        "type": "Boulangerie"
      },
      {
        "nom": "Archas Frédéric",
        "type": "Boucherie"
      },
      {
        "nom": "Ghys",
        "type": "Boulangerie"
      },
      {
        "nom": "Le Jardin de Cocagne de la Haute Borne",
        "type": "Primeur"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Antoine De Saint-Exupéry",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Saint Joseph",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 15
    }
  },
  "59551": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 10
    }
  },
  "59586": {
    "commerces": [
      {
        "nom": "Boulangerie pâtisserie - Entremets Créations",
        "type": "Boulangerie"
      },
      {
        "nom": "Nonno Luigi",
        "type": "Épicerie"
      },
      {
        "nom": "Boulangerie Patisserie Oeschel",
        "type": "Boulangerie"
      },
      {
        "nom": "Pistache",
        "type": "Primeur"
      },
      {
        "nom": "Toucher terre",
        "type": "Épicerie"
      },
      {
        "nom": "Les Maraîchers de Bonnace",
        "type": "Épicerie"
      },
      {
        "nom": "Pharmacie du Maresquel",
        "type": "Pharmacie"
      },
      {
        "nom": "E.Leclerc",
        "type": "Supermarché"
      },
      {
        "nom": "Pharmacie de la Pierre aux Sorcières",
        "type": "Pharmacie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire publique Jules Verne",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Saint Martin",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Groupe scolaire Marie Navart",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [
        "Templeuve",
        "Ennevelin"
      ],
      "arretsBus": 29
    }
  },
  "59592": {
    "commerces": [
      {
        "nom": "Pharmacie des 5 Tailles",
        "type": "Pharmacie"
      },
      {
        "nom": "Carrefour Market",
        "type": "Supermarché"
      }
    ],
    "ecoles": [
      {
        "nom": "Collège Albert Camus",
        "type": "Collège",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire Jules Ferry",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole élémentaire Paul Bert",
        "type": "École élémentaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole maternelle Condorcet",
        "type": "École maternelle",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 19
    }
  },
  "59600": {
    "commerces": [],
    "ecoles": [
      {
        "nom": "Ecole primaire Jean de La Fontaine",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 3
    }
  },
  "59638": {
    "commerces": [
      {
        "nom": "Le comptoir de la Pévèle",
        "type": "Épicerie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire Pablo Picasso",
        "type": "École primaire",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 6
    }
  },
  "59660": {
    "commerces": [
      {
        "nom": "Ferme du Meunier",
        "type": "Primeur"
      },
      {
        "nom": "Le Coin du Vrac",
        "type": "Supermarché"
      },
      {
        "nom": "Soleil du Midi",
        "type": "Boulangerie"
      },
      {
        "nom": "Lidl",
        "type": "Supermarché"
      },
      {
        "nom": "Marché de Willems",
        "type": "Marché"
      },
      {
        "nom": "Pharmacie de la Victoire",
        "type": "Pharmacie"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole élémentaire Condorcet",
        "type": "École élémentaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Sainte Marie",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole maternelle Concorde",
        "type": "École maternelle",
        "secteur": "Public"
      }
    ],
    "transports": {
      "gares": [],
      "arretsBus": 8
    }
  }
};
