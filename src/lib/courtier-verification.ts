import "server-only";
import { prisma } from "./prisma";
import type { AgencyVerificationStatus } from "@prisma/client";

export type CourtierVerification = {
  siret: string | null;
  orias: string | null;
  zoneCouverte: string | null;
  siretDenomination: string | null;
  verifStatut: AgencyVerificationStatus;
  verifSoumiseLe: Date | null;
  verifTraiteeLe: Date | null;
  verifRaison: string | null;
};

const VERIF_SELECT = {
  siret: true,
  orias: true,
  zoneCouverte: true,
  siretDenomination: true,
  verifStatut: true,
  verifSoumiseLe: true,
  verifTraiteeLe: true,
  verifRaison: true,
} as const;

export async function getCourtierVerification(
  userId: string
): Promise<CourtierVerification | null> {
  return prisma.user.findFirst({
    where: { id: userId, type: "COURTIER" },
    select: VERIF_SELECT,
  });
}

export type PendingCourtierVerification = {
  id: string;
  nom: string;
  entreprise: string | null;
  email: string;
  siret: string | null;
  siretDenomination: string | null;
  orias: string | null;
  zoneCouverte: string | null;
  verifSoumiseLe: Date | null;
};

export async function getPendingCourtierVerifications(): Promise<PendingCourtierVerification[]> {
  return prisma.user.findMany({
    where: { type: "COURTIER", verifStatut: "EN_ATTENTE" },
    orderBy: { verifSoumiseLe: "asc" },
    select: {
      id: true,
      nom: true,
      entreprise: true,
      email: true,
      siret: true,
      siretDenomination: true,
      orias: true,
      zoneCouverte: true,
      verifSoumiseLe: true,
    },
  });
}

export type UnsubmittedCourtier = {
  id: string;
  nom: string;
  entreprise: string | null;
  email: string;
  telephone: string | null;
  createdAt: Date;
};

/**
 * Courtiers inscrits mais qui n'ont pas (encore) soumis ORIAS/SIRET depuis
 * /compte/courtier/profil — même logique que getUnsubmittedAgencies() : sans
 * cette liste, ils resteraient invisibles pour l'admin (le badge « en
 * attente » ne portant que sur EN_ATTENTE) sans aucune action possible.
 */
export async function getUnsubmittedCourtiers(): Promise<UnsubmittedCourtier[]> {
  return prisma.user.findMany({
    where: { type: "COURTIER", verifStatut: "NON_SOUMISE" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nom: true,
      entreprise: true,
      email: true,
      telephone: true,
      createdAt: true,
    },
  });
}

/** Nombre total de courtiers nécessitant une action admin (soumis ou non). */
export async function getPendingCourtierVerificationCount(): Promise<number> {
  return prisma.user.count({
    where: { type: "COURTIER", verifStatut: { in: ["EN_ATTENTE", "NON_SOUMISE"] } },
  });
}
