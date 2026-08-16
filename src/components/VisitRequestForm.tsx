"use client";

import { useActionState } from "react";
import { createVisitRequestAction, type VisitFormState } from "@/lib/visit-actions";

const initialState: VisitFormState = {};

export default function VisitRequestForm({ listingId }: { listingId: string }) {
  const [state, formAction, pending] = useActionState(
    createVisitRequestAction,
    initialState
  );

  if (state.success) {
    return (
      <p className="m-0 mt-4 rounded-xl bg-[#EAF3E8] px-4 py-3 font-sans text-[13px] text-ink">
        Votre demande a été envoyée — le propriétaire vous recontactera
        directement.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="listingId" value={listingId} />

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          VOTRE MESSAGE
        </span>
        <textarea
          name="message"
          required
          rows={3}
          placeholder="Je souhaite visiter ce bien…"
          className="rounded-xl border border-line bg-white px-3.5 py-3 font-sans text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            DATE SOUHAITÉE (FACULTATIF)
          </span>
          <input
            name="preferredDate"
            type="date"
            className="rounded-xl border border-line bg-white px-3.5 py-3 font-sans text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            TÉLÉPHONE (FACULTATIF)
          </span>
          <input
            name="telephone"
            type="tel"
            placeholder="ex. 06 00 00 00 00"
            className="rounded-xl border border-line bg-white px-3.5 py-3 font-sans text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      </div>

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 font-mono text-[12px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-5 py-3 font-mono text-[11px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "ENVOI…" : "DEMANDER UNE VISITE →"}
      </button>
    </form>
  );
}
