"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getSession, setSessionCookie, clearSessionCookie } from "./session";
import { sendEmail } from "./email";
import { emailVerificationEmail, passwordResetEmail } from "./email-templates";
import { SITE_URL } from "./seo";
import { verifyTurnstileToken } from "./turnstile";
import type { AccountType } from "@prisma/client";

export type AuthState = { error?: string };
export type ResetRequestState = { error?: string; success?: boolean };
export type ResetPasswordState = { error?: string };

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const EMAIL_VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

/** Génère un jeton de vérification, l'enregistre et envoie l'email de confirmation. */
async function sendEmailVerification(userId: string, email: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifyToken: token,
      emailVerifyTokenExpiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    },
  });
  const { subject, html } = emailVerificationEmail({
    verifyUrl: `${SITE_URL}/verifier-email?token=${token}`,
  });
  await sendEmail({ to: email, subject, html });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNextPath(formData: FormData): string {
  const next = String(formData.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
}

async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const rawType = formData.get("type");
  const type: AccountType =
    rawType === "AGENCE" ? "AGENCE" : rawType === "ARTISAN" ? "ARTISAN" : "PARTICULIER";
  const nom = String(formData.get("nom") ?? "").trim();
  const entreprise = String(formData.get("entreprise") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!nom) return { error: "Merci d'indiquer votre nom." };
  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (type === "AGENCE" && !entreprise) {
    return { error: "Merci d'indiquer le nom de votre agence." };
  }
  if (type === "ARTISAN" && !entreprise) {
    return { error: "Merci d'indiquer le nom de votre entreprise." };
  }

  const turnstileToken = formData.get("cf-turnstile-response");
  const turnstileOk = await verifyTurnstileToken(turnstileToken, "register", await clientIp());
  if (!turnstileOk) {
    return { error: "Vérification anti-robot échouée. Merci de réessayer." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Cet email est déjà utilisé." };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nom,
      entreprise: type === "PARTICULIER" ? null : entreprise,
      type,
    },
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    nom: user.nom,
    type: user.type,
  });

  await sendEmailVerification(user.id, user.email);

  if (type === "AGENCE" || type === "ARTISAN") {
    redirect("/bienvenue");
  }

  redirect(safeNextPath(formData));
}

export type VerifyEmailOutcome = "ok" | "already" | "invalid";

/**
 * Valide un jeton de vérification d'email. Fonctionne connecté ou non (le lien
 * peut être ouvert sur un autre appareil). Idempotent : un jeton déjà consommé
 * mais correspondant à un compte vérifié renvoie « already » plutôt qu'une erreur.
 */
export async function verifyEmailToken(token: string): Promise<VerifyEmailOutcome> {
  if (!token) return "invalid";

  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) return "invalid";
  // Le jeton n'est PAS consommé au premier appel : les clients mail préchargent
  // souvent les liens, ce qui verrouillerait l'utilisateur. On s'appuie sur
  // `emailVerifiedAt` (idempotent) et sur l'expiration du jeton (7 j).
  if (user.emailVerifiedAt) return "already";
  if (!user.emailVerifyTokenExpiresAt || user.emailVerifyTokenExpiresAt < new Date()) {
    return "invalid";
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });
  return "ok";
}

/** Renvoie l'email de vérification à l'utilisateur connecté s'il n'est pas encore vérifié. */
export async function resendEmailVerificationAction(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user && !user.emailVerifiedAt) {
    await sendEmailVerification(user.id, user.email);
  }
  redirect("/compte?verif=renvoye");
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const genericError = { error: "Email ou mot de passe incorrect." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericError;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return genericError;

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    nom: user.nom,
    type: user.type,
  });

  redirect(safeNextPath(formData));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

/**
 * Ne révèle jamais si l'email existe en base (évite l'énumération de
 * comptes) : le message de succès est identique dans tous les cas.
 */
export async function requestPasswordResetAction(
  _prevState: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Adresse email invalide." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const resetToken = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });
    const { subject, html } = passwordResetEmail({
      resetUrl: `${SITE_URL}/reinitialiser-mot-de-passe?token=${resetToken}`,
    });
    await sendEmail({ to: user.email, subject, html });
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "Lien de réinitialisation invalide." };
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirmPassword) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return { error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    nom: user.nom,
    type: user.type,
  });

  redirect("/compte");
}
