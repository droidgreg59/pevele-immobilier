// Généré par scripts/generate-bilan-2025.ts le 2026-09-22.
// Snapshot éditorial FIGÉ — ne JAMAIS régénérer automatiquement (import DVF,
// build, cron...). Une régénération est un choix délibéré (ex. correction
// avérée d'une erreur dans la source), documentée dans l'historique git.
// Méthodologie : identique à src/lib/dvf.ts (exclusion 1er/99e centile du
// prix/m², Pévèle entière, par typologie — voir /methodologie). Ce fichier
// répond à « avec quelles données et quelle méthode ce Bilan a-t-il été
// produit ? » via dataComputedAt / sourceDatasetDate / methodologyVersion /
// generatorCommit ci-dessous.

export const bilan2025 = {
  "dataPeriod": "2025",
  "dataComputedAt": "2026-09-22",
  "source": "DVF",
  "sourceDatasetDate": "2026-09-21",
  "methodologyVersion": "sprint2-outlier-v1",
  "generatorCommit": "b558164",
  "maison": {
    "totalCount": 1203,
    "retainedCount": 1177,
    "medianPrixM2": 2661,
    "medianPrixTotal": 270000,
    "medianSurfaceBati": 100,
    "medianSurfaceTerrain": 403,
    "terrainSampleCount": 1153
  },
  "appartement": {
    "totalCount": 91,
    "retainedCount": 90,
    "medianPrixM2": 2968,
    "medianPrixTotal": 170575
  },
  "comparaisonAnnuelle": {
    "2023": {
      "medianPrixM2": 2659,
      "medianPrixTotal": 262575,
      "retainedCount": 1074
    },
    "2024": {
      "medianPrixM2": 2604,
      "medianPrixTotal": 265000,
      "retainedCount": 1089
    },
    "2025": {
      "medianPrixM2": 2661,
      "medianPrixTotal": 270000,
      "retainedCount": 1177
    }
  },
  "variationPctM2": {
    "y2024to2025": 2.2,
    "y2023to2025": 0.1
  },
  "budgetPaliers": [
    {
      "budget": 250000,
      "count": 526,
      "pct": 44.7,
      "medianSurface": 83
    },
    {
      "budget": 300000,
      "count": 691,
      "pct": 58.7,
      "medianSurface": 87
    },
    {
      "budget": 350000,
      "count": 844,
      "pct": 71.7,
      "medianSurface": 90
    },
    {
      "budget": 400000,
      "count": 949,
      "pct": 80.6,
      "medianSurface": 94
    },
    {
      "budget": 500000,
      "count": 1074,
      "pct": 91.2,
      "medianSurface": 98
    }
  ],
  "communes2025": [
    {
      "slug": "gruson",
      "medianPrixM2": 3859,
      "retainedCount": 22
    },
    {
      "slug": "peronne-en-melantois",
      "medianPrixM2": 3696,
      "retainedCount": 9
    },
    {
      "slug": "camphin-en-pevele",
      "medianPrixM2": 3487,
      "retainedCount": 10
    },
    {
      "slug": "chereng",
      "medianPrixM2": 3433,
      "retainedCount": 46
    },
    {
      "slug": "la-neuville",
      "medianPrixM2": 3430,
      "retainedCount": 6
    },
    {
      "slug": "merignies",
      "medianPrixM2": 3285,
      "retainedCount": 40
    },
    {
      "slug": "cobrieux",
      "medianPrixM2": 3274,
      "retainedCount": 5
    },
    {
      "slug": "anstaing",
      "medianPrixM2": 3248,
      "retainedCount": 18
    },
    {
      "slug": "sainghin-en-melantois",
      "medianPrixM2": 3238,
      "retainedCount": 29
    },
    {
      "slug": "bachy",
      "medianPrixM2": 3178,
      "retainedCount": 20
    },
    {
      "slug": "genech",
      "medianPrixM2": 3074,
      "retainedCount": 25
    },
    {
      "slug": "wannehain",
      "medianPrixM2": 3037,
      "retainedCount": 13
    },
    {
      "slug": "avelin",
      "medianPrixM2": 2936,
      "retainedCount": 21
    },
    {
      "slug": "baisieux",
      "medianPrixM2": 2932,
      "retainedCount": 66
    },
    {
      "slug": "nomain",
      "medianPrixM2": 2894,
      "retainedCount": 24
    },
    {
      "slug": "attiches",
      "medianPrixM2": 2867,
      "retainedCount": 27
    },
    {
      "slug": "ennevelin",
      "medianPrixM2": 2835,
      "retainedCount": 19
    },
    {
      "slug": "cappelle-en-pevele",
      "medianPrixM2": 2754,
      "retainedCount": 15
    },
    {
      "slug": "bouvines",
      "medianPrixM2": 2752,
      "retainedCount": 16
    },
    {
      "slug": "pont-a-marcq",
      "medianPrixM2": 2733,
      "retainedCount": 33
    },
    {
      "slug": "mouchin",
      "medianPrixM2": 2729,
      "retainedCount": 13
    },
    {
      "slug": "cysoing",
      "medianPrixM2": 2704,
      "retainedCount": 60
    },
    {
      "slug": "templeuve-en-pevele",
      "medianPrixM2": 2702,
      "retainedCount": 87
    },
    {
      "slug": "bourghelles",
      "medianPrixM2": 2695,
      "retainedCount": 17
    },
    {
      "slug": "faumont",
      "medianPrixM2": 2688,
      "retainedCount": 19
    },
    {
      "slug": "auchy-lez-orchies",
      "medianPrixM2": 2633,
      "retainedCount": 15
    },
    {
      "slug": "bersee",
      "medianPrixM2": 2627,
      "retainedCount": 25
    },
    {
      "slug": "landas",
      "medianPrixM2": 2564,
      "retainedCount": 14
    },
    {
      "slug": "willems",
      "medianPrixM2": 2561,
      "retainedCount": 25
    },
    {
      "slug": "coutiches",
      "medianPrixM2": 2532,
      "retainedCount": 33
    },
    {
      "slug": "louvil",
      "medianPrixM2": 2511,
      "retainedCount": 12
    },
    {
      "slug": "tourmignies",
      "medianPrixM2": 2467,
      "retainedCount": 8
    },
    {
      "slug": "bouvignies",
      "medianPrixM2": 2466,
      "retainedCount": 13
    },
    {
      "slug": "rosult",
      "medianPrixM2": 2381,
      "retainedCount": 16
    },
    {
      "slug": "sameon",
      "medianPrixM2": 2365,
      "retainedCount": 12
    },
    {
      "slug": "orchies",
      "medianPrixM2": 2343,
      "retainedCount": 80
    },
    {
      "slug": "moncheaux",
      "medianPrixM2": 2277,
      "retainedCount": 24
    },
    {
      "slug": "thumeries",
      "medianPrixM2": 2175,
      "retainedCount": 59
    },
    {
      "slug": "beuvry-la-foret",
      "medianPrixM2": 2150,
      "retainedCount": 29
    },
    {
      "slug": "mons-en-pevele",
      "medianPrixM2": 2065,
      "retainedCount": 21
    },
    {
      "slug": "aix-en-pevele",
      "medianPrixM2": 2024,
      "retainedCount": 15
    },
    {
      "slug": "flines-lez-raches",
      "medianPrixM2": 1959,
      "retainedCount": 51
    },
    {
      "slug": "marchiennes",
      "medianPrixM2": 1957,
      "retainedCount": 51
    },
    {
      "slug": "rumegies",
      "medianPrixM2": 1868,
      "retainedCount": 14
    }
  ],
  "communesMiseEnAvant": {
    "seuilMinimum": 15,
    "plusEleve": [
      {
        "slug": "gruson",
        "medianPrixM2": 3859,
        "retainedCount": 22
      },
      {
        "slug": "chereng",
        "medianPrixM2": 3433,
        "retainedCount": 46
      },
      {
        "slug": "merignies",
        "medianPrixM2": 3285,
        "retainedCount": 40
      }
    ],
    "plusBas": [
      {
        "slug": "marchiennes",
        "medianPrixM2": 1957,
        "retainedCount": 51
      },
      {
        "slug": "flines-lez-raches",
        "medianPrixM2": 1959,
        "retainedCount": 51
      },
      {
        "slug": "aix-en-pevele",
        "medianPrixM2": 2024,
        "retainedCount": 15
      }
    ]
  },
  "communesVariation": {
    "seuilMinimum": 30,
    "paires2023to2025": [
      {
        "slug": "thumeries",
        "pct2023to2025": 9.6,
        "n2023": 46,
        "n2025": 59
      },
      {
        "slug": "orchies",
        "pct2023to2025": 5.7,
        "n2023": 82,
        "n2025": 80
      },
      {
        "slug": "baisieux",
        "pct2023to2025": 2.6,
        "n2023": 47,
        "n2025": 66
      },
      {
        "slug": "pont-a-marcq",
        "pct2023to2025": -0.1,
        "n2023": 36,
        "n2025": 33
      },
      {
        "slug": "coutiches",
        "pct2023to2025": -1,
        "n2023": 36,
        "n2025": 33
      },
      {
        "slug": "templeuve-en-pevele",
        "pct2023to2025": -4.1,
        "n2023": 55,
        "n2025": 87
      },
      {
        "slug": "flines-lez-raches",
        "pct2023to2025": -4.4,
        "n2023": 56,
        "n2025": 51
      },
      {
        "slug": "cysoing",
        "pct2023to2025": -7.5,
        "n2023": 51,
        "n2025": 60
      },
      {
        "slug": "marchiennes",
        "pct2023to2025": -8.2,
        "n2023": 38,
        "n2025": 51
      },
      {
        "slug": "merignies",
        "pct2023to2025": -8.7,
        "n2023": 44,
        "n2025": 40
      }
    ]
  }
} as const;
