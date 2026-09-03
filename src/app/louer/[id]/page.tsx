import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingById, getPriceHistory } from "@/lib/listings";
import { getSession } from "@/lib/session";
import { isListingFavorited } from "@/lib/favorites";
import { getArtisansForVillage } from "@/lib/artisans";
import { getOpenHouseForListing } from "@/lib/open-house";
import ListingDetail from "@/components/ListingDetail";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, listingJsonLd } from "@/lib/seo";
import { formatPrix } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/louer/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "LOCATION") return {};
  const title = `${listing.titre} à louer à ${listing.commune} — ${formatPrix(listing.prix, listing.transaction)}`;
  return {
    title,
    description: listing.description,
    alternates: {
      canonical: `/louer/${listing.id}`,
    },
    openGraph: {
      title,
      description: listing.description,
      // L'image de partage est la carte de marque générée par opengraph-image.tsx.
    },
  };
}

export default async function LouerListingPage({
  params,
}: PageProps<"/louer/[id]">) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "LOCATION") notFound();

  const [priceHistory, session, artisans] = await Promise.all([
    getPriceHistory(listing.id),
    getSession(),
    getArtisansForVillage(listing.villageSlug),
  ]);
  const [isFavorited, openHouse] = await Promise.all([
    session ? isListingFavorited(session.userId, listing.id) : Promise.resolve(false),
    getOpenHouseForListing(listing.id, session?.userId),
  ]);

  return (
    <>
      <JsonLd data={listingJsonLd(listing)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Louer", url: "/louer" },
          { name: listing.commune, url: `/villages/${listing.villageSlug}` },
          { name: listing.titre, url: `/louer/${listing.id}` },
        ])}
      />
      <ListingDetail
        listing={listing}
        dvfStats={null}
        dvfRecent={[]}
        priceHistory={priceHistory}
        isOwner={session?.userId === listing.ownerId}
        isLoggedIn={session !== null}
        isFavorited={isFavorited}
        artisans={artisans}
        openHouse={openHouse}
        viewerNom={session?.nom ?? ""}
      />
    </>
  );
}
