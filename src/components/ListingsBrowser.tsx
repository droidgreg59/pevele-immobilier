"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ListingWithOwner } from "@/lib/listings";
import { slugify } from "@/lib/slugify";
import { createSavedSearchAction } from "@/lib/saved-search-actions";
import { EQUIPEMENTS } from "@/data/equipements";
import {
  filterListings,
  sortListings,
  matchesFiltre,
  matchesTypeBien,
  matchesTypeMaison,
  type ListingFiltre,
  type TypeBienFiltre,
  type TypeMaisonFiltre,
  type ListingSort,
} from "@/lib/listing-filters";
import { useBrowseView } from "@/lib/browse-view";
import ListingCard from "./ListingCard";
import SkeletonCard from "./SkeletonCard";
import VillageMultiSelect from "./VillageMultiSelect";
import ResumeBanner from "./ResumeBanner";
import ViewToggle from "./ViewToggle";
import MapPanel from "./MapPanel";

const FILTRE_LABEL: Record<ListingFiltre, string> = {
  tout: "Tout",
  agence: "Agences",
  particulier: "Entre voisins",
};

const TRI_LABEL: Record<ListingSort, string> = {
  prix_desc: "Prix ↓",
  prix_asc: "Prix ↑",
  recent: "Plus récentes",
  surface_desc: "Surface ↓",
};

