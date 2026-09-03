import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { slugify } from "./slugify";
import { getVillageBySlug } from "@/data/villages";
import type { TransactionType, TypeBien, TypeMaison } from "@prisma/client";

/** Champs d'une recherche sauvegardée qui définissent les critères de filtre. */
export type SavedSearchCriteria = {
  transaction: TransactionType;
  typeBien: TypeBien | null;
  typeMaison: TypeMaison | null;
  q: string | null;
  villageSlugs: string | null;
  chambresMin: number | null;
  equipements: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
};

/**
 * Construit le `where` Prisma des annonces publiées correspondant à une
 * recherche sauvegardée. Source unique de vérité, réutilisée par le hub
 * /compte, le pill du header et le cron d'alertes — les trois doivent
 * toujours compter exactement les mêmes biens. `since` restreint aux annonces
 * créées après une date (fenêtre « nouveaux biens »).
 */
export function savedSearchListingWhere(
  s: SavedSearchCriteria,
  since?: Date
): Prisma.ListingWhereInput {
  const qSlug = s.q ? slugify(s.q) : "";
  const villageSlugList = s.villageSlugs ? s.villageSlugs.split(",").filter(Boolean) : [];
  const equipementList = s.equipements ? s.equipements.split(",").filter(Boolean) : [];

  return {
    transaction: s.transaction,
    statut: "PUBLIEE",
    ...(since ? { createdAt: { gt: since } } : {}),
    ...(villageSlugList.length > 0
      ? { villageSlug: { in: villageSlugList } }
      : qSlug
        ? { villageSlug: { contains: qSlug } }
        : {}),
    ...(s.typeBien ? { typeBien: s.typeBien } : {}),
    ...(s.typeMaison ? { typeMaison: s.typeMaison } : {}),
    ...(s.chambresMin != null ? { chambres: { gte: s.chambresMin } } : {}),
    ...(equipementList.length > 0
      ? { AND: equipementList.map((tag) => ({ equipements: { contains: tag } })) }
      : {}),
    ...(s.budgetMin != null || s.budgetMax != null
      ? {
          prix: {
            ...(s.budgetMin != null ? { gte: s.budgetMin } : {}),
            ...(s.budgetMax != null ? { lte: s.budgetMax } : {}),
          },
        }
      : {}),
  };
}

const TYPE_BIEN_LABEL: Record<TypeBien, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};
const TYPE_MAISON_LABEL: Record<TypeMaison, string> = {
  INDIVIDUELLE: "individuelle",
  SEMI_INDIVIDUELLE: "semi-individuelle",
  MITOYENNE: "mitoyenne",
};

/** Libellé lisible d'une recherche sauvegardée, ex. « Achat · Maison · Cysoing · ≤ 300 000 € ». */
export function savedSearchLabel(s: SavedSearchCriteria): string {
  const parts: string[] = [s.transaction === "VENTE" ? "Achat" : "Location"];
  if (s.typeBien) {
    parts.push(
      s.typeBien === "MAISON" && s.typeMaison
        ? `${TYPE_BIEN_LABEL.MAISON} ${TYPE_MAISON_LABEL[s.typeMaison]}`
        : TYPE_BIEN_LABEL[s.typeBien]
    );
  }
  const villageSlugList = s.villageSlugs ? s.villageSlugs.split(",").filter(Boolean) : [];
  if (villageSlugList.length > 0) {
    const noms = villageSlugList
      .map((slug) => getVillageBySlug(slug)?.nom)
      .filter((n): n is string => Boolean(n));
    if (noms.length > 0) parts.push(noms.join(", "));
  } else if (s.q) {
    parts.push(s.q);
  } else {
    parts.push("toute la Pévèle");
  }
  if (s.chambresMin != null) parts.push(`${s.chambresMin}+ chambres`);
  if (s.equipements) parts.push(s.equipements.split(",").filter(Boolean).join(", "));
  if (s.budgetMin != null && s.budgetMax != null) {
    parts.push(`${s.budgetMin.toLocaleString("fr-FR")} – ${s.budgetMax.toLocaleString("fr-FR")} €`);
  } else if (s.budgetMax != null) {
    parts.push(`≤ ${s.budgetMax.toLocaleString("fr-FR")} €`);
  } else if (s.budgetMin != null) {
    parts.push(`≥ ${s.budgetMin.toLocaleString("fr-FR")} €`);
  }
  return parts.join(" · ");
}

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
  typeMaison: TypeMaison | null;
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
      const newMatches = await prisma.listing.count({
        where: savedSearchListingWhere(row, row.createdAt),
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

export type SavedSearchPillSummary = {
  id: string;
  matchCount: number;
};

/**
 * Résumé léger de la dernière recherche sauvegardée — pour le pill "Mon
 * projet" du header (appelé depuis /api/session à chaque navigation, donc
 * volontairement sans les jointures mandats/propositions de
 * getSavedSearchesByUser).
 */
export async function getMostRecentSavedSearchSummary(
  userId: string
): Promise<SavedSearchPillSummary | null> {
  const row = await prisma.savedSearch.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;

  const matchCount = await prisma.listing.count({
    where: savedSearchListingWhere(row),
  });

  return { id: row.id, matchCount };
}

export function savedSearchUrl(
  search: Pick<
    SavedSearchSummary,
    | "transaction"
    | "typeBien"
    | "typeMaison"
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
  if (search.typeBien === "MAISON" && search.typeMaison) {
    params.set("typeMaison", search.typeMaison);
  }
  if (search.chambresMin != null) params.set("chambresMin", String(search.chambresMin));
  if (search.equipements) params.set("equip", search.equipements);
  if (search.budgetMin != null) params.set("budgetMin", String(search.budgetMin));
  if (search.budgetMax != null) params.set("budget", String(search.budgetMax));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
