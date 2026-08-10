"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { getVillageBySlug } from "@/data/villages";
import { createListing } from "./listings";

export type ListingFormState = { error?: string };

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function createListingAction(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion?next=/vendre/deposer");
  }

  const transaction = formData.get("transaction") === "LOCATION" ? "LOCATION" : "VENTE";
  const villageSlug = String(formData.get("villageSlug") ?? "");
  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const exterieur = String(formData.get("exterieur") ?? "").trim();
  const dpe = String(formData.get("dpe") ?? "").trim();

  const village = getVillageBySlug(villageSlug);
  if (!village) return { error: "Merci de choisir un village dans la liste." };
  if (!titre) return { error: "Merci d'indiquer un titre pour l'annonce." };
  if (!description) return { error: "Merci d'ajouter une courte description du bien." };

  const prix = parsePositiveInt(formData.get("prix"));
  const pieces = parsePositiveInt(formData.get("pieces"));
  const chambres = parsePositiveInt(formData.get("chambres"));
  const surface = parsePositiveInt(formData.get("surface"));

  if (!prix) return { error: "Le prix doit être un nombre positif." };
  if (!pieces) return { error: "Le nombre de pièces doit être un nombre positif." };
  if (!chambres) return { error: "Le nombre de chambres doit être un nombre positif." };
  if (!surface) return { error: "La surface doit être un nombre positif (en m²)." };

  const listing = await createListing({
    ownerId: session.userId,
    transaction,
    titre,
    description,
    prix,
    villageSlug: village.slug,
    commune: village.nom,
    pieces,
    chambres,
    surface,
    exterieur: exterieur || "—",
    dpe: dpe || undefined,
  });

  redirect(`/${transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`);
}
