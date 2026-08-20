"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ListingWithOwner } from "@/lib/listings";
import { formatPrix, formatPrixM2 } from "@/lib/format";
import { isRecentListing } from "@/lib/listing-filters";
import { useViewedListingIds } from "@/lib/viewed-listings";
import FavoriteButton from "./FavoriteButton";

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

export default function ListingCard({
  listing,
  isFavorited = false,
}: {
  listing: ListingWithOwner;
  isFavorited?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const viewedIds = useViewedListingIds();
  const consulte = viewedIds.has(listing.id);

  const particulier = listing.owner.type === "PARTICULIER";
  const detailHref = `/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`;
  const photos = listing.photos;
  const enBaisse = (listing.priceHistory[0]?.prix ?? listing.prix) > listing.prix;
  const isNew = isRecentListing(listing);
  const prixM2 = listing.transaction === "VENTE" ? formatPrixM2(listing.prix, listing.surface) : null;

  const statusBadge =
    listing.statut === "EN_VERIFICATION"
      ? { label: "En vérification", bg: "var(--pvl-blue)", fg: "#fff" }
      : listing.statut === "REFUSEE"
        ? { label: "Refusée", bg: "var(--pvl-ink)", fg: "#fff" }
        : enBaisse
          ? { label: "↓ Baisse", bg: "var(--pvl-green)", fg: "#fff" }
          : isNew
            ? { label: "Nouveau", bg: "var(--pvl-blue-soft)", fg: "var(--pvl-blue)" }
            : listing.badge
              ? { label: listing.badge, bg: "var(--pvl-yellow)", fg: "var(--pvl-ink)" }
              : null;

  function scrollToIndex(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setActiveIndex(clamped);
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={detailHref} aria-label={listing.titre} className="absolute inset-0 z-10" />

      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {photos.length > 0 ? (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt={listing.titre}
                className="h-full w-full shrink-0 snap-center object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-[12px] text-muted-2">
            Aucune photo pour le moment
          </div>
        )}

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                scrollToIndex(activeIndex - 1);
              }}
              aria-label="Photo précédente"
              className="absolute left-2 top-1/2 z-20 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition group-hover:opacity-100 md:flex"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                scrollToIndex(activeIndex + 1);
              }}
              aria-label="Photo suivante"
              className="absolute right-2 top-1/2 z-20 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition group-hover:opacity-100 md:flex"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 gap-1">
              {photos.map((p, i) => (
                <span
                  key={p.id}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i === activeIndex ? 14 : 4,
                    background: i === activeIndex ? "#fff" : "rgba(255,255,255,.6)",
                  }}
                />
              ))}
            </div>
          </>
        ) : null}

        {statusBadge ? (
          <span
            className="absolute left-2.5 top-2.5 z-20 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm"
            style={{ background: statusBadge.bg, color: statusBadge.fg }}
          >
            {statusBadge.label}
          </span>
        ) : null}

        <div className="absolute right-2.5 top-2.5 z-20">
          <FavoriteButton
            listingId={listing.id}
            initialFavorited={isFavorited}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/92 text-[16px] leading-none text-blue shadow-sm"
          />
        </div>
      </div>

      <div
        className={`flex flex-1 flex-col gap-1.5 px-4 pb-3.5 pt-3 transition-opacity ${
          consulte ? "opacity-60 group-hover:opacity-100" : ""
        }`}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[20px] tracking-[.01em] text-ink">
            {formatPrix(listing.prix, listing.transaction)}
          </span>
          {prixM2 ? <span className="text-[12px] text-muted-2">{prixM2}</span> : null}
        </div>
        <p className="m-0 truncate text-[14px] font-semibold text-ink">
          {TYPE_BIEN_LABEL[listing.typeBien] ?? listing.typeBien} · {listing.surface} m² ·{" "}
          {listing.chambres} ch. · {listing.exterieur}
        </p>
        <p className="m-0 text-[13px] text-muted">
          {listing.commune}{" "}
          <Link
            href={`/villages/${listing.villageSlug}`}
            className="relative z-20 text-blue hover:underline"
          >
            vivre ici →
          </Link>
        </p>

        <div className="mt-auto flex items-center gap-1.5 pt-2">
          {particulier ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
              style={{ background: "#f7f0dd", color: "var(--pvl-gold)" }}
            >
              Particulier
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              {listing.owner.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.owner.logoUrl}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[9px] font-bold text-muted">
                  {(listing.owner.entreprise ?? listing.owner.nom).charAt(0).toUpperCase()}
                </span>
              )}
              {listing.owner.entreprise ?? listing.owner.nom}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
