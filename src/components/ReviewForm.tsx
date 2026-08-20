"use client";

import { useActionState, useState } from "react";
import {
  upsertReviewAction,
  deleteReviewAction,
  type ReviewFormState,
} from "@/lib/review-actions";

const initialState: ReviewFormState = {};

export default function ReviewForm({
  agencyId,
  existingReview,
}: {
  agencyId: string;
  existingReview: { note: number; commentaire: string } | null;
}) {
  const [state, formAction, pending] = useActionState(
    upsertReviewAction,
    initialState
  );
  const [note, setNote] = useState(existingReview?.note ?? 5);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex max-w-[560px] flex-col gap-3.5">
        <input type="hidden" name="agencyId" value={agencyId} />
        <input type="hidden" name="note" value={note} />

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Votre note
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNote(n)}
                aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                className="text-2xl leading-none"
                style={{ color: n <= note ? "var(--pvl-yellow)" : "var(--pvl-line)" }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Votre avis
          </span>
          <textarea
            name="commentaire"
            required
            rows={3}
            defaultValue={existingReview?.commentaire ?? ""}
            placeholder="Votre expérience avec cette agence…"
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>

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
          {pending
            ? "Envoi…"
            : existingReview
              ? "Modifier mon avis →"
              : "Publier mon avis →"}
        </button>
      </form>

      {existingReview ? (
        <form
          action={deleteReviewAction}
          className="self-start"
          onSubmit={(e) => {
            if (!window.confirm("Supprimer votre avis ?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="agencyId" value={agencyId} />
          <button
            type="submit"
            className="text-[12.5px] font-semibold text-muted"
          >
            Supprimer mon avis
          </button>
        </form>
      ) : null}
    </div>
  );
}
