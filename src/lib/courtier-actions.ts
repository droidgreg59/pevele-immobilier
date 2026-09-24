"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { updateCourtierProfile } from "./courtiers";
import { lookupSiretDenomination } from "./agency-verification";
import { courtierSpecialites } from "@/data/courtierSpecialites";
import { villages } from "@/data/villages";
import { normalizeUrl, isValidHttpUrl, isValidSiret, normalizeSiret, isValidOrias, normalizeOrias } from "./validation";
import { logEvent } from "./events";

export type CourtierProfileFormState = { error?: string };
export type CourtierVerificationFormState = { error?: string; success?: boolean };

export async function updateCourtierProfileAction(
  _prevState: CourtierProfileFormState,
  formData: FormData
): Promise<CourtierProfileFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/courtier/profil");
  if (session.type !== "COURTIER") {
    return { error: "Réservé aux comptes courtier." };
  }

  const entreprise = String(formData.get("entreprise") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const adresse = String(formData.get("adresse") ?? "").trim();
  const codePostal = String(formData.get("codePostal") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const siteWeb = normalizeUrl(String(formData.get("siteWeb") ?? ""));
  const categories = formData
    .getAll("categories")
    .map(String)
    .filter((c) => courtierSpecialites.includes(c));
  const communesDesservies = formData
    .getAll("communesDesservies")
    .map(String)
    .filter((slug) => villages.some((v) => v.slug === slug));

  if (!entreprise) {
    return { error: "Merci d'indiquer le nom de votre société de courtage." };
  }
  if (categories.length === 0) {
    return { error: "Merci de choisir au moins une spécialité." };
  }
  if (siteWeb && !isValidHttpUrl(siteWeb)) {
    return { error: "Le site web doit être une URL valide (https://...)." };
  }

  await updateCourtierProfile(session.userId, {
    entreprise,
    description,
    categories,
    communesDesservies,
    telephone,
    adresse,
    codePostal,
    ville,
    siteWeb,
  });

  // Contrairement à /artisans/[id] (auto-déclaratif, jamais gaté), la fiche
  // publique /courtiers/[id] exige verifStatut VERIFIEE (voir getCourtierById)
  // — rediriger vers la fiche publique juste après l'onboarding renverrait
  // un 404 tant que l'ORIAS n'est pas vérifié. On renvoie donc vers la page
  // de profil (qui porte aussi la carte de vérification).
  redirect("/compte/courtier/profil");
}

/**
 * Le courtier soumet ses justificatifs de vérification : numéro ORIAS
 * (obligatoire pour exercer en tant qu'IOBSP) + SIRET facultatif. Le statut
 * passe en EN_ATTENTE ; un administrateur valide ensuite depuis le
 * back-office — même flux que submitAgencyVerificationAction (loi Hoguet).
 */
export async function submitCourtierVerificationAction(
  _prevState: CourtierVerificationFormState,
  formData: FormData
): Promise<CourtierVerificationFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/courtier");
  if (session.type !== "COURTIER") return { error: "Réservé aux comptes courtier." };

  const orias = normalizeOrias(String(formData.get("orias") ?? ""));
  const siretRaw = String(formData.get("siret") ?? "").trim();
  const siret = siretRaw ? normalizeSiret(siretRaw) : "";
  const zoneCouverte = String(formData.get("zoneCouverte") ?? "").trim();

  if (!isValidOrias(orias)) {
    return { error: "Le numéro ORIAS doit comporter entre 5 et 10 chiffres." };
  }
  if (siret && !isValidSiret(siret)) {
    return { error: "Le SIRET doit comporter 14 chiffres et une clé de contrôle valide." };
  }

  const siretDenomination = siret ? await lookupSiretDenomination(siret) : null;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      orias,
      siret: siret || null,
      zoneCouverte: zoneCouverte || null,
      siretDenomination,
      verifStatut: "EN_ATTENTE",
      verifSoumiseLe: new Date(),
      verifTraiteeLe: null,
      verifRaison: null,
    },
  });

  await logEvent("courtier_verification_submitted", {
    userId: session.userId,
    path: "/compte/courtier",
  });

  revalidatePath("/compte/courtier");
  revalidatePath("/compte");
  return { success: true };
}
