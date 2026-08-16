"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="flex max-w-[440px] flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          EMAIL
        </span>
        <input
          type="email"
          name="email"
          required
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
        className="self-start rounded-full bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "CONNEXION…" : "SE CONNECTER →"}
      </button>
    </form>
  );
}
