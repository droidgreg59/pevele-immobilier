"use client";

import { useActionState } from "react";
import { createFinancingRequestAction, type FinancingFormState } from "@/lib/financing-actions";
import TurnstileWidget from "./TurnstileWidget";

const initialState: FinancingFormState = {};

export default function FinancingRequestForm({
  courtierId,
  listingId,
}: {
  courtierId: string;
  listingId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createFinancingRequestAction,
    initialState
  );

  if (state.success) {
    return (
      <p className="m-0 max-w-[560px] rounded-xl bg-[#EAF3E8] px-4 py-3.5 text-[14px] text-ink">
        Votre demande a été envoyée — le courtier vous recontactera directement.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-[560px] flex-col gap-3.5">
      <input type="hidden" name="courtierId" value={courtierId} />
      {listingId ? <input type="hidden" name="listingId" value={listingId} /> : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Votre projet
        </span>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Décrivez votre projet : montant recherché, apport, situation…"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Téléphone (facultatif)
        </span>
        <input
          name="telephone"
          type="tel"
          placeholder="ex. 06 00 00 00 00"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <TurnstileWidget action="financing_request" resetKey={state.error} />

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-5 py-3 text-[13px] font-bold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Demander une étude →"}
      </button>
    </form>
  );
}
