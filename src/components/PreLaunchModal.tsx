"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "pvl-prelaunch-modal-vu";
const DISMISS_EVENT = "pvl-prelaunch-modal-vu-updated";

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeToDismiss(callback: () => void): () => void {
  window.addEventListener(DISMISS_EVENT, callback);
  return () => window.removeEventListener(DISMISS_EVENT, callback);
}

/** Caché par défaut au rendu serveur : évite un flash du pop-up avant que le
 * localStorage (uniquement lisible côté client) ait pu être vérifié. */
function getDismissServerSnapshot(): boolean {
  return true;
}

/**
 * Pop-up de bienvenue pré-lancement — affiché une seule fois par navigateur
 * (fermeture mémorisée en localStorage, jamais réaffiché ensuite, contrairement
 * à ResumeBanner qui se referme pour 24h seulement). Monté au niveau racine
 * du layout, jamais imbriqué dans un conteneur `animate-fade-up` (transform en
 * keyframe) : le portail vers document.body reste une précaution, pas un
 * contournement d'un bug déjà présent à cet endroit.
 */
export default function PreLaunchModal() {
  const dismissed = useSyncExternalStore(
    subscribeToDismiss,
    wasDismissed,
    getDismissServerSnapshot
  );

  if (dismissed) return null;

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage indisponible (navigation privée, cookies bloqués...) —
      // le pop-up réapparaîtra à la prochaine visite, sans casser la page.
    }
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return createPortal(
    <div
      className="animate-fade-up fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 px-4"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-[440px] rounded-3xl bg-white p-7 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-2 transition hover:bg-surface hover:text-ink"
        >
          <X className="h-4.5 w-4.5" strokeWidth={1.75} />
        </button>

        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-blue">
          Pré-lancement
        </span>
        <h2 className="mt-3 font-display text-[24px] leading-tight text-ink">
          Bienvenue sur Pévèle Immobilier
        </h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-muted">
          Le site est actuellement en pré-lancement — l&apos;ouverture au grand
          public est prévue le <b className="text-ink">1er octobre 2026</b>. Nous
          préparons en ce moment avec les agences de la Pévèle la mise en place de
          leurs annonces.
        </p>
        <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-[13.5px] leading-[1.6] text-muted">
          <b className="text-ink">Courtiers et artisans</b>, rejoignez dès
          maintenant l&apos;annuaire et recevez des demandes de financement ou de
          devis :{" "}
          <Link
            href="/inscription?type=COURTIER"
            onClick={handleDismiss}
            className="font-semibold text-blue"
          >
            compte courtier
          </Link>{" "}
          ·{" "}
          <Link
            href="/inscription?type=ARTISAN"
            onClick={handleDismiss}
            className="font-semibold text-blue"
          >
            compte artisan
          </Link>
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <Link
            href="/espace-professionnel"
            onClick={handleDismiss}
            className="rounded-full bg-yellow px-5 py-3 text-center text-[13.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
          >
            Vous êtes un professionnel ? Inscrivez-vous ici →
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full border border-line px-5 py-3 text-[13.5px] font-semibold text-ink transition hover:bg-surface"
          >
            Continuer sur le site
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
