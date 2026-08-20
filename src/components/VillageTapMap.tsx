"use client";

import { villages } from "@/data/villages";

/**
 * Mini-carte tactile (mêmes coordonnées 420×560 que VillageMap/villages.ts)
 * pour sélectionner des villages en tapant sur un point plutôt qu'en tapant
 * du texte — complète VillageMultiSelect, ne le remplace pas.
 */
export default function VillageTapMap({
  value,
  onChange,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
}) {
  function toggle(slug: string) {
    onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug]);
  }

  return (
    <div className="relative h-[190px] overflow-hidden rounded-2xl bg-blue-soft">
      <svg viewBox="0 0 420 560" className="h-full w-full">
        {villages.map((v) => {
          const active = value.includes(v.slug);
          return (
            <g key={v.slug} onClick={() => toggle(v.slug)} className="cursor-pointer">
              <title>{v.nom}</title>
              <circle
                cx={v.mapX}
                cy={v.mapY}
                r={active ? 9 : 5}
                fill={active ? "var(--pvl-blue)" : "#fff"}
                stroke="var(--pvl-blue)"
                strokeWidth={active ? 0 : 1.5}
                className="transition-all"
              />
              {active ? (
                <circle
                  cx={v.mapX}
                  cy={v.mapY}
                  r={2.5}
                  fill="#fff"
                  className="pointer-events-none"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
