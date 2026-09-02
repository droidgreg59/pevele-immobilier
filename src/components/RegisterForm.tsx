"use client";

import { useActionState, useEffect, useState } from "react";
import Script from "next/script";
import { registerAction, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

type AccountType = "PARTICULIER" | "AGENCE" | "ARTISAN";

declare global {
  interface Window {
    turnstile?: { reset: (widgetId?: string) => void };
  }
}

export default function RegisterForm({
  next,
  initialType,
}: {
  next?: string;
  initialType?: AccountType;
}) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );
  const [type, setType] = useState<AccountType>(initialType ?? "PARTICULIER");
  const isPro = type === "AGENCE" || type === "ARTISAN";

  // Un token Turnstile est à usage unique : après un échec (email déjà pris,
  // mot de passe trop court…) il faut regénérer le widget pour la resoumission.
  useEffect(() => {
    if (state.error) {
      window.turnstile?.reset();
    }
  }, [state.error]);

  return (
    <form action={formAction} className="flex max-w-[520px] flex-col gap-4">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <input type="hidden" name="type" value={type} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setType("PARTICULIER")}
          className="rounded-xl px-3 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: type === "PARTICULIER" ? "var(--pvl-blue-soft)" : "#fff",
            border: `1px solid ${type === "PARTICULIER" ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
          }}
        >
          Particulier
        </button>
        <button
          type="button"
          onClick={() => setType("AGENCE")}
          className="rounded-xl px-3 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: type === "AGENCE" ? "var(--pvl-blue-soft)" : "#fff",
            border: `1px solid ${type === "AGENCE" ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
          }}
        >
          Agence
        </button>
        <button
          type="button"
          onClick={() => setType("ARTISAN")}
          className="rounded-xl px-3 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: type === "ARTISAN" ? "var(--pvl-blue-soft)" : "#fff",
            border: `1px solid ${type === "ARTISAN" ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
          }}
        >
          Artisan
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {isPro ? "Nom du contact" : "Nom"}
        </span>
        <input
          name="nom"
          required
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      {isPro ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {type === "AGENCE" ? "Nom de l'agence" : "Nom de l'entreprise"}
          </span>
          <input
            name="entreprise"
            required
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      ) : null}

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

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Mot de passe (8 caractères minimum)
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div
        className="cf-turnstile"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-action="register"
      />

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
        {pending ? "Création du compte…" : "Créer mon compte →"}
      </button>
    </form>
  );
}
