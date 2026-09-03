import { getListingById } from "@/lib/listings";
import { listingOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Annonce — Pévèle Immobilier";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.transaction !== "LOCATION") {
    return listingOgImage({
      titre: "Locations immobilières en Pévèle",
      prix: 0,
      commune: "35 communes",
      transaction: "LOCATION",
      typeBien: "MAISON",
      ownerType: "AGENCE",
    });
  }
  return listingOgImage({
    titre: listing.titre,
    prix: listing.prix,
    commune: listing.commune,
    transaction: listing.transaction,
    typeBien: listing.typeBien,
    ownerType: listing.owner.type,
  });
}
