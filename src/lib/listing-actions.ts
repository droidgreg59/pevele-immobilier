"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import {
  createListing,
  updateListing,
  deleteListing,
  addListingPhotos,
  removeListingPhotos,
  getListingForEdit,
} from "./listings";
import { parseListingFields } from "./listing-fields";
import {
  pickPhotoFiles,
  validatePhotoFiles,
  savePhotoFiles,
  deletePhotoFilesByUrl,
  deleteListingUploadDir,
} from "./photo-upload";

export type ListingFormState = { error?: string };

export async function createListingAction(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion?next=/vendre/deposer");
  }

  const author = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { emailVerifiedAt: true },
  });
  if (!author?.emailVerifiedAt) {
    return {
      error:
        "Vérifiez votre adresse email avant de publier une annonce. Un lien de confirmation vous a été envoyé — regardez aussi vos spams, ou renvoyez-le depuis « Mon compte ».",
    };
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
