"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: { reset: (widgetId?: string) => void };
  }
}

/**
 * Widget anti-bot Cloudflare Turnstile pour les formulaires publics. Charge le
 * script (dédupliqué par next/script si présent plusieurs fois) et pose le
 * conteneur `cf-turnstile` : le script y injecte un champ caché
 * `cf-turnstile-response` que la Server Action vérifie via
 * `verifyTurnstile(formData, action)`.
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
  useEffect(() => {
    if (resetKey) window.turnstile?.reset();
  }, [resetKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div
        className="cf-turnstile"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-action={action}
      />
    </>
  );
}
