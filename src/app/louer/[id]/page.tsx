import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingById, getPriceHistory } from "@/lib/listings";
import { getSession } from "@/lib/session";
import { isListingFavorited } from "@/lib/favorites";
import ListingDetail from "@/components/ListingDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/louer/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "LOCATION") return {};
  return {
    title: `${listing.titre} — ${listing.commune} — Pévèle Immobilier`,
    description: listing.description,
  };
}

export default async function LouerListingPage({
  params,
}: PageProps<"/louer/[id]">) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "LOCATION") notFound();

  const [priceHistory, session] = await Promise.all([
    getPriceHistory(listing.id),
    getSession(),
  ]);
  const isFavorited = session
    ? await isListingFavorited(session.userId, listing.id)
    : false;

  return (
    <ListingDetail
      listing={listing}
      dvfStats={null}
      dvfRecent={[]}
      priceHistory={priceHistory}
      isOwner={session?.userId === listing.ownerId}
      isFavorited={isFavorited}
    />
  );
}
