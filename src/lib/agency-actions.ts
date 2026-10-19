"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { updateAgencyProfile, getAgencyById, updateAgencyServiceAreas } from "./agencies";
import { lookupSiretDenomination } from "./agency-verification";
import { isValidSiret, normalizeSiret } from "./validation";
import { canManageServiceAreas } from "./agency-service-area";
import { logEvent } from "./events";
import { pickLogoFile, validateLogoFile, saveLogoFile, deleteLogoFile } from "./photo-upload";
import { normalizeUrl, isValidHttpUrl, isValidEmail } from "./validation";
import { normalizeReseau, mandataireDisplayName, reseauLogo } from "@/data/reseaux";

export type AgencyProfileFormState = { error?: string };
export type AgencyVerificationFormState = { error?: string; success?: boolean };
export type AgencyServiceAreasFormState = { error?: string; success?: boolean };

export async function updateAgencyProfileAction(
  _prevState: AgencyProfileFormState,
  formData: FormData
): Promise<AgencyProfileFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") {
    return { error: "Réservé aux comptes agence." };
  }

  const existing = await getAgencyById(session.userId);
  if (!existing) return { error: "Compte introuvable." };

  // Agence immobilière ou mandataire indépendant d'un réseau.
  const isMandataire = formData.get("proStatut") === "MANDATAIRE";
  const reseau = isMandataire
    ? normalizeReseau(
        String(formData.get("reseauChoice") ?? ""),
        String(formData.get("reseauAutre") ?? "")
      )
    : null;
  const prenom = String(formData.get("prenom") ?? existing.prenom ?? "").trim();
  const nom = String(formData.get("nom") ?? existing.nom).trim();
  const entreprise = isMandataire
    ? mandataireDisplayName(reseau ?? "", prenom, nom)
    : String(formData.get("entreprise") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const adresse = String(formData.get("adresse") ?? "").trim();
  const codePostal = String(formData.get("codePostal") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const siteWeb = normalizeUrl(String(formData.get("siteWeb") ?? ""));
  const googleAvisUrl = normalizeUrl(String(formData.get("googleAvisUrl") ?? ""));

  if (isMandataire && !reseau) {
    return { error: "Merci d'indiquer votre réseau de mandataires." };
  }
  if (isMandataire && !nom) {
    return { error: "Merci d'indiquer votre nom." };
  }
  if (!isMandataire && !entreprise) {
    return { error: "Merci d'indiquer le nom de l'agence." };
  }
  if (contactEmail && !isValidEmail(contactEmail)) {
    return { error: "L'email de contact doit être une adresse valide." };
  }
  if (siteWeb && !isValidHttpUrl(siteWeb)) {
    return { error: "Le site web doit être une URL valide (https://...)." };
  }
  if (googleAvisUrl && !isValidHttpUrl(googleAvisUrl)) {
    return { error: "Le lien Google avis doit être une URL valide (https://...)." };
  }

  // Logo : celui du réseau pour un mandataire (jamais téléversé), sinon le
  // fichier envoyé par l'agence. Un logo de réseau ne survit pas à un passage
  // en agence.
  const wasNetworkLogo = existing.logoUrl?.startsWith("/reseaux/") ?? false;
  let logoUrl: string | null | undefined;
  if (isMandataire) {
    logoUrl = reseauLogo(reseau);
    if (existing.logoUrl && !wasNetworkLogo && logoUrl !== existing.logoUrl) {
      await deleteLogoFile(existing.logoUrl);
    }
  } else {
    const logoFile = pickLogoFile(formData);
    if (logoFile) {
      const logoError = validateLogoFile(logoFile);
      if (logoError) return { error: logoError };
      logoUrl = await saveLogoFile(session.userId, logoFile);
      if (!wasNetworkLogo) await deleteLogoFile(existing.logoUrl);
    } else if (wasNetworkLogo) {
      logoUrl = null;
    }
  }

  // Agence ↔ mandataire : la base légale change (carte T / RSAC), la
  // vérification est à refaire.
  const statutChanged = Boolean(existing.reseau) !== isMandataire;

  await updateAgencyProfile(session.userId, {
    entreprise,
    reseau,
    ...(isMandataire ? { prenom, nom } : {}),
    resetVerification: statutChanged && existing.verifStatut !== "NON_SOUMISE",
    contactEmail,
    telephone,
    adresse,
    codePostal,
    ville,
    siteWeb,
    googleAvisUrl,
    logoUrl,
  });

  redirect(`/professionnels/${session.userId}`);
}

/**
 * L'agence soumet ses justificatifs de vérification (loi Hoguet) : SIRET,
 * numéro de carte professionnelle (carte T), CCI émettrice, zone couverte.
 * Un mandataire de réseau (agent commercial) n'a pas de carte T : SIRET et
 * ville du greffe de son immatriculation au RSAC à la place.
 * Le statut passe en EN_ATTENTE ; un administrateur valide ensuite depuis le
 * back-office. La raison sociale officielle est récupérée en best-effort.
 */
export async function submitAgencyVerificationAction(
  _prevState: AgencyVerificationFormState,
  formData: FormData
): Promise<AgencyVerificationFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") return { error: "Réservé aux comptes agence." };

  const account = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { reseau: true },
  });
  const isMandataire = Boolean(account?.reseau);

  const siret = normalizeSiret(String(formData.get("siret") ?? ""));
  const carteProfessionnelle = String(formData.get("carteProfessionnelle") ?? "").trim();
  const carteProCci = String(formData.get("carteProCci") ?? "").trim();
  const rsacVille = String(formData.get("rsacVille") ?? "").trim();
  const zoneCouverte = String(formData.get("zoneCouverte") ?? "").trim();

  if (!isValidSiret(siret)) {
    return { error: "Le SIRET doit comporter 14 chiffres et une clé de contrôle valide." };
  }
  if (isMandataire) {
    // Agent commercial : exerce sous la carte T de son réseau, immatriculé au RSAC.
    if (!rsacVille) {
      return { error: "Merci d'indiquer la ville du greffe où vous êtes immatriculé(e) au RSAC." };
    }
  } else {
    if (!carteProfessionnelle) {
      return { error: "Merci d'indiquer le numéro de votre carte professionnelle (carte T)." };
    }
    if (!carteProCci) {
      return { error: "Merci d'indiquer la CCI qui a délivré la carte." };
    }
  }

  const siretDenomination = await lookupSiretDenomination(siret);

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      siret,
      ...(isMandataire
        ? { rsacVille, carteProfessionnelle: null, carteProCci: null }
        : { carteProfessionnelle, carteProCci, rsacVille: null }),
      zoneCouverte: zoneCouverte || null,
      siretDenomination,
      verifStatut: "EN_ATTENTE",
      verifSoumiseLe: new Date(),
      verifTraiteeLe: null,
      verifRaison: null,
    },
  });

  await logEvent("agency_verification_submitted", {
    userId: session.userId,
    path: "/compte/agence",
  });

  revalidatePath("/compte/agence");
  revalidatePath("/compte");
  return { success: true };
}

/**
 * Remplace les zones d'intervention déclarées par l'agence connectée.
 * agencyId vient TOUJOURS de la session serveur, jamais d'un champ du
 * formulaire — canManageServiceAreas()/updateAgencyServiceAreas() (testées
 * sans base dans agency-service-area.test.ts) garantissent qu'on ne peut ni
 * usurper une autre agence, ni écrire un slug de commune inventé.
 */
export async function updateServiceAreasAction(
  _prevState: AgencyServiceAreasFormState,
  formData: FormData
): Promise<AgencyServiceAreasFormState> {
  const session = await getSession();
  if (!session || !canManageServiceAreas(session)) {
    return { error: "Réservé aux comptes agence." };
  }

  const villageSlugs = formData.getAll("villageSlugs").map(String);
  await updateAgencyServiceAreas(session.userId, villageSlugs);

  revalidatePath("/compte/agence");
  revalidatePath("/professionnels");
  return { success: true };
}
