"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ListingWithOwner } from "@/lib/listings";
import type { BrowseMapAggregate, BrowseFacets } from "@/lib/listing-query";
import { createSavedSearchAction } from "@/lib/saved-search-actions";
import { EQUIPEMENTS } from "@/data/equipements";
import type {
  ListingFiltre,
  TypeBienFiltre,
  TypeMaisonFiltre,
  ListingSort,
} from "@/lib/listing-filters";
import { useBrowseView } from "@/lib/browse-view";
import ListingCard from "./ListingCard";
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
  total,
  page,
  pageSize,
  mapAggregates,
  facets,
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
  total: number;
  page: number;
  pageSize: number;
  mapAggregates: BrowseMapAggregate[];
  facets: BrowseFacets;
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
  const searchParams = useSearchParams();
  const viewMode = useBrowseView();

  const filtre = initialFiltre ?? "tout";
  const typeBien = initialTypeBien ?? "TOUS";
  const typeMaison = initialTypeMaison ?? "TOUS";
  const villageSlugs = initialVillageSlugs ?? [];
  const chambresMin = initialChambresMin;
  const equipements = initialEquipements ?? [];
  const tri = initialTri ?? "recent";

  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hoveredVillageSlug, setHoveredVillageSlug] = useState<string | null>(null);

  /** Fusionne un patch dans les paramètres d'URL et navigue (remise à la page 1). */
  const setParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      next.delete("page");
      setSaved(false);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Champs budget : saisie non contrôlée (fluide), navigation différée. Le
  // `key` lié à la valeur d'URL réinitialise le champ sur une navigation externe.
  const budgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onBudgetChange(which: "budgetMin" | "budget", raw: string) {
    if (budgetTimer.current) clearTimeout(budgetTimer.current);
    budgetTimer.current = setTimeout(() => {
      setParams({ [which]: raw === "" ? undefined : raw });
    }, 450);
  }

  function toggleEquipement(tag: string) {
    const next = equipements.includes(tag)
      ? equipements.filter((e) => e !== tag)
      : [...equipements, tag];
    setParams({ equip: next.join(",") || undefined });
  }

  function selectVillages(slugs: string[]) {
    setParams({ villages: slugs.join(",") || undefined, q: undefined });
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
        budgetMin: initialBudgetMin,
        budgetMax: initialBudgetMax,
        next: pathname,
      });
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(target: number): string {
    const next = new URLSearchParams(searchParams.toString());
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const cards = listings.map((listing) => (
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
      aggregates={mapAggregates}
      hoveredVillageSlug={hoveredVillageSlug}
      onHoverVillage={setHoveredVillageSlug}
      onSelectVillage={(slug) => setParams({ villages: slug, q: undefined })}
    />
  );

  const pagination =
    totalPages > 1 ? (
      <div className="mt-8 flex items-center justify-center gap-3 text-[13px] font-semibold">
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            scroll
            className="rounded-full border border-line px-4 py-2 text-ink transition hover:bg-surface"
          >
            ← Précédent
          </Link>
        ) : (
          <span className="rounded-full border border-line px-4 py-2 text-muted-2">← Précédent</span>
        )}
        <span className="text-muted">
          Page {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={pageHref(page + 1)}
            scroll
            className="rounded-full border border-line px-4 py-2 text-ink transition hover:bg-surface"
          >
            Suivant →
          </Link>
        ) : (
          <span className="rounded-full border border-line px-4 py-2 text-muted-2">Suivant →</span>
        )}
      </div>
    ) : null;

  return (
    <div className="animate-fade-up max-w-[1400px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-blue">
          {pieceBadge}
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">{titre}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="text-[12px] font-medium text-muted">
            {total} annonce{total > 1 ? "s" : ""} en ligne — vérifiées par un humain
          </span>
          <ViewToggle value={viewMode} />
        </div>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <ResumeBanner />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(Object.keys(TYPE_BIEN_LABEL) as TypeBienFiltre[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              setParams({
                type: key === "TOUS" ? undefined : key,
                ...(key !== "MAISON" ? { typeMaison: undefined } : {}),
              })
            }
            className={chipClass(typeBien === key, "gold")}
          >
            {TYPE_BIEN_LABEL[key]} ({facets.typeBien[key]})
          </button>
        ))}
      </div>

      {typeBien === "MAISON" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-muted">Type de maison</span>
          {(Object.keys(TYPE_MAISON_LABEL) as TypeMaisonFiltre[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setParams({ typeMaison: key === "TOUS" ? undefined : key })}
              className={chipClass(typeMaison === key, "blue")}
            >
              {TYPE_MAISON_LABEL[key]} ({facets.typeMaison[key]})
            </button>
          ))}
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
        {(Object.keys(FILTRE_LABEL) as ListingFiltre[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setParams({ filtre: key === "tout" ? undefined : key })}
            className={chipClass(filtre === key, "ink")}
          >
            {FILTRE_LABEL[key]} ({facets.filtre[key]})
          </button>
        ))}
        <label className="flex items-center gap-2 text-[12px] font-medium text-muted">
          Budget min
          <input
            key={`bmin-${initialBudgetMin ?? ""}`}
            type="number"
            min={0}
            step={1000}
            placeholder="€"
            defaultValue={initialBudgetMin ?? ""}
            onChange={(e) => onBudgetChange("budgetMin", e.target.value)}
            className="w-[110px] rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex items-center gap-2 text-[12px] font-medium text-muted">
          Budget max
          <input
            key={`bmax-${initialBudgetMax ?? ""}`}
            type="number"
            min={0}
            step={1000}
            placeholder="€"
            defaultValue={initialBudgetMax ?? ""}
            onChange={(e) => onBudgetChange("budget", e.target.value)}
            className="w-[110px] rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex items-center gap-2 text-[12px] font-medium text-muted">
          Chambres min
          <select
            value={chambresMin ?? ""}
            onChange={(e) => setParams({ chambresMin: e.target.value || undefined })}
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
            onChange={(e) => setParams({ tri: e.target.value === "recent" ? undefined : e.target.value })}
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
          <VillageMultiSelect value={villageSlugs} onChange={selectVillages} />
        </div>
      </div>

      {total === 0 ? (
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
              onClick={() => setParams({ villages: undefined })}
              className="text-[13px] font-semibold text-blue"
            >
              Voir toute la Pévèle →
            </button>
          ) : null}
        </div>
      ) : viewMode === "carte" ? (
        <div className="mt-6">{mapPanel}</div>
      ) : viewMode === "liste_carte" ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <div>
            <div className="grid grid-cols-1 gap-6.5 sm:grid-cols-2">{cards}</div>
            {pagination}
          </div>
          {mapPanel}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6.5 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>
          {pagination}
        </>
      )}

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
