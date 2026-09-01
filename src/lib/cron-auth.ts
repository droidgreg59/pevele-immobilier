import "server-only";
import type { NextRequest } from "next/server";

/**
 * Vérifie le secret des routes cron (`/api/cron/...`), déclenchées par un
 * ordonnanceur externe (Vercel Cron, GitHub Actions, cron-job.org…) plutôt
 * que par un utilisateur connecté. Accepte le secret soit dans l'en-tête
 * `Authorization: Bearer <secret>` (convention Vercel Cron), soit en
 * paramètre `?secret=`, pour rester compatible avec les ordonnanceurs qui ne
 * permettent pas de personnaliser les en-têtes.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const querySecret = request.nextUrl.searchParams.get("secret");
  return querySecret === secret;
}
