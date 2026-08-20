"use client";

import { useActionState } from "react";
import {
  updateXmlImportUrlAction,
  syncAgencyXmlAction,
  type XmlImportUrlFormState,
  type XmlSyncFormState,
} from "@/lib/ac3-actions";
import type { AgencyProfile } from "@/lib/agencies";

const urlInitialState: XmlImportUrlFormState = {};
const syncInitialState: XmlSyncFormState = {};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function XmlImportPanel({ agency }: { agency: AgencyProfile }) {
  const [urlState, urlAction, urlPending] = useActionState(
    updateXmlImportUrlAction,
    urlInitialState
  );
  const [syncState, syncAction, syncPending] = useActionState(
    syncAgencyXmlAction,
    syncInitialState
  );

  return (
    <div className="flex max-w-[640px] flex-col gap-5 rounded-2xl border border-line bg-white p-6">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Import XML (AC3 / Immofacile)
        </span>
        <p className="mt-1.5 text-[13.5px] leading-[1.6] text-muted">
          Publiez vos annonces automatiquement depuis le flux XML de votre
          logiciel de transaction, en plus de la saisie manuelle. Seuls les
          biens en Pévèle, avec un statut actif, sont importés.
        </p>
      </div>

      <form action={urlAction} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Adresse du flux
          </span>
          <input
            name="xmlImportUrl"
            type="url"
            defaultValue={agency.xmlImportUrl ?? ""}
            placeholder="https://clients.immo-facile.com/..."
            className="rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        {urlState.error ? (
          <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
            {urlState.error}
          </p>
        ) : null}
        {urlState.success ? (
          <p className="m-0 rounded-xl bg-[#EAF4EA] px-4 py-3 text-[13px] text-ink">
            Adresse enregistrée.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={urlPending}
          className="self-start rounded-full border border-line bg-white px-5 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface disabled:opacity-60"
        >
          {urlPending ? "Enregistrement…" : "Enregistrer l'adresse"}
        </button>
      </form>

      <div className="border-t border-line pt-5">
        {agency.xmlLastSyncAt ? (
          <p className="m-0 text-[13px] text-muted">
            Dernière synchronisation : {formatDate(agency.xmlLastSyncAt)}
            {agency.xmlLastSyncError ? (
              <span className="text-ink"> — échec : {agency.xmlLastSyncError}</span>
            ) : (
              <span> — {agency.xmlLastSyncCount ?? 0} bien(s) reçu(s) du flux.</span>
            )}
          </p>
        ) : (
          <p className="m-0 text-[13px] text-muted-2">
            Aucune synchronisation effectuée pour le moment.
          </p>
        )}

        <form action={syncAction} className="mt-3 flex flex-col gap-2">
          {syncState.error ? (
            <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
              {syncState.error}
            </p>
          ) : null}
          {syncState.success ? (
            <p className="m-0 rounded-xl bg-[#EAF4EA] px-4 py-3 text-[13px] text-ink">
              {syncState.imported} annonce(s) créée(s), {syncState.updated} mise(s) à
              jour, {syncState.skipped} ignorée(s) (hors zone, type non pris en
              charge ou statut inactif).
            </p>
          ) : null}
          <button
            type="submit"
            disabled={syncPending || !agency.xmlImportUrl}
            className="self-start rounded-full bg-yellow px-6 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
          >
            {syncPending ? "Synchronisation…" : "Synchroniser maintenant"}
          </button>
        </form>
      </div>
    </div>
  );
}
