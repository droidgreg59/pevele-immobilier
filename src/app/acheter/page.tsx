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
  title: "Acheter en Pévèle — Annonces et prix immobiliers",
  description:
    "Toutes les annonces de maisons, appartements et terrains à vendre dans les 35 communes de la Pévèle, agences et particuliers, avec le prix moyen au m² de chaque village.",
  alternates: {
    canonical: "/acheter",
  },
};

export default async function AcheterPage({ searchParams }: PageProps<"/acheter">) {
  const params = await searchParams;
  const { criteria, tri, page } = parseBrowseSearchParams(params);

  const [{ listings, total }, mapAggregates, facets, session] = await Promise.all([
    getBrowsePage("VENTE", criteria, tri, page),
    getBrowseMapAggregates("VENTE", criteria),
    getBrowseFacets("VENTE"),
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
      pieceBadge="ACHAT"
      titre="ACHETER EN PÉVÈLE"
      transaction="VENTE"
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
