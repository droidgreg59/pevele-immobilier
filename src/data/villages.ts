import { slugify } from "@/lib/slugify";
import { villageBoundaries } from "./village-boundaries";

export type Village = {
  slug: string;
  labelCourt: string;
  nom: string;
  /** Code INSEE de la commune, utilisé pour rattacher les données DVF. */
  insee: string;
  description: string;
};

const RAW: [string, string, string, string][] = [
  [
    "SAINGHIN-EN-MÉL.",
    "Sainghin-en-Mélantois",
    "59523",
    "Aux portes de la métropole, entre champs et plateau du Mélantois — l’accès le plus direct vers Lille.",
  ],
  [
    "GRUSON",
    "Gruson",
    "59275",
    "L’un des plus petits villages de la Pévèle : calme absolu, chemins vers la vallée de la Marque.",
  ],
  [
    "CHÉRENG",
    "Chéreng",
    "59146",
    "Village-rue animé sur l’axe Lille–Tournai, commerces de proximité et écoles.",
  ],
  [
    "ANSTAING",
    "Anstaing",
    "59013",
    "Petit village du Mélantois sur la Marque, entre Chéreng, Tressin et Villeneuve-d’Ascq — la campagne à la lisière immédiate de la métropole.",
  ],
  [
    "BOUVINES",
    "Bouvines",
    "59106",
    "Théâtre de la célèbre bataille de 1214 remportée par Philippe Auguste ; l’église Saint-Pierre en retrace les épisodes sur 21 vitraux. Village de la vallée de la Marque, entre Gruson et Cysoing.",
  ],
  [
    "PÉRONNE-EN-MÉL.",
    "Péronne-en-Mélantois",
    "59458",
    "Village agricole du plateau du Mélantois, entre Sainghin-en-Mélantois et Fretin — grandes cultures et fermes en brique aux portes de Lille.",
  ],
  [
    "BAISIEUX",
    "Baisieux",
    "59044",
    "Frontière belge et gare TER : le village des frontaliers et des navetteurs.",
  ],
  [
    "WILLEMS",
    "Willems",
    "59660",
    "Entre Baisieux et la vallée de la Marque, un village familial en plein renouveau.",
  ],
  [
    "CAMPHIN-EN-PÉV.",
    "Camphin-en-Pévèle",
    "59124",
    "Secteurs pavés de Camphin-en-Pévèle et du Carrefour de l’Arbre (Paris-Roubaix) à deux pas, esprit village et grandes fermes en briques.",
  ],
  [
    "WANNEHAIN",
    "Wannehain",
    "59638",
    "Petit village frontalier, prisé pour ses longères et son calme.",
  ],
  [
    "BOURGHELLES",
    "Bourghelles",
    "59096",
    "Entre Cysoing et la frontière : longères, briques rouges et vie associative.",
  ],
  [
    "CYSOING",
    "Cysoing",
    "59168",
    "Le cœur de la Pévèle : collèges, commerces, marché — la centralité qui fait monter la demande.",
  ],
  [
    "LOUVIL",
    "Louvil",
    "59364",
    "Village discret entre Cysoing et Templeuve, très recherché des familles.",
  ],
  [
    "BACHY",
    "Bachy",
    "59042",
    "Village frontalier au caractère rural affirmé, entre pavés et pâtures.",
  ],
  [
    "MOUCHIN",
    "Mouchin",
    "59419",
    "Le village le plus à l’est : campagne franche, à cheval sur la frontière belge.",
  ],
  [
    "TEMPLEUVE-EN-PÉV.",
    "Templeuve-en-Pévèle",
    "59586",
    "Gare TER vers Lille, marché, moulin de Vertain : la commune la plus connectée.",
  ],
  [
    "GENECH",
    "Genech",
    "59258",
    "Connu pour son institut de formation horticole — un village vert, au sens propre.",
  ],
  [
    "NOMAIN",
    "Nomain",
    "59435",
    "Grand territoire rural aux hameaux dispersés : les amoureux d’espace s’y retrouvent.",
  ],
  [
    "ORCHIES",
    "Orchies",
    "59449",
    "La ville-porte du sud : gare, commerces, collèges et lycée — les services d’une petite ville.",
  ],
  [
    "BERSÉE",
    "Bersée",
    "59071",
    "Entre plaine et bois de la Croisette, un village agricole authentique.",
  ],
  [
    "MÉRIGNIES",
    "Mérignies",
    "59398",
    "Golf 27 trous et nouveaux quartiers résidentiels : l’adresse « signature » du sud-ouest.",
  ],
  [
    "CAPPELLE-EN-PÉV.",
    "Cappelle-en-Pévèle",
    "59129",
    "Vergers et maisons de plain-pied, entre Templeuve et Bersée.",
  ],
  [
    "MONS-EN-PÉV.",
    "Mons-en-Pévèle",
    "59411",
    "Le mont qui donne son nom à toute la Pévèle, théâtre d’une célèbre bataille en 1304 — un village perché entre champs et bois.",
  ],
  [
    "AIX-EN-PÉV.",
    "Aix-en-Pévèle",
    "59004",
    "Petit village agricole à l’est du territoire, fermes en briques et ferme pédagogique.",
  ],
  [
    "AVELIN",
    "Avelin",
    "59034",
    "En lisière de la forêt de Phalempin, un village rural au calme préservé.",
  ],
  [
    "ENNEVELIN",
    "Ennevelin",
    "59197",
    "Point de départ de nombreuses randonnées et de l’accrobranche, aux portes de la forêt.",
  ],
  [
    "LANDAS",
    "Landas",
    "59330",
    "Village agricole du sud de la Pévèle, entre plaine et lisière du bois de Marchiennes.",
  ],
  [
    "COBRIEUX",
    "Cobrieux",
    "59150",
    "L’un des plus petits villages du territoire, à mi-chemin entre Bachy et Cysoing.",
  ],
  [
    "COUTICHES",
    "Coutiches",
    "59158",
    "Aux confins de la Pévèle, entre plaine de la Scarpe et forêt de Marchiennes.",
  ],
  [
    "BEUVRY-LA-FOR.",
    "Beuvry-la-Forêt",
    "59080",
    "Le tout premier secteur pavé du parcours Paris-Roubaix s’élance depuis ce village en lisière de forêt.",
  ],
  [
    "SAMÉON",
    "Saméon",
    "59551",
    "Balades en calèche dans les rues du village — l’un des rendez-vous conviviaux de la Pévèle.",
  ],
  [
    "PONT-À-MARCQ",
    "Pont-à-Marcq",
    "59466",
    "Bourg-carrefour sur la Marque, à la jonction entre Pévèle et Carembault : commerces de proximité et vie de village active.",
  ],
  [
    "AUCHY-LEZ-ORCH.",
    "Auchy-lez-Orchies",
    "59029",
    "Petit village agricole aux portes d’Orchies, entre champs et pâtures.",
  ],
  [
    "MONCHEAUX",
    "Moncheaux",
    "59408",
    "Village rural entre Pévèle et Ostricourt, dominé par les grandes cultures.",
  ],
  [
    "THUMERIES",
    "Thumeries",
    "59592",
    "Marqué par sa sucrerie historique — aujourd’hui site industriel Tereos — l’un des gros employeurs du secteur.",
  ],
  [
    "TOURMIGNIES",
    "Tourmignies",
    "59600",
    "Petit village agricole discret, entre Pont-à-Marcq et Moncheaux.",
  ],
  [
    "ATTICHES",
    "Attiches",
    "59022",
    "Village agricole tranquille, entre bois et cultures, aux confins ouest de la Pévèle.",
  ],
  [
    "LA NEUVILLE",
    "La Neuville",
    "59427",
    "Petit village rural voisin de Pont-à-Marcq, entre champs et hameaux.",
  ],
  [
    "FLINES-LEZ-RACHES",
    "Flines-lez-Raches",
    "59239",
    "Ancien siège d’une abbaye cistercienne fondée en 1234 par la comtesse de Flandre — au cœur du parc naturel régional Scarpe-Escaut, entre Douai et Valenciennes.",
  ],
  [
    "FAUMONT",
    "Faumont",
    "59222",
    "Village agricole du Pévèle-Carembault, entre Orchies et la vallée de la Scarpe.",
  ],
  [
    "MARCHIENNES",
    "Marchiennes",
    "59375",
    "Abbaye fondée au VIIe siècle, aujourd’hui disparue : sa forêt domaniale (800 ha) reste la plus grande zone boisée de l’arrondissement de Douai. Village au bord de la Scarpe, cœur du parc naturel régional Scarpe-Escaut.",
  ],
  [
    "BOUVIGNIES",
    "Bouvignies",
    "59105",
    "Petit village agricole aux portes nord d’Orchies, au sein de l’intercommunalité Pévèle-Carembault.",
  ],
  [
    "RUMEGIES",
    "Rumegies",
    "59519",
    "Village du parc naturel régional Scarpe-Escaut, aux confins sud-est du territoire, entre Pévèle et Valenciennois.",
  ],
  [
    "ROSULT",
    "Rosult",
    "59511",
    "Village du Valenciennois aux confins sud-est du territoire, entre Scarpe et Porte du Hainaut.",
  ],
];

