import { slugify } from "@/lib/slugify";

export type ListingType = "agence" | "particulier";
export type TransactionType = "vente" | "location";

export type Listing = {
  id: string;
  source: string;
  type: ListingType;
  transaction: TransactionType;
  badge: string;
  titre: string;
  description: string;
  prix: string;
  prixNombre: number;
  commune: string;
  villageSlug: string;
  pieces: string;
  chambres: string;
  surface: string;
  surfaceM2: number;
  exterieur: string;
  dpe: string;
  equipements: string[];
  photo?: string;
  photoLabel?: string;
};

const RAW: Omit<Listing, "id" | "villageSlug">[] = [
  {
    source: "AGENCE — PVL IMMOBILIER",
    type: "agence",
    transaction: "vente",
    badge: "PLAN 2D + VISITE 360°",
    titre: "Maison de caractère",
    description:
      "Ancienne ferme briquette entièrement rénovée, à deux pas du centre de Camphin-en-Pévèle. Volumes traversants, poutres apparentes au séjour, cuisine ouverte récente et dépendance aménageable.",
    prix: "449 000 €",
    prixNombre: 449000,
    commune: "Camphin-en-Pévèle",
    pieces: "5 P.",
    chambres: "3 CH.",
    surface: "142 M²",
    surfaceM2: 142,
    exterieur: "685 M² JARD.",
    dpe: "C",
    equipements: ["Poêle à bois", "Garage", "Dépendance", "Double vitrage"],
    photo: "/images/camphin-en-pevele.png",
  },
  {
    source: "ENTRE VOISINS — PARTICULIER",
    type: "particulier",
    transaction: "vente",
    badge: "VISITE SUR RDV",
    titre: "Longère à rafraîchir",
    description:
      "Longère typique de la Pévèle à rénover, sur un terrain arboré de 900 m². Belle opportunité pour un projet de rénovation : gros œuvre sain, toiture refaite il y a 8 ans, réseaux à revoir.",
    prix: "298 000 €",
    prixNombre: 298000,
    commune: "Bachy",
    pieces: "4 P.",
    chambres: "3 CH.",
    surface: "128 M²",
    surfaceM2: 128,
    exterieur: "900 M² TER.",
    dpe: "E",
    equipements: ["Terrain clos", "Puits", "Abri de jardin"],
    photoLabel: "photos du propriétaire",
  },
  {
    source: "AGENCE — PARTENAIRE",
    type: "agence",
    transaction: "vente",
    badge: "PLANS 2D·3D",
    titre: "Ferme rénovée au calme",
    description:
      "Grande ferme en U entièrement restaurée aux portes de Cysoing, sur un terrain clos de 1 250 m². Belle réception, suite parentale avec dressing, dépendances aménagées en atelier et bureau.",
    prix: "585 000 €",
    prixNombre: 585000,
    commune: "Cysoing",
    pieces: "6 P.",
    chambres: "4 CH.",
    surface: "188 M²",
    surfaceM2: 188,
    exterieur: "1 250 M² TER.",
    dpe: "B",
    equipements: ["Pompe à chaleur", "Dépendances", "Piscine", "Alarme"],
    photoLabel: "photo pro — ferme rénovée",
  },
  {
    source: "ENTRE VOISINS — PARTICULIER",
    type: "particulier",
    transaction: "vente",
    badge: "SANS COMMISSION",
    titre: "Maison de village + garage",
    description:
      "Maison de village avec cour privative et garage, à proximité immédiate des commerces de Nomain. Idéale premier achat : trois chambres à l'étage, séjour lumineux, aucun travaux à prévoir.",
    prix: "242 000 €",
    prixNombre: 242000,
    commune: "Nomain",
    pieces: "4 P.",
    chambres: "3 CH.",
    surface: "105 M²",
    surfaceM2: 105,
    exterieur: "COUR 60 M²",
    dpe: "D",
    equipements: ["Garage", "Cour privative", "Chaudière récente"],
    photoLabel: "photos du propriétaire",
  },
  {
    source: "AGENCE — PARTENAIRE",
    type: "agence",
    transaction: "vente",
    badge: "NOUVEAUTÉ",
    titre: "Plain-pied contemporain",
    description:
      "Construction récente de plain-pied à Templeuve-en-Pévèle, proche de la gare TER. Prestations soignées, cuisine équipée ouverte, garage attenant et jardin clos exposé sud.",
    prix: "365 000 €",
    prixNombre: 365000,
    commune: "Templeuve-en-Pévèle",
    pieces: "4 P.",
    chambres: "3 CH.",
    surface: "110 M²",
    surfaceM2: 110,
    exterieur: "520 M² JARD.",
    dpe: "A",
    equipements: ["Cuisine équipée", "Garage attenant", "Domotique"],
    photoLabel: "photo pro — plain-pied",
  },
  {
    source: "ENTRE VOISINS — PARTICULIER",
    type: "particulier",
    transaction: "location",
    badge: "LOCATION",
    titre: "Appartement en centre-bourg",
    description:
      "Appartement lumineux en centre-bourg d'Orchies, à deux pas des commerces et de la gare. Cuisine équipée, balcon exposé sud, place de parking privative incluse.",
    prix: "790 €/mois",
    prixNombre: 790,
    commune: "Orchies",
    pieces: "3 P.",
    chambres: "2 CH.",
    surface: "68 M²",
    surfaceM2: 68,
    exterieur: "BALCON",
    dpe: "D",
    equipements: ["Cuisine équipée", "Parking privatif", "Balcon"],
    photoLabel: "photos du propriétaire",
  },
];

export const listings: Listing[] = RAW.map((item, index) => ({
  ...item,
  id: String(index + 1),
  villageSlug: slugify(item.commune),
}));

export function getListingsByVillage(villageSlug: string): Listing[] {
  return listings.filter((l) => l.villageSlug === villageSlug);
}

export function getListingById(id: string): Listing | undefined {
  return listings.find((l) => l.id === id);
}
