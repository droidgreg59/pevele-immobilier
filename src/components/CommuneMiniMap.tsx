"use client";

import { villageBoundaries } from "@/data/village-boundaries";
import { contextBoundaries } from "@/data/context-boundaries";

/**
 * Mini-carte de situation d'une commune : son contour réel mis en avant,
 * les communes alentour en gris clair pour l'orientation. Même repère
 * 440×600 que la carte principale, recadré autour de la commune. Le bien
 * n'a pas d'adresse précise en base — on situe donc la commune, pas le
 * logement.
 */
export default function CommuneMiniMap({ insee, nom }: { insee: string; nom: string }) {
  const target = villageBoundaries[insee];
  if (!target) return null;

  const nums = (target.path.match(/-?[\d.]+/g) ?? []).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX;
  const h = maxY - minY;
  const pad = Math.max(w, h, 1) * 0.45;
  const viewBox = `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`;

  const others = [
    ...Object.entries(villageBoundaries),
    ...Object.entries(contextBoundaries),
  ].filter(([code]) => code !== insee);

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-line">
      <svg
        viewBox={viewBox}
        className="block h-auto w-full"
        style={{ background: "var(--pvl-blue-soft)" }}
        role="img"
        aria-label={`Situation de ${nom} dans la Pévèle`}
      >
        {others.map(([code, b]) => (
          <path
            key={code}
            d={b.path}
            fill="var(--pvl-line)"
            stroke="#fff"
            strokeWidth={0.5}
            strokeLinejoin="round"
            opacity={0.55}
          />
        ))}
        <path
          d={target.path}
          fill="var(--pvl-blue)"
          stroke="#fff"
          strokeWidth={1}
          strokeLinejoin="round"
        />
        <circle cx={target.cx} cy={target.cy} r={Math.max(w, h) * 0.035} fill="#fff" />
      </svg>
      <p className="m-0 bg-white px-4 py-2 text-[11px] font-semibold text-blue">
        {nom}, au cœur de la Pévèle
      </p>
    </div>
  );
}
