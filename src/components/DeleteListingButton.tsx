"use client";

import { adminDeleteListingAction } from "@/lib/admin-listings-actions";

export default function DeleteListingButton({
  listingId,
  titre,
  imported = false,
}: {
  listingId: string;
  titre: string;
  /** Annonce de flux : masquée plutôt qu'effacée, pour que la synchro ne la recrée pas. */
  imported?: boolean;
}) {
  return (
    <form
      action={adminDeleteListingAction}
      onSubmit={(e) => {
        const question = imported
          ? `Retirer « ${titre} » du site ? Annonce importée : elle ne sera plus reprise du flux.`
          : `Supprimer définitivement « ${titre} » ?`;
        if (!window.confirm(question)) {
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
