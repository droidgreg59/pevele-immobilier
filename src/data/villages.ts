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
    "Village de la plaine du Mélantois, à environ 8 km de Lille, avec son église Saint-Nicolas et le tumulus gallo-romain du Mont des Tombes.",
  ],
  [
    "GRUSON",
    "Gruson",
    "59275",
    "Petit village de la vallée de la Marque, connu pour son calvaire du XIVe siècle, le « Bon Dieu de pierre », et pour la proximité du Carrefour de l’Arbre (Paris-Roubaix).",
  ],
  [
    "CHÉRENG",
    "Chéreng",
    "59146",
    "Village étiré le long de la route Lille–Tournai, avec une église aux fonts baptismaux du XIIe siècle et un ancien relais de poste royal du XVIIIe siècle, la Hamaide.",
  ],
  [
    "ANSTAING",
    "Anstaing",
    "59013",
    "Petit village du Mélantois, entre Chéreng, Tressin et Villeneuve-d’Ascq — la campagne à la lisière immédiate de la métropole.",
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
    "Petit village du Mélantois, entre Sainghin-en-Mélantois et Fretin, avec son église Saint-Nicolas classée.",
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
    "Commune frontalière au sud de Roubaix, avec son église Saint-Martin à la flèche de 58 m et sa maison commune de 1737.",
  ],
  [
    "CAMPHIN-EN-PÉV.",
    "Camphin-en-Pévèle",
    "59124",
    "Secteurs pavés de Camphin-en-Pévèle et du Carrefour de l’Arbre (Paris-Roubaix) à deux pas, esprit village et Domaine de Luchin, centre d’entraînement du LOSC.",
  ],
  [
    "WANNEHAIN",
    "Wannehain",
    "59638",
    "Petit village agricole en limite de la Belgique, autour de l’église Sainte-Cécile, relié à Bourghelles par un secteur pavé de Paris-Roubaix.",
  ],
  [
    "BOURGHELLES",
    "Bourghelles",
    "59096",
    "Village à une quinzaine de kilomètres de Lille et près de la frontière belge, avec son église du XIIe siècle et le secteur pavé de Bourghelles à Wannehain (Paris-Roubaix).",
  ],
  [
    "CYSOING",
    "Cysoing",
    "59168",
    "Bourg de l’ancienne abbaye de Cysoing, avec la pyramide de Fontenoy (1750), un collège, un marché les mardis et dimanches matin et un secteur pavé de Paris-Roubaix.",
  ],
  [
    "LOUVIL",
    "Louvil",
    "59364",
    "Petit village entre Cysoing et Templeuve-en-Pévèle, autour de son église Saint-Martin au chœur d’environ 1550.",
  ],
  [
    "BACHY",
    "Bachy",
    "59042",
    "Village agricole frontalier de la Belgique, avec son église Saint-Éloi reconstruite en 1845.",
  ],
  [
    "MOUCHIN",
    "Mouchin",
    "59419",
    "Village rural de la frontière belge, aux terres presque entièrement agricoles, autour de l’église Saint-Pierre.",
  ],
  [
    "TEMPLEUVE-EN-PÉV.",
    "Templeuve-en-Pévèle",
    "59586",
    "Gare TER vers Lille, marché couvert le dimanche matin et moulin de Vertain, moulin à pivot restauré et ouvert à la visite.",
  ],
  [
    "GENECH",
    "Genech",
    "59258",
    "Village qui abrite l’Institut de Genech, établissement de formation agricole et horticole fondé en 1894.",
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
    "Village agricole traversé par le secteur pavé d’Auchy-lez-Orchies à Bersée (Paris-Roubaix), avec une église Saint-Étienne au clocher classé.",
  ],
  [
    "MÉRIGNIES",
    "Mérignies",
    "59398",
    "Mérignies Golf (27 trous, ouvert en 2008) et nouveaux quartiers résidentiels : une commune en plein développement.",
  ],
  [
    "CAPPELLE-EN-PÉV.",
    "Cappelle-en-Pévèle",
    "59129",
    "Village aux vergers et au château du Béron, entre Templeuve, Bersée et Pont-à-Marcq.",
  ],
  [
    "MONS-EN-PÉV.",
    "Mons-en-Pévèle",
    "59411",
    "Théâtre de la bataille de 1304 entre Philippe le Bel et les Flamands, ce village dominant la plaine abrite le musée de la Salle des Batailles et un secteur pavé de Paris-Roubaix.",
  ],
  [
    "AIX-EN-PÉV.",
    "Aix-en-Pévèle",
    "59004",
    "Village agricole à l’extrémité nord-est de la Pévèle, frontalier de la Belgique, dont l’église Saint-Laurent possède un clocher du XIe siècle.",
  ],
  [
    "AVELIN",
    "Avelin",
    "59034",
    "Village rural au sud de Lille, connu pour son château du XVIIe siècle et ses cultures de cassis destinées à la liqueur Philippe de Bourgogne.",
  ],
  [
    "ENNEVELIN",
    "Ennevelin",
    "59197",
    "Village rural de la Pévèle, ancienne seigneurie d’Aigremont érigée en marquisat en 1773, dont subsistent la ferme d’Aigremont et le Château Blanc (1824).",
  ],
  [
    "LANDAS",
    "Landas",
    "59330",
    "Village agricole de la Pévèle, ancienne baronnie érigée par Philippe le Bel en 1314, dont l’église Saint-Vaast conserve une cloche de 1285.",
  ],
  [
    "COBRIEUX",
    "Cobrieux",
    "59150",
    "Petit village au sud de Cysoing, voisin de Bachy, où subsistent le château du Fay (XVIIIe siècle) et le souvenir de la commanderie hospitalière de Haute-Avesnes.",
  ],
  [
    "COUTICHES",
    "Coutiches",
    "59158",
    "Commune du Parc naturel régional Scarpe-Escaut, dont le territoire abrite, selon l’IGN, le centre géographique du département du Nord.",
  ],
  [
    "BEUVRY-LA-FOR.",
    "Beuvry-la-Forêt",
    "59080",
    "Village en partie boisé, proche de la forêt de Marchiennes, d’où part le secteur pavé de Beuvry-la-Forêt à Orchies (Paris-Roubaix).",
  ],
  [
    "SAMÉON",
    "Saméon",
    "59551",
    "Village rural du Parc naturel régional Scarpe-Escaut, avec école, gîte municipal, camping et estaminet, et des chapelles dédiées à Notre-Dame.",
  ],
  [
    "PONT-À-MARCQ",
    "Pont-à-Marcq",
    "59466",
    "Bourg sur la Marque, à mi-chemin entre Lille et Douai, siège de la Communauté de communes Pévèle Carembault.",
  ],
  [
    "AUCHY-LEZ-ORCH.",
    "Auchy-lez-Orchies",
    "59029",
    "Village aux portes d’Orchies, longtemps agricole, traversé par le secteur pavé d’Auchy-lez-Orchies à Bersée (Paris-Roubaix).",
  ],
  [
    "MONCHEAUX",
    "Moncheaux",
    "59408",
    "Village rural de la Pévèle, connu pour sa fête annuelle du poireau ; les terres arables occupent près des deux tiers du territoire.",
  ],
  [
    "THUMERIES",
    "Thumeries",
    "59592",
    "Berceau de la sucrerie Béghin-Say (1821), toujours marqué par l’industrie sucrière (site Tereos) ; réserve ornithologique des Cinq Tailles (Natura 2000).",
  ],
  [
    "TOURMIGNIES",
    "Tourmignies",
    "59600",
    "Petit village de la Pévèle-Carembault, dont l’église Saint-Pierre-à-Antioche, citée dès 1188, est classée monument historique.",
  ],
  [
    "ATTICHES",
    "Attiches",
    "59022",
    "Village de la Pévèle-Carembault en lisière de la forêt de Phalempin ; son château (1880) a hébergé l’aviateur Manfred von Richthofen pendant la Première Guerre mondiale.",
  ],
  [
    "LA NEUVILLE",
    "La Neuville",
    "59427",
    "Petit village de la Pévèle-Carembault, voisin de Thumeries, Tourmignies et Wahagnies.",
  ],
  [
    "FLINES-LEZ-RACHES",
    "Flines-lez-Raches",
    "59239",
    "Ancien site de l’abbaye cistercienne de Flines (fondée vers 1234 par la comtesse de Flandre Marguerite de Constantinople), détruite après la Révolution ; commune du parc naturel régional Scarpe-Escaut.",
  ],
  [
    "FAUMONT",
    "Faumont",
    "59222",
    "Village agricole de Douaisis Agglo, dans la Pévèle historique ; près de 75 % du territoire est cultivé.",
  ],
  [
    "MARCHIENNES",
    "Marchiennes",
    "59375",
    "Ancienne abbaye fondée vers 630, dont subsistent un portail de 1748 (aujourd’hui hôtel de ville) et un musée ; commune du parc naturel régional Scarpe-Escaut, au bord de la Scarpe, avec une forêt domaniale d’environ 800 ha, la plus grande surface boisée de l’arrondissement de Douai.",
  ],
  [
    "BOUVIGNIES",
    "Bouvignies",
    "59105",
    "Village de la Pévèle-Carembault au nord d’Orchies, où se trouve le Musée de la Colombophilie ; une partie de la forêt de Marchiennes s’étend sur son territoire.",
  ],
  [
    "RUMEGIES",
    "Rumegies",
    "59519",
    "Village frontalier du parc naturel régional Scarpe-Escaut, dans la Porte du Hainaut ; 87 % du territoire est agricole.",
  ],
  [
    "ROSULT",
    "Rosult",
    "59511",
    "Village du Valenciennois dans le parc naturel régional Scarpe-Escaut, proche de Saint-Amand-les-Eaux, avec sa chapelle à grotte de Lourdes.",
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
