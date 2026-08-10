import type { Metadata } from "next";
import ListingsBrowser from "@/components/ListingsBrowser";

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

  return (
    <ListingsBrowser
      transaction="vente"
      pieceBadge="PIÈCE 01"
      titre="LE SÉJOUR — ACHETER"
      initialQuery={q}
    />
  );
}
