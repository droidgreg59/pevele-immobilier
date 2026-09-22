import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFavoritesHub } from "@/lib/favorites";
import FavoritesHub, { type FavoriteHubItem } from "@/components/FavoritesHub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes favoris",
};

export default async function CompteParticulierFavorisPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/particulier/favoris");
  if (session.type !== "PARTICULIER") redirect("/compte");

  const hub = await getFavoritesHub(session.userId);

  const items: FavoriteHubItem[] = hub.map((entry) => {
    const { listing } = entry;
    const enBaisse = (listing.priceHistory[0]?.prix ?? listing.prix) > listing.prix;
    return {
      id: entry.id,
      listingId: listing.id,
      visite: entry.visite,
      surveillePrix: entry.surveillePrix,
      contacte: entry.contacte,
      favoritedLabel: entry.createdAt.toLocaleDateString("fr-FR"),
      detailHref: `/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`,
      villageSlug: listing.villageSlug,
      commune: listing.commune,
      titre: listing.titre,
      prix: listing.prix,
      transaction: listing.transaction,
      coverUrl: listing.photos[0]?.url,
      ownerType: listing.owner.type,
      pieces: listing.pieces,
      surface: listing.surface,
      exterieur: listing.exterieur,
      enBaisse,
      enVerification: listing.statut === "EN_VERIFICATION",
    };
  });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-[24px] text-ink">Mes favoris ({items.length})</h2>
        <Link href="/acheter" className="text-[13px] font-semibold text-blue">
          Parcourir les annonces →
        </Link>
      </div>

      <p className="m-0 mt-1.5 max-w-[64ch] text-[12.5px] text-muted">
        Cochez « visité » ou « contacté » pour vous organiser. Activez «&nbsp;surveiller
        la baisse de prix&nbsp;» sur un bien&nbsp;: vous recevrez un email dès que son
        prix baisse.
      </p>

      <div className="mt-5">
        <FavoritesHub items={items} />
      </div>
    </div>
  );
}
