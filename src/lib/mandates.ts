import "server-only";
import { prisma } from "./prisma";
import type { TransactionType } from "@prisma/client";
import type { SavedSearchCriteria } from "./saved-searches";

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

/** Champs d'une recherche sauvegardée nécessaires à `savedSearchLabel` — mêmes critères que `SavedSearchCriteria`. */
const SAVED_SEARCH_SELECT = {
  transaction: true,
  typeBien: true,
  typeMaison: true,
  q: true,
  villageSlugs: true,
  chambresMin: true,
  equipements: true,
  budgetMin: true,
  budgetMax: true,
} as const;

export type PendingMandate = {
  id: string;
  createdAt: Date;
  client: { nom: string; prenom: string | null; email: string };
  search: SavedSearchCriteria;
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
      client: { select: { nom: true, prenom: true, email: true } },
      savedSearch: { select: SAVED_SEARCH_SELECT },
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
  statut: "PROPOSEE" | "INTERESSE" | "PAS_INTERESSE";
};

export type ClientFiche = {
  clientId: string;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  searches: (SavedSearchCriteria & {
    mandateId: string;
    acceptedAt: Date | null;
    proposals: ProposedListing[];
  })[];
};

export async function getClientsForAgency(agencyId: string): Promise<ClientFiche[]> {
  const rows = await prisma.searchMandate.findMany({
    where: { agencyId, statut: "ACCEPTEE" },
    orderBy: { respondedAt: "desc" },
    select: {
      id: true,
      respondedAt: true,
      client: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } },
      savedSearch: { select: SAVED_SEARCH_SELECT },
      proposals: {
        select: {
          id: true,
          statut: true,
          listing: { select: { id: true, titre: true, prix: true, transaction: true } },
        },
      },
    },
  });

  const byClient = new Map<string, ClientFiche>();
  for (const r of rows) {
    const existing = byClient.get(r.client.id);
    const search = {
      ...r.savedSearch,
      mandateId: r.id,
      acceptedAt: r.respondedAt,
      proposals: r.proposals.map((p) => ({
        proposalId: p.id,
        listingId: p.listing.id,
        titre: p.listing.titre,
        prix: p.listing.prix,
        transaction: p.listing.transaction,
        statut: p.statut,
      })),
    };
    if (existing) {
      existing.searches.push(search);
    } else {
      byClient.set(r.client.id, {
        clientId: r.client.id,
        nom: r.client.nom,
        prenom: r.client.prenom,
        email: r.client.email,
        telephone: r.client.telephone,
        searches: [search],
      });
    }
  }
  return Array.from(byClient.values());
}
