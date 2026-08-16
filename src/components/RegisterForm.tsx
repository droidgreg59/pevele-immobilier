"use client";

import { useActionState, useState } from "react";
import { registerAction, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

type AccountType = "PARTICULIER" | "AGENCE" | "ARTISAN";

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

  return (
    <form action={formAction} className="flex max-w-[520px] flex-col gap-4">
      <input type="hidden" name="type" value={type} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setType("PARTICULIER")}
          className="rounded-xl px-3 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: type === "PARTICULIER" ? "#FBF3DC" : "#fff",
            border: `1px solid ${type === "PARTICULIER" ? "transparent" : "var(--pvl-line)"}`,
          }}
        >
          PARTICULIER
        </button>
        <button
          type="button"
          onClick={() => setType("AGENCE")}
          className="rounded-xl px-3 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: type === "AGENCE" ? "#FBF3DC" : "#fff",
            border: `1px solid ${type === "AGENCE" ? "transparent" : "var(--pvl-line)"}`,
          }}
        >
          AGENCE
        </button>
        <button
          type="button"
          onClick={() => setType("ARTISAN")}
          className="rounded-xl px-3 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: type === "ARTISAN" ? "#FBF3DC" : "#fff",
            border: `1px solid ${type === "ARTISAN" ? "transparent" : "var(--pvl-line)"}`,
          }}
        >
          ARTISAN
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          {isPro ? "NOM DU CONTACT" : "NOM"}
        </span>
        <input
          name="nom"
          required
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      {isPro ? (
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            {type === "AGENCE" ? "NOM DE L'AGENCE" : "NOM DE L'ENTREPRISE"}
          </span>
          <input
            name="entreprise"
            required
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      ) : null}

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
          MOT DE PASSE (8 CARACTÈRES MINIMUM)
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
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
        {pending ? "CRÉATION DU COMPTE…" : "CRÉER MON COMPTE →"}
      </button>
    </form>
  );
}
