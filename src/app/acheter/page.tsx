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
import { getSession, isParticulierSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const TITLE = "Acheter en Pévèle — Annonces et prix immobiliers";
const DESCRIPTION =
  "Toutes les annonces de maisons, appartements et terrains à vendre dans les 44 communes de la Pévèle, agences et particuliers, avec le prix moyen au m² de chaque village.";

// generateMetadata (plutôt qu'un objet metadata statique) pour que le
// canonical suive la page réelle : ?page=2, ?page=3… ont leur propre
// canonical au lieu de canonicaliser vers la page 1 (ce qui les faisait
// disparaître de l'index dès que le catalogue dépasse une page). Les autres
// paramètres de recherche (villages, budget, type…) restent volontairement
// hors du canonical — seules les combinaisons choisies au cas par cas sont
// destinées à être indexées séparément, pas toutes les variantes de filtre.
export async function generateMetadata({
  searchParams,
}: PageProps<"/acheter">): Promise<Metadata> {
  const params = await searchParams;
  const { page } = parseBrowseSearchParams(params);
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: page > 1 ? `/acheter?page=${page}` : "/acheter",
    },
  };
}

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
      isParticulier={isParticulierSession(session)}
      favoriteIds={favoriteIds}
    />
  );
}
