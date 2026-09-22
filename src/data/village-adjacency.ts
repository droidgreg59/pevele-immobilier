// Généré par scripts/fetch-village-adjacency.ts le 2026-09-22.
//
// Source : geo.api.gouv.fr, champ `contour` (polygones officiels, pleine
// précision — pas le tracé déjà simplifié de village-boundaries.ts).
// Méthode : distance minimale segment-à-segment entre les anneaux de deux
// communes, projection équirectangulaire locale (référence 50,5°N), seuil
// d'adjacence 15 m — absorbe l'arrondi/imprécision de la
// source, jamais utilisé pour rapprocher des communes réellement séparées
// (distances réelles observées lors de la génération : de 0 à ~15 m pour les
// paires retenues, la plupart à 0 — les frontières officielles coïncident).
//
// Ne PAS confondre avec nearestVillages() (villages.ts), qui mesure une
// simple proximité de centroïde, pas une adjacence topologique réelle.
// Ne pas éditer à la main : relancer le script si de nouvelles communes sont
// ajoutées ou si les contours officiels changent.

export const villageAdjacency: Record<string, string[]> = {
  "sainghin-en-melantois": [
    "anstaing",
    "bouvines",
    "cysoing",
    "gruson",
    "peronne-en-melantois"
  ],
  "gruson": [
    "anstaing",
    "baisieux",
    "bouvines",
    "camphin-en-pevele",
    "chereng",
    "cysoing",
    "sainghin-en-melantois"
  ],
  "chereng": [
    "anstaing",
    "baisieux",
    "gruson",
    "willems"
  ],
  "anstaing": [
    "chereng",
    "gruson",
    "sainghin-en-melantois"
  ],
  "bouvines": [
    "cysoing",
    "gruson",
    "sainghin-en-melantois"
  ],
  "peronne-en-melantois": [
    "cysoing",
    "louvil",
    "sainghin-en-melantois",
    "templeuve-en-pevele"
  ],
  "baisieux": [
    "camphin-en-pevele",
    "chereng",
    "gruson",
    "willems"
  ],
  "willems": [
    "baisieux",
    "chereng"
  ],
  "camphin-en-pevele": [
    "baisieux",
    "bourghelles",
    "cysoing",
    "gruson",
    "wannehain"
  ],
  "wannehain": [
    "bachy",
    "bourghelles",
    "camphin-en-pevele"
  ],
  "bourghelles": [
    "bachy",
    "camphin-en-pevele",
    "cobrieux",
    "cysoing",
    "wannehain"
  ],
  "cysoing": [
    "bourghelles",
    "bouvines",
    "camphin-en-pevele",
    "cobrieux",
    "genech",
    "gruson",
    "louvil",
    "peronne-en-melantois",
    "sainghin-en-melantois",
    "templeuve-en-pevele"
  ],
  "louvil": [
    "cysoing",
    "peronne-en-melantois",
    "templeuve-en-pevele"
  ],
  "bachy": [
    "bourghelles",
    "cobrieux",
    "mouchin",
    "wannehain"
  ],
  "mouchin": [
    "aix-en-pevele",
    "bachy",
    "cobrieux",
    "genech",
    "nomain"
  ],
  "templeuve-en-pevele": [
    "cappelle-en-pevele",
    "cysoing",
    "ennevelin",
    "genech",
    "louvil",
    "merignies",
    "nomain",
    "peronne-en-melantois"
  ],
  "genech": [
    "cobrieux",
    "cysoing",
    "mouchin",
    "nomain",
    "templeuve-en-pevele"
  ],
  "nomain": [
    "aix-en-pevele",
    "auchy-lez-orchies",
    "cappelle-en-pevele",
    "genech",
    "landas",
    "mouchin",
    "orchies",
    "templeuve-en-pevele"
  ],
  "orchies": [
    "auchy-lez-orchies",
    "beuvry-la-foret",
    "bouvignies",
    "coutiches",
    "landas",
    "nomain"
  ],
  "bersee": [
    "auchy-lez-orchies",
    "cappelle-en-pevele",
    "coutiches",
    "faumont",
    "merignies",
    "mons-en-pevele"
  ],
  "merignies": [
    "avelin",
    "bersee",
    "cappelle-en-pevele",
    "ennevelin",
    "mons-en-pevele",
    "pont-a-marcq",
    "templeuve-en-pevele",
    "tourmignies"
  ],
  "cappelle-en-pevele": [
    "auchy-lez-orchies",
    "bersee",
    "merignies",
    "nomain",
    "templeuve-en-pevele"
  ],
  "mons-en-pevele": [
    "attiches",
    "bersee",
    "faumont",
    "merignies",
    "moncheaux",
    "thumeries",
    "tourmignies"
  ],
  "aix-en-pevele": [
    "landas",
    "mouchin",
    "nomain",
    "rumegies",
    "sameon"
  ],
  "avelin": [
    "attiches",
    "ennevelin",
    "merignies",
    "pont-a-marcq",
    "tourmignies"
  ],
  "ennevelin": [
    "avelin",
    "merignies",
    "pont-a-marcq",
    "templeuve-en-pevele"
  ],
  "landas": [
    "aix-en-pevele",
    "beuvry-la-foret",
    "nomain",
    "orchies",
    "rosult",
    "sameon"
  ],
  "cobrieux": [
    "bachy",
    "bourghelles",
    "cysoing",
    "genech",
    "mouchin"
  ],
  "coutiches": [
    "auchy-lez-orchies",
    "bersee",
    "bouvignies",
    "faumont",
    "flines-lez-raches",
    "orchies"
  ],
  "beuvry-la-foret": [
    "bouvignies",
    "landas",
    "marchiennes",
    "orchies"
  ],
  "sameon": [
    "aix-en-pevele",
    "landas",
    "rosult",
    "rumegies"
  ],
  "pont-a-marcq": [
    "avelin",
    "ennevelin",
    "merignies"
  ],
  "auchy-lez-orchies": [
    "bersee",
    "cappelle-en-pevele",
    "coutiches",
    "nomain",
    "orchies"
  ],
  "moncheaux": [
    "faumont",
    "mons-en-pevele",
    "thumeries"
  ],
  "thumeries": [
    "attiches",
    "la-neuville",
    "moncheaux",
    "mons-en-pevele"
  ],
  "tourmignies": [
    "attiches",
    "avelin",
    "merignies",
    "mons-en-pevele"
  ],
  "attiches": [
    "avelin",
    "la-neuville",
    "mons-en-pevele",
    "thumeries",
    "tourmignies"
  ],
  "la-neuville": [
    "attiches",
    "thumeries"
  ],
  "flines-lez-raches": [
    "bouvignies",
    "coutiches",
    "faumont",
    "marchiennes"
  ],
  "faumont": [
    "bersee",
    "coutiches",
    "flines-lez-raches",
    "moncheaux",
    "mons-en-pevele"
  ],
  "marchiennes": [
    "beuvry-la-foret",
    "bouvignies",
    "flines-lez-raches"
  ],
  "bouvignies": [
    "beuvry-la-foret",
    "coutiches",
    "flines-lez-raches",
    "marchiennes",
    "orchies"
  ],
  "rumegies": [
    "aix-en-pevele",
    "sameon"
  ],
  "rosult": [
    "landas",
    "sameon"
  ]
};
