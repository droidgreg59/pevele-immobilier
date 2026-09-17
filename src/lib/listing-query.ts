import "server-only";
import { Prisma } from "@prisma/client";
import type { TransactionType, TypeBien } from "@prisma/client";
import { prisma } from "./prisma";
import { slugify } from "./slugify";
import { listingWithOwner, type ListingWithOwner } from "./listings";
import type {
  ListingFilterCriteria,
  ListingSort,
  ListingFiltre,
  TypeBienFiltre,
  TypeMaisonFiltre,
} from "./listing-filters";

export const BROWSE_PAGE_SIZE = 24;

type RawParams = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined): string | undefined =>
  typeof v === "string" && v !== "" ? v : undefined;
const num = (v: string | string[] | undefined): number | undefined => {
  const s = str(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Lit les `searchParams` de /acheter et /louer en critères + tri + page. */
export function parseBrowseSearchParams(params: RawParams): {
  criteria: ListingFilterCriteria;
  tri: ListingSort;
  page: number;
} {
  const typeRaw = str(params.type);
  const typeBien: TypeBienFiltre =
    typeRaw === "MAISON" || typeRaw === "APPARTEMENT" || typeRaw === "TERRAIN" ? typeRaw : "TOUS";
  const typeMaisonRaw = str(params.typeMaison);
  const typeMaison: TypeMaisonFiltre =
    typeBien === "MAISON" &&
    (typeMaisonRaw === "INDIVIDUELLE" ||
      typeMaisonRaw === "SEMI_INDIVIDUELLE" ||
      typeMaisonRaw === "MITOYENNE")
      ? typeMaisonRaw
      : "TOUS";
  const filtreRaw = str(params.filtre);
  const filtre: ListingFiltre =
    filtreRaw === "agence" || filtreRaw === "particulier" ? filtreRaw : "tout";
  const triRaw = str(params.tri);
  const tri: ListingSort =
    triRaw === "prix_desc" || triRaw === "prix_asc" || triRaw === "surface_desc"
      ? triRaw
      : "recent";
  const villagesParam = str(params.villages);
  const villageSlugs = villagesParam ? villagesParam.split(",").filter(Boolean) : [];
  const equipParam = str(params.equip);
  const equipements = equipParam ? equipParam.split(",").filter(Boolean) : [];
  const pageNum = num(params.page);
  const page = pageNum && pageNum >= 1 ? Math.floor(pageNum) : 1;

  return {
    criteria: {
      filtre,
      typeBien,
      typeMaison,
      villageSlugs,
      querySlug: villageSlugs.length === 0 ? str(params.q) : undefined,
      budgetMin: num(params.budgetMin),
      budgetMax: num(params.budget),
      chambresMin: num(params.chambresMin),
      equipements,
    },
    tri,
    page,
  };
}

/**
 * Traduit les critères de recherche de /acheter et /louer en `where` Prisma.
 * Doit rester équivalent à `filterListings` (src/lib/listing-filters.ts), qui
 * fait le même filtrage en mémoire pour le compteur live du tunnel Mon projet.
 */
export function browseListingWhere(
  transaction: TransactionType,
  c: ListingFilterCriteria
): Prisma.ListingWhereInput {
  const villageSlugs = c.villageSlugs ?? [];
  const equipements = c.equipements ?? [];
  const qSlug = c.querySlug ? slugify(c.querySlug) : "";

  return {
    transaction,
    statut: "PUBLIEE",
    ...(c.filtre === "agence"
      ? { owner: { type: "AGENCE" } }
      : c.filtre === "particulier"
        ? { owner: { type: "PARTICULIER" } }
        : {}),
    ...(c.typeBien && c.typeBien !== "TOUS" ? { typeBien: c.typeBien } : {}),
    ...(c.typeMaison && c.typeMaison !== "TOUS" ? { typeMaison: c.typeMaison } : {}),
    ...(villageSlugs.length > 0
      ? { villageSlug: { in: villageSlugs } }
      : qSlug
        ? { villageSlug: { contains: qSlug } }
        : {}),
    ...(c.budgetMin != null || c.budgetMax != null
      ? {
          prix: {
            ...(c.budgetMin != null ? { gte: c.budgetMin } : {}),
            ...(c.budgetMax != null ? { lte: c.budgetMax } : {}),
          },
        }
      : {}),
    ...(c.chambresMin != null ? { chambres: { gte: c.chambresMin } } : {}),
    ...(equipements.length > 0
      ? { AND: equipements.map((tag) => ({ equipements: { contains: tag } })) }
      : {}),
  };
}

export function browseOrderBy(tri: ListingSort): Prisma.ListingOrderByWithRelationInput {
  switch (tri) {
    case "prix_asc":
      return { prix: "asc" };
    case "prix_desc":
      return { prix: "desc" };
    case "surface_desc":
      return { surface: "desc" };
    case "recent":
    default:
      return { createdAt: "desc" };
  }
}

export type BrowsePage = {
  listings: ListingWithOwner[];
  total: number;
};

export async function getBrowsePage(
  transaction: TransactionType,
  criteria: ListingFilterCriteria,
  tri: ListingSort,
  page: number
): Promise<BrowsePage> {
  const where = browseListingWhere(transaction, criteria);
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: browseOrderBy(tri),
      skip: (page - 1) * BROWSE_PAGE_SIZE,
      take: BROWSE_PAGE_SIZE,
      ...listingWithOwner,
    }),
    prisma.listing.count({ where }),
  ]);
  return { listings, total };
}

