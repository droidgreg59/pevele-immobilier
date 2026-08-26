import type { Metadata } from "next";
import Link from "next/link";
import { getAdminStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Super admin",
};

function Tile({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:shadow-md">
      <span className="font-display text-[28px] text-ink">{value}</span>
      <span className="text-[12.5px] font-medium text-muted">{label}</span>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="animate-fade-up mx-auto max-w-[1100px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">Vue d&apos;ensemble</h1>
      <Link href="/compte" className="text-[13px] font-semibold text-blue">
        ← Mon compte
      </Link>

      <div className="mt-7">
        <span className="text-[11px] font-semibold text-muted">Comptes ({stats.totalUsers})</span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Particuliers" value={stats.usersByType.PARTICULIER} href="/admin/comptes?type=PARTICULIER" />
          <Tile label="Agences" value={stats.usersByType.AGENCE} href="/admin/comptes?type=AGENCE" />
          <Tile label="Artisans" value={stats.usersByType.ARTISAN} href="/admin/comptes?type=ARTISAN" />
          <Tile label="Tous les comptes" value={stats.totalUsers} href="/admin/comptes" />
        </div>
      </div>

      <div className="mt-7">
        <span className="text-[11px] font-semibold text-muted">Annonces ({stats.totalListings})</span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile
            label="En attente de vérification"
            value={stats.listingsByStatut.EN_VERIFICATION}
            href="/admin/annonces"
          />
          <Tile label="Publiées" value={stats.listingsByStatut.PUBLIEE} href="/admin/annonces/toutes?statut=PUBLIEE" />
          <Tile label="Refusées" value={stats.listingsByStatut.REFUSEE} href="/admin/annonces/toutes?statut=REFUSEE" />
          <Tile label="Toutes les annonces" value={stats.totalListings} href="/admin/annonces/toutes" />
        </div>
      </div>

      <div className="mt-7">
        <span className="text-[11px] font-semibold text-muted">Avis Pévèle ({stats.totalReviews})</span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Avis reçus" value={stats.totalReviews} href="/admin/avis" />
          <Tile label="Avis officiels" value={stats.officialReviews} href="/admin/avis" />
        </div>
      </div>
    </div>
  );
}
