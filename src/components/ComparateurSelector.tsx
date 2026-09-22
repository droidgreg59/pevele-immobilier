"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { villages } from "@/data/villages";

/**
 * Sélecteur libre pour comparer deux communes — fonctionne pour n'importe
 * quelle paire des 44, sans construire de grille de 946 liens (voir Sprint 5,
 * point 18 : l'outil se construit depuis deux sélecteurs, pas depuis un
 * maillage combinatoire).
 */
export default function ComparateurSelector() {
  const router = useRouter();
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b || a === b) return;
    const [x, y] = a < b ? [a, b] : [b, a];
    router.push(`/comparer/${x}/${y}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Première commune</span>
        <select
          value={a}
          onChange={(e) => setA(e.target.value)}
          className="rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-ink outline-none focus:border-blue"
        >
          <option value="">Choisir…</option>
          {villages.map((v) => (
            <option key={v.slug} value={v.slug} disabled={v.slug === b}>
              {v.nom}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Deuxième commune</span>
        <select
          value={b}
          onChange={(e) => setB(e.target.value)}
          className="rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-ink outline-none focus:border-blue"
        >
          <option value="">Choisir…</option>
          {villages.map((v) => (
            <option key={v.slug} value={v.slug} disabled={v.slug === a}>
              {v.nom}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={!a || !b || a === b}
        className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-50"
      >
        Comparer
      </button>
    </form>
  );
}
