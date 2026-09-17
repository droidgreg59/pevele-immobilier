import "server-only";
import { prisma } from "./prisma";
import type { TransactionType } from "@prisma/client";

export type VisitRequestForOwner = {
  id: string;
  message: string;
  telephone: string | null;
  preferredDate: Date | null;
  traite: boolean;
  createdAt: Date;
  author: { nom: string; prenom: string | null; email: string };
  listing: { id: string; titre: string; transaction: TransactionType };
};

export async function getVisitRequestsForOwner(
  ownerId: string
): Promise<VisitRequestForOwner[]> {
  return prisma.visitRequest.findMany({
    where: { listing: { ownerId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      telephone: true,
      preferredDate: true,
      traite: true,
      createdAt: true,
      author: { select: { nom: true, prenom: true, email: true } },
      listing: { select: { id: true, titre: true, transaction: true } },
    },
  });
}

export type VisitRequestByUser = {
  id: string;
  message: string;
  preferredDate: Date | null;
  traite: boolean;
  createdAt: Date;
  listing: { id: string; titre: string; transaction: TransactionType };
};

/** Demandes de visite envoyées par cet utilisateur (côté demandeur) — suivi dans /compte/particulier/mes-demarches. */
export async function getVisitRequestsByUser(authorId: string): Promise<VisitRequestByUser[]> {
  return prisma.visitRequest.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      preferredDate: true,
      traite: true,
      createdAt: true,
      listing: { select: { id: true, titre: true, transaction: true } },
    },
  });
}
