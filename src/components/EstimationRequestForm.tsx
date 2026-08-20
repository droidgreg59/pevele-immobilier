"use client";

import { useActionState } from "react";
import {
  createEstimationRequestAction,
  type EstimationFormState,
} from "@/lib/estimation-actions";

const initialState: EstimationFormState = {};

export default function EstimationRequestForm({ agencyId }: { agencyId: string }) {
  const [state, formAction, pending] = useActionState(
    createEstimationRequestAction,
    initialState
  );

  if (state.success) {
    return (
      <p className="m-0 max-w-[560px] rounded-xl bg-[#EAF3E8] px-4 py-3.5 text-[14px] text-ink">
        Votre demande de rendez-vous a été envoyée — l&apos;agence vous
        recontactera pour la confirmer.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-[560px] flex-col gap-3.5">
      <input type="hidden" name="agencyId" value={agencyId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Adresse du bien
        </span>
        <input
          name="adresse"
          required
          placeholder="ex. 12 rue des Tilleuls, Cysoing"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Nom et prénom
        </span>
        <input
          name="nom"
          required
          placeholder="ex. Marie Dubois"
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
          required
          placeholder="ex. 06 00 00 00 00"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Date souhaitée
          </span>
          <input
            name="preferredDate"
            type="date"
            required
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Heure souhaitée
          </span>
          <input
            name="preferredTime"
            type="time"
            required
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      </div>

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-blue px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Demander une estimation →"}
      </button>
    </form>
  );
}
