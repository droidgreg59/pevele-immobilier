import type { Metadata } from "next";
import ListingsBrowser from "@/components/ListingsBrowser";
import {
  parseBrowseSearchParams,
  getBrowsePage,
  getBrowseMapAggregates,
  getBrowseFacets,
  BROWSE_PAGE_SIZE,
} from "@/lib/listing-query";
import { getFavoriteListingIds } from "@/lib/favorites";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Louer en Pévèle — Annonces de location",
  description:
    "Toutes les annonces de maisons et appartements à louer dans les 35 communes de la Pévèle, agences et particuliers.",
  alternates: {
    canonical: "/louer",
  },
};

export default async function LouerPage({ searchParams }: PageProps<"/louer">) {
  const params = await searchParams;
  const { criteria, tri, page } = parseBrowseSearchParams(params);

  const [{ listings, total }, mapAggregates, facets, session] = await Promise.all([
    getBrowsePage("LOCATION", criteria, tri, page),
    getBrowseMapAggregates("LOCATION", criteria),
    getBrowseFacets("LOCATION"),
    getSession(),
  ]);
  const favoriteIds = session
    ? Array.from(await getFavoriteListingIds(session.userId))
    : [];

  return (
    <ListingsBrowser
      listings={listings}
      total={total}
      page={page}
      pageSize={BROWSE_PAGE_SIZE}
      mapAggregates={mapAggregates}
      facets={facets}
      pieceBadge="LOCATION"
      titre="LOUER EN PÉVÈLE"
      transaction="LOCATION"
      initialQuery={criteria.querySlug}
      initialBudgetMin={criteria.budgetMin}
      initialBudgetMax={criteria.budgetMax}
      initialTypeBien={criteria.typeBien}
      initialTypeMaison={criteria.typeMaison}
      initialVillageSlugs={criteria.villageSlugs}
      initialChambresMin={criteria.chambresMin}
      initialEquipements={criteria.equipements}
      initialTri={tri}
      initialFiltre={criteria.filtre}
      isLoggedIn={session !== null}
      favoriteIds={favoriteIds}
    />
  );
}
