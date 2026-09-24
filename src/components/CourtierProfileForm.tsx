"use client";

import { useActionState, useState } from "react";
import {
  updateCourtierProfileAction,
  type CourtierProfileFormState,
} from "@/lib/courtier-actions";
import { courtierSpecialites } from "@/data/courtierSpecialites";
import { villages } from "@/data/villages";
import type { CourtierProfile } from "@/lib/courtiers";

const initialState: CourtierProfileFormState = {};

export default function CourtierProfileForm({
  courtier,
}: {
  courtier: CourtierProfile;
}) {
  const [state, formAction, pending] = useActionState(
    updateCourtierProfileAction,
    initialState
  );
  const [categories, setCategories] = useState<string[]>(courtier.categories);
  const [communes, setCommunes] = useState<string[]>(courtier.communesDesservies);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <form action={formAction} className="flex max-w-[640px] flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Nom de la société de courtage
        </span>
        <input
          name="entreprise"
          required
          defaultValue={courtier.entreprise ?? ""}
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Présentation
        </span>
        <textarea
          name="description"
          rows={4}
          defaultValue={courtier.description ?? ""}
          placeholder="Votre activité, votre expérience, vos partenaires bancaires…"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Spécialités
        </span>
        <div className="flex flex-wrap gap-2">
          {courtierSpecialites.map((cat) => {
            const active = categories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(categories, setCategories, cat)}
                className="rounded-full px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-surface"
                style={{
                  background: active ? "var(--pvl-ink)" : "#fff",
                  color: active ? "#fff" : "var(--pvl-ink)",
                  border: `1px solid ${active ? "transparent" : "var(--pvl-line)"}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
        {categories.map((c) => (
          <input key={c} type="hidden" name="categories" value={c} />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Zones d&apos;intervention (facultatif)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {villages.map((v) => {
            const active = communes.includes(v.slug);
            return (
              <button
                key={v.slug}
                type="button"
                onClick={() => toggle(communes, setCommunes, v.slug)}
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
        {communes.map((slug) => (
          <input key={slug} type="hidden" name="communesDesservies" value={slug} />
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Téléphone
        </span>
        <input
          name="telephone"
          type="tel"
          defaultValue={courtier.telephone ?? ""}
          placeholder="ex. 03 20 00 00 00"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Adresse
        </span>
        <input
          name="adresse"
          defaultValue={courtier.adresse ?? ""}
          placeholder="ex. 5 rue de la Bourse"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Code postal
          </span>
          <input
            name="codePostal"
            defaultValue={courtier.codePostal ?? ""}
            placeholder="ex. 59830"
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Ville
          </span>
          <input
            name="ville"
            defaultValue={courtier.ville ?? ""}
            placeholder="ex. Cysoing"
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Site web
        </span>
        <input
          name="siteWeb"
          type="text"
          inputMode="url"
          defaultValue={courtier.siteWeb ?? ""}
          placeholder="https://…"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
          {state.error}
        </p>
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
