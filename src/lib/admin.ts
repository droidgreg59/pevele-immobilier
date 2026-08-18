import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession, type SessionPayload } from "./session";

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  return user?.isAdmin ?? false;
}

/** Redirige si non connecté ou non admin. Renvoie la session sinon. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/admin/annonces");
  if (!(await isUserAdmin(session.userId))) redirect("/compte");
  return session;
}

const PENDING_LISTING_SELECT = {
  id: true,
  titre: true,
  transaction: true,
  typeBien: true,
  prix: true,
  commune: true,
  createdAt: true,
  owner: { select: { nom: true, entreprise: true, type: true } },
  photos: { orderBy: { order: "asc" as const }, take: 1 },
} as const;

export type PendingListing = {
  id: string;
  titre: string;
  transaction: "VENTE" | "LOCATION";
  typeBien: string;
  prix: number;
  commune: string;
  createdAt: Date;
  ownerNom: string;
  ownerLabel: string;
  coverUrl: string | null;
};

export async function getPendingListings(): Promise<PendingListing[]> {
  const listings = await prisma.listing.findMany({
    where: { statut: "EN_VERIFICATION" },
    orderBy: { createdAt: "asc" },
    select: PENDING_LISTING_SELECT,
  });

  return listings.map((l) => ({
    id: l.id,
    titre: l.titre,
    transaction: l.transaction,
    typeBien: l.typeBien,
    prix: l.prix,
    commune: l.commune,
    createdAt: l.createdAt,
    ownerNom: l.owner.nom,
    ownerLabel: l.owner.entreprise ?? l.owner.nom,
    coverUrl: l.photos[0]?.url ?? null,
  }));
}

export async function publishListing(id: string): Promise<void> {
  await prisma.listing.update({
    where: { id },
    data: { statut: "PUBLIEE", statutRaison: null },
  });
}

export async function rejectListing(id: string, raison: string): Promise<void> {
  await prisma.listing.update({
    where: { id },
    data: { statut: "REFUSEE", statutRaison: raison || null },
  });
}
