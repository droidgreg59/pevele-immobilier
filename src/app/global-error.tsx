"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

/**
 * Filet de sécurité racine : ne s'affiche que si le layout racine lui-même
 * lève une erreur (les erreurs de page sont prises par les `error.tsx` de
 * segment). Doit rendre ses propres <html>/<body>. Remonte l'erreur à Sentry.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientError(error, { kind: "global-error" });
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#faf8f4",
          color: "#20242e",
        }}
      >
        <div style={{ maxWidth: 440, padding: "0 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Un souci de notre côté.</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
            La page n&apos;a pas pu s&apos;afficher. L&apos;incident a été signalé.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: 999,
              border: 0,
              background: "#20242e",
              color: "#fff",
              padding: "12px 24px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
