"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

/**
 * Widget anti-bot Cloudflare Turnstile pour les formulaires publics.
 *
 * Rendu **explicite** via `turnstile.render()` plutôt que le scan automatique
 * (data-sitekey) de Cloudflare : ce dernier ne s'exécute qu'au chargement
 * initial du script, donc jamais pour une page qui monte ce composant après
 * une navigation côté client (App Router) vers une page où le script était
 * déjà chargé — le widget restait alors invisible, bloquant silencieusement
 * toute soumission (constaté en prod sur /inscription). `onReady` de
 * `next/script` est censé se redéclencher à chaque montage mais s'est révélé
 * peu fiable en pratique quand le script était déjà chargé par une page
 * précédente (`window.turnstile` bien défini, mais `onReady` jamais rappelé) —
 * on vérifie donc aussi explicitement au montage, avec un court polling tant
 * que le script n'est pas encore prêt (cas de la toute première visite).
 *
 * `action` doit correspondre exactement au 2ᵉ argument de `verifyTurnstile`
 * côté serveur. Passer `resetKey` (ex. le message d'erreur du formulaire) :
 * quand il change, le widget est régénéré — un token Turnstile est à usage
 * unique, il faut donc en obtenir un neuf après un échec de soumission.
 */
export default function TurnstileWidget({
  action,
  resetKey,
}: {
  action: string;
  resetKey?: unknown;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  function renderWidget() {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      action,
    });
  }

  useEffect(() => {
    // `onReady` de next/script ne se redéclenche pas de façon fiable quand le
    // script était déjà chargé par une page précédente (constaté en pratique :
    // `window.turnstile` bien défini, mais aucun appel à render() déclenché) —
    // on vérifie donc aussi directement au montage, en réessayant tant que le
    // script n'est pas encore prêt (première visite, script pas encore chargé).
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function tryRender() {
      if (cancelled) return;
      if (window.turnstile) {
        renderWidget();
        return;
      }
      timer = setTimeout(tryRender, 100);
    }
    tryRender();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (widgetIdRef.current) {
        try {
          window.turnstile?.remove(widgetIdRef.current);
        } catch {
          // Conteneur déjà démonté — rien à nettoyer.
        }
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!resetKey || !widgetIdRef.current) return;
    try {
      window.turnstile?.reset(widgetIdRef.current);
    } catch {
      // Widget déjà démonté (ex. redirection juste après une soumission
      // réussie) — il n'y a alors simplement plus rien à réinitialiser.
    }
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} />
    </>
  );
}
