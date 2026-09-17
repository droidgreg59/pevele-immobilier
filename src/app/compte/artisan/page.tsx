import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDevisRequestsForArtisan } from "@/lib/devis";
import { getSavedSearchesByUser } from "@/lib/saved-searches";
import { getFavoriteCount } from "@/lib/favorites";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

function StatCard({
  value,
  label,
  href,
  accent = false,
}: {
  value: string;
  label: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
    >
      <span
        className="font-display text-[30px] leading-none"
        style={{ color: accent ? "var(--pvl-gold)" : "var(--pvl-blue)" }}
      >
        {value}
      </span>
      <span className="text-[12.5px] font-medium text-muted">{label}</span>
    </Link>
  );
}

export default async function CompteArtisanDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/artisan");
  if (session.type !== "ARTISAN") redirect("/compte");

  const [devisRequests, mesRecherches, favoriteCount] = await Promise.all([
    getDevisRequestsForArtisan(session.userId),
    getSavedSearchesByUser(session.userId),
    getFavoriteCount(session.userId),
  ]);

  const devisEnAttente = devisRequests.filter((d) => !d.traite).length;
  const totalNewMatches = mesRecherches.reduce((sum, s) => sum + s.newMatches, 0);
  const pendingProposals = mesRecherches.reduce(
    (sum, s) =>
      sum +
      s.mandates.reduce(
        (mSum, m) => mSum + m.proposals.filter((p) => p.statut === "PROPOSEE").length,
        0
      ),
    0
  );
  const aTraiter = devisEnAttente + totalNewMatches + pendingProposals;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="m-0 font-display text-[24px] text-ink">Tableau de bord</h2>
        <p className="m-0 mt-1 text-[14px] text-muted">
          {aTraiter > 0
            ? `${aTraiter} élément${aTraiter > 1 ? "s" : ""} à traiter en ce moment.`
            : "Rien en attente — tout est à jour."}
        </p>
      </div>

      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          À traiter
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            value={String(devisEnAttente)}
            label="Demandes de devis"
            href="/compte/artisan/devis"
            accent={devisEnAttente > 0}
          />
          <StatCard
            value={String(totalNewMatches)}
            label="Nouvelles annonces"
            href="/compte/artisan/recherches"
            accent={totalNewMatches > 0}
          />
          <StatCard
            value={String(pendingProposals)}
            label="Propositions d'agences"
            href="/compte/artisan/recherches"
            accent={pendingProposals > 0}
          />
        </div>
      </div>

      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Mon activité
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={String(devisRequests.length)} label="Devis reçus" href="/compte/artisan/devis" />
          <StatCard value={String(favoriteCount)} label="Favoris" href="/compte/favoris" />
          <StatCard
            value={String(mesRecherches.length)}
            label="Recherches sauvegardées"
            href="/compte/artisan/recherches"
          />
        </div>
      </div>
    </div>
  );
}
