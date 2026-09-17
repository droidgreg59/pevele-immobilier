"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { mandateReceivedEmail, mandateRespondedEmail } from "./email-templates";
import { sendPushNotification } from "./push";
import { logEvent } from "./events";

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

  const { subject, html } = mandateReceivedEmail({ clientNom: session.nom });
  await sendEmail({ to: agency.email, subject, html });
  await sendPushNotification(agencyId, {
    title: "Nouvelle recherche confiée",
    body: `${session.nom} vous confie sa recherche.`,
    url: "/compte/agence/clients",
  });
  await logEvent("mandate_created", { userId: session.userId, path: "/compte" });

  redirect("/compte");
}

export async function respondToMandateAction(formData: FormData) {
  const mandateId = String(formData.get("mandateId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (decision !== "accept" && decision !== "refuse") redirect("/compte/agence/clients");

  const existing = await prisma.searchMandate.findFirst({
    where: { id: mandateId, agencyId: session.userId, statut: "EN_ATTENTE" },
    select: {
      clientId: true,
      client: { select: { email: true } },
      agency: { select: { nom: true, entreprise: true } },
    },
  });

  await prisma.searchMandate.updateMany({
    where: { id: mandateId, agencyId: session.userId, statut: "EN_ATTENTE" },
    data: {
      statut: decision === "accept" ? "ACCEPTEE" : "REFUSEE",
      respondedAt: new Date(),
    },
  });

  if (existing) {
    const accepted = decision === "accept";
    const agencyNom = existing.agency.entreprise ?? existing.agency.nom;
    const { subject, html } = mandateRespondedEmail({ agencyNom, accepted });
    await sendEmail({ to: existing.client.email, subject, html });
    await sendPushNotification(existing.clientId, {
      title: accepted ? "Recherche confiée acceptée" : "Recherche confiée déclinée",
      body: `${agencyNom} ${accepted ? "a accepté" : "a décliné"} votre recherche.`,
      url: "/compte",
    });
  }

  redirect("/compte/agence/clients");
}
