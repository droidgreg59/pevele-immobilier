import "server-only";
import { prisma } from "./prisma";
import type { AgencyVerificationStatus } from "@prisma/client";

export type AgencyVerification = {
  siret: string | null;
  carteProfessionnelle: string | null;
  carteProCci: string | null;
  zoneCouverte: string | null;
  siretDenomination: string | null;
  verifStatut: AgencyVerificationStatus;
  verifSoumiseLe: Date | null;
  verifTraiteeLe: Date | null;
  verifRaison: string | null;
};

const VERIF_SELECT = {
  siret: true,
  carteProfessionnelle: true,
  carteProCci: true,
  zoneCouverte: true,
  siretDenomination: true,
  verifStatut: true,
  verifSoumiseLe: true,
  verifTraiteeLe: true,
  verifRaison: true,
} as const;

export async function getAgencyVerification(
  userId: string
): Promise<AgencyVerification | null> {
  return prisma.user.findFirst({
    where: { id: userId, type: "AGENCE" },
    select: VERIF_SELECT,
  });
}

/**
 * Raison sociale officielle d'un établissement à partir de son SIRET, via
 * l'API ouverte recherche-entreprises.api.gouv.fr. Best-effort : renvoie
 * `null` si l'API est indisponible ou ne trouve rien — ne bloque jamais la
 * soumission, l'admin vérifie ensuite à la main.
 */
export async function lookupSiretDenomination(siret: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&page=1&per_page=1`,
      { signal: AbortSignal.timeout(6000), headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { nom_complet?: string; nom_raison_sociale?: string; siege?: { siret?: string } }[];
    };
    const hit = data.results?.[0];
    if (!hit) return null;
    return hit.nom_complet || hit.nom_raison_sociale || null;
  } catch {
    return null;
  }
}

export type PendingVerification = {
  id: string;
  nom: string;
  entreprise: string | null;
  email: string;
  siret: string | null;
  siretDenomination: string | null;
  carteProfessionnelle: string | null;
  carteProCci: string | null;
  zoneCouverte: string | null;
  verifSoumiseLe: Date | null;
};

export async function getPendingVerifications(): Promise<PendingVerification[]> {
  return prisma.user.findMany({
    where: { type: "AGENCE", verifStatut: "EN_ATTENTE" },
    orderBy: { verifSoumiseLe: "asc" },
    select: {
      id: true,
      nom: true,
      entreprise: true,
      email: true,
      siret: true,
      siretDenomination: true,
      carteProfessionnelle: true,
      carteProCci: true,
      zoneCouverte: true,
      verifSoumiseLe: true,
    },
  });
}

export async function getPendingVerificationCount(): Promise<number> {
  return prisma.user.count({ where: { type: "AGENCE", verifStatut: "EN_ATTENTE" } });
}
