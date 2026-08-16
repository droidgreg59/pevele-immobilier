"use client";

import { useState, useTransition } from "react";
import { updateDevisStatusAction } from "@/lib/devis-actions";

export type DevisItem = {
  id: string;
  message: string;
  telephone: string | null;
  traite: boolean;
  createdLabel: string;
  authorNom: string;
  authorEmail: string;
};

export default function DevisList({ items }: { items: DevisItem[] }) {
  const [list, setList] = useState(items);
  const [, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-col gap-3">
      {list.map((d) => (
        <div
          key={d.id}
          className="flex flex-col gap-2 border-2 border-ink bg-white px-5 py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-sans text-[14px] font-semibold text-ink">
              {d.authorNom}
            </span>
            <span className="font-mono text-[10.5px] text-muted-2">
              {d.createdLabel}
            </span>
          </div>
          <p className="m-0 font-sans text-[14px] leading-[1.5] text-ink">
            {d.message}
          </p>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[10.5px] font-medium text-blue">
            <a href={`mailto:${d.authorEmail}`}>{d.authorEmail}</a>
            {d.telephone ? <a href={`tel:${d.telephone}`}>{d.telephone}</a> : null}
          </div>
          <label className="flex w-fit items-center gap-1.5 font-mono text-[10.5px] font-medium text-ink">
            <input
              type="checkbox"
              checked={d.traite}
              onChange={(e) => {
                const value = e.target.checked;
                setList((prev) =>
                  prev.map((it) => (it.id === d.id ? { ...it, traite: value } : it))
                );
                startTransition(async () => {
                  await updateDevisStatusAction(d.id, value);
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
