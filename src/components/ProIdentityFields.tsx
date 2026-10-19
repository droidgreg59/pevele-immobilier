"use client";

import { useEffect, useState } from "react";
import { RESEAUX, AUTRE_RESEAU, mandataireDisplayName } from "@/data/reseaux";

export type ProIdentity = {
  proStatut: "AGENCE" | "MANDATAIRE";
  reseauChoice: string;
  reseauAutre: string;
  prenom: string;
  nom: string;
  entreprise: string;
};

const inputCls =
  "rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

/** Valeurs initiales à partir d'un compte existant. */
export function initialProIdentity(a: {
  reseau: string | null;
  prenom: string | null;
  nom: string;
  entreprise: string | null;
}): ProIdentity {
  const known = a.reseau && RESEAUX.some((r) => r.label === a.reseau);
  return {
    proStatut: a.reseau ? "MANDATAIRE" : "AGENCE",
    reseauChoice: a.reseau ? (known ? a.reseau : AUTRE_RESEAU) : "",
    reseauAutre: a.reseau && !known ? a.reseau : "",
    prenom: a.prenom ?? "",
    nom: a.nom,
    entreprise: a.reseau ? "" : (a.entreprise ?? ""),
  };
}

/**
 * Identité publique d'un compte professionnel « agence » : agence immobilière
 * (nom libre) ou mandataire indépendant d'un réseau (nom calculé « RÉSEAU –
 * Prénom Nom », logo du réseau). Rend des champs nommés (utilisables dans un
 * <form>) et prévient `onChange` pour les écrans qui construisent eux-mêmes
 * leur FormData.
 */
export default function ProIdentityFields({
  initial,
  onChange,
  wasVerified = false,
}: {
  initial: ProIdentity;
  onChange?: (v: ProIdentity) => void;
  /** Vérification acquise ou en cours : changer de statut l'annule. */
  wasVerified?: boolean;
}) {
  const [v, setV] = useState<ProIdentity>(initial);
  const set = (patch: Partial<ProIdentity>) => setV((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    onChange?.(v);
  }, [v, onChange]);

  const mandataire = v.proStatut === "MANDATAIRE";
  const reseau = v.reseauChoice === AUTRE_RESEAU ? v.reseauAutre.trim() : v.reseauChoice;
  const statutChanged = v.proStatut !== initial.proStatut;

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="proStatut" value={v.proStatut} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {(
          [
            ["AGENCE", "Agence immobilière", "Vous exercez sous votre propre carte T."],
            ["MANDATAIRE", "Mandataire d'un réseau", "SAFTI, IAD, MeilleursBiens… agent commercial."],
          ] as const
        ).map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            onClick={() => set({ proStatut: value })}
            className="rounded-xl px-3 py-3 text-left text-[13.5px] font-semibold text-ink transition-colors"
            style={{
              background: v.proStatut === value ? "var(--pvl-blue-soft)" : "#fff",
              border: `1px solid ${v.proStatut === value ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
            }}
          >
            {label}
            <span className="mt-0.5 block text-[12px] font-normal text-muted">{hint}</span>
          </button>
        ))}
      </div>

      {statutChanged && wasVerified ? (
        <p className="m-0 rounded-xl bg-[#FBF3DC] px-4 py-3 text-[13px] text-ink">
          Changer de statut annule votre vérification (acquise ou en cours) : il faudra la
          refaire, et votre compte restera masqué jusqu&apos;à ce qu&apos;un administrateur le
          valide à nouveau.
        </p>
      ) : null}

      {mandataire ? (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Votre réseau
            </span>
            <select
              name="reseauChoice"
              required
              value={v.reseauChoice}
              onChange={(e) => set({ reseauChoice: e.target.value })}
              className={inputCls}
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
          {v.reseauChoice === AUTRE_RESEAU ? (
            <input
              name="reseauAutre"
              required
              value={v.reseauAutre}
              onChange={(e) => set({ reseauAutre: e.target.value })}
              placeholder="Nom du réseau"
              className={inputCls}
            />
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Prénom</span>
              <input
                name="prenom"
                required
                value={v.prenom}
                onChange={(e) => set({ prenom: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Nom</span>
              <input
                name="nom"
                required
                value={v.nom}
                onChange={(e) => set({ nom: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>
          {reseau && v.nom.trim() ? (
            <p className="m-0 text-[12.5px] text-muted">
              Nom affiché sur le site :{" "}
              <b className="text-ink">{mandataireDisplayName(reseau, v.prenom, v.nom)}</b>
            </p>
          ) : null}
        </>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Nom de l&apos;agence
          </span>
          <input
            name="entreprise"
            required
            value={v.entreprise}
            onChange={(e) => set({ entreprise: e.target.value })}
            className={inputCls}
          />
        </label>
      )}
    </div>
  );
}
