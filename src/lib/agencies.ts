import "server-only";
import { prisma } from "./prisma";

export type AgencySummary = {
  id: string;
  nom: string;
  entreprise: string | null;
  logoUrl: string | null;
  createdAt: Date;
  listingCount: number;
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
      _count: { select: { listings: { where: { statut: "PUBLIEE" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return agencies.map((a) => ({
    id: a.id,
    nom: a.nom,
    entreprise: a.entreprise,
    logoUrl: a.logoUrl,
    createdAt: a.createdAt,
    listingCount: a._count.listings,
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
  await prisma.user.update({
    where: { id: userId },
    data: {
      xmlLastSyncAt: new Date(),
      xmlLastSyncCount: "count" in result ? result.count : null,
      xmlLastSyncError: "error" in result ? result.error : null,
    },
  });
}
