"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { proposalReceivedEmail } from "./email-templates";

export async function createProposalAction(formData: FormData) {
  const mandateId = String(formData.get("mandateId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (!listingId) redirect("/compte/agence/clients");

  const mandate = await prisma.searchMandate.findFirst({
    where: { id: mandateId, agencyId: session.userId, statut: "ACCEPTEE" },
    include: { client: { select: { email: true } } },
  });
  if (!mandate) redirect("/compte/agence/clients");

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, ownerId: session.userId },
  });
  if (!listing) redirect("/compte/agence/clients");

  await prisma.listingProposal.upsert({
    where: { mandateId_listingId: { mandateId, listingId } },
    update: {},
    create: { mandateId, listingId },
  });

  const { subject, html } = proposalReceivedEmail({
    agencyNom: session.nom,
    listingTitre: listing.titre,
    listingHref: `/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`,
  });
  await sendEmail({ to: mandate.client.email, subject, html });

  redirect("/compte/agence/clients");
}

export async function removeProposalAction(formData: FormData) {
  const proposalId = String(formData.get("proposalId") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");

  await prisma.listingProposal.deleteMany({
    where: { id: proposalId, mandate: { agencyId: session.userId } },
  });

  redirect("/compte/agence/clients");
}

export async function respondToProposalAction(formData: FormData) {
  const proposalId = String(formData.get("proposalId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (decision !== "interesse" && decision !== "pas_interesse") redirect("/compte");

  await prisma.listingProposal.updateMany({
    where: { id: proposalId, mandate: { clientId: session.userId } },
    data: { statut: decision === "interesse" ? "INTERESSE" : "PAS_INTERESSE" },
  });

  redirect("/compte");
}
