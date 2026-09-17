import "server-only";
import { prisma } from "./prisma";

export type DevisRequestForArtisan = {
  id: string;
  message: string;
  /** Téléphone saisi sur le formulaire de devis (facultatif), sinon celui du compte de l'auteur. */
  telephone: string | null;
  traite: boolean;
  createdAt: Date;
  author: { nom: string; prenom: string | null; email: string };
};

export async function getDevisRequestsForArtisan(
  artisanId: string
): Promise<DevisRequestForArtisan[]> {
  const rows = await prisma.devisRequest.findMany({
    where: { artisanId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      telephone: true,
      traite: true,
      createdAt: true,
      author: { select: { nom: true, prenom: true, email: true, telephone: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    message: r.message,
    telephone: r.telephone ?? r.author.telephone,
    traite: r.traite,
    createdAt: r.createdAt,
    author: { nom: r.author.nom, prenom: r.author.prenom, email: r.author.email },
  }));
}

export async function getDevisRequestCount(artisanId: string): Promise<number> {
  return prisma.devisRequest.count({ where: { artisanId } });
}
