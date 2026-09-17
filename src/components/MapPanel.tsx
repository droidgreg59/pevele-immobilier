"use client";

import { useMemo } from "react";
import type { BrowseMapAggregate } from "@/lib/listing-query";
import { villages } from "@/data/villages";
import { villageBoundaries } from "@/data/village-boundaries";
import { contextBoundaries } from "@/data/context-boundaries";

/**
 * Carte des annonces filtrées, avec les vraies délimitations de commune
 * (mêmes tracés que VillageMap, projetés dans le repère 440x600 partagé de
 * villages.ts / village-boundaries.ts). Un prix par village plutôt que par
 * annonce : on n'a pas de coordonnées précises par bien, donc pas de
 * position inventée à l'intérieur d'un village.
 */

type VillageShape = {
  slug: string;
  nom: string;
  labelCourt: string;
  path: string;
  cx: number;
  cy: number;
  count: number;
  minPrix: number | null;
};

export default function MapPanel({
  aggregates,
  hoveredVillageSlug,
  onHoverVillage,
  onSelectVillage,
}: {
  aggregates: BrowseMapAggregate[];
  hoveredVillageSlug: string | null;
  onHoverVillage: (slug: string | null) => void;
  onSelectVillage: (slug: string) => void;
}) {
  const shapes = useMemo<VillageShape[]>(() => {
    const byVillage = new Map(aggregates.map((a) => [a.villageSlug, a]));
    return villages
      .map((v) => {
        const boundary = villageBoundaries[v.insee];
        if (!boundary) return null;
        const agg = byVillage.get(v.slug);
        return {
          slug: v.slug,
          nom: v.nom,
          labelCourt: v.labelCourt,
          path: boundary.path,
          cx: boundary.cx,
          cy: boundary.cy,
          count: agg?.count ?? 0,
          minPrix: agg?.minPrix ?? null,
        };
      })
      .filter((s): s is VillageShape => s !== null);
  }, [aggregates]);

  const hasAnyMatch = shapes.some((s) => s.count > 0);

  return (
    <div
      className="sticky top-24 h-[560px] overflow-hidden rounded-2xl border border-line shadow-sm lg:h-[calc(100vh-160px)]"
      style={{
        background:
          "radial-gradient(130% 90% at 10% 0%, var(--pvl-blue-soft) 0%, #e4e9f4 60%)",
      }}
    >
      <svg viewBox="0 0 440 600" className="h-full w-full">
        <defs>
          <filter id="map-panel-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="rgba(32,36,46,.2)" />
          </filter>
        </defs>
        {Object.entries(contextBoundaries).map(([insee, c]) => (
          <path
            key={insee}
            d={c.path}
            fill="var(--pvl-line)"
            stroke="#fff"
            strokeWidth={1}
            strokeLinejoin="round"
            className="pointer-events-none"
            opacity={0.6}
          />
        ))}
        {shapes.map((s) => {
          const hovered = hoveredVillageSlug === s.slug;
          const active = s.count > 0;
          return (
            <g
              key={s.slug}
              onMouseEnter={() => onHoverVillage(s.slug)}
              onMouseLeave={() => onHoverVillage(null)}
              onClick={() => onSelectVillage(s.slug)}
              className="cursor-pointer"
            >
              <path
                d={s.path}
                fill={
                  hovered
                    ? "var(--pvl-blue)"
                    : active
                      ? "var(--pvl-blue-soft)"
                      : "var(--pvl-surface)"
                }
                stroke="#fff"
                strokeWidth={hovered ? 2 : 1.5}
                strokeLinejoin="round"
                filter={hovered ? "url(#map-panel-shadow)" : undefined}
                className="transition-colors duration-150"
              />
              {active ? (
                <text
                  x={s.cx}
                  y={s.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={hovered ? 8.5 : 7.5}
                  fontWeight={700}
                  fill={hovered ? "#fff" : "var(--pvl-blue)"}
                  className="pointer-events-none select-none transition-all duration-150"
                >
                  dès {Math.round((s.minPrix ?? 0) / 1000)}k€
                </text>
              ) : (
                <text
                  x={s.cx}
                  y={s.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={6.5}
                  fontWeight={600}
                  fill="var(--pvl-muted-2)"
                  className="pointer-events-none select-none"
                  style={{ opacity: hovered ? 0.9 : 0.65 }}
                >
                  {s.labelCourt}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {!hasAnyMatch ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] text-muted">
          <span className="rounded-xl bg-white/90 px-4 py-3 shadow-sm">
            Aucune annonce à afficher sur la carte pour ces critères.
          </span>
        </div>
      ) : null}
    </div>
  );
}
