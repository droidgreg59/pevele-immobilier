"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import type { TransactionType, TypeBien } from "@prisma/client";

export async function createSavedSearchAction(input: {
  transaction: TransactionType;
  typeBien?: TypeBien;
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

  await prisma.savedSearch.create({
    data: {
      userId: session.userId,
      transaction: input.transaction,
      typeBien: input.typeBien ?? null,
      q: input.q?.trim() || null,
      villageSlugs: input.villageSlugs?.length ? input.villageSlugs.join(",") : null,
      chambresMin: input.chambresMin ?? null,
      equipements: input.equipements?.length ? input.equipements.join(",") : null,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
    },
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
