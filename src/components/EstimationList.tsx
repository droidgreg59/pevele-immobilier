"use client";

import { useState, useTransition } from "react";
import { updateEstimationStatusAction } from "@/lib/estimation-actions";

export type EstimationItem = {
  id: string;
  adresse: string;
  nom: string;
  telephone: string;
  preferredDateLabel: string | null;
  traite: boolean;
  createdLabel: string;
  authorEmail: string;
};

export default function EstimationList({ items }: { items: EstimationItem[] }) {
  const [list, setList] = useState(items);
  const [, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-col gap-3">
      {list.map((e) => (
        <div
          key={e.id}
          className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[14px] font-semibold text-ink">
              {e.nom}
            </span>
            <span className="text-[12px] text-muted-2">
              {e.createdLabel}
            </span>
          </div>
          <span className="text-[14px] text-ink">{e.adresse}</span>
          {e.preferredDateLabel ? (
            <span className="flex items-center gap-2 text-[13px] font-semibold text-blue">
              Créneau souhaité : {e.preferredDateLabel}
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  background: e.traite ? "#EAF3E8" : "#FBF3DC",
                  color: e.traite ? "var(--pvl-green)" : "var(--pvl-gold)",
                }}
              >
                {e.traite ? "Validé" : "En attente de validation"}
              </span>
            </span>
          ) : null}
          <div className="flex flex-wrap items-center gap-4 text-[12.5px] font-semibold text-blue">
            <a href={`tel:${e.telephone}`}>{e.telephone}</a>
            <a href={`mailto:${e.authorEmail}`}>{e.authorEmail}</a>
          </div>
          <label className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-ink">
            <input
              type="checkbox"
              checked={e.traite}
              onChange={(ev) => {
                const value = ev.target.checked;
                setList((prev) =>
                  prev.map((it) => (it.id === e.id ? { ...it, traite: value } : it))
                );
                startTransition(async () => {
                  await updateEstimationStatusAction(e.id, value);
                });
              }}
              className="h-4 w-4 accent-[var(--pvl-blue)]"
            />
            Rendez-vous validé
          </label>
        </div>
      ))}
    </div>
  );
}
