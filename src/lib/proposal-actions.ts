"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { proposalReceivedEmail, proposalRespondedEmail } from "./email-templates";
import { sendPushNotification } from "./push";

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
  await sendPushNotification(mandate.clientId, {
    title: "Nouveau bien proposé",
    body: `${session.nom} vous propose « ${listing.titre} ».`,
    url: "/compte/particulier/recherches",
  });

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

  const proposal = await prisma.listingProposal.findFirst({
    where: { id: proposalId, mandate: { clientId: session.userId } },
    select: {
      statut: true,
      listing: { select: { titre: true } },
      mandate: { select: { agencyId: true, agency: { select: { email: true } } } },
    },
  });
  if (!proposal) redirect("/compte/particulier/recherches");

  const interesse = decision === "interesse";
  await prisma.listingProposal.updateMany({
    where: { id: proposalId, mandate: { clientId: session.userId } },
    data: { statut: interesse ? "INTERESSE" : "PAS_INTERESSE" },
  });

  // L'agence est prévenue de la réponse (seulement la première fois) — sans
  // quoi elle ne la voyait qu'en revenant d'elle-même sur « Mes clients ».
  if (proposal.statut === "PROPOSEE") {
    const { subject, html } = proposalRespondedEmail({
      clientNom: session.nom,
      listingTitre: proposal.listing.titre,
      interesse,
    });
    await sendEmail({ to: proposal.mandate.agency.email, subject, html });
    await sendPushNotification(proposal.mandate.agencyId, {
      title: interesse ? "Client intéressé" : "Proposition déclinée",
      body: `${session.nom} ${interesse ? "est intéressé(e) par" : "a décliné"} « ${proposal.listing.titre} ».`,
      url: "/compte/agence/clients",
    });
  }

  // Le compteur « à traiter » est calculé dans le layout de l'espace.
  revalidatePath("/compte", "layout");
  redirect("/compte/particulier/recherches");
}
