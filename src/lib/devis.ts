import "server-only";
import { prisma } from "./prisma";

export type DevisRequestForArtisan = {
  id: string;
  message: string;
  telephone: string | null;
  traite: boolean;
  createdAt: Date;
  author: { nom: string; email: string };
};

export async function getDevisRequestsForArtisan(
  artisanId: string
): Promise<DevisRequestForArtisan[]> {
  return prisma.devisRequest.findMany({
    where: { artisanId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      telephone: true,
      traite: true,
      createdAt: true,
      author: { select: { nom: true, email: true } },
    },
  });
}

export async function getDevisRequestCount(artisanId: string): Promise<number> {
  return prisma.devisRequest.count({ where: { artisanId } });
}
