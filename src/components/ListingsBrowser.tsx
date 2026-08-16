"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ListingWithOwner } from "@/lib/listings";
import { slugify } from "@/lib/slugify";
import { createSavedSearchAction } from "@/lib/saved-search-actions";
import { EQUIPEMENTS } from "@/data/equipements";
import ListingCard from "./ListingCard";
import VillageMultiSelect from "./VillageMultiSelect";

type Filtre = "tout" | "agence" | "particulier";
type TypeBienFiltre = "TOUS" | "MAISON" | "APPARTEMENT" | "TERRAIN";

const FILTRE_LABEL: Record<Filtre, string> = {
  tout: "TOUT",
  agence: "AGENCES",
  particulier: "ENTRE VOISINS",
};

const TYPE_BIEN_LABEL: Record<TypeBienFiltre, string> = {
  TOUS: "TOUS TYPES",
  MAISON: "MAISON",
  APPARTEMENT: "APPARTEMENT",
  TERRAIN: "TERRAIN",
};

function matchesFiltre(listing: ListingWithOwner, filtre: Filtre): boolean {
  if (filtre === "tout") return true;
  return filtre === "agence"
    ? listing.owner.type === "AGENCE"
    : listing.owner.type === "PARTICULIER";
}

function matchesTypeBien(listing: ListingWithOwner, typeBien: TypeBienFiltre): boolean {
  return typeBien === "TOUS" || listing.typeBien === typeBien;
}

