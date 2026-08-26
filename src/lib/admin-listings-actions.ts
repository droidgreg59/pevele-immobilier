"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin";
import {
  adminUpdateListing,
  adminDeleteListing,
  getListingForEditAsAdmin,
  addListingPhotos,
  removeListingPhotos,
} from "./listings";
import { parseListingFields } from "./listing-fields";
import {
  pickPhotoFiles,
  validatePhotoFiles,
  savePhotoFiles,
  deletePhotoFilesByUrl,
  deleteListingUploadDir,
} from "./photo-upload";
import type { ListingFormState } from "./listing-actions";

export async function adminUpdateListingAction(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "");
  const existing = await getListingForEditAsAdmin(listingId);
  if (!existing) return { error: "Annonce introuvable." };

  const removePhotoIds = formData.getAll("removePhotoIds").map(String);
  const photoFiles = pickPhotoFiles(formData);
  const remainingExisting = existing.photos.length - removePhotoIds.length;
  const photoError = validatePhotoFiles(photoFiles, remainingExisting);
  if (photoError) return { error: photoError };

  const parsed = parseListingFields(formData);
  if ("error" in parsed) return parsed;

  await adminUpdateListing(listingId, parsed.fields);

  if (removePhotoIds.length > 0) {
    const removed = await removeListingPhotos(removePhotoIds);
    await deletePhotoFilesByUrl(removed.map((p) => p.url));
  }
  if (photoFiles.length > 0) {
    const urls = await savePhotoFiles(listingId, photoFiles);
    await addListingPhotos(listingId, urls);
  }

  revalidatePath("/admin/annonces/toutes");
  redirect("/admin/annonces/toutes");
}

export async function adminDeleteListingAction(formData: FormData) {
  await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "");
  const deleted = await adminDeleteListing(listingId);
  if (deleted) {
    await deleteListingUploadDir(listingId);
  }

  revalidatePath("/admin/annonces/toutes");
  redirect("/admin/annonces/toutes");
}
