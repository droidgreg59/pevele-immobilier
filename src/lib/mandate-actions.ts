"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";

export async function sendMandateAction(formData: FormData) {
  const savedSearchId = String(formData.get("savedSearchId") ?? "");
  const agencyId = String(formData.get("agencyId") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (!agencyId) redirect("/compte");

  const savedSearch = await prisma.savedSearch.findUnique({
    where: { id: savedSearchId },
  });
  if (!savedSearch || savedSearch.userId !== session.userId) redirect("/compte");

  const agency = await prisma.user.findFirst({
    where: { id: agencyId, type: "AGENCE" },
  });
  if (!agency) redirect("/compte");

  await prisma.searchMandate.upsert({
    where: { savedSearchId_agencyId: { savedSearchId, agencyId } },
    update: {},
    create: { savedSearchId, agencyId, clientId: session.userId },
  });

  redirect("/compte");
}

export async function respondToMandateAction(formData: FormData) {
  const mandateId = String(formData.get("mandateId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (decision !== "accept" && decision !== "refuse") redirect("/compte/agence/clients");

  await prisma.searchMandate.updateMany({
    where: { id: mandateId, agencyId: session.userId, statut: "EN_ATTENTE" },
    data: {
      statut: decision === "accept" ? "ACCEPTEE" : "REFUSEE",
      respondedAt: new Date(),
    },
  });

  redirect("/compte/agence/clients");
}