export type BrowseMapAggregate = {
  villageSlug: string;
  count: number;
  minPrix: number | null;
};

/** Agrégat par commune (nombre + prix mini) de toutes les annonces correspondant aux critères — pour la carte. */
export async function getBrowseMapAggregates(
  transaction: TransactionType,
  criteria: ListingFilterCriteria
): Promise<BrowseMapAggregate[]> {
  const rows = await prisma.listing.groupBy({
    by: ["villageSlug"],
    where: browseListingWhere(transaction, criteria),
    _count: { _all: true },
    _min: { prix: true },
  });
  return rows.map((r) => ({
    villageSlug: r.villageSlug,
    count: r._count._all,
    minPrix: r._min.prix,
  }));
}

export type BrowseFacets = {
  typeBien: Record<TypeBienFiltre, number>;
  typeMaison: Record<TypeMaisonFiltre, number>;
  filtre: Record<ListingFiltre, number>;
};

/**
 * Compteurs affichés sur les puces de filtre : calculés sur l'ensemble de base
 * (transaction + publiée), indépendamment des filtres actifs — comme le faisait
 * l'ancien filtrage en mémoire.
 */
export async function getBrowseFacets(transaction: TransactionType): Promise<BrowseFacets> {
  const base: Prisma.ListingWhereInput = { transaction, statut: "PUBLIEE" };

  const [byType, byMaison, total, agence, particulier] = await Promise.all([
    prisma.listing.groupBy({ by: ["typeBien"], where: base, _count: { _all: true } }),
    prisma.listing.groupBy({
      by: ["typeMaison"],
      where: { ...base, typeBien: "MAISON" },
      _count: { _all: true },
    }),
    prisma.listing.count({ where: base }),
    prisma.listing.count({ where: { ...base, owner: { type: "AGENCE" } } }),
    prisma.listing.count({ where: { ...base, owner: { type: "PARTICULIER" } } }),
  ]);

  const typeCount = (t: TypeBien) =>
    byType.find((r) => r.typeBien === t)?._count._all ?? 0;
  const maisonTotal = byMaison.reduce((s, r) => s + r._count._all, 0);
  const maisonCount = (t: "INDIVIDUELLE" | "SEMI_INDIVIDUELLE" | "MITOYENNE") =>
    byMaison.find((r) => r.typeMaison === t)?._count._all ?? 0;

  return {
    typeBien: {
      TOUS: total,
      MAISON: typeCount("MAISON"),
      APPARTEMENT: typeCount("APPARTEMENT"),
      TERRAIN: typeCount("TERRAIN"),
    },
    typeMaison: {
      TOUS: maisonTotal,
      INDIVIDUELLE: maisonCount("INDIVIDUELLE"),
      SEMI_INDIVIDUELLE: maisonCount("SEMI_INDIVIDUELLE"),
      MITOYENNE: maisonCount("MITOYENNE"),
    },
    filtre: { tout: total, agence, particulier },
  };
}
