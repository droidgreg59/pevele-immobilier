import "server-only";
import { prisma } from "./prisma";
import type { AccountType } from "@prisma/client";

export type UserSummary = {
  id: string;
  email: string;
  nom: string;
  entreprise: string | null;
  type: AccountType;
  isAdmin: boolean;
  createdAt: Date;
  listingCount: number;
};

export async function getAllUsers(): Promise<UserSummary[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      nom: true,
      entreprise: true,
      type: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    nom: u.nom,
    entreprise: u.entreprise,
    type: u.type,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
    listingCount: u._count.listings,
  }));
}

export type DeleteUserResult = { error?: string };

/**
 * Supprime un compte et tout ce qui en dépend (annonces, avis, favoris,
 * recherches, mandats, demandes...) via les cascades Prisma. Les fichiers
 * photo des annonces supprimées doivent être nettoyés séparément par
 * l'appelant (le nom des dossiers dépend des listingId, récupérés ici avant
 * suppression).
 */
export async function deleteUserAccount(
  targetUserId: string,
  requesterId: string
): Promise<DeleteUserResult & { deletedListingIds?: string[] }> {
  if (targetUserId === requesterId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte depuis cette page." };
  }
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, listings: { select: { id: true } } },
  });
  if (!target) return { error: "Compte introuvable." };

  await prisma.user.delete({ where: { id: targetUserId } });
  return { deletedListingIds: target.listings.map((l) => l.id) };
}
