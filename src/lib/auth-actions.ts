"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { setSessionCookie, clearSessionCookie } from "./session";
import type { AccountType } from "@prisma/client";

export type AuthState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNextPath(formData: FormData): string {
  const next = String(formData.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
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

  if (type === "AGENCE" || type === "ARTISAN") {
    redirect("/bienvenue");
  }

  redirect(safeNextPath(formData));
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