const TYPE_BIEN_LABEL: Record<TypeBienFiltre, string> = {
  TOUS: "Tous types",
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

const TYPE_MAISON_LABEL: Record<TypeMaisonFiltre, string> = {
  TOUS: "Toutes",
  INDIVIDUELLE: "Individuelle",
  SEMI_INDIVIDUELLE: "Semi-individuelle",
  MITOYENNE: "Mitoyenne",
};

const BATCH_SIZE = 24;

function chipClass(active: boolean, tone: "ink" | "gold" | "blue" = "ink"): string {
  if (!active) {
    return "cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface";
  }
  const toneClass =
    tone === "gold"
      ? "bg-gold text-white"
      : tone === "blue"
        ? "border border-blue bg-blue-soft text-blue"
        : "bg-ink text-white";
  return `cursor-pointer rounded-full border border-transparent px-4 py-2 text-[13px] font-semibold transition-colors ${toneClass}`;
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
  initialTypeMaison,
  initialVillageSlugs,
  initialChambresMin,
  initialEquipements,
  initialTri,
  initialFiltre,
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
  initialTypeMaison?: TypeMaisonFiltre;
  initialVillageSlugs?: string[];
  initialChambresMin?: number;
  initialEquipements?: string[];
  initialTri?: ListingSort;
  initialFiltre?: ListingFiltre;
  isLoggedIn?: boolean;
  favoriteIds?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [filtre, setFiltre] = useState<ListingFiltre>(initialFiltre ?? "tout");
  const [typeBien, setTypeBien] = useState<TypeBienFiltre>(initialTypeBien ?? "TOUS");
  const [typeMaison, setTypeMaison] = useState<TypeMaisonFiltre>(initialTypeMaison ?? "TOUS");
  const [budgetMin, setBudgetMin] = useState<number | undefined>(initialBudgetMin);
  const [budgetMax, setBudgetMax] = useState<number | undefined>(initialBudgetMax);
  const [villageSlugs, setVillageSlugs] = useState<string[]>(initialVillageSlugs ?? []);
  const [chambresMin, setChambresMin] = useState<number | undefined>(initialChambresMin);
  const [equipements, setEquipements] = useState<string[]>(initialEquipements ?? []);
  const [tri, setTri] = useState<ListingSort>(initialTri ?? "recent");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hoveredVillageSlug, setHoveredVillageSlug] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const viewMode = useBrowseView();

  const querySlug = initialQuery ? slugify(initialQuery) : "";
  const filtered = filterListings(listings, {
    filtre,
    typeBien,
    typeMaison,
    villageSlugs,
    querySlug,
    budgetMin,
    budgetMax,
    chambresMin,
    equipements,
  });
  const list = sortListings(filtered, tri);
  const visibleList = list.slice(0, visibleCount);
  const hasMore = visibleCount < list.length;

  // Synchronise les filtres/tri dans l'URL — partageable, survit au rafraîchissement.
  useEffect(() => {
    const params = new URLSearchParams();
    if (villageSlugs.length > 0) params.set("villages", villageSlugs.join(","));
    else if (initialQuery) params.set("q", initialQuery);
    if (typeBien !== "TOUS") params.set("type", typeBien);
    if (typeBien === "MAISON" && typeMaison !== "TOUS") params.set("typeMaison", typeMaison);
    if (chambresMin !== undefined) params.set("chambresMin", String(chambresMin));
    if (equipements.length > 0) params.set("equip", equipements.join(","));
    if (budgetMin !== undefined) params.set("budgetMin", String(budgetMin));
    if (budgetMax !== undefined) params.set("budget", String(budgetMax));
    if (tri !== "recent") params.set("tri", tri);
    if (filtre !== "tout") params.set("filtre", filtre);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villageSlugs, typeBien, typeMaison, chambresMin, equipements, budgetMin, budgetMax, tri, filtre]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < list.length) {
        setLoadingMore(true);
        window.setTimeout(() => {
          setVisibleCount((v) => Math.min(v + BATCH_SIZE, list.length));
          setLoadingMore(false);
        }, 220);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, list.length]);

  function handleSelectVillage(slug: string) {
    setSaved(false);
    setVisibleCount(BATCH_SIZE);
    setVillageSlugs([slug]);
  }

  function toggleEquipement(tag: string) {
    setSaved(false);
    setVisibleCount(BATCH_SIZE);
    setEquipements((prev) => (prev.includes(tag) ? prev.filter((e) => e !== tag) : [...prev, tag]));
  }

  function handleSaveSearch() {
    setSaved(true);
    startTransition(async () => {
      await createSavedSearchAction({
        transaction,
        typeBien: typeBien === "TOUS" ? undefined : typeBien,
        typeMaison: typeBien === "MAISON" && typeMaison !== "TOUS" ? typeMaison : undefined,
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
    <div className="animate-fade-up max-w-[1400px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-blue">
          {pieceBadge}
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">{titre}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="text-[12px] font-medium text-muted">
            {list.length} annonce{list.length > 1 ? "s" : ""} en ligne — vérifiées par un humain
          </span>
          <ViewToggle value={viewMode} />
        </div>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <ResumeBanner />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(Object.keys(TYPE_BIEN_LABEL) as TypeBienFiltre[]).map((key) => {
          const count = listings.filter((l) => matchesTypeBien(l, key)).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTypeBien(key);
                if (key !== "MAISON") setTypeMaison("TOUS");
                setVisibleCount(BATCH_SIZE);
              }}
              className={chipClass(typeBien === key, "gold")}
            >
              {TYPE_BIEN_LABEL[key]} ({count})
            </button>
          );
        })}
      </div>

      {typeBien === "MAISON" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-muted">Type de maison</span>
          {(Object.keys(TYPE_MAISON_LABEL) as TypeMaisonFiltre[]).map((key) => {
            const count = listings.filter(
              (l) => matchesTypeBien(l, "MAISON") && matchesTypeMaison(l, key)
            ).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTypeMaison(key);
                  setVisibleCount(BATCH_SIZE);
                }}
                className={chipClass(typeMaison === key, "blue")}
              >
                {TYPE_MAISON_LABEL[key]} ({count})
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {EQUIPEMENTS.map((eq) => (
          <button
            key={eq}
            type="button"
            onClick={() => toggleEquipement(eq)}
            className={chipClass(equipements.includes(eq), "blue")}
          >
            {eq}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {(Object.keys(FILTRE_LABEL) as ListingFiltre[]).map((key) => {
          const count = listings.filter((l) => matchesFiltre(l, key)).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFiltre(key);
                setVisibleCount(BATCH_SIZE);
              }}
              className={chipClass(filtre === key, "ink")}
            >
              {FILTRE_LABEL[key]} ({count})
            </button>
          );
        })}
        <label className="flex items-center gap-2 text-[12px] font-medium text-muted">
          Budget min
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="€"
            defaultValue={initialBudgetMin ?? ""}
            onChange={(e) => {
              setSaved(false);
              setVisibleCount(BATCH_SIZE);
              const v = e.target.value;
              setBudgetMin(v === "" ? undefined : Number(v));
            }}
            className="w-[110px] rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex items-center gap-2 text-[12px] font-medium text-muted">
          Budget max
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="€"
            defaultValue={initialBudgetMax ?? ""}
            onChange={(e) => {
              setSaved(false);
              setVisibleCount(BATCH_SIZE);
              const v = e.target.value;
              setBudgetMax(v === "" ? undefined : Number(v));
            }}
            className="w-[110px] rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex items-center gap-2 text-[12px] font-medium text-muted">
          Chambres min
          <select
            defaultValue={initialChambresMin ?? ""}
            onChange={(e) => {
              setSaved(false);
              setVisibleCount(BATCH_SIZE);
              const v = e.target.value;
              setChambresMin(v === "" ? undefined : Number(v));
            }}
            className="rounded-full border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          >
            <option value="">Peu importe</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        <label className="ml-auto flex items-center gap-2 text-[12px] font-medium text-muted">
          Trier
          <select
            value={tri}
            onChange={(e) => {
              setTri(e.target.value as ListingSort);
              setVisibleCount(BATCH_SIZE);
            }}
            className="cursor-pointer rounded-full border border-line bg-white px-3.5 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          >
            {(Object.keys(TRI_LABEL) as ListingSort[]).map((key) => (
              <option key={key} value={key}>
                {TRI_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        {isLoggedIn ? (
          <button
            type="button"
            disabled={isPending || saved}
            onClick={handleSaveSearch}
            className="rounded-full border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:bg-surface disabled:opacity-70"
          >
            {saved ? "★ Recherche enregistrée" : "☆ Enregistrer cette recherche"}
          </button>
        ) : (
          <Link
            href={`/connexion?next=${encodeURIComponent(pathname)}`}
            className="rounded-full border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:bg-surface"
          >
            ☆ Enregistrer cette recherche
          </Link>
        )}
      </div>

      <div className="mt-4 max-w-[420px]">
        <span className="text-[12px] font-medium text-muted">Villages</span>
        <div className="mt-1.5">
          <VillageMultiSelect
            value={villageSlugs}
            onChange={(slugs) => {
              setSaved(false);
              setVisibleCount(BATCH_SIZE);
              setVillageSlugs(slugs);
            }}
          />
        </div>
      </div>

      {(() => {
        const skeletons = loadingMore
          ? Array.from({ length: Math.min(BATCH_SIZE, list.length - visibleCount) }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))
          : null;
        const cards = visibleList.map((listing) => (
          <div
            key={listing.id}
            className={
              hoveredVillageSlug === listing.villageSlug
                ? "rounded-2xl ring-2 ring-blue transition"
                : "transition"
            }
          >
            <ListingCard listing={listing} isFavorited={favoriteIds.includes(listing.id)} />
          </div>
        ));
        const mapPanel = (
          <MapPanel
            listings={list}
            hoveredVillageSlug={hoveredVillageSlug}
            onHoverVillage={setHoveredVillageSlug}
            onSelectVillage={handleSelectVillage}
          />
        );

        if (list.length === 0) {
          return (
            <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center">
              <p className="m-0 text-[15px] font-semibold text-ink">
                Aucune annonce ne correspond à ces critères pour le moment.
              </p>
              <p className="m-0 max-w-[46ch] text-[13.5px] leading-[1.6] text-muted">
                Le marché de la Pévèle est petit — c&apos;est normal. Élargissez vos critères ou
                enregistrez une alerte pour être prévenu dès qu&apos;un bien correspond.
              </p>
              {villageSlugs.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setVillageSlugs([]);
                    setVisibleCount(BATCH_SIZE);
                    setSaved(false);
                  }}
                  className="text-[13px] font-semibold text-blue"
                >
                  Voir toute la Pévèle →
                </button>
              ) : null}
            </div>
          );
        }

        if (viewMode === "carte") {
          return <div className="mt-6">{mapPanel}</div>;
        }

        if (viewMode === "liste_carte") {
          return (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
              <div>
                <div className="grid grid-cols-1 gap-6.5 sm:grid-cols-2">
                  {cards}
                  {skeletons}
                </div>
                {hasMore ? <div ref={sentinelRef} className="h-1" /> : null}
              </div>
              {mapPanel}
            </div>
          );
        }

        return (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6.5 sm:grid-cols-2 lg:grid-cols-3">
              {cards}
              {skeletons}
            </div>
            {hasMore ? <div ref={sentinelRef} className="h-1" /> : null}
          </>
        );
      })()}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface px-6 py-5">
        <span className="text-[15px] text-ink">
          Votre bien mérite d&apos;être vu — <b>déposer une annonce prend 5 minutes.</b>
        </span>
        <Link
          href="/vendre/deposer"
          className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          Déposer une annonce
        </Link>
      </div>
    </div>
  );
}
