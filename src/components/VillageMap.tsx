"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { villages } from "@/data/villages";

export default function VillageMap({ initialSlug }: { initialSlug?: string }) {
  const initialIndex = Math.max(
    0,
    villages.findIndex((v) => v.slug === initialSlug)
  );
  const [sel, setSel] = useState(initialIndex === -1 ? 0 : initialIndex);
  const selected = villages[sel];

  const dots = useMemo(
    () =>
      villages.map((v, i) => {
        const active = i === sel;
        return {
          ...v,
          index: i,
          r: active ? 8 : 5,
          halo: active ? 14 : 0,
          fill: active ? "var(--pvl-yellow)" : "var(--pvl-blue)",
          leftPct: (v.labelX / 420) * 100,
          topPct: ((v.labelY - 3) / 560) * 100,
        };
      }),
    [sel]
  );

  return (
    <div className="animate-view-in max-w-[1400px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="border-2 border-green px-3 py-1.5 font-mono text-sm text-green">
          PIÈCE 06
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          LA CARTE — PLAN DE MASSE
        </h2>
        <span className="ml-auto font-mono text-[11px] font-medium text-muted">
          SURVOLEZ &amp; CLIQUEZ UN VILLAGE
        </span>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <div className="mt-5.5 grid grid-cols-1 items-start gap-12 lg:grid-cols-[470px_1fr]">
        <div className="border-[2.5px] border-ink bg-white p-5.5 shadow-[6px_6px_0_rgba(39,67,166,.22)]">
          <div className="mb-1.5 flex justify-between">
            <span className="font-mono text-[10px] font-medium text-blue">
              PLAN DE MASSE — LA PÉVÈLE
            </span>
            <span className="font-mono text-[10px] font-medium text-blue">
              N ↑ · ÉCH. 1:75 000
            </span>
          </div>
          <div className="relative">
            <svg viewBox="0 0 420 560" className="block w-full">
              {dots.map((d) => (
                <g
                  key={d.slug}
                  onClick={() => setSel(d.index)}
                  onMouseEnter={() => setSel(d.index)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={d.mapX}
                    cy={d.mapY}
                    r={d.halo}
                    fill="rgba(245,181,46,.25)"
                  />
                  <circle
                    cx={d.mapX}
                    cy={d.mapY}
                    r={d.r}
                    fill={d.fill}
                    className="animate-dot-in transition-[r]"
                  />
                </g>
              ))}
            </svg>
            {dots.map((d) => (
              <span
                key={d.slug}
                onClick={() => setSel(d.index)}
                onMouseEnter={() => setSel(d.index)}
                className="absolute cursor-pointer whitespace-nowrap font-mono text-[9.5px]"
                style={{
                  left: `${d.leftPct}%`,
                  top: `${d.topPct}%`,
                  transform: "translate(-50%, -50%)",
                  color: d.index === sel ? "var(--pvl-gold)" : "var(--pvl-ink)",
                  fontWeight: d.index === sel ? 600 : 400,
                }}
              >
                {d.labelCourt}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4.5">
          <div className="animate-draw-in flex flex-col gap-3 border-[2.5px] border-ink bg-white p-7 shadow-[6px_6px_0_rgba(39,67,166,.22)]">
            <span className="font-mono text-[10.5px] font-medium text-green">
              FICHE VILLAGE — {sel + 1}/{villages.length}
            </span>
            <span className="font-display text-[34px] text-ink">
              {selected.nom.toUpperCase()}
            </span>
            <p className="m-0 max-w-[56ch] font-sans text-[15px] leading-[1.6] text-muted">
              {selected.description}
            </p>
            <div className="flex max-w-[520px] font-mono text-[11px]">
              <Link
                href={`/villages/${selected.slug}`}
                className="flex-1 border-2 border-ink bg-cream px-2.5 py-2.5 text-center text-ink"
              >
                GUIDE DU VILLAGE
              </Link>
              <Link
                href={`/acheter?q=${selected.slug}`}
                className="flex-1 border-2 border-l-0 border-ink bg-yellow px-2.5 py-2.5 text-center text-ink"
              >
                ANNONCES ICI →
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {villages.map((v, i) => (
              <button
                key={v.slug}
                type="button"
                onClick={() => setSel(i)}
                className="cursor-pointer border-[1.5px] border-ink px-3 py-2 font-mono text-[10.5px] font-medium transition-colors hover:bg-[#FDEBC2]"
                style={{
                  background: sel === i ? "var(--pvl-yellow)" : "#fff",
                  color: "var(--pvl-ink)",
                }}
              >
                {v.nom}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
