"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { logEvent } from "./events";
import type { TransactionType, TypeBien, TypeMaison } from "@prisma/client";

/** "Mon projet" est réservé aux particuliers — l'UI le masque déjà aux comptes pro, filet de sécurité ici. */
export async function createSavedSearchAction(input: {
  transaction: TransactionType;
  typeBien?: TypeBien;
  typeMaison?: TypeMaison;
  q?: string;
  villageSlugs?: string[];
  chambresMin?: number;
  equipements?: string[];
  budgetMin?: number;
  budgetMax?: number;
  next?: string;
}) {
  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(input.next || "/")}`);
  }
  if (session.type !== "PARTICULIER") return;

  await prisma.savedSearch.create({
    data: {
      userId: session.userId,
      transaction: input.transaction,
      typeBien: input.typeBien ?? null,
      typeMaison: input.typeMaison ?? null,
      q: input.q?.trim() || null,
      villageSlugs: input.villageSlugs?.length ? input.villageSlugs.join(",") : null,
      chambresMin: input.chambresMin ?? null,
      equipements: input.equipements?.length ? input.equipements.join(",") : null,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
    },
  });
  await logEvent("saved_search_created", {
    userId: session.userId,
    path: input.next ?? null,
    meta: { transaction: input.transaction, communes: input.villageSlugs?.length ?? 0 },
  });
}

export async function deleteSavedSearchAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");

  await prisma.savedSearch.deleteMany({
    where: { id, userId: session.userId },
  });

  redirect("/compte");
}
