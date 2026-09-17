"use client";

import { useActionState } from "react";
import {
  submitAgencyVerificationAction,
  type AgencyVerificationFormState,
} from "@/lib/agency-actions";
import type { AgencyVerification } from "@/lib/agency-verification";

const initial: AgencyVerificationFormState = {};

const inputCls =
  "rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

export default function AgencyVerificationCard({
  verification: v,
}: {
  verification: AgencyVerification;
}) {
  const [state, formAction, pending] = useActionState(
    submitAgencyVerificationAction,
    initial
  );

  const verified = v.verifStatut === "VERIFIEE";
  const enAttente = v.verifStatut === "EN_ATTENTE" && !state.success;
  const showForm = !verified && !enAttente;

  return (
    <section className="flex max-w-[720px] flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 font-display text-[20px] text-ink">Vérification de l&apos;agence</h2>
        {verified ? (
          <span className="rounded-full bg-[#EAF3E8] px-3 py-1 text-[12px] font-semibold text-green">
            ✓ Agence vérifiée
          </span>
        ) : enAttente ? (
          <span className="rounded-full bg-[#FBF3DC] px-3 py-1 text-[12px] font-semibold text-gold">
            En cours de vérification
          </span>
        ) : null}
      </div>

      {verified ? (
        <p className="m-0 text-[13.5px] leading-[1.6] text-muted">
          Votre agence est vérifiée{" "}
          {v.verifTraiteeLe ? `depuis le ${v.verifTraiteeLe.toLocaleDateString("fr-FR")}` : ""}. Le
          badge « Agence vérifiée » apparaît sur votre page publique, dans l&apos;annuaire des
          professionnels et sur vos annonces.
        </p>
      ) : enAttente || state.success ? (
        <p className="m-0 text-[13.5px] leading-[1.6] text-muted">
          Votre demande a été transmise. Un administrateur contrôle le SIRET et la carte
          professionnelle sous quelques jours — vous serez prévenu par email.
        </p>
      ) : (
        <p className="m-0 text-[13.5px] leading-[1.6] text-muted">
          Faites vérifier votre agence pour afficher le badge « Agence vérifiée ». Nous
          contrôlons le SIRET et le numéro de carte professionnelle (carte T,
          transactions immobilières) — obligatoire pour exercer (loi Hoguet).
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
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">SIRET</span>
            <input
              name="siret"
              required
              inputMode="numeric"
              defaultValue={v.siret ?? ""}
              placeholder="14 chiffres"
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                N° de carte professionnelle (carte T)
              </span>
              <input
                name="carteProfessionnelle"
                required
                defaultValue={v.carteProfessionnelle ?? ""}
                placeholder="ex. CPI 5901 2020 000 012 345"
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                CCI émettrice
              </span>
              <input
                name="carteProCci"
                required
                defaultValue={v.carteProCci ?? ""}
                placeholder="ex. CCI Grand Lille"
                className={inputCls}
              />
            </label>
          </div>
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
