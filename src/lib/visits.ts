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

export type ExistingVisitRequest = {
  createdAt: Date;
  preferredDate: Date | null;
  traite: boolean;
};

export type VisitFormContext = {
  /** Téléphone déjà connu du compte, pour pré-remplir le formulaire — reste modifiable. */
  telephone: string | null;
  /** Dernière demande déjà envoyée par ce visiteur pour ce bien, s'il y en a une — le
   * formulaire est alors remplacé par un état de suivi plutôt que rouvert. */
  existingRequest: ExistingVisitRequest | null;
};

/**
 * Contexte pour pré-remplir/masquer le formulaire de demande de visite d'une
 * fiche annonce — jamais appelé pour le propriétaire de l'annonce ni un
 * visiteur non connecté (voir acheter/[id]/page.tsx et louer/[id]/page.tsx).
 */
export async function getVisitFormContext(
  userId: string,
  listingId: string
): Promise<VisitFormContext> {
  const [user, existingRequest] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { telephone: true } }),
    prisma.visitRequest.findFirst({
      where: { listingId, authorId: userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, preferredDate: true, traite: true },
    }),
  ]);
  return { telephone: user?.telephone ?? null, existingRequest };
}
