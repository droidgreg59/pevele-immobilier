import "server-only";
import { prisma } from "./prisma";
import { villages } from "@/data/villages";
import { filterValidVillageSlugs } from "./agency-service-area";

export type AgencySummary = {
  id: string;
  nom: string;
  entreprise: string | null;
  logoUrl: string | null;
  createdAt: Date;
  listingCount: number;
  verified: boolean;
};

export async function getAgencies(): Promise<AgencySummary[]> {
  const agencies = await prisma.user.findMany({
    where: { type: "AGENCE" },
    select: {
      id: true,
      nom: true,
      entreprise: true,
      logoUrl: true,
      createdAt: true,
      verifStatut: true,
      _count: { select: { listings: { where: { statut: "PUBLIEE" } } } },
    },
    // Alphabétique, jamais createdAt (favoriserait structurellement la
    // première agence inscrite) ni aléatoire (rendu instable, cache/SEO).
    orderBy: [{ entreprise: { sort: "asc", nulls: "last" } }, { nom: "asc" }],
  });

  return agencies.map((a) => ({
    id: a.id,
    nom: a.nom,
    entreprise: a.entreprise,
    logoUrl: a.logoUrl,
    createdAt: a.createdAt,
    listingCount: a._count.listings,
    verified: a.verifStatut === "VERIFIEE",
  }));
}

const AGENCY_PROFILE_SELECT = {
  id: true,
  nom: true,
  entreprise: true,
  email: true,
  telephone: true,
  adresse: true,
  codePostal: true,
  ville: true,
  siteWeb: true,
  googleAvisUrl: true,
  logoUrl: true,
  xmlImportUrl: true,
  xmlLastSyncAt: true,
  xmlLastSyncCount: true,
  xmlLastSyncError: true,
  verifStatut: true,
  createdAt: true,
} as const;

export type AgencyProfile = {
  id: string;
  nom: string;
  entreprise: string | null;
  email: string;
  telephone: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  siteWeb: string | null;
  googleAvisUrl: string | null;
  logoUrl: string | null;
  xmlImportUrl: string | null;
  xmlLastSyncAt: Date | null;
  xmlLastSyncCount: number | null;
  xmlLastSyncError: string | null;
  verifStatut: "NON_SOUMISE" | "EN_ATTENTE" | "VERIFIEE" | "REFUSEE";
  createdAt: Date;
};

export async function getAgencyById(id: string): Promise<AgencyProfile | null> {
  return prisma.user.findFirst({
    where: { id, type: "AGENCE" },
    select: AGENCY_PROFILE_SELECT,
  });
}

export type AgencyProfileInput = {
  entreprise: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  siteWeb?: string;
  googleAvisUrl?: string;
  logoUrl?: string;
};

export async function updateAgencyProfile(
  userId: string,
  input: AgencyProfileInput
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      entreprise: input.entreprise,
      telephone: input.telephone || null,
      adresse: input.adresse || null,
      codePostal: input.codePostal || null,
      ville: input.ville || null,
      siteWeb: input.siteWeb || null,
      googleAvisUrl: input.googleAvisUrl || null,
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    },
  });
}

export async function updateXmlImportUrl(userId: string, url: string | null): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { xmlImportUrl: url } });
}

export async function recordXmlSyncResult(
  userId: string,
  result: { count: number } | { error: string }
): Promise<void> {
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      xmlLastSyncAt: now,
      xmlLastSyncCount: "count" in result ? result.count : null,
      xmlLastSyncError: "error" in result ? result.error : null,
      // Uniquement sur un succès — jamais écrasé par un échec, contrairement
      // à xmlLastSyncAt (voir le commentaire du champ dans schema.prisma).
      ...("count" in result ? { xmlLastSuccessAt: now } : {}),
    },
  });
}

/** Communes déclarées par une agence comme zone d'intervention (slugs). */
export async function getAgencyServiceAreas(agencyId: string): Promise<string[]> {
  const rows = await prisma.agencyServiceArea.findMany({
    where: { agencyId },
    select: { villageSlug: true },
  });
  return rows.map((r) => r.villageSlug);
}

/**
 * Remplace intégralement les zones déclarées par une agence. `agencyId` doit
 * toujours venir de la session serveur (jamais d'un champ de formulaire) —
 * vérifié par l'appelant (agency-actions.ts). Chaque slug est revalidé ici
 * contre la liste réelle des communes, même si l'appelant a déjà filtré :
 * cette fonction ne fait jamais confiance à son entrée par construction.
 */
export async function updateAgencyServiceAreas(
  agencyId: string,
  villageSlugs: string[]
): Promise<void> {
  const valid = filterValidVillageSlugs(
    villageSlugs,
    villages.map((v) => v.slug)
  );
  await prisma.$transaction([
    prisma.agencyServiceArea.deleteMany({ where: { agencyId } }),
    ...(valid.length > 0
      ? [
          prisma.agencyServiceArea.createMany({
            data: valid.map((villageSlug) => ({ agencyId, villageSlug })),
          }),
        ]
      : []),
  ]);
}

export type AgencyVillageSummary = {
  id: string;
  nom: string;
  entreprise: string | null;
  logoUrl: string | null;
};

/** Agences ayant déclaré intervenir dans cette commune — tri alphabétique déterministe. */
export async function getAgenciesForVillage(villageSlug: string): Promise<AgencyVillageSummary[]> {
  return prisma.user.findMany({
    where: { type: "AGENCE", serviceAreas: { some: { villageSlug } } },
    select: { id: true, nom: true, entreprise: true, logoUrl: true },
    orderBy: [{ entreprise: { sort: "asc", nulls: "last" } }, { nom: "asc" }],
  });
}

/**
 * Nombre total d'agences actives sur le portail — sert à décider si le bloc
 * « Agences intervenant à {commune} » doit apparaître sur les pages village
 * (voir villages/[slug]/page.tsx) : avec une seule agence, l'afficher sur les
 * 44 communes donnerait l'impression que le site n'est qu'une vitrine PVL,
 * à l'opposé du positionnement de portail multi-agences indépendant.
 */
export async function getActiveAgencyCount(): Promise<number> {
  return prisma.user.count({ where: { type: "AGENCE" } });
}
