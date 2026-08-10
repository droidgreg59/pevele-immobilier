import type { Metadata } from "next";
import ListingsBrowser from "@/components/ListingsBrowser";
import { getPublicListings } from "@/lib/listings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acheter en Pévèle — Pévèle Immobilier",
  description:
    "Toutes les annonces de maisons, appartements et terrains à vendre en Pévèle, agences et particuliers.",
};

export default async function AcheterPage({
  searchParams,
}: PageProps<"/acheter">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const listings = await getPublicListings("VENTE");

  return (
    <ListingsBrowser
      listings={listings}
      pieceBadge="PIÈCE 01"
      titre="LE SÉJOUR — ACHETER"
      initialQuery={q}
    />
  );
}
