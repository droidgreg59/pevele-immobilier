import "server-only";
import { prisma } from "./prisma";

export type ArtisanSummary = {
  id: string;
  nom: string;
  entreprise: string | null;
  ville: string | null;
  categories: string[];
};

export async function getArtisans(category?: string): Promise<ArtisanSummary[]> {
  const artisans = await prisma.user.findMany({
    where: {
      type: "ARTISAN",
      ...(category ? { categories: { contains: category } } : {}),
    },
    select: { id: true, nom: true, entreprise: true, ville: true, categories: true },
    orderBy: { createdAt: "asc" },
  });

  return artisans.map((a) => ({
    id: a.id,
    nom: a.nom,
    entreprise: a.entreprise,
    ville: a.ville,
    categories: a.categories ? a.categories.split(",").filter(Boolean) : [],
  }));
}

const ARTISAN_PROFILE_SELECT = {
  id: true,
  nom: true,
  entreprise: true,
  email: true,
  telephone: true,
  adresse: true,
  codePostal: true,
  ville: true,
  siteWeb: true,
  description: true,
  categories: true,
  communesDesservies: true,
  createdAt: true,
} as const;

export type ArtisanProfile = {
  id: string;
  nom: string;
  entreprise: string | null;
  email: string;
  telephone: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  siteWeb: string | null;
  description: string | null;
  categories: string[];
  communesDesservies: string[];
  createdAt: Date;
};

export async function getArtisanById(id: string): Promise<ArtisanProfile | null> {
  const a = await prisma.user.findFirst({
    where: { id, type: "ARTISAN" },
    select: ARTISAN_PROFILE_SELECT,
  });
  if (!a) return null;
  return {
    ...a,
    categories: a.categories ? a.categories.split(",").filter(Boolean) : [],
    communesDesservies: a.communesDesservies
      ? a.communesDesservies.split(",").filter(Boolean)
      : [],
  };
}

export type ArtisanProfileInput = {
  entreprise: string;
  description?: string;
  categories: string[];
  communesDesservies: string[];
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  siteWeb?: string;
};

export async function updateArtisanProfile(
  userId: string,
  input: ArtisanProfileInput
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      entreprise: input.entreprise,
      description: input.description || null,
      categories: input.categories.join(","),
      communesDesservies: input.communesDesservies.join(","),
      telephone: input.telephone || null,
      adresse: input.adresse || null,
      codePostal: input.codePostal || null,
      ville: input.ville || null,
      siteWeb: input.siteWeb || null,
    },
  });
}
