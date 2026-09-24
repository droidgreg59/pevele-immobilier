import "server-only";
import { prisma } from "./prisma";

export type CourtierSummary = {
  id: string;
  nom: string;
  entreprise: string | null;
  ville: string | null;
  categories: string[];
};

/**
 * N'affiche que les courtiers validés par un administrateur (voir
 * /admin/verifications, `User.verifStatut`) — même règle que getAgencies(),
 * contrairement à getArtisans() qui est auto-déclaratif. Sert aussi de gate
 * pour savoir si la fonctionnalité doit apparaître ailleurs sur le site (bloc
 * fiche annonce, étape du tunnel Mon projet) : voir getVerifiedCourtierCount().
 */
export async function getVerifiedCourtiers(category?: string): Promise<CourtierSummary[]> {
  const courtiers = await prisma.user.findMany({
    where: {
      type: "COURTIER",
      verifStatut: "VERIFIEE",
      ...(category ? { categories: { contains: category } } : {}),
    },
    select: { id: true, nom: true, entreprise: true, ville: true, categories: true },
    // Alphabétique, jamais createdAt (favoriserait structurellement le
    // premier courtier inscrit) — même correctif que getAgencies()/getArtisansForVillage().
    orderBy: [{ entreprise: { sort: "asc", nulls: "last" } }, { nom: "asc" }],
  });

  return courtiers.map((c) => ({
    id: c.id,
    nom: c.nom,
    entreprise: c.entreprise,
    ville: c.ville,
    categories: c.categories ? c.categories.split(",").filter(Boolean) : [],
  }));
}

/**
 * Nombre de courtiers vérifiés, tous confondus — utilisé uniquement comme
 * gate d'affichage (le bloc « Besoin d'un financement ? » d'une fiche annonce
 * et l'étape correspondante du tunnel Mon projet ne doivent jamais apparaître
 * tant qu'aucun courtier n'est inscrit et vérifié).
 */
export async function getVerifiedCourtierCount(): Promise<number> {
  return prisma.user.count({ where: { type: "COURTIER", verifStatut: "VERIFIEE" } });
}

const COURTIER_PROFILE_SELECT = {
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
  verifStatut: true,
} as const;

export type CourtierProfile = {
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
  verified: boolean;
};

function toProfile(u: {
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
  categories: string | null;
  communesDesservies: string | null;
  createdAt: Date;
  verifStatut: string;
}): CourtierProfile {
  return {
    id: u.id,
    nom: u.nom,
    entreprise: u.entreprise,
    email: u.email,
    telephone: u.telephone,
    adresse: u.adresse,
    codePostal: u.codePostal,
    ville: u.ville,
    siteWeb: u.siteWeb,
    description: u.description,
    categories: u.categories ? u.categories.split(",").filter(Boolean) : [],
    communesDesservies: u.communesDesservies ? u.communesDesservies.split(",").filter(Boolean) : [],
    createdAt: u.createdAt,
    verified: u.verifStatut === "VERIFIEE",
  };
}

/** Fiche publique — 404 tant que le courtier n'est pas vérifié, comme les agences. */
export async function getCourtierById(id: string): Promise<CourtierProfile | null> {
  const c = await prisma.user.findFirst({
    where: { id, type: "COURTIER", verifStatut: "VERIFIEE" },
    select: COURTIER_PROFILE_SELECT,
  });
  return c ? toProfile(c) : null;
}

/** Variante sans le gate de vérification — pour que le courtier connecté voie toujours sa propre fiche (hub, onboarding). */
export async function getCourtierByIdOwner(id: string): Promise<CourtierProfile | null> {
  const c = await prisma.user.findFirst({
    where: { id, type: "COURTIER" },
    select: COURTIER_PROFILE_SELECT,
  });
  return c ? toProfile(c) : null;
}

export type CourtierProfileInput = {
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

export async function updateCourtierProfile(
  userId: string,
  input: CourtierProfileInput
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
