import type { Metadata } from "next";
import ListingsBrowser from "@/components/ListingsBrowser";
import { getPublicListings } from "@/lib/listings";
import { getFavoriteListingIds } from "@/lib/favorites";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Louer en Pévèle — Pévèle Immobilier",
  description:
    "Toutes les annonces de location en Pévèle, agences et particuliers.",
};

export default async function LouerPage({
  searchParams,
}: PageProps<"/louer">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const budget = typeof params.budget === "string" ? Number(params.budget) : undefined;
  const budgetMin =
    typeof params.budgetMin === "string" ? Number(params.budgetMin) : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const initialTypeBien =
    type === "MAISON" || type === "APPARTEMENT" || type === "TERRAIN" ? type : undefined;
  const villagesParam = typeof params.villages === "string" ? params.villages : undefined;
  const initialVillageSlugs = villagesParam
    ? villagesParam.split(",").filter(Boolean)
    : undefined;
  const chambresMinParam =
    typeof params.chambresMin === "string" ? Number(params.chambresMin) : undefined;
  const initialChambresMin =
    chambresMinParam !== undefined && Number.isFinite(chambresMinParam)
      ? chambresMinParam
      : undefined;
  const equipParam = typeof params.equip === "string" ? params.equip : undefined;
  const initialEquipements = equipParam ? equipParam.split(",").filter(Boolean) : undefined;
  const [listings, session] = await Promise.all([
    getPublicListings("LOCATION"),
    getSession(),
  ]);
  const favoriteIds = session
    ? Array.from(await getFavoriteListingIds(session.userId))
    : [];

  return (
    <ListingsBrowser
      listings={listings}
      pieceBadge="LOCATION"
      titre="LOUER EN PÉVÈLE"
      transaction="LOCATION"
      initialQuery={q}
      initialBudgetMin={
        budgetMin !== undefined && Number.isFinite(budgetMin) ? budgetMin : undefined
      }
      initialBudgetMax={budget !== undefined && Number.isFinite(budget) ? budget : undefined}
      initialTypeBien={initialTypeBien}
      initialVillageSlugs={initialVillageSlugs}
      initialChambresMin={initialChambresMin}
      initialEquipements={initialEquipements}
      isLoggedIn={session !== null}
      favoriteIds={favoriteIds}
    />
  );
}
