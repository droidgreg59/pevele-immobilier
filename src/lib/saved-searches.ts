import "server-only";
import { prisma } from "./prisma";
import { slugify } from "./slugify";
import type { TransactionType, TypeBien } from "@prisma/client";

export type ProposedListing = {
  proposalId: string;
  listingId: string;
  titre: string;
  prix: number;
  transaction: TransactionType;
  statut: "PROPOSEE" | "INTERESSE" | "PAS_INTERESSE";
};

export type SavedSearchMandate = {
  id: string;
  agencyId: string;
  agencyNom: string;
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  proposals: ProposedListing[];
};

export type SavedSearchSummary = {
  id: string;
  transaction: TransactionType;
  typeBien: TypeBien | null;
  q: string | null;
  villageSlugs: string | null;
  chambresMin: number | null;
  equipements: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: Date;
  newMatches: number;
  mandates: SavedSearchMandate[];
};

export async function getSavedSearchesByUser(
  userId: string
): Promise<SavedSearchSummary[]> {
  const rows = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      mandates: {
        select: {
          id: true,
          agencyId: true,
          statut: true,
          agency: { select: { nom: true, entreprise: true } },
          proposals: {
            select: {
              id: true,
              statut: true,
              listing: {
                select: { id: true, titre: true, prix: true, transaction: true },
              },
            },
          },
        },
      },
    },
  });

  return Promise.all(
    rows.map(async (row) => {
      const qSlug = row.q ? slugify(row.q) : "";
      const villageSlugList = row.villageSlugs
        ? row.villageSlugs.split(",").filter(Boolean)
        : [];
      const equipementList = row.equipements
        ? row.equipements.split(",").filter(Boolean)
        : [];
      const newMatches = await prisma.listing.count({
        where: {
          transaction: row.transaction,
          statut: "PUBLIEE",
          createdAt: { gt: row.createdAt },
          ...(villageSlugList.length > 0
            ? { villageSlug: { in: villageSlugList } }
            : qSlug
              ? { villageSlug: { contains: qSlug } }
              : {}),
          ...(row.typeBien ? { typeBien: row.typeBien } : {}),
          ...(row.chambresMin != null ? { chambres: { gte: row.chambresMin } } : {}),
          ...(equipementList.length > 0
            ? { AND: equipementList.map((tag) => ({ equipements: { contains: tag } })) }
            : {}),
          ...(row.budgetMin != null || row.budgetMax != null
            ? {
                prix: {
                  ...(row.budgetMin != null ? { gte: row.budgetMin } : {}),
                  ...(row.budgetMax != null ? { lte: row.budgetMax } : {}),
                },
              }
            : {}),
        },
      });
      const mandates = row.mandates.map((m) => ({
        id: m.id,
        agencyId: m.agencyId,
        agencyNom: m.agency.entreprise ?? m.agency.nom,
        statut: m.statut,
        proposals: m.proposals.map((p) => ({
          proposalId: p.id,
          listingId: p.listing.id,
          titre: p.listing.titre,
          prix: p.listing.prix,
          transaction: p.listing.transaction,
          statut: p.statut,
        })),
      }));
      return { ...row, newMatches, mandates };
    })
  );
}

export function savedSearchUrl(
  search: Pick<
    SavedSearchSummary,
    | "transaction"
    | "typeBien"
    | "q"
    | "villageSlugs"
    | "chambresMin"
    | "equipements"
    | "budgetMin"
    | "budgetMax"
  >
): string {
  const base = search.transaction === "VENTE" ? "/acheter" : "/louer";
  const params = new URLSearchParams();
  if (search.villageSlugs) params.set("villages", search.villageSlugs);
  else if (search.q) params.set("q", search.q);
  if (search.typeBien) params.set("type", search.typeBien);
  if (search.chambresMin != null) params.set("chambresMin", String(search.chambresMin));
  if (search.equipements) params.set("equip", search.equipements);
  if (search.budgetMin != null) params.set("budgetMin", String(search.budgetMin));
  if (search.budgetMax != null) params.set("budget", String(search.budgetMax));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
