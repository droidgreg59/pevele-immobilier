"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { updateAgencyProfile, getAgencyById } from "./agencies";
import { lookupSiretDenomination } from "./agency-verification";
import { isValidSiret, normalizeSiret } from "./validation";
import { pickLogoFile, validateLogoFile, saveLogoFile, deleteLogoFile } from "./photo-upload";

export type AgencyProfileFormState = { error?: string };
export type AgencyVerificationFormState = { error?: string; success?: boolean };

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateAgencyProfileAction(
  _prevState: AgencyProfileFormState,
  formData: FormData
): Promise<AgencyProfileFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") {
    return { error: "Réservé aux comptes agence." };
  }

  const entreprise = String(formData.get("entreprise") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const adresse = String(formData.get("adresse") ?? "").trim();
  const codePostal = String(formData.get("codePostal") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const siteWeb = String(formData.get("siteWeb") ?? "").trim();
  const googleAvisUrl = String(formData.get("googleAvisUrl") ?? "").trim();

  if (!entreprise) {
    return { error: "Merci d'indiquer le nom de l'agence." };
  }
  if (siteWeb && !isValidHttpUrl(siteWeb)) {
    return { error: "Le site web doit être une URL valide (https://...)." };
  }
  if (googleAvisUrl && !isValidHttpUrl(googleAvisUrl)) {
    return { error: "Le lien Google avis doit être une URL valide (https://...)." };
  }

  const logoFile = pickLogoFile(formData);
  let logoUrl: string | undefined;
  if (logoFile) {
    const logoError = validateLogoFile(logoFile);
    if (logoError) return { error: logoError };
    const existing = await getAgencyById(session.userId);
    logoUrl = await saveLogoFile(session.userId, logoFile);
    await deleteLogoFile(existing?.logoUrl);
  }

  await updateAgencyProfile(session.userId, {
    entreprise,
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

  const siret = normalizeSiret(String(formData.get("siret") ?? ""));
  const carteProfessionnelle = String(formData.get("carteProfessionnelle") ?? "").trim();
  const carteProCci = String(formData.get("carteProCci") ?? "").trim();
  const zoneCouverte = String(formData.get("zoneCouverte") ?? "").trim();

  if (!isValidSiret(siret)) {
    return { error: "Le SIRET doit comporter 14 chiffres et une clé de contrôle valide." };
  }
  if (!carteProfessionnelle) {
    return { error: "Merci d'indiquer le numéro de votre carte professionnelle (carte T)." };
  }
  if (!carteProCci) {
    return { error: "Merci d'indiquer la CCI qui a délivré la carte." };
  }

  const siretDenomination = await lookupSiretDenomination(siret);

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      siret,
      carteProfessionnelle,
      carteProCci,
      zoneCouverte: zoneCouverte || null,
      siretDenomination,
      verifStatut: "EN_ATTENTE",
      verifSoumiseLe: new Date(),
      verifTraiteeLe: null,
      verifRaison: null,
    },
  });

  revalidatePath("/compte/agence");
  revalidatePath("/compte");
  return { success: true };
}
