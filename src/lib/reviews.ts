import "server-only";
import { prisma } from "./prisma";

export type ReviewWithAuthor = {
  id: string;
  note: number;
  commentaire: string;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: { nom: string };
};

export async function getAgencyReviews(
  agencyId: string
): Promise<ReviewWithAuthor[]> {
  return prisma.review.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      note: true,
      commentaire: true,
      isOfficial: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: { select: { nom: true } },
    },
  });
}

export type ReviewSummary = {
  id: string;
  note: number;
  commentaire: string;
  isOfficial: boolean;
  createdAt: Date;
  agencyId: string;
  agencyNom: string;
  authorNom: string;
};

export async function getAllReviews(): Promise<ReviewSummary[]> {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      note: true,
      commentaire: true,
      isOfficial: true,
      createdAt: true,
      agencyId: true,
      agency: { select: { nom: true, entreprise: true } },
      author: { select: { nom: true } },
    },
  });
  return reviews.map((r) => ({
    id: r.id,
    note: r.note,
    commentaire: r.commentaire,
    isOfficial: r.isOfficial,
    createdAt: r.createdAt,
    agencyId: r.agencyId,
    agencyNom: r.agency.entreprise ?? r.agency.nom,
    authorNom: r.author.nom,
  }));
}

export type AgencyReviewStats = { count: number; average: number | null };

export async function getAgencyReviewStats(
  agencyId: string
): Promise<AgencyReviewStats> {
  const agg = await prisma.review.aggregate({
    where: { agencyId },
    _count: { _all: true },
    _avg: { note: true },
  });
  return {
    count: agg._count._all,
    average: agg._avg.note !== null ? Math.round(agg._avg.note * 10) / 10 : null,
  };
}

export async function getUserReviewForAgency(
  agencyId: string,
  authorId: string
) {
  return prisma.review.findUnique({
    where: { agencyId_authorId: { agencyId, authorId } },
  });
}
