"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { isValidPhoneNumber, isDateAfterToday } from "./validation";
import { sendEmail } from "./email";
import { listingDetailPath } from "./open-house";
import { logEvent } from "./events";
import {
  openHouseRegistrationReceivedEmail,
  openHouseRegistrationRespondedEmail,
} from "./email-templates";

export type OpenHouseDateFormState = { error?: string };
export type OpenHouseSignupState = { error?: string; success?: boolean };

const MAX_CAPACITY = 200;

function formatDateLabel(startAt: Date, endAt: Date): string {
  const day = startAt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const time = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time(startAt)} – ${time(endAt)}`;
}

/** Charge une annonce en vérifiant qu'elle appartient à l'utilisateur. */
async function getOwnedListing(listingId: string, ownerId: string) {
  return prisma.listing.findFirst({ where: { id: listingId, ownerId } });
}

/**
 * Ajoute un créneau à l'évènement portes ouvertes d'une annonce, en créant
 * l'évènement s'il n'existe pas encore. Propriétaire de l'annonce uniquement.
 */
export async function addOpenHouseDateAction(
  _prev: OpenHouseDateFormState,
  formData: FormData
): Promise<OpenHouseDateFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const listingId = String(formData.get("listingId") ?? "");
  const listing = await getOwnedListing(listingId, session.userId);
  if (!listing) return { error: "Annonce introuvable." };

  const dateRaw = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  if (!dateRaw || !startTime || !endTime) {
    return { error: "Merci d'indiquer une date, une heure de début et de fin." };
  }
  if (!isDateAfterToday(dateRaw)) {
    return { error: "La date des portes ouvertes doit être postérieure à aujourd'hui." };
  }
  const startAt = new Date(`${dateRaw}T${startTime}`);
  const endAt = new Date(`${dateRaw}T${endTime}`);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { error: "Date ou heure invalide." };
  }
  if (endAt <= startAt) {
    return { error: "L'heure de fin doit être après l'heure de début." };
  }
  const capacity = Number.parseInt(capacityRaw, 10);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
    return { error: `Le nombre de places doit être compris entre 1 et ${MAX_CAPACITY}.` };
  }

  const openHouse = await prisma.openHouse.upsert({
    where: { listingId },
    update: { annulee: false },
    create: { listingId },
  });

  await prisma.openHouseDate.create({
    data: { openHouseId: openHouse.id, startAt, endAt, capacity },
  });

  revalidatePath(`/compte/annonces/${listingId}`);
  revalidatePath(listingDetailPath(listing.transaction, listingId));
  return {};
}

/** Supprime un créneau (et les inscriptions rattachées). Propriétaire uniquement. */
export async function deleteOpenHouseDateAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const dateId = String(formData.get("dateId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");

  const date = await prisma.openHouseDate.findFirst({
    where: { id: dateId, openHouse: { listing: { ownerId: session.userId } } },
    include: { openHouse: { include: { listing: { select: { transaction: true } } } } },
  });
  if (!date) redirect(`/compte/annonces/${listingId}`);

  await prisma.openHouseDate.delete({ where: { id: dateId } });

  revalidatePath(listingDetailPath(date.openHouse.listing.transaction, date.openHouse.listingId));
  redirect(`/compte/annonces/${date.openHouse.listingId}`);
}

/** Met à jour ou efface les consignes générales de l'évènement. Propriétaire uniquement. */
export async function updateOpenHouseNoteAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const listingId = String(formData.get("listingId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const listing = await getOwnedListing(listingId, session.userId);
  if (!listing) redirect("/compte");

  await prisma.openHouse.updateMany({
    where: { listingId },
    data: { note: note || null },
  });

  revalidatePath(listingDetailPath(listing.transaction, listingId));
  redirect(`/compte/annonces/${listingId}`);
}

/** Annule (ou réactive) l'évènement portes ouvertes. Propriétaire uniquement. */
export async function setOpenHouseCancelledAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const listingId = String(formData.get("listingId") ?? "");
  const annulee = String(formData.get("annulee") ?? "") === "true";

  const listing = await getOwnedListing(listingId, session.userId);
  if (!listing) redirect("/compte");

  await prisma.openHouse.updateMany({ where: { listingId }, data: { annulee } });

  revalidatePath(listingDetailPath(listing.transaction, listingId));
  redirect(`/compte/annonces/${listingId}`);
}

/**
 * Inscription d'un visiteur connecté à un créneau de portes ouvertes. Crée
 * une demande en attente et notifie le propriétaire par email.
 */
export async function registerToOpenHouseAction(
  _prev: OpenHouseSignupState,
  formData: FormData
): Promise<OpenHouseSignupState> {
  const dateId = String(formData.get("dateId") ?? "");

  const date = await prisma.openHouseDate.findUnique({
    where: { id: dateId },
    include: {
      openHouse: {
        include: {
          listing: {
            select: {
              id: true,
              titre: true,
              transaction: true,
              ownerId: true,
              owner: { select: { email: true } },
            },
          },
        },
      },
      registrations: { select: { statut: true } },
    },
  });
  if (!date) return { error: "Créneau introuvable." };

  const listing = date.openHouse.listing;
  const detailPath = listingDetailPath(listing.transaction, listing.id);

  const session = await getSession();
  if (!session) {
    redirect(`/connexion?next=${encodeURIComponent(detailPath)}`);
  }
  if (listing.ownerId === session.userId) {
    return { error: "Vous ne pouvez pas vous inscrire à vos propres portes ouvertes." };
  }
  if (date.openHouse.annulee) {
    return { error: "Ces portes ouvertes ont été annulées." };
  }
  if (date.startAt <= new Date()) {
    return { error: "Ce créneau est déjà passé." };
  }

  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();

  if (!prenom || !nom) return { error: "Merci d'indiquer vos nom et prénom." };
  if (!telephone) return { error: "Merci d'indiquer votre téléphone." };
  if (!isValidPhoneNumber(telephone)) {
    return { error: "Merci d'indiquer un numéro de téléphone valide." };
  }

  const acceptedCount = date.registrations.filter((r) => r.statut === "ACCEPTEE").length;
  if (acceptedCount >= date.capacity) {
    return { error: "Ce créneau est complet." };
  }

  try {
    await prisma.openHouseRegistration.create({
      data: { dateId, visiteurId: session.userId, prenom, nom, telephone },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Vous êtes déjà inscrit à ce créneau." };
    }
    throw e;
  }

  const { subject, html } = openHouseRegistrationReceivedEmail({
    listingTitre: listing.titre,
    listingId: listing.id,
    prenom,
    nom,
    telephone,
    dateLabel: formatDateLabel(date.startAt, date.endAt),
  });
  await sendEmail({ to: listing.owner.email, subject, html });
  await logEvent("open_house_registered", {
    userId: session.userId,
    path: detailPath,
  });

  revalidatePath(detailPath);
  return { success: true };
}

/**
 * Le propriétaire accepte ou refuse une inscription. Notifie le visiteur par
 * email. Réutilisé via useActionState pour signaler « créneau complet ».
 */
export async function respondToOpenHouseRegistrationAction(
  _prev: OpenHouseDateFormState,
  formData: FormData
): Promise<OpenHouseDateFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const registrationId = String(formData.get("registrationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "accept" && decision !== "refuse") {
    return { error: "Décision invalide." };
  }

  const registration = await prisma.openHouseRegistration.findFirst({
    where: {
      id: registrationId,
      statut: "EN_ATTENTE",
      date: { openHouse: { listing: { ownerId: session.userId } } },
    },
    include: {
      visiteur: { select: { email: true } },
      date: {
        include: {
          registrations: { select: { statut: true } },
          openHouse: {
            include: { listing: { select: { id: true, titre: true, transaction: true } } },
          },
        },
      },
    },
  });
  if (!registration) return { error: "Inscription introuvable ou déjà traitée." };

  const { date } = registration;
  const listing = date.openHouse.listing;

  if (decision === "accept") {
    const acceptedCount = date.registrations.filter((r) => r.statut === "ACCEPTEE").length;
    if (acceptedCount >= date.capacity) {
      return {
        error: `Créneau complet (${date.capacity} places). Refusez une inscription acceptée pour libérer une place.`,
      };
    }
  }

  await prisma.openHouseRegistration.update({
    where: { id: registrationId },
    data: {
      statut: decision === "accept" ? "ACCEPTEE" : "REFUSEE",
      respondedAt: new Date(),
    },
  });

  const { subject, html } = openHouseRegistrationRespondedEmail({
    listingTitre: listing.titre,
    listingId: listing.id,
    listingTransaction: listing.transaction,
    dateLabel: formatDateLabel(date.startAt, date.endAt),
    accepted: decision === "accept",
  });
  await sendEmail({ to: registration.visiteur.email, subject, html });

  revalidatePath(`/compte/annonces/${listing.id}`);
  revalidatePath(listingDetailPath(listing.transaction, listing.id));
  revalidatePath("/compte");
  return {};
}
