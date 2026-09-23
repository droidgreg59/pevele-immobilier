"use client";

import { useActionState } from "react";
import { createVisitRequestAction, type VisitFormState } from "@/lib/visit-actions";
import { tomorrowDateString } from "@/lib/validation";
import { formatPreferredDateTime } from "@/lib/format";
import TurnstileWidget from "./TurnstileWidget";

const initialState: VisitFormState = {};

// Demi-heures 8h-20h : un <select> plutôt qu'un <input type="time"> rend de
// façon identique sur tous les navigateurs — contrairement au <input
// type="time"> natif, dont Safari contrôle l'éditeur interne (icône,
// espacement des segments) sans possibilité de le styler pour qu'il
// corresponde visuellement au champ date à côté.
const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30;
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
});

const fieldCls =
  "rounded-xl border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

export type ExistingVisitRequestInfo = {
  createdAt: Date;
  preferredDate: Date | null;
  traite: boolean;
  ownerIsAgency: boolean;
};

export default function VisitRequestForm({
  listingId,
  defaultTelephone,
  existingRequest,
}: {
  listingId: string;
  defaultTelephone?: string | null;
  existingRequest?: ExistingVisitRequestInfo | null;
}) {
  const [state, formAction, pending] = useActionState(
    createVisitRequestAction,
    initialState
  );

  if (existingRequest) {
    const preferredLabel = formatPreferredDateTime(existingRequest.preferredDate);
    return (
      <p className="m-0 mt-4 rounded-xl bg-[#EAF3E8] px-4 py-3 text-[13px] leading-[1.5] text-ink">
        Vous avez déjà demandé une visite pour ce bien le{" "}
        {existingRequest.createdAt.toLocaleDateString("fr-FR")}
        {preferredLabel ? ` (créneau souhaité : ${preferredLabel})` : ""}.{" "}
        {existingRequest.traite
          ? "Cette demande a été traitée."
          : `${existingRequest.ownerIsAgency ? "L'agence" : "Le propriétaire"} vous recontactera directement.`}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="m-0 mt-4 rounded-xl bg-[#EAF3E8] px-4 py-3 text-[13px] text-ink">
        Votre demande a été envoyée —{" "}
        {state.ownerIsAgency ? "l'agence" : "le propriétaire"} vous recontactera
        directement.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="listingId" value={listingId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Votre message
        </span>
        <textarea
          name="message"
          required
          rows={3}
          defaultValue="Je souhaite visiter ce bien"
          className={fieldCls}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Date souhaitée (facultatif)
          </span>
          <input
            name="preferredDate"
            type="date"
            min={tomorrowDateString()}
            className={fieldCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Heure souhaitée
          </span>
          <select name="preferredTime" defaultValue="" className={fieldCls}>
            <option value="" disabled>
              --:--
            </option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Téléphone
        </span>
        <input
          name="telephone"
          type="tel"
          required
          defaultValue={defaultTelephone ?? undefined}
          placeholder="ex. 06 00 00 00 00"
          className={fieldCls}
        />
      </label>

      <TurnstileWidget action="visit_request" resetKey={state.error} />

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Demander une visite →"}
      </button>
    </form>
  );
}
