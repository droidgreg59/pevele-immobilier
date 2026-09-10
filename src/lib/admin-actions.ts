"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, publishListing, rejectListing } from "./admin";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { listingModeratedEmail } from "./email-templates";
import { logEvent } from "./events";

async function notifyOwnerOfModeration(id: string, accepted: boolean, raison?: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      titre: true,
      transaction: true,
      owner: { select: { email: true } },
    },
  });
  if (!listing) return;
  const { subject, html } = listingModeratedEmail({
    listingTitre: listing.titre,
    listingHref: `/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${id}`,
    accepted,
    raison,
  });
  await sendEmail({ to: listing.owner.email, subject, html });
}

export async function publishListingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("listingId") ?? "");
  if (!id) return;
  await publishListing(id);
  await notifyOwnerOfModeration(id, true);
  await logEvent("listing_published", { path: "/admin/annonces", meta: { listingId: id } });
  revalidatePath("/admin/annonces");
}

export async function rejectListingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("listingId") ?? "");
  if (!id) return;
  const raison = String(formData.get("raison") ?? "").trim();
  await rejectListing(id, raison);
  await notifyOwnerOfModeration(id, false, raison);
  revalidatePath("/admin/annonces");
}
