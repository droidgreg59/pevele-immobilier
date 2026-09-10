"use client";

import { useActionState } from "react";
import { saveEstimateLeadAction, type EstimateLeadState } from "@/lib/estimate-actions";
import TurnstileWidget from "./TurnstileWidget";

const initialState: EstimateLeadState = {};

const fieldCls =
  "box-border w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

export default function EstimateLeadForm({
  villageSlug,
  communeNom,
  surface,
  type,
  dpe,
  low,
  high,
}: {
  villageSlug: string;
  communeNom: string;
  surface: number;
  type: string;
  dpe: string | null;
  low: number;
  high: number;
}) {
  const [state, formAction, pending] = useActionState(saveEstimateLeadAction, initialState);

  if (state.success) {
    return (
      <div className="mt-4 rounded-xl bg-[#EAF3E8] px-4 py-3.5 text-[13.5px] leading-[1.5] text-ink">
        C&apos;est envoyé — vous recevez votre estimation à {communeNom} par email.
        Vous pouvez la faire affiner par une agence quand vous voulez.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 rounded-xl bg-blue-soft p-4">
      <p className="m-0 text-[13px] font-semibold text-ink">
        Recevoir cette estimation par email + un suivi du marché
      </p>
      <input type="hidden" name="villageSlug" value={villageSlug} />
      <input type="hidden" name="surface" value={surface} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="dpe" value={dpe ?? ""} />
      <input type="hidden" name="low" value={low} />
      <input type="hidden" name="high" value={high} />

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <input name="nom" required placeholder="Nom" className={fieldCls} />
        <input type="email" name="email" required placeholder="Email" className={fieldCls} />
        <input
          type="tel"
          name="telephone"
          placeholder="Téléphone (facultatif)"
          className={fieldCls}
        />
      </div>

      <div className="mt-2.5">
        <TurnstileWidget action="estimate_lead" resetKey={state.error} />
      </div>

      {state.error ? (
        <p className="m-0 mt-2 rounded-lg bg-[#FBEAEA] px-3 py-2 text-[12.5px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2.5 rounded-full bg-blue px-4 py-2.5 text-[12.5px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Recevoir mon estimation →"}
      </button>
      <p className="m-0 mt-2 text-[11px] leading-[1.4] text-muted-2">
        Sans engagement. Vos coordonnées servent à vous envoyer l&apos;estimation et,
        si vous le souhaitez plus tard, à vous mettre en relation avec une agence locale.
      </p>
    </form>
  );
}
