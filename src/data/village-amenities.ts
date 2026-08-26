// Généré par scripts/fetch-village-amenities.ts — commerces (OpenStreetMap),
// écoles (annuaire officiel de l'Éducation nationale, data.education.gouv.fr)
// et transports (OpenStreetMap) réels par commune. Aucune donnée inventée :
// une liste vide signifie qu'aucun résultat n'a été trouvé dans la source,
// pas qu'elle a été omise. Ne pas éditer à la main : relancer le script si
// de nouvelles communes sont ajoutées ou pour rafraîchir les données.

export type Commerce = {
  nom: string;
  type: "Supermarché" | "Épicerie" | "Boulangerie";
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
  "59034": {
    "commerces": [
      {
        "nom": "Be Vrac",
        "type": "Épicerie"
      },
      {
        "nom": "Boulangerie Louise",
        "type": "Boulangerie"
      },
      {
        "nom": "Total",
        "type": "Épicerie"
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
        "nom": "Boulangerie Umamie",
        "type": "Boulangerie"
      },
      {
        "nom": "Aldi",
        "type": "Supermarché"
      },
      {
        "nom": "Carrefour Market",
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
    "commerces": [],
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
        "nom": "Lycée Général et Technologique privé hors contrat LOSC Formation de CAMPHIN-EN-PEVELE",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire privée Sacré-Coeur",
        "type": "École primaire",
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
    "commerces": [],
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
        "nom": "Carrefour City",
        "type": "Épicerie"
      },
      {
        "nom": "Hervé Delepierre",
        "type": "Boulangerie"
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
        "nom": "Ecole primaire privée Saint Joseph",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire Léon Lambert",
        "type": "École primaire",
        "secteur": "Public"
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
        "nom": "Boulangerie Alvin",
        "type": "Boulangerie"
      },
      {
        "nom": "Ethique & Vrac",
        "type": "Épicerie"
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
        "nom": "Collège Notre-Dame",
        "type": "Collège",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire privée Saint Joseph",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Collège Paul Éluard",
        "type": "Collège",
        "secteur": "Public"
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
        "nom": "Ecole primaire Le Petit Prince",
        "type": "École primaire",
        "secteur": "Public"
      },
      {
        "nom": "Lycée agricole privé de Genech",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Institut de Genech",
        "type": "Lycée",
        "secteur": "Privé"
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
        "nom": "Ecole primaire privée Notre-Dame de La Visitation",
        "type": "École primaire",
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
      "arretsBus": 6
    }
  },
  "59330": {
    "commerces": [
      {
        "nom": "Le Pain de nos Ancêtres",
        "type": "Boulangerie"
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
    "commerces": [],
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
    "commerces": [],
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
  "59435": {
    "commerces": [
      {
        "nom": "Le Moulin Saint-Martin",
        "type": "Boulangerie"
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
        "nom": "Boulangerie Soleil du Midi",
        "type": "Boulangerie"
      },
      {
        "nom": "La Farinette",
        "type": "Boulangerie"
      },
      {
        "nom": "Boulangerie Louise",
        "type": "Boulangerie"
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
        "nom": "Lidl",
        "type": "Supermarché"
      },
      {
        "nom": "Coeur de Pévèle",
        "type": "Boulangerie"
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
        "nom": "Lycée Notre-Dame de la Providence",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole technologique privée hors contrat de production automobile du Pévèle (EPAP) d'ORCHIES",
        "type": "Lycée",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole maternelle Roger Salengro",
        "type": "École maternelle",
        "secteur": "Public"
      },
      {
        "nom": "Collège du Pévèle",
        "type": "Collège",
        "secteur": "Public"
      },
      {
        "nom": "Ecole élémentaire Jules Ferry",
        "type": "École élémentaire",
        "secteur": "Public"
      },
      {
        "nom": "Ecole primaire privée Notre-Dame de La Providence Saint Michel",
        "type": "École primaire",
        "secteur": "Privé"
      }
    ],
    "transports": {
      "gares": [
        "Orchies"
      ],
      "arretsBus": 27
    }
  },
  "59523": {
    "commerces": [
      {
        "nom": "Carrefour Express",
        "type": "Épicerie"
      },
      {
        "nom": "Boulangerie Dhaussy Patrice",
        "type": "Boulangerie"
      },
      {
        "nom": "Ghys",
        "type": "Boulangerie"
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
  "59586": {
    "commerces": [
      {
        "nom": "Boulangerie pâtisserie - Entremets Créations",
        "type": "Boulangerie"
      },
      {
        "nom": "Boulangerie Patisserie Oeschel",
        "type": "Boulangerie"
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
        "nom": "E.Leclerc",
        "type": "Supermarché"
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire privée Saint Martin",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole primaire publique Jules Verne",
        "type": "École primaire",
        "secteur": "Public"
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
      }
    ],
    "ecoles": [
      {
        "nom": "Ecole primaire privée Sainte Marie",
        "type": "École primaire",
        "secteur": "Privé"
      },
      {
        "nom": "Ecole élémentaire Condorcet",
        "type": "École élémentaire",
        "secteur": "Public"
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
