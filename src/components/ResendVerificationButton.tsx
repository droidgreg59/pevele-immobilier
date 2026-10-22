"use client";

import { useActionState } from "react";
import { resendEmailVerificationAction } from "@/lib/auth-actions";

/** Bouton « Renvoyer l'email » des bannières de vérification, avec confirmation sur place. */
export default function ResendVerificationButton() {
  const [state, action, pending] = useActionState(resendEmailVerificationAction, null);

  if (state === "sent") {
    return (
      <span className="text-[12.5px] font-semibold text-[#1f7a4d]">
        ✓ Email renvoyé — pensez à vérifier vos indésirables.
      </span>
    );
  }

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Renvoyer l'email"}
      </button>
    </form>
  );
}
