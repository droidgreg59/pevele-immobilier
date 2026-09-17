import { reportClientError } from "./lib/report-error";

/**
 * Instrumentation client de Next (exécutée avant l'hydratation). On branche
 * la capture des erreurs non gérées vers Sentry — no-op si
 * `NEXT_PUBLIC_SENTRY_DSN` n'est pas défini. Les erreurs de rendu React
 * remontent en plus par `src/app/global-error.tsx`.
 */
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    void reportClientError(event.error ?? event.message, { kind: "error" });
  });
  window.addEventListener("unhandledrejection", (event) => {
    void reportClientError(event.reason, { kind: "unhandledrejection" });
  });

  // Enregistrement du service worker (PWA installable + repli hors ligne).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // pas bloquant : l'appli fonctionne sans.
      });
    });
  }
}
