"use client";

import { useActionState, useState } from "react";
import { registerAction, type AuthState } from "@/lib/auth-actions";
import TurnstileWidget from "./TurnstileWidget";
import { RESEAUX, AUTRE_RESEAU, mandataireDisplayName } from "@/data/reseaux";

const initialState: AuthState = {};

type AccountType = "PARTICULIER" | "AGENCE" | "ARTISAN" | "COURTIER";

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
  const [modeAnnonces, setModeAnnonces] = useState<"MANUEL" | "AUTOMATISE">("MANUEL");
  // Agence immobilière ou mandataire indépendant d'un réseau (SAFTI, IAD…) :
  // un mandataire ne représente pas une agence, il s'affiche « RÉSEAU – Prénom Nom ».
  const [proStatut, setProStatut] = useState<"AGENCE" | "MANDATAIRE">("AGENCE");
  const [reseauChoice, setReseauChoice] = useState("");
  const [reseauAutre, setReseauAutre] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const mandataire = type === "AGENCE" && proStatut === "MANDATAIRE";
  const reseauPreview = reseauChoice === AUTRE_RESEAU ? reseauAutre.trim() : reseauChoice;
  const isPro = type === "AGENCE" || type === "ARTISAN" || type === "COURTIER";

  return (
    <form action={formAction} className="flex max-w-[520px] flex-col gap-4">
      <input type="hidden" name="type" value={type} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {type === "AGENCE" ? <input type="hidden" name="modeAnnonces" value={modeAnnonces} /> : null}
      {type === "AGENCE" ? <input type="hidden" name="proStatut" value={proStatut} /> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <button
          type="button"
          onClick={() => setType("COURTIER")}
          className="rounded-xl px-3 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: type === "COURTIER" ? "var(--pvl-blue-soft)" : "#fff",
            border: `1px solid ${type === "COURTIER" ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
          }}
        >
          Courtier
        </button>
      </div>

      {type === "AGENCE" ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Vous êtes
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {(
              [
                ["AGENCE", "Une agence immobilière", "Vous exercez sous votre propre carte T."],
                ["MANDATAIRE", "Mandataire d'un réseau", "SAFTI, IAD, MeilleursBiens… agent commercial."],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                onClick={() => setProStatut(value)}
                className="rounded-xl px-3 py-3 text-left text-[13.5px] font-semibold text-ink transition-colors"
                style={{
                  background: proStatut === value ? "var(--pvl-blue-soft)" : "#fff",
                  border: `1px solid ${proStatut === value ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
                }}
              >
                {label}
                <span className="mt-0.5 block text-[12px] font-normal text-muted">{hint}</span>
              </button>
            ))}
          </div>

          {mandataire ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Votre réseau
                </span>
                <select
                  name="reseauChoice"
                  required
                  value={reseauChoice}
                  onChange={(e) => setReseauChoice(e.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                >
                  <option value="">Choisir…</option>
                  {RESEAUX.map((r) => (
                    <option key={r.label} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                  <option value={AUTRE_RESEAU}>Autre réseau…</option>
                </select>
              </label>
              {reseauChoice === AUTRE_RESEAU ? (
                <input
                  name="reseauAutre"
                  required
                  value={reseauAutre}
                  onChange={(e) => setReseauAutre(e.target.value)}
                  placeholder="Nom du réseau"
                  className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                />
              ) : null}
              {reseauPreview && nom.trim() ? (
                <p className="m-0 text-[12.5px] text-muted">
                  Vous apparaîtrez sur le site comme{" "}
                  <b className="text-ink">{mandataireDisplayName(reseauPreview, prenom, nom)}</b>.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {isPro && !mandataire ? "Prénom du contact" : "Prénom"}
          </span>
          <input
            name="prenom"
            required
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {isPro && !mandataire ? "Nom du contact" : "Nom"}
          </span>
          <input
            name="nom"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      </div>

      {isPro && !mandataire ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {type === "AGENCE"
              ? "Nom de l'agence"
              : type === "COURTIER"
                ? "Nom de la société de courtage"
                : "Nom de l'entreprise"}
          </span>
          <input
            name="entreprise"
            required
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      ) : null}

      {type === "AGENCE" ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Comment diffusez-vous vos annonces ?
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setModeAnnonces("MANUEL")}
              className="rounded-xl px-3 py-3 text-left text-[13.5px] font-semibold text-ink transition-colors"
              style={{
                background: modeAnnonces === "MANUEL" ? "var(--pvl-blue-soft)" : "#fff",
                border: `1px solid ${modeAnnonces === "MANUEL" ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
              }}
            >
              Saisie manuelle
              <span className="mt-0.5 block text-[12px] font-normal text-muted">
                Vous déposez vos annonces vous-même sur le site.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setModeAnnonces("AUTOMATISE")}
              className="rounded-xl px-3 py-3 text-left text-[13.5px] font-semibold text-ink transition-colors"
              style={{
                background: modeAnnonces === "AUTOMATISE" ? "var(--pvl-blue-soft)" : "#fff",
                border: `1px solid ${modeAnnonces === "AUTOMATISE" ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
              }}
            >
              Diffusion automatisée
              <span className="mt-0.5 block text-[12px] font-normal text-muted">
                Vos annonces sont synchronisées depuis votre logiciel métier.
              </span>
            </button>
          </div>

          {modeAnnonces === "AUTOMATISE" ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Quel logiciel métier utilisez-vous ?
                </span>
                <input
                  name="logicielMetier"
                  required
                  placeholder="ex. AC3, Immofacile, Netty…"
                  className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                />
              </label>
              <p className="m-0 text-[12.5px] leading-[1.5] text-muted">
                Nous vous contacterons pour effectuer le branchement automatisé de vos
                annonces une fois votre compte validé.
              </p>
            </>
          ) : null}
        </div>
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
          Téléphone
        </span>
        <input
          type="tel"
          name="telephone"
          required
          placeholder="ex. 06 00 00 00 00"
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

      <TurnstileWidget action="register" resetKey={state.error} />

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
