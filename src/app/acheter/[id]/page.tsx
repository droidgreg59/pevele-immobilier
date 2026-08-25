import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingById, getPriceHistory } from "@/lib/listings";
import { getDvfStatsForVillage, getRecentDvfTransactions } from "@/lib/dvf";
import { getSession } from "@/lib/session";
import { isListingFavorited } from "@/lib/favorites";
import { getArtisansForVillage } from "@/lib/artisans";
import ListingDetail from "@/components/ListingDetail";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, listingJsonLd } from "@/lib/seo";
import { formatPrix } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/acheter/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "VENTE") return {};
  const title = `${listing.titre} à vendre à ${listing.commune} — ${formatPrix(listing.prix, listing.transaction)}`;
  return {
    title,
    description: listing.description,
    alternates: {
      canonical: `/acheter/${listing.id}`,
    },
    openGraph: {
      title,
      description: listing.description,
      images: listing.photos.length > 0 ? listing.photos.map((p) => ({ url: p.url })) : undefined,
    },
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
    <>
      <JsonLd data={listingJsonLd(listing)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Acheter", url: "/acheter" },
          { name: listing.commune, url: `/villages/${listing.villageSlug}` },
          { name: listing.titre, url: `/acheter/${listing.id}` },
        ])}
      />
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
    </>
  );
}
