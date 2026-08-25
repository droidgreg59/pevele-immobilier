import "server-only";
import { prisma } from "./prisma";
import type { MandateStatus } from "@prisma/client";

export type EstimationRequestForAgency = {
  id: string;
  adresse: string;
  nom: string;
  telephone: string;
  preferredDate: Date | null;
  statut: MandateStatus;
  createdAt: Date;
  author: { nom: string; email: string };
};

export async function getEstimationRequestsForAgency(
  agencyId: string
): Promise<EstimationRequestForAgency[]> {
  return prisma.estimationRequest.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      adresse: true,
      nom: true,
      telephone: true,
      preferredDate: true,
      statut: true,
      createdAt: true,
      author: { select: { nom: true, email: true } },
    },
  });
}

export async function getEstimationRequestCount(agencyId: string): Promise<number> {
  return prisma.estimationRequest.count({ where: { agencyId } });
}

export type EstimationRequestForAuthor = {
  id: string;
  adresse: string;
  preferredDate: Date | null;
  statut: MandateStatus;
  createdAt: Date;
  agencyId: string;
  agencyNom: string;
};

export async function getEstimationRequestsByUser(
  authorId: string
): Promise<EstimationRequestForAuthor[]> {
  const rows = await prisma.estimationRequest.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      adresse: true,
      preferredDate: true,
      statut: true,
      createdAt: true,
      agencyId: true,
      agency: { select: { nom: true, entreprise: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    adresse: r.adresse,
    preferredDate: r.preferredDate,
    statut: r.statut,
    createdAt: r.createdAt,
    agencyId: r.agencyId,
    agencyNom: r.agency.entreprise ?? r.agency.nom,
  }));
}
