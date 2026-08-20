"use client";

import { useMemo } from "react";
import type { ListingWithOwner } from "@/lib/listings";
import { villages } from "@/data/villages";

/**
 * Carte des annonces filtrées, en pins par village (mêmes coordonnées SVG
 * 420×560 que VillageMap/villages.ts — pas de bibliothèque de cartographie
 * ajoutée). Un pin par village plutôt que par annonce : on n'a pas de
 * coordonnées précises par bien, donc pas de position inventée à l'intérieur
 * d'un village.
 */

type VillagePin = {
  slug: string;
  nom: string;
  mapX: number;
  mapY: number;
  count: number;
  minPrix: number;
};

export default function MapPanel({
  listings,
  hoveredVillageSlug,
  onHoverVillage,
  onSelectVillage,
}: {
  listings: ListingWithOwner[];
  hoveredVillageSlug: string | null;
  onHoverVillage: (slug: string | null) => void;
  onSelectVillage: (slug: string) => void;
}) {
  const pins = useMemo<VillagePin[]>(() => {
    const byVillage = new Map<string, ListingWithOwner[]>();
    for (const l of listings) {
      const arr = byVillage.get(l.villageSlug) ?? [];
      arr.push(l);
      byVillage.set(l.villageSlug, arr);
    }
    const result: VillagePin[] = [];
    for (const [slug, items] of byVillage) {
      const village = villages.find((v) => v.slug === slug);
      if (!village) continue;
      result.push({
        slug,
        nom: village.nom,
        mapX: village.mapX,
        mapY: village.mapY,
        count: items.length,
        minPrix: Math.min(...items.map((l) => l.prix)),
      });
    }
    return result;
  }, [listings]);

  return (
    <div
      className="sticky top-24 h-[560px] overflow-hidden rounded-2xl border border-line lg:h-[calc(100vh-160px)]"
      style={{ background: "#e4e9f4" }}
    >
      <svg viewBox="0 0 420 560" className="h-full w-full">
        {pins.map((p) => {
          const hovered = hoveredVillageSlug === p.slug;
          return (
            <g
              key={p.slug}
              onMouseEnter={() => onHoverVillage(p.slug)}
              onMouseLeave={() => onHoverVillage(null)}
              onClick={() => onSelectVillage(p.slug)}
              className="cursor-pointer"
            >
              <rect
                x={p.mapX - 28}
                y={p.mapY - 24}
                width={56}
                height={19}
                rx={9.5}
                fill={hovered ? "var(--pvl-blue)" : "#fff"}
                stroke={hovered ? "#fff" : "var(--pvl-line)"}
                strokeWidth={hovered ? 2 : 1}
              />
              <text
                x={p.mapX}
                y={p.mapY - 11}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={700}
                fill={hovered ? "#fff" : "var(--pvl-ink)"}
              >
                dès {Math.round(p.minPrix / 1000)}k€
              </text>
              <circle cx={p.mapX} cy={p.mapY} r={4} fill={hovered ? "var(--pvl-blue)" : "var(--pvl-ink)"} />
            </g>
          );
        })}
      </svg>
      {pins.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] text-muted">
          Aucune annonce à afficher sur la carte pour ces critères.
        </div>
      ) : null}
    </div>
  );
}
