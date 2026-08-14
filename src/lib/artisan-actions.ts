"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { updateArtisanProfile } from "./artisans";
import { artisanCategories } from "@/data/artisanCategories";
import { villages } from "@/data/villages";

export type ArtisanProfileFormState = { error?: string };

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateArtisanProfileAction(
  _prevState: ArtisanProfileFormState,
  formData: FormData
): Promise<ArtisanProfileFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/artisan");
  if (session.type !== "ARTISAN") {
    return { error: "Réservé aux comptes artisan." };
  }

  const entreprise = String(formData.get("entreprise") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const adresse = String(formData.get("adresse") ?? "").trim();
  const codePostal = String(formData.get("codePostal") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const siteWeb = String(formData.get("siteWeb") ?? "").trim();
  const categories = formData
    .getAll("categories")
    .map(String)
    .filter((c) => artisanCategories.includes(c));
  const communesDesservies = formData
    .getAll("communesDesservies")
    .map(String)
    .filter((slug) => villages.some((v) => v.slug === slug));

  if (!entreprise) {
    return { error: "Merci d'indiquer le nom de votre entreprise." };
  }
  if (categories.length === 0) {
    return { error: "Merci de choisir au moins une spécialité." };
  }
  if (siteWeb && !isValidHttpUrl(siteWeb)) {
    return { error: "Le site web doit être une URL valide (https://...)." };
  }

  await updateArtisanProfile(session.userId, {
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

  redirect(`/artisans/${session.userId}`);
}
