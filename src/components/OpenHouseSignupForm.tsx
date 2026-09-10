"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import {
  registerToOpenHouseAction,
  type OpenHouseSignupState,
} from "@/lib/open-house-actions";

export type OpenHouseDateView = {
  id: string;
  startAt: string | Date;
  endAt: string | Date;
  capacity: number;
  acceptedCount: number;
  viewerStatut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE" | null;
};

const STATUT_LABEL: Record<"EN_ATTENTE" | "ACCEPTEE" | "REFUSEE", { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: "En attente de validation", bg: "#FBF3DC", color: "var(--pvl-gold)" },
  ACCEPTEE: { label: "Inscription confirmée", bg: "#EAF3E8", color: "var(--pvl-green)" },
  REFUSEE: { label: "Non retenue", bg: "var(--pvl-surface)", color: "var(--pvl-muted)" },
};

function formatDate(start: string | Date, end: string | Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
  const t = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${t(s)} – ${t(e)}`;
}

const initialState: OpenHouseSignupState = {};

export default function OpenHouseSignupForm({
  dates,
  note,
  isLoggedIn,
  loginHref,
  defaultNom = "",
  defaultTelephone = "",
}: {
  dates: OpenHouseDateView[];
  note: string | null;
  isLoggedIn: boolean;
  loginHref: string;
  defaultNom?: string;
  defaultTelephone?: string;
}) {
  const [state, formAction, pending] = useActionState(
    registerToOpenHouseAction,
    initialState
  );

  // Le serveur ne renvoie que des créneaux encore à venir (voir
  // getOpenHouseForListing), inutile de refiltrer sur la date ici.
  const selectable = useMemo(
    () => dates.filter((d) => d.viewerStatut === null && d.acceptedCount < d.capacity),
    [dates]
  );
  const [selectedId, setSelectedId] = useState(selectable[0]?.id ?? "");

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue">
        <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
        Portes ouvertes
      </span>

      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {dates.map((d) => {
          const remaining = Math.max(d.capacity - d.acceptedCount, 0);
          const full = remaining === 0;
          const statut = d.viewerStatut ? STATUT_LABEL[d.viewerStatut] : null;
          return (
            <li
              key={d.id}
              className="flex flex-col gap-1 rounded-xl bg-surface px-3.5 py-2.5"
            >
              <span className="text-[13.5px] font-semibold text-ink">
                {formatDate(d.startAt, d.endAt)}
              </span>
              {statut ? (
                <span
                  className="w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: statut.bg, color: statut.color }}
                >
                  {statut.label}
                </span>
              ) : (
                <span className="text-[12px] font-medium text-muted">
                  {full ? "Complet" : `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {note ? (
        <p className="m-0 mt-3 rounded-xl bg-blue-soft px-3.5 py-2.5 text-[12.5px] leading-[1.55] text-ink">
          {note}
        </p>
      ) : null}

      {state.success ? (
        <p className="m-0 mt-4 rounded-xl bg-[#EAF3E8] px-4 py-3 text-[13px] text-ink">
          Votre inscription a été transmise. Vous serez recontacté au numéro
          indiqué une fois qu&apos;elle sera validée.
        </p>
      ) : !isLoggedIn ? (
        <p className="m-0 mt-4 font-sans text-[12.5px] leading-[1.6] text-muted">
          <Link href={loginHref} className="text-blue">
            Connectez-vous
          </Link>{" "}
          pour vous inscrire aux portes ouvertes.
        </p>
      ) : selectable.length === 0 ? (
        <p className="m-0 mt-4 text-[12.5px] leading-[1.6] text-muted">
          {dates.some((d) => d.viewerStatut)
            ? "Vous êtes déjà inscrit. Retrouvez le suivi dans votre compte."
            : "Tous les créneaux sont complets pour le moment."}
        </p>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-3">
          {selectable.length > 1 ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Créneau
              </span>
              <select
                name="dateId"
                required
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="rounded-xl border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
              >
                {selectable.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDate(d.startAt, d.endAt)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <input type="hidden" name="dateId" value={selectable[0].id} />
              <p className="m-0 text-[12.5px] text-muted">
                Créneau : <span className="font-semibold text-ink">{formatDate(selectable[0].startAt, selectable[0].endAt)}</span>
              </p>
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Prénom
              </span>
              <input
                name="prenom"
                required
                className="rounded-xl border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Nom
              </span>
              <input
                name="nom"
                required
                defaultValue={defaultNom}
                className="rounded-xl border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Téléphone
            </span>
            <input
              name="telephone"
              type="tel"
              required
              defaultValue={defaultTelephone}
              placeholder="ex. 06 00 00 00 00"
              className="rounded-xl border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
            className="self-start rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Envoi…" : "S'inscrire →"}
          </button>
        </form>
      )}
    </div>
  );
}
