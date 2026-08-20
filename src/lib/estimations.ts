import "server-only";
import { prisma } from "./prisma";

export type EstimationRequestForAgency = {
  id: string;
  adresse: string;
  nom: string;
  telephone: string;
  preferredDate: Date | null;
  traite: boolean;
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
      traite: true,
      createdAt: true,
      author: { select: { nom: true, email: true } },
    },
  });
}

export async function getEstimationRequestCount(agencyId: string): Promise<number> {
  return prisma.estimationRequest.count({ where: { agencyId } });
}
