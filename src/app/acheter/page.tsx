import type { Metadata } from "next";
import ListingsBrowser from "@/components/ListingsBrowser";
import { getPublicListings } from "@/lib/listings";
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

export default async function AcheterPage({
  searchParams,
}: PageProps<"/acheter">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const budget =
    typeof params.budget === "string" && params.budget !== "" ? Number(params.budget) : undefined;
  const budgetMin =
    typeof params.budgetMin === "string" && params.budgetMin !== ""
      ? Number(params.budgetMin)
      : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const initialTypeBien =
    type === "MAISON" || type === "APPARTEMENT" || type === "TERRAIN" ? type : undefined;
  const villagesParam = typeof params.villages === "string" ? params.villages : undefined;
  const initialVillageSlugs = villagesParam
    ? villagesParam.split(",").filter(Boolean)
    : undefined;
  const chambresMinParam =
    typeof params.chambresMin === "string" && params.chambresMin !== ""
      ? Number(params.chambresMin)
      : undefined;
  const initialChambresMin =
    chambresMinParam !== undefined && Number.isFinite(chambresMinParam)
      ? chambresMinParam
      : undefined;
  const equipParam = typeof params.equip === "string" ? params.equip : undefined;
  const initialEquipements = equipParam ? equipParam.split(",").filter(Boolean) : undefined;
  const triParam = typeof params.tri === "string" ? params.tri : undefined;
  const initialTri =
    triParam === "prix_desc" || triParam === "prix_asc" || triParam === "recent" || triParam === "surface_desc"
      ? triParam
      : undefined;
  const filtreParam = typeof params.filtre === "string" ? params.filtre : undefined;
  const initialFiltre =
    filtreParam === "agence" || filtreParam === "particulier" ? filtreParam : undefined;
  const [listings, session] = await Promise.all([
    getPublicListings("VENTE"),
    getSession(),
  ]);
  const favoriteIds = session
    ? Array.from(await getFavoriteListingIds(session.userId))
    : [];

  return (
    <ListingsBrowser
      listings={listings}
      pieceBadge="ACHAT"
      titre="ACHETER EN PÉVÈLE"
      transaction="VENTE"
      initialQuery={q}
      initialBudgetMin={
        budgetMin !== undefined && Number.isFinite(budgetMin) ? budgetMin : undefined
      }
      initialBudgetMax={budget !== undefined && Number.isFinite(budget) ? budget : undefined}
      initialTypeBien={initialTypeBien}
      initialVillageSlugs={initialVillageSlugs}
      initialChambresMin={initialChambresMin}
      initialEquipements={initialEquipements}
      initialTri={initialTri}
      initialFiltre={initialFiltre}
      isLoggedIn={session !== null}
      favoriteIds={favoriteIds}
    />
  );
}
