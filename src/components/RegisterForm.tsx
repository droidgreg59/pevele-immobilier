"use client";

import { useActionState, useState } from "react";
import { registerAction, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );
  const [type, setType] = useState<"PARTICULIER" | "AGENCE">("PARTICULIER");

  return (
    <form action={formAction} className="flex max-w-[520px] flex-col gap-4">
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setType("PARTICULIER")}
          className="border-2 border-ink px-4 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-[#FDEBC2]"
          style={{ background: type === "PARTICULIER" ? "#FBF3DC" : "#fff" }}
        >
          PARTICULIER
        </button>
        <button
          type="button"
          onClick={() => setType("AGENCE")}
          className="border-2 border-ink px-4 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-[#FDEBC2]"
          style={{ background: type === "AGENCE" ? "#FBF3DC" : "#fff" }}
        >
          AGENCE
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          {type === "AGENCE" ? "NOM DU CONTACT" : "NOM"}
        </span>
        <input
          name="nom"
          required
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      {type === "AGENCE" ? (
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            NOM DE L&apos;AGENCE
          </span>
          <input
            name="entreprise"
            required
            className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
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
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
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
        {pending ? "CRÉATION DU COMPTE…" : "CRÉER MON COMPTE →"}
      </button>
    </form>
  );
}
