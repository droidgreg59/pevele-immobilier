"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import type { TransactionType } from "@prisma/client";

export async function createSavedSearchAction(input: {
  transaction: TransactionType;
  q?: string;
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
      q: input.q?.trim() || null,
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
