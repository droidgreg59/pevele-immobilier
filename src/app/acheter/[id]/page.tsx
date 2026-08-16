import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingById, getPriceHistory } from "@/lib/listings";
import { getDvfStatsForVillage, getRecentDvfTransactions } from "@/lib/dvf";
import { getSession } from "@/lib/session";
import { isListingFavorited } from "@/lib/favorites";
import { getArtisansForVillage } from "@/lib/artisans";
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

  const [dvfStats, dvfRecent, priceHistory, session, artisans] = await Promise.all([
    getDvfStatsForVillage(listing.villageSlug),
    getRecentDvfTransactions(listing.villageSlug),
    getPriceHistory(listing.id),
    getSession(),
    getArtisansForVillage(listing.villageSlug),
  ]);
  const isFavorited = session
    ? await isListingFavorited(session.userId, listing.id)
    : false;

  return (
    <ListingDetail
      listing={listing}
      dvfStats={dvfStats}
      dvfRecent={dvfRecent}
      priceHistory={priceHistory}
      isOwner={session?.userId === listing.ownerId}
      isLoggedIn={session !== null}
      isFavorited={isFavorited}
      artisans={artisans}
    />
  );
}
