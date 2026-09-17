import "server-only";
import { prisma } from "./prisma";

/**
 * Blocage temporaire par email après trop d'échecs de connexion (bourrage
 * d'identifiants) — remplace Turnstile sur /connexion. Volontairement
 * indépendant de l'existence réelle du compte : on enregistre une tentative
 * échouée même pour un email inconnu, sinon l'absence de blocage révélerait
 * qu'un email n'a pas de compte (énumération).
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** Purge les tentatives expirées de cet email, puis indique si le seuil est atteint. */
export async function isLoginThrottled(email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  await prisma.loginAttempt.deleteMany({ where: { email, createdAt: { lt: since } } });
  const count = await prisma.loginAttempt.count({ where: { email } });
  return count >= MAX_ATTEMPTS;
}

export async function recordFailedLogin(email: string): Promise<void> {
  await prisma.loginAttempt.create({ data: { email } });
}

/** À appeler après une connexion réussie, pour qu'un utilisateur légitime ne reste pas bloqué. */
export async function clearFailedLogins(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}
