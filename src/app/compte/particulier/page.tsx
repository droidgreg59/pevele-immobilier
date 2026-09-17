import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getListingsByUser } from "@/lib/listings";
import { getFavoriteCount } from "@/lib/favorites";
import { getSavedSearchesByUser } from "@/lib/saved-searches";
import { getVisitRequestsForOwner } from "@/lib/visits";
import { getPendingOpenHouseRegistrationsForOwner } from "@/lib/open-house";

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

export default async function CompteParticulierDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/particulier");
  if (session.type !== "PARTICULIER") redirect("/compte");

  const [listings, favoriteCount, mesRecherches, visitRequests, pendingOpenHouse] = await Promise.all([
    getListingsByUser(session.userId),
    getFavoriteCount(session.userId),
    getSavedSearchesByUser(session.userId),
    getVisitRequestsForOwner(session.userId),
    getPendingOpenHouseRegistrationsForOwner(session.userId),
  ]);

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
  const visitesEnAttente = visitRequests.filter((v) => !v.traite).length;
  const estVendeur = listings.length > 0;
  const aTraiter = totalNewMatches + pendingProposals + visitesEnAttente + pendingOpenHouse.length;

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
            value={String(totalNewMatches)}
            label="Nouvelles annonces"
            href="/compte/particulier/recherches"
            accent={totalNewMatches > 0}
          />
          <StatCard
            value={String(pendingProposals)}
            label="Propositions d'agences"
            href="/compte/particulier/recherches"
            accent={pendingProposals > 0}
          />
          {estVendeur ? (
            <>
              <StatCard
                value={String(visitesEnAttente)}
                label="Demandes de visite"
                href="/compte/particulier/demandes"
                accent={visitesEnAttente > 0}
              />
              <StatCard
                value={String(pendingOpenHouse.length)}
                label="Portes ouvertes"
                href="/compte/particulier/demandes"
                accent={pendingOpenHouse.length > 0}
              />
            </>
          ) : null}
        </div>
      </div>

      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Mon activité
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={String(favoriteCount)} label="Favoris" href="/compte/favoris" />
          <StatCard
            value={String(mesRecherches.length)}
            label="Recherches sauvegardées"
            href="/compte/particulier/recherches"
          />
          {estVendeur ? (
            <StatCard
              value={String(listings.length)}
              label="Mes annonces"
              href="/compte/particulier/annonces"
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface px-6 py-5">
        <span className="text-[15px] text-ink">
          {estVendeur ? "Un nouveau bien à publier ?" : "Prêt à publier votre premier bien ?"}
        </span>
        <Link
          href="/vendre/deposer"
          className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          + Déposer une annonce
        </Link>
      </div>
    </div>
  );
}
