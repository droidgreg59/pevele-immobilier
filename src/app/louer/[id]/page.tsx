import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listings, getListingById } from "@/data/listings";
import ListingDetail from "@/components/ListingDetail";

export function generateStaticParams() {
  return listings
    .filter((l) => l.transaction === "location")
    .map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/louer/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing || listing.transaction !== "location") return {};
  return {
    title: `${listing.titre} — ${listing.commune} — Pévèle Immobilier`,
    description: listing.description,
  };
}

export default async function LouerListingPage({
  params,
}: PageProps<"/louer/[id]">) {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing || listing.transaction !== "location") notFound();

  return <ListingDetail listing={listing} />;
}
