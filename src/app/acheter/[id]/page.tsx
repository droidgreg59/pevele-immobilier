import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingById, getPriceHistory } from "@/lib/listings";
import { getDvfStatsForVillage, getRecentDvfTransactions } from "@/lib/dvf";
import { getSession } from "@/lib/session";
import { isListingFavorited } from "@/lib/favorites";
import { getArtisansForVillage } from "@/lib/artisans";
import { getOpenHouseForListing } from "@/lib/open-house";
import { getCommuneRisques } from "@/lib/georisques";
import { getVillageBySlug } from "@/data/villages";
import { villageCoords } from "@/data/village-coords";
import { villageAmenities } from "@/data/village-amenities";
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
      // L'image de partage est la carte de marque générée par opengraph-image.tsx.
    },
  };
}

export default async function AcheterListingPage({
  params,
}: PageProps<"/acheter/[id]">) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "VENTE") notFound();

  const village = getVillageBySlug(listing.villageSlug);
  const [dvfStats, dvfRecent, priceHistory, session, artisans, risques] = await Promise.all([
    getDvfStatsForVillage(listing.villageSlug),
    getRecentDvfTransactions(listing.villageSlug),
    getPriceHistory(listing.id),
    getSession(),
    getArtisansForVillage(listing.villageSlug),
    village
      ? getCommuneRisques(village.insee, villageCoords[village.insee] ?? null)
      : Promise.resolve(null),
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
        openHouse={openHouse}
        risques={risques}
        amenities={village ? villageAmenities[village.insee] ?? null : null}
        viewerNom={session?.nom ?? ""}
      />
    </>
  );
}
