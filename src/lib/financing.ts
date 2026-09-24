import "server-only";
import { prisma } from "./prisma";

export type FinancingRequestForCourtier = {
  id: string;
  message: string;
  /** Téléphone saisi sur le formulaire (facultatif), sinon celui du compte de l'auteur. */
  telephone: string | null;
  traite: boolean;
  createdAt: Date;
  author: { nom: string; prenom: string | null; email: string };
  listing: { id: string; titre: string; commune: string; transaction: "VENTE" | "LOCATION" } | null;
};

export async function getFinancingRequestsForCourtier(
  courtierId: string
): Promise<FinancingRequestForCourtier[]> {
  const rows = await prisma.financingRequest.findMany({
    where: { courtierId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      telephone: true,
      traite: true,
      createdAt: true,
      author: { select: { nom: true, prenom: true, email: true, telephone: true } },
      listing: { select: { id: true, titre: true, commune: true, transaction: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    message: r.message,
    telephone: r.telephone ?? r.author.telephone,
    traite: r.traite,
    createdAt: r.createdAt,
    author: { nom: r.author.nom, prenom: r.author.prenom, email: r.author.email },
    listing: r.listing,
  }));
}

export async function getFinancingRequestCount(courtierId: string): Promise<number> {
  return prisma.financingRequest.count({ where: { courtierId } });
}
