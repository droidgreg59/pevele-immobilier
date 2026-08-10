"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="flex max-w-[440px] flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          EMAIL
        </span>
        <input
          type="email"
          name="email"
          required
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          MOT DE PASSE
        </span>
        <input
          type="password"
          name="password"
          required
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      {state.error ? (
        <p className="m-0 border-2 border-ink bg-[#FBEAEA] px-4 py-3 font-mono text-[12px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px disabled:opacity-60"
      >
        {pending ? "CONNEXION…" : "SE CONNECTER →"}
      </button>
    </form>
  );
}
