import "server-only";
import { prisma } from "./prisma";
import type { TransactionType } from "@prisma/client";

export async function getPendingMandateCount(agencyId: string): Promise<number> {
  return prisma.searchMandate.count({ where: { agencyId, statut: "EN_ATTENTE" } });
}

export async function getClientCount(agencyId: string): Promise<number> {
  const rows = await prisma.searchMandate.findMany({
    where: { agencyId, statut: "ACCEPTEE" },
    select: { clientId: true },
    distinct: ["clientId"],
  });
  return rows.length;
}

export type PendingMandate = {
  id: string;
  createdAt: Date;
  client: { nom: string; email: string };
  search: { transaction: TransactionType; q: string | null; budgetMax: number | null };
};

export async function getPendingMandatesForAgency(
  agencyId: string
): Promise<PendingMandate[]> {
  const rows = await prisma.searchMandate.findMany({
    where: { agencyId, statut: "EN_ATTENTE" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      client: { select: { nom: true, email: true } },
      savedSearch: { select: { transaction: true, q: true, budgetMax: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    client: r.client,
    search: r.savedSearch,
  }));
}

export type ProposedListing = {
  proposalId: string;
  listingId: string;
  titre: string;
  prix: number;
  transaction: TransactionType;
};

export type ClientFiche = {
  clientId: string;
  nom: string;
  email: string;
  searches: {
    mandateId: string;
    transaction: TransactionType;
    q: string | null;
    budgetMax: number | null;
    acceptedAt: Date | null;
    proposals: ProposedListing[];
  }[];
};

export async function getClientsForAgency(agencyId: string): Promise<ClientFiche[]> {
  const rows = await prisma.searchMandate.findMany({
    where: { agencyId, statut: "ACCEPTEE" },
    orderBy: { respondedAt: "desc" },
    select: {
      id: true,
      respondedAt: true,
      client: { select: { id: true, nom: true, email: true } },
      savedSearch: { select: { transaction: true, q: true, budgetMax: true } },
      proposals: {
        select: {
          id: true,
          listing: { select: { id: true, titre: true, prix: true, transaction: true } },
        },
      },
    },
  });

  const byClient = new Map<string, ClientFiche>();
  for (const r of rows) {
    const existing = byClient.get(r.client.id);
    const search = {
      mandateId: r.id,
      transaction: r.savedSearch.transaction,
      q: r.savedSearch.q,
      budgetMax: r.savedSearch.budgetMax,
      acceptedAt: r.respondedAt,
      proposals: r.proposals.map((p) => ({
        proposalId: p.id,
        listingId: p.listing.id,
        titre: p.listing.titre,
        prix: p.listing.prix,
        transaction: p.listing.transaction,
      })),
    };
    if (existing) {
      existing.searches.push(search);
    } else {
      byClient.set(r.client.id, {
        clientId: r.client.id,
        nom: r.client.nom,
        email: r.client.email,
        searches: [search],
      });
    }
  }
  return Array.from(byClient.values());
}
