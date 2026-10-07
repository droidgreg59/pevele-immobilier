"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin";
import { prisma } from "./prisma";
import {
  adminUpdateListing,
  adminDeleteListing,
  getListingForEditAsAdmin,
  addListingPhotos,
  removeListingPhotos,
} from "./listings";
import { parseListingFields } from "./listing-fields";
import { validateStagedKeys } from "./photo-keys";
import { maxPhotosFor } from "./photo-constants";
import {
  commitStagedPhotos,
  deletePhotoFilesByUrl,
  deleteListingUploadDir,
} from "./photo-upload";
import type { ListingFormState } from "./listing-actions";

export async function adminUpdateListingAction(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const admin = await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "");
  const existing = await getListingForEditAsAdmin(listingId);
  if (!existing) return { error: "Annonce introuvable." };

  if (formData.get("photosPending")) {
    return { error: "Les photos sont encore en cours d'envoi : patientez quelques secondes puis réessayez." };
  }
  const removePhotoIds = formData.getAll("removePhotoIds").map(String);
  // Photos mises en attente par l'admin connecté ; limite selon le compte propriétaire.
  const photoKeys = formData.getAll("photoKeys").map(String).filter(Boolean);
  const remainingExisting = existing.photos.length - removePhotoIds.length;
  const photoError = validateStagedKeys(photoKeys, admin.userId, remainingExisting, maxPhotosFor(existing.owner.type));
  if (photoError) return { error: photoError };

  const parsed = parseListingFields(formData);
  if ("error" in parsed) return parsed;

  await adminUpdateListing(listingId, parsed.fields);

  if (removePhotoIds.length > 0) {
    const removed = await removeListingPhotos(removePhotoIds);
    await deletePhotoFilesByUrl(removed.map((p) => p.url));
  }
  if (photoKeys.length > 0) {
    const urls = await commitStagedPhotos(listingId, photoKeys);
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

/**
 * Masque une annonce publiée (RETIREE + hiddenByAdminAt) : disparaît du site,
 * et la synchro du flux ne la republie pas. Historisé comme un retrait dans
 * ListingLifecycleEvent, comme n'importe quel autre retrait.
 */
export async function hideListingAction(formData: FormData) {
  await requireAdmin();
  const listingId = String(formData.get("listingId") ?? "");
  const now = new Date();
  const { count } = await prisma.listing.updateMany({
    where: { id: listingId, statut: "PUBLIEE" },
    data: { statut: "RETIREE", retiredAt: now, hiddenByAdminAt: now },
  });
  if (count > 0) {
    await prisma.listingLifecycleEvent.create({ data: { listingId, type: "RETIRED" } });
  }
  revalidatePath("/admin/annonces/toutes");
  redirect("/admin/annonces/toutes");
}

export async function unhideListingAction(formData: FormData) {
  await requireAdmin();
  const listingId = String(formData.get("listingId") ?? "");
  const { count } = await prisma.listing.updateMany({
    where: { id: listingId, hiddenByAdminAt: { not: null } },
    data: { statut: "PUBLIEE", retiredAt: null, hiddenByAdminAt: null },
  });
  if (count > 0) {
    await prisma.listingLifecycleEvent.create({ data: { listingId, type: "REPUBLISHED" } });
  }
  revalidatePath("/admin/annonces/toutes");
  redirect("/admin/annonces/toutes");
}
