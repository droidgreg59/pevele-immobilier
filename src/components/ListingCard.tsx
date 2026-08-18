import Link from "next/link";
import type { ListingWithOwner } from "@/lib/listings";
import { formatPrix } from "@/lib/format";
import FavoriteButton from "./FavoriteButton";

export default function ListingCard({
  listing,
  isFavorited = false,
}: {
  listing: ListingWithOwner;
  isFavorited?: boolean;
}) {
  const particulier = listing.owner.type === "PARTICULIER";
  const enVerification = listing.statut === "EN_VERIFICATION";
  const refusee = listing.statut === "REFUSEE";
  const detailHref = `/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`;
  const cover = listing.photos[0];
  const enBaisse = (listing.priceHistory[0]?.prix ?? listing.prix) > listing.prix;

  return (
    <article className="animate-draw-in flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-[215px] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={listing.titre}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface px-4 text-center font-mono text-[10.5px] text-muted-2">
            Aucune photo pour le moment
          </div>
        )}
        <span
          className="absolute left-2.5 top-2.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold shadow-sm"
          style={{
            background: particulier ? "#FBF3DC" : "#EDF1FB",
            color: particulier ? "var(--pvl-gold)" : "var(--pvl-blue)",
          }}
        >
          {particulier ? "ENTRE VOISINS" : "AGENCE"}
        </span>
        <FavoriteButton
          listingId={listing.id}
          initialFavorited={isFavorited}
          className="absolute right-2.5 top-2.5 flex items-center justify-center rounded-full border border-line bg-white text-[16px] leading-none text-blue shadow-sm"
        />
        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="rounded-xl bg-ink px-3.5 py-1.5 font-display text-[26px] tracking-[.02em] text-yellow">
            {formatPrix(listing.prix, listing.transaction)}
          </span>
          {enBaisse ? (
            <span className="rounded-full bg-white px-2 py-1 font-mono text-[9px] font-semibold text-green shadow-sm">
              ↓ BAISSE
            </span>
          ) : null}
        </span>
        {enVerification ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-blue px-2.5 py-1 font-mono text-[9px] font-semibold text-white shadow-sm">
            EN VÉRIFICATION
          </span>
        ) : refusee ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-ink px-2.5 py-1 font-mono text-[9px] font-semibold text-white shadow-sm">
            REFUSÉE
          </span>
        ) : listing.badge ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-yellow px-2.5 py-1 font-mono text-[9px] font-semibold text-ink shadow-sm">
            {listing.badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
        <div className="flex flex-col gap-0.5">
          <Link
            href={detailHref}
            className="font-sans text-[17.5px] font-bold text-ink"
          >
            {listing.titre}
          </Link>
          <span className="flex items-center gap-1.5">
            <Link
              href={`/villages/${listing.villageSlug}`}
              className="font-mono text-[10.5px] font-medium text-blue"
            >
              ◉ {listing.commune.toUpperCase()}
            </Link>
            <span className="font-mono text-[10.5px] text-muted-2">
              · {listing.typeBien}
            </span>
          </span>
        </div>
        <div className="mt-auto flex gap-1.5 text-center">
          <span className="flex-1 rounded-xl bg-surface px-1 py-1.5">
            <b className="block font-sans text-[13px] font-semibold text-ink">
              {listing.pieces} P.
            </b>
            <span className="font-mono text-[8px] font-medium text-muted">
              PIÈCES
            </span>
          </span>
          <span className="flex-1 rounded-xl bg-surface px-1 py-1.5">
            <b className="block font-sans text-[13px] font-semibold text-ink">
              {listing.surface} M²
            </b>
            <span className="font-mono text-[8px] font-medium text-muted">
              SURFACE
            </span>
          </span>
          <span className="flex-1 rounded-xl bg-surface px-1 py-1.5">
            <b className="block font-sans text-[13px] font-semibold text-ink">
              {listing.exterieur}
            </b>
            <span className="font-mono text-[8px] font-medium text-muted">
              EXTÉRIEUR
            </span>
          </span>
        </div>
        <Link
          href={detailHref}
          className="flex justify-between border-t border-line pt-2.5 font-mono text-[11px] font-semibold text-blue hover:text-ink"
        >
          VOIR LA FICHE COMPLÈTE
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}
