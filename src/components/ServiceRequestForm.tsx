"use client";

import { useActionState, useState } from "react";
import {
  requestAgencyServiceAction,
  type ServiceRequestState,
} from "@/lib/agency-service-actions";

const initial: ServiceRequestState = {};
const inputCls =
  "rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

export default function ServiceRequestForm({
  serviceId,
  defaultTelephone,
  interet = false,
}: {
  serviceId: string;
  defaultTelephone: string;
  /** Service pas encore lancé : un seul bouton « Être prévenu ». */
  interet?: boolean;
}) {
  const [state, formAction, pending] = useActionState(requestAgencyServiceAction, initial);
  const [open, setOpen] = useState(false);

  if (interet) {
    if (state.success) {
      return (
        <p className="m-0 rounded-xl bg-[#EAF3E8] px-4 py-3 text-[13.5px] leading-[1.5] text-ink">
          ✓ C&apos;est noté : vous serez prévenu dès le lancement.
        </p>
      );
    }
    return (
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="service" value={serviceId} />
        {state.error ? (
          <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full border border-line bg-white px-6 py-3.5 text-[13.5px] font-semibold text-ink transition hover:bg-surface disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Être prévenu au lancement"}
        </button>
      </form>
    );
  }

  if (state.success) {
    return (
      <p className="m-0 rounded-xl bg-[#EAF3E8] px-4 py-3 text-[13.5px] leading-[1.5] text-ink">
        ✓ Demande envoyée. Nous vous recontactons pour convenir d&apos;un rendez-vous et définir
        ensemble ce que vous souhaitez. Un email de confirmation vient de vous être envoyé.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full bg-yellow px-6 py-3.5 text-[13.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
      >
        Demander un rendez-vous →
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="service" value={serviceId} />
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Votre besoin (facultatif)
        </span>
        <textarea
          name="message"
          rows={3}
          placeholder="Ce que vous attendez, votre site actuel, vos réseaux…"
          className={inputCls}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Vos disponibilités (facultatif)
          </span>
          <input name="disponibilites" placeholder="ex. mardi matin, jeudi après 17 h" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Téléphone
          </span>
          <input name="telephone" type="tel" defaultValue={defaultTelephone} className={inputCls} />
        </label>
      </div>
      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">{state.error}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-yellow px-6 py-3.5 text-[13.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Envoyer ma demande →"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] font-semibold text-muted hover:text-ink"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
