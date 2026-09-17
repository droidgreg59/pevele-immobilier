import "server-only";
import { headers } from "next/headers";

/**
 * Vérification côté serveur d'un token Cloudflare Turnstile (widget anti-bot
 * sur les formulaires publics : inscription, connexion, mot de passe oublié,
 * demandes de visite / d'estimation / de devis, dépôt d'avis). Le token vient
 * du champ caché `cf-turnstile-response` ajouté par le script Turnstile dans
 * le formulaire ; il est vérifié ici via l'API `siteverify` — jamais côté
 * navigateur. Échoue fermé (retourne `false`) sur tout token manquant, action
 * inattendue, hostname non approuvé, ou erreur réseau/API.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Première IP de `x-forwarded-for` — passée à siteverify en `remoteip`. */
export async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

/**
 * Raccourci pour les Server Actions : lit le token du `FormData`, résout l'IP
 * cliente et délègue à `verifyTurnstileToken`. `action` doit correspondre au
 * `data-action` du widget (`<TurnstileWidget action="…">`).
 */
export async function verifyTurnstile(formData: FormData, action: string): Promise<boolean> {
  return verifyTurnstileToken(formData.get("cf-turnstile-response"), action, await clientIp());
}

function expectedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean)
  );
}

export async function verifyTurnstileToken(
  token: unknown,
  expectedAction: string,
  remoteip?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  const hostnames = expectedHostnames();

  if (!secret || hostnames.size === 0) {
    console.warn("[turnstile] TURNSTILE_SECRET ou TURNSTILE_HOSTNAMES manquant.");
    return false;
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return false;
  }

  let result: { success?: boolean; action?: string; hostname?: string };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteip) body.set("remoteip", remoteip);

    const r = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    result = await r.json();
  } catch (e) {
    console.error("[turnstile] Échec de la vérification siteverify :", e);
    return false;
  }

  if (!result.success) return false;
  if (result.action !== expectedAction) return false;
  if (!result.hostname || !hostnames.has(result.hostname)) return false;

  return true;
}
