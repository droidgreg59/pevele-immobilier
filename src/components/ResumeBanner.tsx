"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useProjectDraft, projectDraftProgress, type ProjectDraft } from "@/lib/project-draft";

const DISMISS_KEY = "pvl-reprise-vue";
const DISMISS_EVENT = "pvl-reprise-vue-updated";
const DISMISS_HOURS = 24;

function summaryLabel(draft: ProjectDraft): string {
  const parts: string[] = [];
  if (draft.typeBien) {
    parts.push(
      draft.typeBien === "MAISON" ? "Maison" : draft.typeBien === "APPARTEMENT" ? "Appartement" : "Terrain"
    );
  }
  if (draft.transaction) parts.push(draft.transaction === "VENTE" ? "Achat" : "Location");
  if (draft.villageSlugs.length === 1) parts.push(draft.villageSlugs[0]);
  else if (draft.villageSlugs.length > 1) parts.push(`${draft.villageSlugs[0]} +${draft.villageSlugs.length - 1}`);
  return parts.length > 0 ? parts.join(" · ") : "Votre projet en cours";
}

function wasRecentlyDismissed(): boolean {
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_HOURS * 60 * 60 * 1000;
}

function subscribeToDismiss(callback: () => void): () => void {
  window.addEventListener(DISMISS_EVENT, callback);
  return () => window.removeEventListener(DISMISS_EVENT, callback);
}

function getDismissServerSnapshot(): boolean {
  return true;
}

/**
 * Bannière "On continue ?" — affichée si un brouillon de projet incomplet
 * existe. Fermer ne supprime jamais le brouillon, seulement masque la
 * bannière pendant 24h.
 */
export default function ResumeBanner() {
  const draft = useProjectDraft();
  const dismissed = useSyncExternalStore(
    subscribeToDismiss,
    wasRecentlyDismissed,
    getDismissServerSnapshot
  );

  if (!draft || dismissed) return null;
  const progress = projectDraftProgress(draft);
  if (progress <= 0 || progress >= 1) return null;

  const pct = Math.round(progress * 100);

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return (
    <div className="mb-6 flex items-center gap-3.5 rounded-2xl border border-line bg-blue-soft px-4 py-3.5">
      <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-blue text-[13px] font-extrabold text-white">
        {pct}
        <span className="text-[8px]">%</span>
      </span>
      <div className="flex-1">
        <p className="m-0 text-[14px] font-bold text-ink">
          On continue ? Votre projet est presque terminé.
        </p>
        <p className="m-0 mt-0.5 text-[12px] text-muted">{summaryLabel(draft)}</p>
      </div>
      <Link
        href="/mon-projet"
        className="shrink-0 whitespace-nowrap rounded-xl bg-blue px-3.5 py-2 text-[13px] font-bold text-white"
      >
        Reprendre
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fermer"
        className="shrink-0 px-1 text-[16px] text-muted-2 hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
