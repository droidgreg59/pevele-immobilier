import type { Metadata } from "next";
import ListingsBrowser from "@/components/ListingsBrowser";

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

  return (
    <ListingsBrowser
      transaction="location"
      pieceBadge="PIÈCE 02"
      titre="L'ENTRÉE — LOUER"
      initialQuery={q}
    />
  );
}
