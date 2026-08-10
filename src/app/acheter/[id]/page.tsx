import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listings, getListingById } from "@/data/listings";
import ListingDetail from "@/components/ListingDetail";

export function generateStaticParams() {
  return listings
    .filter((l) => l.transaction === "vente")
    .map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/acheter/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing || listing.transaction !== "vente") return {};
  return {
    title: `${listing.titre} — ${listing.commune} — Pévèle Immobilier`,
    description: listing.description,
  };
}

export default async function AcheterListingPage({
  params,
}: PageProps<"/acheter/[id]">) {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing || listing.transaction !== "vente") notFound();

  return <ListingDetail listing={listing} />;
}
