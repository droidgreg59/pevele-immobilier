"use client";

import { adminDeleteListingAction } from "@/lib/admin-listings-actions";

export default function DeleteListingButton({ listingId, titre }: { listingId: string; titre: string }) {
  return (
    <form
      action={adminDeleteListingAction}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer définitivement « ${titre} » ?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="listingId" value={listingId} />
      <button type="submit" className="text-[12.5px] font-semibold text-muted hover:text-ink">
        Supprimer
      </button>
    </form>
  );
}
