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
  author: { nom: string; email: string };
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
      author: { select: { nom: true, email: true } },
      listing: { select: { id: true, titre: true, transaction: true } },
    },
  });
}
