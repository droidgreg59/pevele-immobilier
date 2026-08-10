import Link from "next/link";
import type { ListingWithOwner } from "@/lib/listings";
import { formatPrix } from "@/lib/format";
import FavoriteButton from "./FavoriteButton";

export default function ListingCard({ listing }: { listing: ListingWithOwner }) {
  const particulier = listing.owner.type === "PARTICULIER";
  const enVerification = listing.statut === "EN_VERIFICATION";
  const detailHref = `/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`;

  return (
    <article className="animate-draw-in flex flex-col border-[2.5px] border-ink bg-white shadow-[6px_6px_0_rgba(39,67,166,.22)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
      <div className="relative h-[215px] overflow-hidden border-b-[2.5px] border-ink">
        <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,#EDEAE1_0_14px,#E4E0D3_14px_28px)] px-4 text-center font-mono text-[10.5px] text-muted-2">
          {listing.photoLabel}
        </div>
        {listing.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photo}
            alt={listing.titre}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <span
          className="absolute left-2.5 top-2.5 whitespace-nowrap border-2 border-ink px-2.5 py-1.5 font-mono text-[9.5px] font-semibold"
          style={{
            background: particulier ? "#FBF3DC" : "#EDF1FB",
            color: particulier ? "var(--pvl-gold)" : "var(--pvl-blue)",
          }}
        >
          {particulier ? "ENTRE VOISINS" : "AGENCE"}
        </span>
        <FavoriteButton className="absolute right-2.5 top-2.5 flex items-center justify-center rounded-full border-2 border-ink bg-white text-[16px] leading-none text-blue" />
        <span className="absolute bottom-2.5 left-2.5 bg-ink px-3.5 py-1.5 font-display text-[26px] tracking-[.02em] text-yellow">
          {formatPrix(listing.prix, listing.transaction)}
        </span>
        {enVerification ? (
          <span className="absolute bottom-0 right-0 border-l-2 border-t-2 border-ink bg-blue px-2.5 py-1.5 font-mono text-[9px] font-semibold text-white">
            EN VÉRIFICATION
          </span>
        ) : listing.badge ? (
          <span className="absolute bottom-0 right-0 border-l-2 border-t-2 border-ink bg-yellow px-2.5 py-1.5 font-mono text-[9px] font-semibold text-ink">
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
          <Link
            href={`/villages/${listing.villageSlug}`}
            className="font-mono text-[10.5px] font-medium text-blue"
          >
            ◉ {listing.commune.toUpperCase()}
          </Link>
        </div>
        <div className="mt-auto flex text-center">
          <span className="flex-1 border-2 border-ink bg-[#F7F4EA] px-1 py-1.5">
            <b className="block font-sans text-[13px] font-semibold text-ink">
              {listing.pieces} P.
            </b>
            <span className="font-mono text-[8px] font-medium text-muted">
              PIÈCES
            </span>
          </span>
          <span className="flex-1 border-2 border-l-0 border-ink bg-[#F7F4EA] px-1 py-1.5">
            <b className="block font-sans text-[13px] font-semibold text-ink">
              {listing.surface} M²
            </b>
            <span className="font-mono text-[8px] font-medium text-muted">
              SURFACE
            </span>
          </span>
          <span className="flex-1 border-2 border-l-0 border-ink bg-[#F7F4EA] px-1 py-1.5">
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
          className="flex justify-between border-t-2 border-line pt-2.5 font-mono text-[11px] font-semibold text-blue hover:text-ink"
        >
          VOIR LA FICHE COMPLÈTE
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}
