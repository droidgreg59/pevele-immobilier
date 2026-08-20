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
          fill: active ? "var(--pvl-blue)" : "var(--pvl-muted-2)",
          leftPct: (v.labelX / 420) * 100,
          topPct: ((v.labelY - 3) / 560) * 100,
        };
      }),
    [sel]
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

      <div className="mt-5.5 grid grid-cols-1 items-start gap-12 lg:grid-cols-[470px_1fr]">
        <div className="rounded-2xl border border-line bg-white p-5.5 shadow-sm">
          <div className="mb-1.5 flex justify-between">
            <span className="text-[11px] font-semibold text-blue">Plan de masse — la Pévèle</span>
            <span className="text-[11px] font-medium text-muted-2">N ↑</span>
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
                  <circle cx={d.mapX} cy={d.mapY} r={d.halo} fill="rgba(44,67,156,.16)" />
                  <circle
                    cx={d.mapX}
                    cy={d.mapY}
                    r={d.r}
                    fill={d.fill}
                    className="animate-fade-up transition-[r]"
                  />
                </g>
              ))}
            </svg>
            {dots.map((d) => (
              <span
                key={d.slug}
                onClick={() => setSel(d.index)}
                onMouseEnter={() => setSel(d.index)}
                className="absolute cursor-pointer whitespace-nowrap text-[10px]"
                style={{
                  left: `${d.leftPct}%`,
                  top: `${d.topPct}%`,
                  transform: "translate(-50%, -50%)",
                  color: d.index === sel ? "var(--pvl-blue)" : "var(--pvl-ink)",
                  fontWeight: d.index === sel ? 700 : 500,
                }}
              >
                {d.labelCourt}
              </span>
            ))}
          </div>
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
          <div className="flex flex-wrap gap-1.5">
            {villages.map((v, i) => (
              <button
                key={v.slug}
                type="button"
                onClick={() => setSel(i)}
                className="cursor-pointer rounded-full px-3 py-2 text-[12.5px] font-semibold transition-colors"
                style={{
                  background: sel === i ? "var(--pvl-blue-soft)" : "#fff",
                  color: sel === i ? "var(--pvl-blue)" : "var(--pvl-ink)",
                  border: `1.5px solid ${sel === i ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
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
