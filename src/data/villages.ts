import { slugify } from "@/lib/slugify";

export type Village = {
  slug: string;
  labelCourt: string;
  nom: string;
  /** Code INSEE de la commune, utilisé pour rattacher les données DVF. */
  insee: string;
  /** Coordinates of the dot on the 420x560 SVG map viewBox. */
  mapX: number;
  mapY: number;
  /** Coordinates of the floating text label, in the same 420x560 space. */
  labelX: number;
  labelY: number;
  description: string;
};

const RAW: [string, string, string, number, number, number, number, string][] = [
  [
    "SAINGHIN-EN-MÉL.",
    "Sainghin-en-Mélantois",
    "59523",
    146,
    195,
    146,
    212,
    "Aux portes de la métropole, entre champs et golf — l’accès le plus direct vers Lille.",
  ],
  [
    "GRUSON",
    "Gruson",
    "59275",
    219,
    166,
    222,
    184,
    "L’un des plus petits villages de la Pévèle : calme absolu, chemins vers la vallée de la Marque.",
  ],
  [
    "CHÉRENG",
    "Chéreng",
    "59146",
    219,
    124,
    219,
    112,
    "Village-rue animé sur l’axe Lille–Tournai, commerces de proximité et écoles.",
  ],
  [
    "BAISIEUX",
    "Baisieux",
    "59044",
    310,
    124,
    310,
    112,
    "Frontière belge et gare TER : le village des frontaliers et des navetteurs.",
  ],
  [
    "WILLEMS",
    "Willems",
    "59660",
    283,
    53,
    283,
    41,
    "Entre Baisieux et la vallée de la Marque, un village familial en plein renouveau.",
  ],
  [
    "CAMPHIN-EN-PÉV.",
    "Camphin-en-Pévèle",
    "59124",
    310,
    181,
    310,
    199,
    "Pavé de la trouée d’Arenberg à deux pas, esprit village et grandes fermes en briques.",
  ],
  [
    "WANNEHAIN",
    "Wannehain",
    "59638",
    328,
    237,
    336,
    255,
    "Petit village frontalier, prisé pour ses longères et son calme.",
  ],
  [
    "BOURGHELLES",
    "Bourghelles",
    "59096",
    283,
    262,
    283,
    280,
    "Entre Cysoing et la frontière : longères, briques rouges et vie associative.",
  ],
  [
    "CYSOING",
    "Cysoing",
    "59168",
    237,
    237,
    230,
    227,
    "Le cœur de la Pévèle : collèges, commerces, marché — la centralité qui fait monter la demande.",
  ],
  [
    "LOUVIL",
    "Louvil",
    "59364",
    201,
    290,
    196,
    308,
    "Village discret entre Cysoing et Templeuve, très recherché des familles.",
  ],
  [
    "BACHY",
    "Bachy",
    "59042",
    310,
    308,
    310,
    326,
    "Village frontalier au caractère rural affirmé, entre pavés et pâtures.",
  ],
  [
    "MOUCHIN",
    "Mouchin",
    "59419",
    374,
    379,
    374,
    397,
    "Le village le plus à l’est : campagne franche, à cheval sur la frontière belge.",
  ],
  [
    "TEMPLEUVE-EN-PÉV.",
    "Templeuve-en-Pévèle",
    "59586",
    155,
    365,
    155,
    384,
    "Gare TER vers Lille, marché, moulin de Vertain : la commune la plus connectée.",
  ],
  [
    "GENECH",
    "Genech",
    "59258",
    246,
    351,
    246,
    341,
    "Connu pour son institut de formation horticole — un village vert, au sens propre.",
  ],
  [
    "NOMAIN",
    "Nomain",
    "59435",
    292,
    436,
    292,
    454,
    "Grand territoire rural aux hameaux dispersés : les amoureux d’espace s’y retrouvent.",
  ],
  [
    "ORCHIES",
    "Orchies",
    "59449",
    292,
    522,
    292,
    540,
    "La ville-porte du sud : gare, commerces, collèges et lycée — les services d’une petite ville.",
  ],
  [
    "BERSÉE",
    "Bersée",
    "59071",
    128,
    493,
    128,
    511,
    "Entre plaine et bois de la Croisette, un village agricole authentique.",
  ],
  [
    "MÉRIGNIES",
    "Mérignies",
    "59398",
    55,
    422,
    60,
    440,
    "Golf 27 trous et nouveaux quartiers résidentiels : l’adresse « signature » du sud-ouest.",
  ],
  [
    "CAPPELLE-EN-PÉV.",
    "Cappelle-en-Pévèle",
    "59129",
    146,
    422,
    146,
    412,
    "Vergers et maisons de plain-pied, entre Templeuve et Bersée.",
  ],
];

export const villages: Village[] = RAW.map(
  ([labelCourt, nom, insee, mapX, mapY, labelX, labelY, description]) => ({
    slug: slugify(nom),
    labelCourt,
    nom,
    insee,
    mapX,
    mapY,
    labelX,
    labelY,
    description,
  })
);

export function getVillageByInsee(insee: string): Village | undefined {
  return villages.find((v) => v.insee === insee);
}

export function getVillageBySlug(slug: string): Village | undefined {
  return villages.find((v) => v.slug === slug);
}
