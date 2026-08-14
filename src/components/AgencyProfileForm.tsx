"use client";

import { useActionState } from "react";
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

  return (
    <form action={formAction} className="flex max-w-[640px] flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          NOM DE L&apos;AGENCE
        </span>
        <input
          name="entreprise"
          required
          defaultValue={agency.entreprise ?? ""}
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          TÉLÉPHONE
        </span>
        <input
          name="telephone"
          type="tel"
          defaultValue={agency.telephone ?? ""}
          placeholder="ex. 03 20 00 00 00"
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          ADRESSE
        </span>
        <input
          name="adresse"
          defaultValue={agency.adresse ?? ""}
          placeholder="ex. 12 place de la Mairie"
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            CODE POSTAL
          </span>
          <input
            name="codePostal"
            defaultValue={agency.codePostal ?? ""}
            placeholder="ex. 59830"
            className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            VILLE
          </span>
          <input
            name="ville"
            defaultValue={agency.ville ?? ""}
            placeholder="ex. Cysoing"
            className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
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
          defaultValue={agency.siteWeb ?? ""}
          placeholder="https://…"
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          LIEN VERS VOTRE FICHE GOOGLE (AVIS)
        </span>
        <input
          name="googleAvisUrl"
          type="url"
          defaultValue={agency.googleAvisUrl ?? ""}
          placeholder="https://g.page/r/…"
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
        <span className="font-sans text-[12px] text-muted-2">
          Le lien vers votre fiche Google (Maps ou Business). On affichera un
          bouton vers cette page — on n&apos;affiche pas votre note Google
          directement.
        </span>
      </label>

      {state.error ? (
        <p className="m-0 border-2 border-ink bg-[#FBEAEA] px-4 py-3 font-mono text-[12px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px disabled:opacity-60"
      >
        {pending ? "ENREGISTREMENT…" : "ENREGISTRER →"}
      </button>
    </form>
  );
}
