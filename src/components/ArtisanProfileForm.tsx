"use client";

import { useActionState, useState } from "react";
import {
  updateArtisanProfileAction,
  type ArtisanProfileFormState,
} from "@/lib/artisan-actions";
import { artisanCategories } from "@/data/artisanCategories";
import { villages } from "@/data/villages";
import type { ArtisanProfile } from "@/lib/artisans";

const initialState: ArtisanProfileFormState = {};

export default function ArtisanProfileForm({
  artisan,
}: {
  artisan: ArtisanProfile;
}) {
  const [state, formAction, pending] = useActionState(
    updateArtisanProfileAction,
    initialState
  );
  const [categories, setCategories] = useState<string[]>(artisan.categories);
  const [communes, setCommunes] = useState<string[]>(artisan.communesDesservies);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <form action={formAction} className="flex max-w-[640px] flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          NOM DE L&apos;ENTREPRISE
        </span>
        <input
          name="entreprise"
          required
          defaultValue={artisan.entreprise ?? ""}
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          PRÉSENTATION
        </span>
        <textarea
          name="description"
          rows={4}
          defaultValue={artisan.description ?? ""}
          placeholder="Votre activité, votre expérience, vos réalisations…"
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          SPÉCIALITÉS
        </span>
        <div className="flex flex-wrap gap-2">
          {artisanCategories.map((cat) => {
            const active = categories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(categories, setCategories, cat)}
                className="rounded-full px-3 py-2 font-mono text-[11px] font-medium transition-colors hover:bg-surface"
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
        <span className="font-mono text-[10.5px] font-medium text-muted">
          COMMUNES DESSERVIES
        </span>
        <div className="flex flex-wrap gap-1.5">
          {villages.map((v) => {
            const active = communes.includes(v.slug);
            return (
              <button
                key={v.slug}
                type="button"
                onClick={() => toggle(communes, setCommunes, v.slug)}
                className="rounded-full px-2.5 py-1.5 font-mono text-[10px] font-medium transition-colors hover:bg-surface"
                style={{
                  background: active ? "var(--pvl-yellow)" : "#fff",
                  color: "var(--pvl-ink)",
                  border: `1px solid ${active ? "transparent" : "var(--pvl-line)"}`,
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
        <span className="font-mono text-[10.5px] font-medium text-muted">
          TÉLÉPHONE
        </span>
        <input
          name="telephone"
          type="tel"
          defaultValue={artisan.telephone ?? ""}
          placeholder="ex. 03 20 00 00 00"
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          ADRESSE
        </span>
        <input
          name="adresse"
          defaultValue={artisan.adresse ?? ""}
          placeholder="ex. 5 rue des Artisans"
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            CODE POSTAL
          </span>
          <input
            name="codePostal"
            defaultValue={artisan.codePostal ?? ""}
            placeholder="ex. 59830"
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            VILLE
          </span>
          <input
            name="ville"
            defaultValue={artisan.ville ?? ""}
            placeholder="ex. Cysoing"
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          SITE WEB
        </span>
        <input
          name="siteWeb"
          type="url"
          defaultValue={artisan.siteWeb ?? ""}
          placeholder="https://…"
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 font-mono text-[12px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "ENREGISTREMENT…" : "ENREGISTRER →"}
      </button>
    </form>
  );
}
