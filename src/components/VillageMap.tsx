"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { villages } from "@/data/villages";
import { villageBoundaries } from "@/data/village-boundaries";
import { contextBoundaries } from "@/data/context-boundaries";
import type { DvfVillageStats } from "@/lib/dvf";

export default function VillageMap({
  initialSlug,
  dvfBySlug = {},
}: {
  initialSlug?: string;
  dvfBySlug?: Record<string, DvfVillageStats>;
}) {
  const initialIndex = Math.max(
    0,
    villages.findIndex((v) => v.slug === initialSlug)
  );
  const [sel, setSel] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [hovered, setHovered] = useState<number | null>(null);
  const selected = villages[sel];
  const selectedDvf = dvfBySlug[selected.slug];
  const activeIndex = hovered ?? sel;

  const sortedForList = useMemo(
    () => [...villages].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    []
  );

  const shapes = useMemo(
    () =>
      villages.map((v, i) => ({
        ...v,
        index: i,
        boundary: villageBoundaries[v.insee],
      })),
    []
  );

  return (
    <div className="animate-fade-up max-w-[1400px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-green">
          La carte
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          Explorez la Pévèle
        </h2>
        <span className="ml-auto text-[12px] font-medium text-muted">
          Survolez &amp; cliquez un village
        </span>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <div className="mt-5.5 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_420px]">
        <div
          className="relative overflow-hidden rounded-3xl border border-line p-5.5 shadow-sm"
          style={{
            background:
              "radial-gradient(120% 100% at 15% 0%, var(--pvl-blue-soft) 0%, var(--pvl-cream) 55%)",
          }}
        >
          <div className="mb-1.5 flex justify-between">
            <span className="text-[11px] font-semibold text-blue">Communes de la Pévèle</span>
            <span className="text-[11px] font-medium text-muted-2">N ↑</span>
          </div>
          <svg viewBox="0 0 440 600" className="block w-full">
            <defs>
              <filter id="village-shape-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="rgba(32,36,46,.18)" />
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
            {shapes.map((v) => {
              if (!v.boundary) return null;
              const active = v.index === activeIndex;
              const isSelected = v.index === sel;
              return (
                <g
                  key={v.slug}
                  onClick={() => setSel(v.index)}
                  onMouseEnter={() => setHovered(v.index)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer"
                >
                  <path
                    d={v.boundary.path}
                    fill={
                      isSelected
                        ? "var(--pvl-blue)"
                        : active
                          ? "var(--pvl-blue-soft)"
                          : "var(--pvl-surface)"
                    }
                    stroke="#fff"
                    strokeWidth={active ? 2 : 1.5}
                    strokeLinejoin="round"
                    filter={active ? "url(#village-shape-shadow)" : undefined}
                    className="transition-colors duration-150"
                  />
                  <text
                    x={v.boundary.cx}
                    y={v.boundary.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={active ? 8.5 : 7.5}
                    fontWeight={active ? 700 : 600}
                    fill={isSelected ? "#fff" : active ? "var(--pvl-blue)" : "var(--pvl-ink)"}
                    className="pointer-events-none select-none transition-all duration-150"
                    style={{ opacity: active ? 1 : 0.82 }}
                  >
                    {v.labelCourt}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-col gap-4.5">
          <div className="animate-fade-up flex flex-col gap-3 rounded-2xl border border-line bg-white p-7 shadow-sm">
            <span className="text-[11px] font-semibold text-green">
              Fiche village — {sel + 1}/{villages.length}
            </span>
            <span className="font-display text-[30px] text-ink">{selected.nom}</span>
            <p className="m-0 max-w-[56ch] text-[15px] leading-[1.6] text-muted">
              {selected.description}
            </p>
            {selectedDvf ? (
              <div className="flex items-baseline gap-2 rounded-xl bg-surface px-3.5 py-2.5">
                <span className="font-display text-[20px] text-ink">
                  {selectedDvf.avgPrixM2.toLocaleString("fr-FR")} €
                </span>
                <span className="text-[12px] font-medium text-muted">
                  / m² en moyenne · {selectedDvf.count} vente{selectedDvf.count > 1 ? "s" : ""} (
                  {selectedDvf.minAnnee}–{selectedDvf.maxAnnee})
                </span>
              </div>
            ) : (
              <p className="m-0 text-[12.5px] text-muted-2">
                Pas encore assez de ventes DVF enregistrées pour ce village.
              </p>
            )}
            <div className="flex max-w-[520px] gap-2 text-[13px] font-semibold">
              <Link
                href={`/villages/${selected.slug}`}
                className="flex-1 rounded-full border border-line bg-surface px-2.5 py-2.5 text-center text-ink transition hover:bg-white"
              >
                Guide du village
              </Link>
              <Link
                href={`/acheter?q=${selected.slug}`}
                className="flex-1 rounded-full bg-yellow px-2.5 py-2.5 text-center text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
              >
                Annonces ici →
              </Link>
            </div>
          </div>
          <div className="flex max-h-[220px] flex-wrap content-start gap-1.5 overflow-y-auto">
            {sortedForList.map((v) => {
              const i = villages.indexOf(v);
              const active = i === sel;
              return (
                <button
                  key={v.slug}
                  type="button"
                  onClick={() => setSel(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer rounded-full px-3 py-2 text-[12.5px] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--pvl-blue-soft)" : "#fff",
                    color: active ? "var(--pvl-blue)" : "var(--pvl-ink)",
                    border: `1.5px solid ${active ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
                  }}
                >
                  {v.nom}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
