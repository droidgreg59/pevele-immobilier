"use client";

import { useActionState } from "react";
import { addOfficialReviewAction } from "@/lib/admin-reviews-actions";
import type { OfficialReviewFormState } from "@/lib/admin-reviews-actions";
import type { AgencySummary } from "@/lib/agencies";

const initialState: OfficialReviewFormState = {};

export default function OfficialReviewForm({ agencies }: { agencies: AgencySummary[] }) {
  const [state, formAction, pending] = useActionState(addOfficialReviewAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <select
        name="agencyId"
        required
        defaultValue=""
        className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
      >
        <option value="" disabled>
          Choisir une agence…
        </option>
        {agencies.map((a) => (
          <option key={a.id} value={a.id}>
            {a.entreprise ?? a.nom}
          </option>
        ))}
      </select>
      <select
        name="note"
        required
        defaultValue="5"
        className="w-32 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} / 5
          </option>
        ))}
      </select>
      <textarea
        name="commentaire"
        required
        rows={3}
        placeholder="Commentaire de l'avis officiel Pévèle Immobilier…"
        className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
      />
      {state?.error ? (
        <p className="m-0 text-[12.5px] text-gold">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-5 py-2.5 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Publication…" : "Publier l'avis officiel →"}
      </button>
    </form>
  );
}
