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
      pieceBadge="PIÈCE 02"
      titre="L'ENTRÉE — LOUER"
      initialQuery={q}
      favoriteIds={favoriteIds}
    />
  );
}
