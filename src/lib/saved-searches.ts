import "server-only";
import { prisma } from "./prisma";
import { slugify } from "./slugify";
import type { TransactionType } from "@prisma/client";

export type SavedSearchSummary = {
  id: string;
  transaction: TransactionType;
  q: string | null;
  budgetMax: number | null;
  createdAt: Date;
  newMatches: number;
};

export async function getSavedSearchesByUser(
  userId: string
): Promise<SavedSearchSummary[]> {
  const rows = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    rows.map(async (row) => {
      const qSlug = row.q ? slugify(row.q) : "";
      const newMatches = await prisma.listing.count({
        where: {
          transaction: row.transaction,
          statut: "PUBLIEE",
          createdAt: { gt: row.createdAt },
          ...(qSlug ? { villageSlug: { contains: qSlug } } : {}),
          ...(row.budgetMax != null ? { prix: { lte: row.budgetMax } } : {}),
        },
      });
      return { ...row, newMatches };
    })
  );
}

export function savedSearchUrl(
  search: Pick<SavedSearchSummary, "transaction" | "q" | "budgetMax">
): string {
  const base = search.transaction === "VENTE" ? "/acheter" : "/louer";
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.budgetMax != null) params.set("budget", String(search.budgetMax));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
