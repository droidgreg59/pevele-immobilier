"use client";

import { useActionState, useState } from "react";
import { tomorrowDateString } from "@/lib/validation";
import {
  addOpenHouseDateAction,
  deleteOpenHouseDateAction,
  updateOpenHouseNoteAction,
  setOpenHouseCancelledAction,
  respondToOpenHouseRegistrationAction,
  type OpenHouseDateFormState,
} from "@/lib/open-house-actions";

type Registration = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  createdAt: string | Date;
};

type OpenHouseDate = {
  id: string;
  startAt: string | Date;
  endAt: string | Date;
  capacity: number;
  acceptedCount: number;
  registrations: Registration[];
};

export type OpenHouseForOwnerView = {
  id: string;
  note: string | null;
  annulee: boolean;
  dates: OpenHouseDate[];
};

const STATUT_LABEL: Record<Registration["statut"], { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "#FBF3DC", color: "var(--pvl-gold)" },
  ACCEPTEE: { label: "Acceptée", bg: "#EAF3E8", color: "var(--pvl-green)" },
  REFUSEE: { label: "Refusée", bg: "var(--pvl-surface)", color: "var(--pvl-muted)" },
};

function formatDate(start: string | Date, end: string | Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const t = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${t(s)} – ${t(e)}`;
}

const inputCls =
  "rounded-xl border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

const addInitial: OpenHouseDateFormState = {};

function AddDateForm({ listingId }: { listingId: string }) {
  const [state, formAction, pending] = useActionState(addOpenHouseDateAction, addInitial);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-surface p-4">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        Ajouter une date de portes ouvertes
      </span>
      <input type="hidden" name="listingId" value={listingId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[11px] font-semibold text-muted">Date</span>
          <input type="date" name="date" required min={tomorrowDateString()} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-muted">Début</span>
          <input type="time" name="startTime" required defaultValue="14:00" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-muted">Fin</span>
          <input type="time" name="endTime" required defaultValue="16:00" className={inputCls} />
        </label>
      </div>
      <label className="flex max-w-[180px] flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-muted">Places (max acceptées)</span>
        <input type="number" name="capacity" required min={1} max={200} defaultValue={10} className={inputCls} />
      </label>
      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-5 py-2.5 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Ajout…" : "+ Ajouter cette date"}
      </button>
    </form>
  );
}

const respondInitial: OpenHouseDateFormState = {};

function RespondForm({ registrationId }: { registrationId: string }) {
  const [state, formAction, pending] = useActionState(
    respondToOpenHouseRegistrationAction,
    respondInitial
  );
  return (
    <div className="flex flex-col gap-1.5">
      <form action={formAction} className="flex items-center gap-4">
        <input type="hidden" name="registrationId" value={registrationId} />
        <button
          type="submit"
          name="decision"
          value="accept"
          disabled={pending}
          className="rounded-full bg-yellow px-3.5 py-2 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
        >
          Accepter
        </button>
        <button
          type="submit"
          name="decision"
          value="refuse"
          disabled={pending}
          className="text-[12.5px] font-semibold text-muted hover:text-ink disabled:opacity-60"
        >
          Refuser
        </button>
      </form>
      {state.error ? (
        <p className="m-0 text-[12px] font-medium text-[#b3261e]">{state.error}</p>
      ) : null}
    </div>
  );
}

export default function OpenHousePanel({
  listingId,
  openHouse,
}: {
  listingId: string;
  openHouse: OpenHouseForOwnerView | null;
}) {
  const [now] = useState(() => Date.now());
  const totalPending =
    openHouse?.dates.reduce(
      (sum, d) => sum + d.registrations.filter((r) => r.statut === "EN_ATTENTE").length,
      0
    ) ?? 0;

  return (
    <section className="mt-10 flex max-w-[720px] flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 font-display text-[22px] text-ink">Portes ouvertes</h2>
          <p className="m-0 text-[13px] text-muted">
            Organisez une visite groupée : les visiteurs s&apos;inscrivent depuis la fiche,
            vous validez chaque inscription.
          </p>
        </div>
        {totalPending > 0 ? (
          <span className="rounded-full bg-[#FBF3DC] px-2.5 py-1 text-[11px] font-semibold text-gold">
            {totalPending} inscription{totalPending > 1 ? "s" : ""} à traiter
          </span>
        ) : null}
      </div>

      {openHouse?.annulee ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FBEAEA] px-5 py-4">
          <span className="text-[13px] font-medium text-ink">
            Ces portes ouvertes sont annulées et masquées de la fiche.
          </span>
          <form action={setOpenHouseCancelledAction}>
            <input type="hidden" name="listingId" value={listingId} />
            <input type="hidden" name="annulee" value="false" />
            <button
              type="submit"
              className="rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
            >
              Réactiver
            </button>
          </form>
        </div>
      ) : null}

      {openHouse ? (
        <>
          <form
            action={updateOpenHouseNoteAction}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <input type="hidden" name="listingId" value={listingId} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Consignes affichées aux inscrits (facultatif)
              </span>
              <textarea
                name="note"
                rows={2}
                defaultValue={openHouse.note ?? ""}
                placeholder="Accès par le portail bleu, sonner à l'interphone…"
                className={inputCls}
              />
            </label>
            <button
              type="submit"
              className="self-start rounded-full border border-line px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
            >
              Enregistrer les consignes
            </button>
          </form>

          {openHouse.dates.length > 0 ? (
            <div className="flex flex-col gap-4">
              {openHouse.dates.map((d) => {
                const past = new Date(d.startAt).getTime() < now;
                const remaining = Math.max(d.capacity - d.acceptedCount, 0);
                return (
                  <div
                    key={d.id}
                    className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[14px] font-semibold text-ink">
                          {formatDate(d.startAt, d.endAt)}
                          {past ? " · passé" : ""}
                        </span>
                        <span className="text-[12px] text-muted">
                          {d.acceptedCount}/{d.capacity} accepté{d.acceptedCount > 1 ? "s" : ""}
                          {!past ? ` · ${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}` : ""}
                        </span>
                      </div>
                      <form
                        action={deleteOpenHouseDateAction}
                        onSubmit={(e) => {
                          if (
                            !window.confirm(
                              "Supprimer cette date ? Les inscriptions rattachées seront perdues."
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="dateId" value={d.id} />
                        <input type="hidden" name="listingId" value={listingId} />
                        <button
                          type="submit"
                          className="text-[12px] font-semibold text-muted hover:text-ink"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>

                    {d.registrations.length > 0 ? (
                      <ul className="m-0 flex list-none flex-col gap-2 p-0">
                        {d.registrations.map((r) => {
                          const statut = STATUT_LABEL[r.statut];
                          return (
                            <li
                              key={r.id}
                              className="flex flex-col gap-1.5 rounded-xl bg-surface px-3.5 py-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[13.5px] font-semibold text-ink">
                                  {r.prenom} {r.nom}
                                </span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                  style={{ background: statut.bg, color: statut.color }}
                                >
                                  {statut.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-[12.5px] font-semibold text-blue">
                                <a href={`tel:${r.telephone}`}>{r.telephone}</a>
                                <a href={`mailto:${r.email}`}>{r.email}</a>
                              </div>
                              {r.statut === "EN_ATTENTE" ? (
                                <RespondForm registrationId={r.id} />
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="m-0 text-[12.5px] text-muted">Aucune inscription pour ce créneau.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="m-0 text-[13px] text-muted">Aucune date pour le moment.</p>
          )}

          <AddDateForm listingId={listingId} />

          {!openHouse.annulee ? (
            <form action={setOpenHouseCancelledAction} className="self-start">
              <input type="hidden" name="listingId" value={listingId} />
              <input type="hidden" name="annulee" value="true" />
              <button
                type="submit"
                className="rounded-full border border-line px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-[#FBEAEA]"
              >
                Annuler les portes ouvertes
              </button>
            </form>
          ) : null}
        </>
      ) : (
        <AddDateForm listingId={listingId} />
      )}
    </section>
  );
}
