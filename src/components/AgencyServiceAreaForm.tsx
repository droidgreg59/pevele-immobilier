"use client";

import { useActionState, useState } from "react";
import { updateServiceAreasAction, type AgencyServiceAreasFormState } from "@/lib/agency-actions";
import { villages } from "@/data/villages";

const initialState: AgencyServiceAreasFormState = {};

export default function AgencyServiceAreaForm({
  serviceAreas,
}: {
  serviceAreas: string[];
}) {
  const [state, formAction, pending] = useActionState(updateServiceAreasAction, initialState);
  const [selected, setSelected] = useState<string[]>(serviceAreas);

  function toggle(slug: string) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  return (
    <form action={formAction} className="flex max-w-[640px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Communes où vous intervenez
        </span>
        <div className="flex gap-3 text-[12px] font-semibold text-blue">
          <button type="button" onClick={() => setSelected(villages.map((v) => v.slug))}>
            Tout sélectionner
          </button>
          <button type="button" onClick={() => setSelected([])}>
            Tout désélectionner
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {villages.map((v) => {
          const active = selected.includes(v.slug);
          return (
            <button
              key={v.slug}
              type="button"
              onClick={() => toggle(v.slug)}
              className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
              style={{
                background: active ? "var(--pvl-blue-soft)" : "#fff",
                color: active ? "var(--pvl-blue)" : "var(--pvl-ink)",
                border: `1px solid ${active ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
              }}
            >
              {v.nom}
            </button>
          );
        })}
      </div>
      {selected.map((slug) => (
        <input key={slug} type="hidden" name="villageSlugs" value={slug} />
      ))}

      <p className="m-0 text-[12px] text-muted-2">
        Ces communes s&apos;affichent sur votre fiche professionnelle, et sur les fiches village
        elles-mêmes une fois plusieurs agences actives sur le portail.
      </p>

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="m-0 rounded-xl bg-[#EAF3E8] px-4 py-3 text-[13px] text-ink">Zones enregistrées.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-6.5 py-4 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer →"}
      </button>
    </form>
  );
}
