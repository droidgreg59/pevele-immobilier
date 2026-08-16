"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateVisitStatusAction } from "@/lib/visit-actions";

export type VisitItem = {
  id: string;
  message: string;
  telephone: string | null;
  preferredDateLabel: string | null;
  traite: boolean;
  createdLabel: string;
  authorNom: string;
  authorEmail: string;
  listingId: string;
  listingTitre: string;
  listingHref: string;
};

export default function VisitRequestList({ items }: { items: VisitItem[] }) {
  const [list, setList] = useState(items);
  const [, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-col gap-3">
      {list.map((v) => (
        <div
          key={v.id}
          className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-sans text-[14px] font-semibold text-ink">
              {v.authorNom}
            </span>
            <span className="font-mono text-[10.5px] text-muted-2">
              {v.createdLabel}
            </span>
          </div>
          <Link
            href={v.listingHref}
            className="font-mono text-[10.5px] font-medium text-blue"
          >
            {v.listingTitre} →
          </Link>
          <p className="m-0 font-sans text-[14px] leading-[1.5] text-ink">
            {v.message}
          </p>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[10.5px] font-medium text-blue">
            <a href={`mailto:${v.authorEmail}`}>{v.authorEmail}</a>
            {v.telephone ? <a href={`tel:${v.telephone}`}>{v.telephone}</a> : null}
            {v.preferredDateLabel ? (
              <span className="text-muted">Souhaite le {v.preferredDateLabel}</span>
            ) : null}
          </div>
          <label className="flex w-fit items-center gap-1.5 font-mono text-[10.5px] font-medium text-ink">
            <input
              type="checkbox"
              checked={v.traite}
              onChange={(e) => {
                const value = e.target.checked;
                setList((prev) =>
                  prev.map((it) => (it.id === v.id ? { ...it, traite: value } : it))
                );
                startTransition(async () => {
                  await updateVisitStatusAction(v.id, value);
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
