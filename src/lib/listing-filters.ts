import type { ListingWithOwner } from "@/lib/listings";

/**
 * Logique de filtre/tri des annonces, extraite de ListingsBrowser pour être
 * réutilisée telle quelle par le compteur live du tunnel "Mon projet" — les
 * deux doivent toujours compter exactement les mêmes biens.
 */

export type ListingFiltre = "tout" | "agence" | "particulier";
export type TypeBienFiltre = "TOUS" | "MAISON" | "APPARTEMENT" | "TERRAIN";
export type ListingSort = "prix_desc" | "prix_asc" | "recent" | "surface_desc";

export type ListingFilterCriteria = {
  filtre?: ListingFiltre;
  typeBien?: TypeBienFiltre;
  villageSlugs?: string[];
  querySlug?: string;
  budgetMin?: number;
  budgetMax?: number;
  chambresMin?: number;
  equipements?: string[];
};

export function matchesFiltre(listing: ListingWithOwner, filtre: ListingFiltre): boolean {
  if (filtre === "tout") return true;
  return filtre === "agence" ? listing.owner.type === "AGENCE" : listing.owner.type === "PARTICULIER";
}

export function matchesTypeBien(listing: ListingWithOwner, typeBien: TypeBienFiltre): boolean {
  return typeBien === "TOUS" || listing.typeBien === typeBien;
}

export function filterListings(
  listings: ListingWithOwner[],
  criteria: ListingFilterCriteria
): ListingWithOwner[] {
  const {
    filtre = "tout",
    typeBien = "TOUS",
    villageSlugs = [],
    querySlug = "",
    budgetMin,
    budgetMax,
    chambresMin,
    equipements = [],
  } = criteria;

  return listings.filter(
    (l) =>
      matchesFiltre(l, filtre) &&
      matchesTypeBien(l, typeBien) &&
      (villageSlugs.length > 0
        ? villageSlugs.includes(l.villageSlug)
        : querySlug === "" || l.villageSlug.includes(querySlug)) &&
      (budgetMin === undefined || l.prix >= budgetMin) &&
      (budgetMax === undefined || l.prix <= budgetMax) &&
      (chambresMin === undefined || l.chambres >= chambresMin) &&
      equipements.every((tag) => l.equipements.toLowerCase().includes(tag.toLowerCase()))
  );
}

/** Wrapper autour de Date.now() — évite d'appeler un global impur directement dans un composant. */
export function isRecentListing(
  listing: ListingWithOwner,
  withinMs: number = 7 * 24 * 60 * 60 * 1000
): boolean {
  return Date.now() - new Date(listing.createdAt).getTime() < withinMs;
}

export function sortListings(list: ListingWithOwner[], tri: ListingSort): ListingWithOwner[] {
  const sorted = [...list];
  switch (tri) {
    case "prix_asc":
      return sorted.sort((a, b) => a.prix - b.prix);
    case "recent":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "surface_desc":
      return sorted.sort((a, b) => b.surface - a.surface);
    case "prix_desc":
    default:
      return sorted.sort((a, b) => b.prix - a.prix);
  }
}
