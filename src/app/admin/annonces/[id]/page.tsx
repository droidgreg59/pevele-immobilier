import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingForEditAsAdmin } from "@/lib/listings";
import { adminUpdateListingAction, adminDeleteListingAction } from "@/lib/admin-listings-actions";
import EditListingForm from "@/components/EditListingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier une annonce — Super admin",
};

export default async function AdminModifierAnnoncePage({
  params,
}: PageProps<"/admin/annonces/[id]">) {
  const { id } = await params;
  const listing = await getListingForEditAsAdmin(id);
  if (!listing) notFound();

  return (
    <div className="animate-fade-up mx-auto max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Modifier l&apos;annonce
      </h1>
      <div className="flex flex-wrap gap-4">
        <Link href="/admin/annonces/toutes" className="text-[13px] font-semibold text-blue">
          ← Toutes les annonces
        </Link>
        <Link
          href={`/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`}
          className="text-[13px] font-semibold text-blue"
        >
          Voir la fiche →
        </Link>
      </div>
      <p className="mt-4 max-w-[64ch] text-[13.5px] text-muted">
        Déposée par {listing.owner.entreprise ?? listing.owner.nom}.
      </p>

      <div className="mt-7">
        <EditListingForm
          listing={listing}
          updateAction={adminUpdateListingAction}
          deleteAction={adminDeleteListingAction}
        />
      </div>
    </div>
  );
}
