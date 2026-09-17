import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getListingsByUser } from "@/lib/listings";
import { getFavoriteListingIds } from "@/lib/favorites";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes annonces",
};

export default async function CompteParticulierAnnoncesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/particulier/annonces");
  if (session.type !== "PARTICULIER") redirect("/compte");

  const [listings, favoriteIds] = await Promise.all([
    getListingsByUser(session.userId),
    getFavoriteListingIds(session.userId),
  ]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-[24px] text-ink">Mes annonces ({listings.length})</h2>
        <Link
          href="/vendre/deposer"
          className="rounded-full bg-yellow px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          + Déposer une annonce
        </Link>
      </div>

      {listings.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {listings.map((listing) => (
            <div key={listing.id} className="flex flex-col gap-2">
              <ListingCard listing={listing} isFavorited={favoriteIds.has(listing.id)} />
              {listing.statut === "REFUSEE" ? (
                <p className="m-0 text-[12.5px] text-muted">
                  Refusée{listing.statutRaison ? ` — ${listing.statutRaison}` : ""}
                </p>
              ) : null}
              <Link
                href={`/compte/annonces/${listing.id}`}
                className="self-start text-[12.5px] font-semibold text-blue"
              >
                Modifier cette annonce →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">Vous n&apos;avez pas encore déposé d&apos;annonce.</p>
      )}
    </div>
  );
}
