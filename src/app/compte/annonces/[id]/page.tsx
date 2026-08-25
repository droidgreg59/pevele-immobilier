import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getListingForEdit } from "@/lib/listings";
import EditListingForm from "@/components/EditListingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier mon annonce",
};

export default async function ModifierAnnoncePage({
  params,
}: PageProps<"/compte/annonces/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/connexion?next=/compte/annonces/${id}`);

  const listing = await getListingForEdit(id, session.userId);
  if (!listing) notFound();

  return (
    <div className="animate-fade-up max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Modifier l&apos;annonce
      </h1>
      <div className="flex flex-wrap gap-4">
        <Link href="/compte" className="text-[13px] font-semibold text-blue">
          ← Mon compte
        </Link>
        <Link
          href={`/${listing.transaction === "VENTE" ? "acheter" : "louer"}/${listing.id}`}
          className="text-[13px] font-semibold text-blue"
        >
          Voir la fiche →
        </Link>
      </div>

      <div className="mt-7">
        <EditListingForm listing={listing} />
      </div>
    </div>
  );
}