export default function ListingsBrowser({
  listings,
  pieceBadge,
  titre,
  transaction,
  initialQuery,
  initialBudgetMin,
  initialBudgetMax,
  initialTypeBien,
  initialVillageSlugs,
  initialChambresMin,
  initialEquipements,
  isLoggedIn = false,
  favoriteIds = [],
}: {
  listings: ListingWithOwner[];
  pieceBadge: string;
  titre: string;
  transaction: "VENTE" | "LOCATION";
  initialQuery?: string;
  initialBudgetMin?: number;
  initialBudgetMax?: number;
  initialTypeBien?: TypeBienFiltre;
  initialVillageSlugs?: string[];
  initialChambresMin?: number;
  initialEquipements?: string[];
  isLoggedIn?: boolean;
  favoriteIds?: string[];
}) {
  const pathname = usePathname();
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [typeBien, setTypeBien] = useState<TypeBienFiltre>(initialTypeBien ?? "TOUS");
  const [budgetMin, setBudgetMin] = useState<number | undefined>(
    initialBudgetMin
  );
  const [budgetMax, setBudgetMax] = useState<number | undefined>(
    initialBudgetMax
  );
  const [villageSlugs, setVillageSlugs] = useState<string[]>(
    initialVillageSlugs ?? []
  );
  const [chambresMin, setChambresMin] = useState<number | undefined>(
    initialChambresMin
  );
  const [equipements, setEquipements] = useState<string[]>(
    initialEquipements ?? []
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const querySlug = initialQuery ? slugify(initialQuery) : "";
  const list = listings.filter(
    (l) =>
      matchesFiltre(l, filtre) &&
      matchesTypeBien(l, typeBien) &&
      (villageSlugs.length > 0
        ? villageSlugs.includes(l.villageSlug)
        : querySlug === "" || l.villageSlug.includes(querySlug)) &&
      (budgetMin === undefined || l.prix >= budgetMin) &&
      (budgetMax === undefined || l.prix <= budgetMax) &&
      (chambresMin === undefined || l.chambres >= chambresMin) &&
      equipements.every((tag) =>
        l.equipements.toLowerCase().includes(tag.toLowerCase())
      )
  );

  function toggleEquipement(tag: string) {
    setSaved(false);
    setEquipements((prev) =>
      prev.includes(tag) ? prev.filter((e) => e !== tag) : [...prev, tag]
    );
  }

  function handleSaveSearch() {
    setSaved(true);
    startTransition(async () => {
      await createSavedSearchAction({
        transaction,
        typeBien: typeBien === "TOUS" ? undefined : typeBien,
        q: villageSlugs.length > 0 ? undefined : initialQuery,
        villageSlugs: villageSlugs.length > 0 ? villageSlugs : undefined,
        chambresMin,
        equipements: equipements.length > 0 ? equipements : undefined,
        budgetMin,
        budgetMax,
        next: pathname,
      });
    });
  }

  return (
    <div className="animate-view-in max-w-[1400px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs font-medium text-blue">
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
        ← RETOUR À L&apos;ACCUEIL
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(Object.keys(TYPE_BIEN_LABEL) as TypeBienFiltre[]).map((key) => {
          const count = listings.filter((l) => matchesTypeBien(l, key)).length;
          const active = typeBien === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTypeBien(key)}
              className="cursor-pointer rounded-full px-4 py-2 font-mono text-[11px] font-medium transition-colors hover:bg-surface"
              style={{
                background: active ? "var(--pvl-gold)" : "transparent",
                color: active ? "#fff" : "var(--pvl-ink)",
                border: active ? "none" : "1px solid var(--pvl-line)",
              }}
            >
              {TYPE_BIEN_LABEL[key]} ({count})
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {EQUIPEMENTS.map((eq) => {
          const active = equipements.includes(eq);
          return (
            <button
              key={eq}
              type="button"
              onClick={() => toggleEquipement(eq)}
              className="cursor-pointer rounded-full px-4 py-2 font-mono text-[11px] font-medium transition-colors hover:bg-surface"
              style={{
                background: active ? "#FBF3DC" : "transparent",
                color: "var(--pvl-ink)",
                border: active ? "1px solid transparent" : "1px solid var(--pvl-line)",
              }}
            >
              {eq}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {(Object.keys(FILTRE_LABEL) as Filtre[]).map((key) => {
          const count = listings.filter((l) => matchesFiltre(l, key)).length;
          const active = filtre === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFiltre(key)}
              className="cursor-pointer rounded-full px-4 py-2 font-mono text-[11px] font-medium transition-colors hover:bg-surface"
              style={{
                background: active ? "var(--pvl-ink)" : "transparent",
                color: active ? "#fff" : "var(--pvl-ink)",
                border: active ? "none" : "1px solid var(--pvl-line)",
              }}
            >
              {FILTRE_LABEL[key]} ({count})
            </button>
          );
        })}
        <label className="flex items-center gap-2 font-mono text-[10.5px] font-medium text-muted">
          BUDGET MIN
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="€"
            defaultValue={initialBudgetMin ?? ""}
            onChange={(e) => {
              setSaved(false);
              const v = e.target.value;
              setBudgetMin(v === "" ? undefined : Number(v));
            }}
            className="w-[110px] rounded-xl border border-line bg-white px-3 py-2 font-sans text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex items-center gap-2 font-mono text-[10.5px] font-medium text-muted">
          BUDGET MAX
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="€"
            defaultValue={initialBudgetMax ?? ""}
            onChange={(e) => {
              setSaved(false);
              const v = e.target.value;
              setBudgetMax(v === "" ? undefined : Number(v));
            }}
            className="w-[110px] rounded-xl border border-line bg-white px-3 py-2 font-sans text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex items-center gap-2 font-mono text-[10.5px] font-medium text-muted">
          CHAMBRES MIN
          <select
            defaultValue={initialChambresMin ?? ""}
            onChange={(e) => {
              setSaved(false);
              const v = e.target.value;
              setChambresMin(v === "" ? undefined : Number(v));
            }}
            className="rounded-full border border-line bg-white px-3 py-2 font-sans text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          >
            <option value="">Peu importe</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto flex items-center gap-2 font-mono text-[10.5px] font-medium text-muted">
          TRIER
          <span className="cursor-pointer rounded-full border border-line bg-white px-3.5 py-2 text-ink">
            PRIX ↓ ▾
          </span>
        </span>
        {isLoggedIn ? (
          <button
            type="button"
            disabled={isPending || saved}
            onClick={handleSaveSearch}
            className="rounded-full border border-line px-3.5 py-2 font-mono text-[11px] font-medium text-ink transition hover:bg-surface disabled:opacity-70"
          >
            {saved ? "★ RECHERCHE ENREGISTRÉE" : "☆ ENREGISTRER CETTE RECHERCHE"}
          </button>
        ) : (
          <Link
            href={`/connexion?next=${encodeURIComponent(pathname)}`}
            className="rounded-full border border-line px-3.5 py-2 font-mono text-[11px] font-medium text-ink transition hover:bg-surface"
          >
            ☆ ENREGISTRER CETTE RECHERCHE
          </Link>
        )}
      </div>

      <div className="mt-4 max-w-[420px]">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          VILLAGES
        </span>
        <div className="mt-1.5">
          <VillageMultiSelect
            value={villageSlugs}
            onChange={(slugs) => {
              setSaved(false);
              setVillageSlugs(slugs);
            }}
          />
        </div>
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

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface px-6 py-5">
        <span className="font-sans text-[15px] text-ink">
          Votre bien mérite d&apos;être vu —{" "}
          <b>déposer une annonce prend 5 minutes.</b>
        </span>
        <Link
          href="/vendre/deposer"
          className="rounded-full bg-yellow px-5 py-3 font-mono text-[11.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          + DÉPOSER UNE ANNONCE
        </Link>
      </div>
    </div>
  );
}
