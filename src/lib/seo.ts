import { getVillageBySlug } from "@/data/villages";
import { villageCoords } from "@/data/village-coords";

export const SITE_URL = "https://pevele-immobilier.fr";
export const SITE_NAME = "Pévèle Immobilier";

export type BreadcrumbItem = { name: string; url: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Le portail local des annonces et des prix immobiliers de la Pévèle : agences, particuliers et artisans réunis pour les 35 communes.",
    areaServed: {
      "@type": "Place",
      name: "La Pévèle",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/acheter?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function listingJsonLd(listing: {
  id: string;
  titre: string;
  description: string;
  prix: number;
  transaction: "VENTE" | "LOCATION";
  commune: string;
  villageSlug: string;
  surface: number;
  pieces: number;
  chambres: number;
  createdAt: Date;
  photos: { url: string }[];
  owner: { nom: string; entreprise: string | null; type: "PARTICULIER" | "AGENCE" | "ARTISAN" };
}) {
  const path = listing.transaction === "VENTE" ? "acheter" : "louer";
  const village = getVillageBySlug(listing.villageSlug);
  const coords = villageCoords[village?.insee ?? ""];
  const broker =
    listing.owner.type === "AGENCE"
      ? {
          broker: {
            "@type": "RealEstateAgent",
            name: listing.owner.entreprise ?? listing.owner.nom,
          },
        }
      : {};

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${SITE_URL}/${path}/${listing.id}`,
    url: `${SITE_URL}/${path}/${listing.id}`,
    name: listing.titre,
    description: listing.description,
    datePosted: listing.createdAt.toISOString(),
    image: listing.photos.map((p) => (p.url.startsWith("http") ? p.url : `${SITE_URL}${p.url}`)),
    numberOfRooms: listing.pieces,
    numberOfBedrooms: listing.chambres,
    floorSize: {
      "@type": "QuantitativeValue",
      value: listing.surface,
      unitCode: "MTK",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.commune,
      addressRegion: "Hauts-de-France",
      addressCountry: "FR",
    },
    ...(coords
      ? { geo: { "@type": "GeoCoordinates", latitude: coords.lat, longitude: coords.lng } }
      : {}),
    ...broker,
    offers: {
      "@type": "Offer",
      price: listing.prix,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };
}

export function localBusinessJsonLd(entity: {
  id: string;
  path: "professionnels" | "artisans";
  nom: string;
  description?: string | null;
  telephone?: string | null;
  email: string;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  logoUrl?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": entity.path === "professionnels" ? "RealEstateAgent" : "LocalBusiness",
    "@id": `${SITE_URL}/${entity.path}/${entity.id}`,
    url: `${SITE_URL}/${entity.path}/${entity.id}`,
    name: entity.nom,
    description: entity.description ?? undefined,
    email: entity.email,
    telephone: entity.telephone ?? undefined,
    image: entity.logoUrl
      ? entity.logoUrl.startsWith("http")
        ? entity.logoUrl
        : `${SITE_URL}${entity.logoUrl}`
      : undefined,
    address:
      entity.adresse || entity.codePostal || entity.ville
        ? {
            "@type": "PostalAddress",
            streetAddress: entity.adresse ?? undefined,
            postalCode: entity.codePostal ?? undefined,
            addressLocality: entity.ville ?? undefined,
            addressCountry: "FR",
          }
        : undefined,
    areaServed: {
      "@type": "Place",
      name: "La Pévèle",
    },
  };
}
