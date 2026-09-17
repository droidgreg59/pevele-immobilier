"use client";

import { useMemo, useState } from "react";
import { villages } from "@/data/villages";
import { villageBoundaries } from "@/data/village-boundaries";
import { contextBoundaries } from "@/data/context-boundaries";

/**
 * Carte tactile du tunnel « Mon projet » : les vrais contours des 38 communes
 * de la Pévèle, une commune = une forme que l'on touche pour l'ajouter /
 * retirer de sa sélection. Même repère 440×600 que la carte principale, mais
 * recadré au plus près du territoire. Complète `VillageMultiSelect` (recherche
 * texte) — ne le remplace pas.
 */
export default function VillageTapMap({
  value,
  onChange,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const selected = useMemo(() => new Set(value), [value]);

  const shapes = useMemo(
    () =>
      villages
        .map((v) => ({ slug: v.slug, nom: v.nom, labelCourt: v.labelCourt, b: villageBoundaries[v.insee] }))
        .filter((v): v is typeof v & { b: NonNullable<typeof v.b> } => Boolean(v.b)),
    []
  );

  const viewBox = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    const collect = (path: string) => {
      const nums = (path.match(/-?[\d.]+/g) ?? []).map(Number);
      for (let i = 0; i < nums.length; i += 2) {
        xs.push(nums[i]);
        ys.push(nums[i + 1]);
      }
    };
    shapes.forEach((s) => collect(s.b.path));
    Object.values(contextBoundaries).forEach((c) => collect(c.path));
    const pad = 8;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const w = Math.max(...xs) - Math.min(...xs) + pad * 2;
    const h = Math.max(...ys) - Math.min(...ys) + pad * 2;
    return { str: `${minX} ${minY} ${w} ${h}`, ratio: w / h };
  }, [shapes]);

  function toggle(slug: string) {
    onChange(selected.has(slug) ? value.filter((s) => s !== slug) : [...value, slug]);
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-line shadow-sm"
      style={{
        background:
          "radial-gradient(130% 110% at 15% 0%, var(--pvl-blue-soft) 0%, var(--pvl-cream) 65%)",
      }}
    >
      <svg
        viewBox={viewBox.str}
        className="block w-full"
        style={{ aspectRatio: String(viewBox.ratio) }}
        role="group"
        aria-label="Carte des communes de la Pévèle — touchez pour sélectionner"
      >
        <defs>
          <filter id="vtm-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="1.1" floodColor="rgba(32,36,46,.22)" />
          </filter>
        </defs>

        {Object.entries(contextBoundaries).map(([insee, c]) => (
          <path
            key={insee}
            d={c.path}
            fill="var(--pvl-line)"
            stroke="#fff"
            strokeWidth={0.6}
            strokeLinejoin="round"
            opacity={0.4}
            className="pointer-events-none"
          />
        ))}

        {shapes.map((v) => {
          const isSel = selected.has(v.slug);
          const isHov = hovered === v.slug;
          return (
            <g
              key={v.slug}
              onClick={() => toggle(v.slug)}
              onMouseEnter={() => setHovered(v.slug)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
              role="button"
              aria-pressed={isSel}
              aria-label={v.nom}
            >
              <title>{v.nom}</title>
              <path
                d={v.b.path}
                fill={
                  isSel
                    ? "var(--pvl-blue)"
                    : isHov
                      ? "var(--pvl-blue-soft)"
                      : "var(--pvl-surface)"
                }
                stroke={isSel ? "var(--pvl-blue)" : "#fff"}
                strokeWidth={isSel || isHov ? 1.5 : 1}
                strokeLinejoin="round"
                filter={isSel || isHov ? "url(#vtm-shadow)" : undefined}
                className="transition-[fill,stroke] duration-150"
              />
              {isSel ? (
                <circle cx={v.b.cx} cy={v.b.cy} r={2.6} fill="#fff" className="pointer-events-none" />
              ) : isHov ? (
                <text
                  x={v.b.cx}
                  y={v.b.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={7}
                  fontWeight={700}
                  fill="var(--pvl-blue)"
                  className="pointer-events-none select-none"
                >
                  {v.labelCourt}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <span
        className={`pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          value.length > 0 ? "bg-blue text-white" : "bg-white/85 text-muted"
        }`}
      >
        {value.length > 0
          ? `${value.length} commune${value.length > 1 ? "s" : ""} choisie${value.length > 1 ? "s" : ""}`
          : "Touchez une commune"}
      </span>
    </div>
  );
}
