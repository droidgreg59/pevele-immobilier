"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { updateAgencyProfile, getAgencyById } from "./agencies";
import { pickLogoFile, validateLogoFile, saveLogoFile, deleteLogoFile } from "./photo-upload";

export type AgencyProfileFormState = { error?: string };

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
