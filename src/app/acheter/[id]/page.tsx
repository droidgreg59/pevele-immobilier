import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingById } from "@/lib/listings";
import { getDvfStatsForVillage, getRecentDvfTransactions } from "@/lib/dvf";
import ListingDetail from "@/components/ListingDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/acheter/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "VENTE") return {};
  return {
    title: `${listing.titre} — ${listing.commune} — Pévèle Immobilier`,
    description: listing.description,
  };
}

export default async function AcheterListingPage({
  params,
}: PageProps<"/acheter/[id]">) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "VENTE") notFound();

  const [dvfStats, dvfRecent] = await Promise.all([
    getDvfStatsForVillage(listing.villageSlug),
    getRecentDvfTransactions(listing.villageSlug),
  ]);

  return <ListingDetail listing={listing} dvfStats={dvfStats} dvfRecent={dvfRecent} />;
}
