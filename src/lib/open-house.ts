import "server-only";
import { prisma } from "./prisma";
import type { MandateStatus } from "@prisma/client";

/** Chemin de la fiche publique d'une annonce selon sa transaction. */
export function listingDetailPath(transaction: "VENTE" | "LOCATION", id: string): string {
  return `/${transaction === "VENTE" ? "acheter" : "louer"}/${id}`;
}

export type OpenHouseDatePublic = {
  id: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  acceptedCount: number;
  /** Statut de l'inscription du visiteur courant sur ce créneau, si connecté et inscrit. */
  viewerStatut: MandateStatus | null;
};

export type OpenHouseForListing = {
  id: string;
  note: string | null;
  dates: OpenHouseDatePublic[];
};

/**
 * Évènement portes ouvertes affiché sur la fiche du bien : uniquement s'il
 * n'est pas annulé, avec ses créneaux encore à venir triés par date. Le
 * statut d'inscription du visiteur courant est renseigné quand `viewerId`
 * est fourni.
 */
export async function getOpenHouseForListing(
  listingId: string,
  viewerId?: string | null
): Promise<OpenHouseForListing | null> {
  const openHouse = await prisma.openHouse.findUnique({
    where: { listingId },
    include: {
      dates: {
        where: { startAt: { gt: new Date() } },
        orderBy: { startAt: "asc" },
        include: {
          registrations: { select: { statut: true, visiteurId: true } },
        },
      },
    },
  });
  if (!openHouse || openHouse.annulee || openHouse.dates.length === 0) return null;

  return {
    id: openHouse.id,
    note: openHouse.note,
    dates: openHouse.dates.map((d) => ({
      id: d.id,
      startAt: d.startAt,
      endAt: d.endAt,
      capacity: d.capacity,
      acceptedCount: d.registrations.filter((r) => r.statut === "ACCEPTEE").length,
      viewerStatut:
        (viewerId &&
          d.registrations.find((r) => r.visiteurId === viewerId)?.statut) ||
        null,
    })),
  };
}

export type OwnerRegistration = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  statut: MandateStatus;
  createdAt: Date;
};

export type OwnerDate = {
  id: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  acceptedCount: number;
  registrations: OwnerRegistration[];
};

export type OpenHouseForOwner = {
  id: string;
  note: string | null;
  annulee: boolean;
  dates: OwnerDate[];
};

/**
 * Évènement complet pour le panneau de gestion du propriétaire : tous les
 * créneaux (y compris passés) et toutes les inscriptions. Renvoie `null` si
 * l'annonce n'existe pas, n'appartient pas à `ownerId`, ou n'a pas encore
 * d'évènement.
 */
export async function getOpenHouseForOwner(
  listingId: string,
  ownerId: string
): Promise<OpenHouseForOwner | null> {
  const openHouse = await prisma.openHouse.findFirst({
    where: { listingId, listing: { ownerId } },
    include: {
      dates: {
        orderBy: { startAt: "asc" },
        include: {
          registrations: {
            orderBy: { createdAt: "asc" },
            include: { visiteur: { select: { email: true } } },
          },
        },
      },
    },
  });
  if (!openHouse) return null;

  return {
    id: openHouse.id,
    note: openHouse.note,
    annulee: openHouse.annulee,
    dates: openHouse.dates.map((d) => ({
      id: d.id,
      startAt: d.startAt,
      endAt: d.endAt,
      capacity: d.capacity,
      acceptedCount: d.registrations.filter((r) => r.statut === "ACCEPTEE").length,
      registrations: d.registrations.map((r) => ({
        id: r.id,
        nom: r.nom,
        prenom: r.prenom,
        telephone: r.telephone,
        email: r.visiteur.email,
        statut: r.statut,
        createdAt: r.createdAt,
      })),
    })),
  };
}

export type PendingRegistrationForOwner = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  createdAt: Date;
  dateStartAt: Date;
  dateEndAt: Date;
  listingId: string;
  listingTitre: string;
  listingHref: string;
};

/** Inscriptions en attente sur toutes les annonces du propriétaire, pour /compte. */
export async function getPendingOpenHouseRegistrationsForOwner(
  ownerId: string
): Promise<PendingRegistrationForOwner[]> {
  const rows = await prisma.openHouseRegistration.findMany({
    where: {
      statut: "EN_ATTENTE",
      date: { openHouse: { annulee: false, listing: { ownerId } } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      visiteur: { select: { email: true } },
      date: {
        select: {
          startAt: true,
          endAt: true,
          openHouse: {
            select: { listing: { select: { id: true, titre: true, transaction: true } } },
          },
        },
      },
    },
  });

  return rows.map((r) => {
    const listing = r.date.openHouse.listing;
    return {
      id: r.id,
      nom: r.nom,
      prenom: r.prenom,
      telephone: r.telephone,
      email: r.visiteur.email,
      createdAt: r.createdAt,
      dateStartAt: r.date.startAt,
      dateEndAt: r.date.endAt,
      listingId: listing.id,
      listingTitre: listing.titre,
      listingHref: listingDetailPath(listing.transaction, listing.id),
    };
  });
}

export type MyOpenHouseRegistration = {
  id: string;
  statut: MandateStatus;
  dateStartAt: Date;
  dateEndAt: Date;
  annulee: boolean;
  listingId: string;
  listingTitre: string;
  listingHref: string;
};

/** Inscriptions portes ouvertes du visiteur, pour le suivi dans /compte. */
export async function getOpenHouseRegistrationsByUser(
  userId: string
): Promise<MyOpenHouseRegistration[]> {
  const rows = await prisma.openHouseRegistration.findMany({
    where: { visiteurId: userId },
    orderBy: { date: { startAt: "asc" } },
    include: {
      date: {
        select: {
          startAt: true,
          endAt: true,
          openHouse: {
            select: {
              annulee: true,
              listing: { select: { id: true, titre: true, transaction: true } },
            },
          },
        },
      },
    },
  });

  return rows.map((r) => {
    const listing = r.date.openHouse.listing;
    return {
      id: r.id,
      statut: r.statut,
      dateStartAt: r.date.startAt,
      dateEndAt: r.date.endAt,
      annulee: r.date.openHouse.annulee,
      listingId: listing.id,
      listingTitre: listing.titre,
      listingHref: listingDetailPath(listing.transaction, listing.id),
    };
  });
}