export const villages: Village[] = RAW.map(([labelCourt, nom, insee, description]) => ({
  slug: slugify(nom),
  labelCourt,
  nom,
  insee,
  description,
}));

export function getVillageByInsee(insee: string): Village | undefined {
  return villages.find((v) => v.insee === insee);
}

export function getVillageBySlug(slug: string): Village | undefined {
  return villages.find((v) => v.slug === slug);
}

/**
 * Communes les plus proches d'une commune donnée, par distance réelle entre
 * centroïdes de contour (repère SVG 440x600 partagé avec village-boundaries.ts,
 * issu de vraies coordonnées géographiques). Sert au maillage interne des
 * pages d'atterrissage SEO. Approximatif (distance euclidienne dans une
 * projection locale) mais suffisant pour « communes proches ».
 */
export function nearestVillages(slug: string, count = 4): Village[] {
  const origin = getVillageBySlug(slug);
  const originBoundary = origin ? villageBoundaries[origin.insee] : undefined;
  if (!origin || !originBoundary) return [];
  return villages
    .filter((v) => v.slug !== slug)
    .map((v) => {
      const b = villageBoundaries[v.insee];
      const d = b
        ? (b.cx - originBoundary.cx) ** 2 + (b.cy - originBoundary.cy) ** 2
        : Infinity;
      return { v, d };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.v);
}
