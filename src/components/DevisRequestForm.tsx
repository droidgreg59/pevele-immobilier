"use client";

import { useActionState } from "react";
import { createDevisRequestAction, type DevisFormState } from "@/lib/devis-actions";

const initialState: DevisFormState = {};

export default function DevisRequestForm({ artisanId }: { artisanId: string }) {
  const [state, formAction, pending] = useActionState(
    createDevisRequestAction,
    initialState
  );

  if (state.success) {
    return (
      <p className="m-0 max-w-[560px] rounded-xl bg-[#EAF3E8] px-4 py-3.5 font-sans text-[14px] text-ink">
        Votre demande a été envoyée — l&apos;artisan vous recontactera directement.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-[560px] flex-col gap-3.5">
      <input type="hidden" name="artisanId" value={artisanId} />

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          VOTRE BESOIN
        </span>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Décrivez les travaux envisagés, le délai souhaité…"
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
        className="self-start rounded-full bg-yellow px-5 py-3 font-mono text-[11px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "ENVOI…" : "DEMANDER UN DEVIS →"}
      </button>
    </form>
  );
}
