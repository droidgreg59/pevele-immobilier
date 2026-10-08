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
  markManualOverrides,
  clearManualOverrides,
} from "./listings";
import { PHOTOS_FIELD } from "./import-overrides";
import { isUserAdmin } from "./admin";
import { parseListingFields } from "./listing-fields";
import { logEvent } from "./events";
import {
  commitStagedPhotos,
  deletePhotoFilesByUrl,
  deleteListingUploadDir,
} from "./photo-upload";
import { validateStagedKeys } from "./photo-keys";
import { maxPhotosFor } from "./photo-constants";

/** Clés des photos en attente soumises avec le formulaire (voir stagePhotoAction). */
function pickStagedKeys(formData: FormData): string[] {
  return formData.getAll("photoKeys").map(String).filter(Boolean);
}

const PHOTOS_PENDING_ERROR = "Les photos sont encore en cours d'envoi : patientez quelques secondes puis réessayez.";

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

  if (formData.get("photosPending")) return { error: PHOTOS_PENDING_ERROR };
  const photoKeys = pickStagedKeys(formData);
  const photoError = validateStagedKeys(photoKeys, session.userId, 0, maxPhotosFor(session.type));
  if (photoError) return { error: photoError };

  const parsed = parseListingFields(formData);
  if ("error" in parsed) return parsed;

  const listing = await createListing({ ownerId: session.userId, ...parsed.fields });

  if (photoKeys.length > 0) {
    const urls = await commitStagedPhotos(listing.id, photoKeys);
    await addListingPhotos(listing.id, urls);
  }

  await logEvent("listing_submitted", {
    userId: session.userId,
    path: "/vendre/deposer",
    meta: {
      transaction: parsed.fields.transaction,
      typeBien: parsed.fields.typeBien,
      commune: parsed.fields.villageSlug,
      photos: photoKeys.length,
    },
  });

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

  if (formData.get("photosPending")) return { error: PHOTOS_PENDING_ERROR };
  const removePhotoIds = formData.getAll("removePhotoIds").map(String);
  const photoKeys = pickStagedKeys(formData);
  const remainingExisting = existing.photos.length - removePhotoIds.length;
  const photoError = validateStagedKeys(photoKeys, session.userId, remainingExisting, maxPhotosFor(session.type));
  if (photoError) return { error: photoError };

  const parsed = parseListingFields(formData);
  if ("error" in parsed) return parsed;

  await updateListing(listingId, session.userId, parsed.fields);

  if (removePhotoIds.length > 0) {
    const removed = await removeListingPhotos(removePhotoIds);
    await deletePhotoFilesByUrl(removed.map((p) => p.url));
  }
  if (photoKeys.length > 0) {
    const urls = await commitStagedPhotos(listingId, photoKeys);
    await addListingPhotos(listingId, urls);
  }
  if (removePhotoIds.length > 0 || photoKeys.length > 0) {
    await markManualOverrides(listingId, [PHOTOS_FIELD]);
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

/** « Rétablir la synchronisation » : l'annonce importée reprend tous ses champs du flux au prochain passage. */
export async function resetImportOverridesAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const listingId = String(formData.get("listingId") ?? "");
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, importSource: true },
  });
  const allowed =
    listing?.importSource &&
    (listing.ownerId === session.userId || (await isUserAdmin(session.userId)));
  if (allowed) await clearManualOverrides(listingId);

  redirect(`/compte/annonces/${listingId}`);
}
