"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, publishListing, rejectListing } from "./admin";

export async function publishListingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("listingId") ?? "");
  if (!id) return;
  await publishListing(id);
  revalidatePath("/admin/annonces");
}

export async function rejectListingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("listingId") ?? "");
  if (!id) return;
  const raison = String(formData.get("raison") ?? "").trim();
  await rejectListing(id, raison);
  revalidatePath("/admin/annonces");
}
