"use client";

import { useActionState } from "react";
import {
  submitCourtierVerificationAction,
  type CourtierVerificationFormState,
} from "@/lib/courtier-actions";
import type { CourtierVerification } from "@/lib/courtier-verification";

const initial: CourtierVerificationFormState = {};

const inputCls =
  "rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

export default function CourtierVerificationCard({
  verification: v,
}: {
  verification: CourtierVerification;
}) {
  const [state, formAction, pending] = useActionState(
    submitCourtierVerificationAction,
    initial
  );

  const verified = v.verifStatut === "VERIFIEE";
  const enAttente = v.verifStatut === "EN_ATTENTE" && !state.success;
  const showForm = !verified && !enAttente;

  return (
    <section className="flex max-w-[720px] flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 font-display text-[20px] text-ink">Vérification du compte</h2>
        {verified ? (
          <span className="rounded-full bg-[#EAF3E8] px-3 py-1 text-[12px] font-semibold text-green">
            ✓ Courtier vérifié
          </span>
        ) : enAttente ? (
          <span className="rounded-full bg-[#FBF3DC] px-3 py-1 text-[12px] font-semibold text-gold">
            En cours de vérification
          </span>
        ) : null}
      </div>

      {verified ? (
        <p className="m-0 text-[13.5px] leading-[1.6] text-muted">
          Votre compte est vérifié{" "}
          {v.verifTraiteeLe ? `depuis le ${v.verifTraiteeLe.toLocaleDateString("fr-FR")}` : ""}. Le
          badge « Courtier vérifié » apparaît sur votre page publique et dans l&apos;annuaire —
          votre fiche n&apos;est visible qu&apos;à partir de cette validation.
        </p>
      ) : enAttente || state.success ? (
        <p className="m-0 text-[13.5px] leading-[1.6] text-muted">
          Votre demande a été transmise. Un administrateur contrôle votre numéro ORIAS sous
          quelques jours — vous serez prévenu par email. Votre fiche reste invisible dans
          l&apos;annuaire jusque-là.
        </p>
      ) : (
        <p className="m-0 text-[13.5px] leading-[1.6] text-muted">
          Faites vérifier votre compte pour apparaître dans l&apos;annuaire des courtiers et
          recevoir des demandes d&apos;étude de financement. Nous contrôlons votre numéro
          d&apos;immatriculation ORIAS — obligatoire pour exercer en tant
          qu&apos;intermédiaire en opérations de banque (IOBSP).
        </p>
      )}

      {v.verifStatut === "REFUSEE" && v.verifRaison ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
          Demande précédente non validée — {v.verifRaison}
        </p>
      ) : null}

      {showForm ? (
        <form action={formAction} className="mt-1 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Numéro ORIAS
            </span>
            <input
              name="orias"
              required
              inputMode="numeric"
              defaultValue={v.orias ?? ""}
              placeholder="ex. 12345678"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              SIRET (facultatif)
            </span>
            <input
              name="siret"
              inputMode="numeric"
              defaultValue={v.siret ?? ""}
              placeholder="14 chiffres"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Zone couverte (facultatif)
            </span>
            <input
              name="zoneCouverte"
              defaultValue={v.zoneCouverte ?? ""}
              placeholder="ex. Pévèle, Carembault, sud de Lille"
              className={inputCls}
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
            className="self-start rounded-full bg-yellow px-6 py-3.5 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Demander la vérification →"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
