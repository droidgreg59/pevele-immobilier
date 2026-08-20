"use client";

import { useActionState, useState } from "react";
import {
  updateAgencyProfileAction,
  type AgencyProfileFormState,
} from "@/lib/agency-actions";
import type { AgencyProfile } from "@/lib/agencies";

const initialState: AgencyProfileFormState = {};

export default function AgencyProfileForm({
  agency,
}: {
  agency: AgencyProfile;
}) {
  const [state, formAction, pending] = useActionState(
    updateAgencyProfileAction,
    initialState
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(agency.logoUrl);

  return (
    <form action={formAction} className="flex max-w-[640px] flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Logo de l&apos;agence
        </span>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-xl text-muted-2">
                {(agency.entreprise ?? agency.nom).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label className="cursor-pointer rounded-full border border-line bg-white px-4 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface">
            {logoPreview ? "Changer le logo" : "Ajouter un logo"}
            <input
              type="file"
              name="logo"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setLogoPreview(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>
        <span className="text-[12px] text-muted-2">
          JPEG, PNG ou WebP, 5 Mo max.
        </span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Nom de l&apos;agence
        </span>
        <input
          name="entreprise"
          required
          defaultValue={agency.entreprise ?? ""}
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Téléphone
        </span>
        <input
          name="telephone"
          type="tel"
          defaultValue={agency.telephone ?? ""}
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
          defaultValue={agency.adresse ?? ""}
          placeholder="ex. 12 place de la Mairie"
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
            defaultValue={agency.codePostal ?? ""}
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
            defaultValue={agency.ville ?? ""}
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
          type="url"
          defaultValue={agency.siteWeb ?? ""}
          placeholder="https://…"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Lien vers votre fiche Google (avis)
        </span>
        <input
          name="googleAvisUrl"
          type="url"
          defaultValue={agency.googleAvisUrl ?? ""}
          placeholder="https://g.page/r/…"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
        <span className="text-[12px] text-muted-2">
          Le lien vers votre fiche Google (Maps ou Business). On affichera un
          bouton vers cette page — on n&apos;affiche pas votre note Google
          directement.
        </span>
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
