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

export default async function CompteFavorisPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/favoris");

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
    <div className="animate-fade-up max-w-[1000px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Mes favoris
      </h1>
      <Link href="/compte" className="text-[13px] font-semibold text-blue">
        ← Mon compte
      </Link>

      <p className="mt-6 max-w-[64ch] text-[14.5px] leading-[1.6] text-muted">
        Cochez « visité » ou « contacté » pour vous organiser. Activez «&nbsp;surveiller
        la baisse de prix&nbsp;» sur un bien&nbsp;: vous recevrez un email dès que son
        prix baisse.
      </p>

      <div className="mt-7">
        <FavoritesHub items={items} />
      </div>
    </div>
  );
}
