"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { getVillageBySlug } from "@/data/villages";
import {
  createListing,
  updateListing,
  deleteListing,
  addListingPhotos,
  removeListingPhotos,
  getListingForEdit,
  type ListingFieldsInput,
} from "./listings";
import {
  pickPhotoFiles,
  validatePhotoFiles,
  savePhotoFiles,
  deletePhotoFilesByUrl,
  deleteListingUploadDir,
} from "./photo-upload";

export type ListingFormState = { error?: string };

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseListingFields(
  formData: FormData
): { error: string } | { fields: ListingFieldsInput } {
  const transaction = formData.get("transaction") === "LOCATION" ? "LOCATION" : "VENTE";
  const typeBienRaw = String(formData.get("typeBien") ?? "");
  const typeBien =
    typeBienRaw === "APPARTEMENT" || typeBienRaw === "TERRAIN" ? typeBienRaw : "MAISON";
  const villageSlug = String(formData.get("villageSlug") ?? "");
  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const exterieur = String(formData.get("exterieur") ?? "").trim();
  const dpe = String(formData.get("dpe") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const visiteVirtuelleUrl = String(formData.get("visiteVirtuelleUrl") ?? "").trim();

  const village = getVillageBySlug(villageSlug);
  if (!village) return { error: "Merci de choisir un village dans la liste." };
  if (!titre) return { error: "Merci d'indiquer un titre pour l'annonce." };
  if (!description) return { error: "Merci d'ajouter une courte description du bien." };
  if (videoUrl && !isValidHttpUrl(videoUrl)) {
    return { error: "Le lien vidéo doit être une URL valide (https://...)." };
  }
  if (visiteVirtuelleUrl && !isValidHttpUrl(visiteVirtuelleUrl)) {
    return { error: "Le lien de visite virtuelle doit être une URL valide (https://...)." };
  }

  const prix = parsePositiveInt(formData.get("prix"));
  const pieces = parsePositiveInt(formData.get("pieces"));
  const chambres = parsePositiveInt(formData.get("chambres"));
  const surface = parsePositiveInt(formData.get("surface"));

  if (!prix) return { error: "Le prix doit être un nombre positif." };
  if (!pieces) return { error: "Le nombre de pièces doit être un nombre positif." };
  if (!chambres) return { error: "Le nombre de chambres doit être un nombre positif." };
  if (!surface) return { error: "La surface doit être un nombre positif (en m²)." };

  return {
    fields: {
      transaction,
      typeBien,
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
      videoUrl: videoUrl || undefined,
      visiteVirtuelleUrl: visiteVirtuelleUrl || undefined,
    },
  };
}

export async function createListingAction(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion?next=/vendre/deposer");
  }

  const photoFiles = pickPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const parsed = parseListingFields(formData);
  if ("error" in parsed) return parsed;

  const listing = await createListing({ ownerId: session.userId, ...parsed.fields });

  if (photoFiles.length > 0) {
    const urls = await savePhotoFiles(listing.id, photoFiles);
    await addListingPhotos(listing.id, urls);
  }

  redirect(`/${parsed.fields.transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`);
}

export async function updateListingAction(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion");
  }

  const listingId = String(formData.get("listingId") ?? "");
  const existing = await getListingForEdit(listingId, session.userId);
  if (!existing) return { error: "Annonce introuvable." };

  const removePhotoIds = formData.getAll("removePhotoIds").map(String);
  const photoFiles = pickPhotoFiles(formData);
  const remainingExisting = existing.photos.length - removePhotoIds.length;
  const photoError = validatePhotoFiles(photoFiles, remainingExisting);
  if (photoError) return { error: photoError };

  const parsed = parseListingFields(formData);
  if ("error" in parsed) return parsed;

  await updateListing(listingId, session.userId, parsed.fields);

  if (removePhotoIds.length > 0) {
    const removed = await removeListingPhotos(removePhotoIds);
    await deletePhotoFilesByUrl(removed.map((p) => p.url));
  }
  if (photoFiles.length > 0) {
    const urls = await savePhotoFiles(listingId, photoFiles);
    await addListingPhotos(listingId, urls);
  }

  redirect(`/${parsed.fields.transaction === "VENTE" ? "acheter" : "louer"}/${listingId}`);
}

export async function deleteListingAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const listingId = String(formData.get("listingId") ?? "");
  const deleted = await deleteListing(listingId, session.userId);
  if (deleted) {
    await deleteListingUploadDir(listingId);
  }

  redirect("/compte");
}
