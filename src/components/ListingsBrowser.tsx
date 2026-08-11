"use client";

import { useState } from "react";
import Link from "next/link";
import type { ListingWithOwner } from "@/lib/listings";
import { slugify } from "@/lib/slugify";
import ListingCard from "./ListingCard";

type Filtre = "tout" | "agence" | "particulier";

const FILTRE_LABEL: Record<Filtre, string> = {
  tout: "TOUT",
  agence: "AGENCES",
  particulier: "ENTRE VOISINS",
};

function matchesFiltre(listing: ListingWithOwner, filtre: Filtre): boolean {
  if (filtre === "tout") return true;
  return filtre === "agence"
    ? listing.owner.type === "AGENCE"
    : listing.owner.type === "PARTICULIER";
}

export default function ListingsBrowser({
  listings,
  pieceBadge,
  titre,
  initialQuery,
  favoriteIds = [],
}: {
  listings: ListingWithOwner[];
  pieceBadge: string;
  titre: string;
  initialQuery?: string;
  favoriteIds?: string[];
}) {
  const [filtre, setFiltre] = useState<Filtre>("tout");

  const querySlug = initialQuery ? slugify(initialQuery) : "";
  const list = listings.filter(
    (l) =>
      matchesFiltre(l, filtre) &&
      (querySlug === "" || l.villageSlug.includes(querySlug))
  );

  return (
    <div className="animate-view-in max-w-[1400px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="border-2 border-blue px-3 py-1.5 font-mono text-sm text-blue">
          {pieceBadge}
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          {titre}
        </h2>
        <span className="ml-auto font-mono text-[11px] font-medium text-muted">
          {list.length} ANNONCE{list.length > 1 ? "S" : ""} EN LIGNE — VÉRIFIÉES
          PAR UN HUMAIN
        </span>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(Object.keys(FILTRE_LABEL) as Filtre[]).map((key) => {
          const count = listings.filter((l) => matchesFiltre(l, key)).length;
          const active = filtre === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFiltre(key)}
              className="cursor-pointer border-2 border-ink px-4 py-2.5 font-mono text-[11px] font-medium transition-colors hover:bg-[#FDEBC2]"
              style={{
                background: active ? "var(--pvl-ink)" : "#fff",
                color: active ? "#fff" : "var(--pvl-ink)",
              }}
            >
              {FILTRE_LABEL[key]} ({count})
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-2 font-mono text-[10.5px] font-medium text-muted">
          TRIER
          <span className="cursor-pointer border-2 border-ink bg-white px-3.5 py-2.5 text-ink">
            PRIX ↓ ▾
          </span>
        </span>
      </div>

      {list.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited={favoriteIds.includes(listing.id)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 font-sans text-[15px] text-muted">
          Aucune annonce ne correspond à cette recherche pour le moment.
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 border-2 border-dashed border-blue px-6 py-5">
        <span className="font-sans text-[15px] text-ink">
          Votre bien mérite sa place sur le plan —{" "}
          <b>déposer une annonce prend 5 minutes.</b>
        </span>
        <Link
          href="/vendre/deposer"
          className="bg-yellow px-5 py-3.5 font-mono text-[11.5px] font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px"
        >
          + DÉPOSER UNE ANNONCE
        </Link>
      </div>
    </div>
  );
}
