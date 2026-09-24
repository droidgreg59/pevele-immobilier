"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateFinancingStatusAction } from "@/lib/financing-actions";

export type FinancingRequestItem = {
  id: string;
  message: string;
  telephone: string | null;
  traite: boolean;
  createdLabel: string;
  authorNom: string;
  authorEmail: string;
  listing: { id: string; titre: string; href: string } | null;
};

export default function FinancingRequestList({ items }: { items: FinancingRequestItem[] }) {
  const [list, setList] = useState(items);
  const [, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-col gap-3">
      {list.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[14px] font-semibold text-ink">
              {r.authorNom}
            </span>
            <span className="text-[12px] text-muted-2">
              {r.createdLabel}
            </span>
          </div>
          {r.listing ? (
            <Link
              href={r.listing.href}
              className="w-fit rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-blue transition hover:bg-blue-soft"
            >
              À propos de « {r.listing.titre} »
            </Link>
          ) : null}
          <p className="m-0 text-[14px] leading-[1.5] text-ink">
            {r.message}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[12.5px] font-semibold text-blue">
            <a href={`mailto:${r.authorEmail}`}>{r.authorEmail}</a>
            {r.telephone ? <a href={`tel:${r.telephone}`}>{r.telephone}</a> : null}
          </div>
          <label className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-ink">
            <input
              type="checkbox"
              checked={r.traite}
              onChange={(e) => {
                const value = e.target.checked;
                setList((prev) =>
                  prev.map((it) => (it.id === r.id ? { ...it, traite: value } : it))
                );
                startTransition(async () => {
                  await updateFinancingStatusAction(r.id, value);
                });
              }}
              className="h-4 w-4 accent-[var(--pvl-blue)]"
            />
            Traité
          </label>
        </div>
      ))}
    </div>
  );
}
