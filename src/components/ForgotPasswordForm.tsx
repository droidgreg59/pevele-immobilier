"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type ResetRequestState } from "@/lib/auth-actions";

const initialState: ResetRequestState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <div className="max-w-[440px] rounded-2xl bg-[#EAF3E8] px-5 py-4 text-[13.5px] text-ink">
        Si un compte existe avec cette adresse, un email vient de vous être envoyé avec un lien
        pour réinitialiser votre mot de passe.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-[440px] flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
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
        className="self-start rounded-full bg-yellow px-6.5 py-4 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer le lien →"}
      </button>
    </form>
  );
}
