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
  prix: string;
  commune: string;
  villageSlug: string;
  pieces: string;
  surface: string;
  exterieur: string;
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
    prix: "449 000 €",
    commune: "Camphin-en-Pévèle",
    pieces: "5 P.",
    surface: "142 M²",
    exterieur: "685 M² JARD.",
    photo: "/images/camphin-en-pevele.png",
  },
  {
    source: "ENTRE VOISINS — PARTICULIER",
    type: "particulier",
    transaction: "vente",
    badge: "VISITE SUR RDV",
    titre: "Longère à rafraîchir",
    prix: "298 000 €",
    commune: "Bachy",
    pieces: "4 P.",
    surface: "128 M²",
    exterieur: "900 M² TER.",
    photoLabel: "photos du propriétaire",
  },
  {
    source: "AGENCE — PARTENAIRE",
    type: "agence",
    transaction: "vente",
    badge: "PLANS 2D·3D",
    titre: "Ferme rénovée au calme",
    prix: "585 000 €",
    commune: "Cysoing",
    pieces: "6 P.",
    surface: "188 M²",
    exterieur: "1 250 M² TER.",
    photoLabel: "photo pro — ferme rénovée",
  },
  {
    source: "ENTRE VOISINS — PARTICULIER",
    type: "particulier",
    transaction: "vente",
    badge: "SANS COMMISSION",
    titre: "Maison de village + garage",
    prix: "242 000 €",
    commune: "Nomain",
    pieces: "4 P.",
    surface: "105 M²",
    exterieur: "COUR 60 M²",
    photoLabel: "photos du propriétaire",
  },
  {
    source: "AGENCE — PARTENAIRE",
    type: "agence",
    transaction: "vente",
    badge: "NOUVEAUTÉ",
    titre: "Plain-pied contemporain",
    prix: "365 000 €",
    commune: "Templeuve-en-Pévèle",
    pieces: "4 P.",
    surface: "110 M²",
    exterieur: "520 M² JARD.",
    photoLabel: "photo pro — plain-pied",
  },
  {
    source: "ENTRE VOISINS — PARTICULIER",
    type: "particulier",
    transaction: "location",
    badge: "LOCATION",
    titre: "Appartement en centre-bourg",
    prix: "790 €/mois",
    commune: "Orchies",
    pieces: "3 P.",
    surface: "68 M²",
    exterieur: "BALCON",
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
