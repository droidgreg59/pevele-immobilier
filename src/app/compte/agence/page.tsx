import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAgencyStats } from "@/lib/stats";
import { getVisitRequestsForOwner } from "@/lib/visits";
import { getPendingOpenHouseRegistrationsForOwner } from "@/lib/open-house";
import { getEstimationRequestsForAgency } from "@/lib/estimations";
import { getPendingMandateCount } from "@/lib/mandates";

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

export default async function CompteAgenceDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") redirect("/compte");

  const [stats, visitRequests, pendingOpenHouse, estimationRequests, pendingMandateCount] =
    await Promise.all([
      getAgencyStats(session.userId),
      getVisitRequestsForOwner(session.userId),
      getPendingOpenHouseRegistrationsForOwner(session.userId),
      getEstimationRequestsForAgency(session.userId),
      getPendingMandateCount(session.userId),
    ]);

  const visitesEnAttente = visitRequests.filter((v) => !v.traite).length;
  const estimationsEnAttente = estimationRequests.filter((e) => e.statut === "EN_ATTENTE").length;
  const aTraiter = visitesEnAttente + pendingOpenHouse.length + estimationsEnAttente + pendingMandateCount;

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
            value={String(visitesEnAttente)}
            label="Demandes de visite"
            href="/compte/agence/visites"
            accent={visitesEnAttente > 0}
          />
          <StatCard
            value={String(pendingOpenHouse.length)}
            label="Portes ouvertes"
            href="/compte/agence/portes-ouvertes"
            accent={pendingOpenHouse.length > 0}
          />
          <StatCard
            value={String(estimationsEnAttente)}
            label="Demandes d'estimation"
            href="/compte/agence/estimations"
            accent={estimationsEnAttente > 0}
          />
          <StatCard
            value={String(pendingMandateCount)}
            label="Recherches confiées"
            href="/compte/agence/clients"
            accent={pendingMandateCount > 0}
          />
        </div>
      </div>

      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Activité
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={String(stats.listings.publiees)} label="Annonces en ligne" href="/compte/agence/annonces" />
          <StatCard value={String(stats.mandates.acceptees)} label="Clients" href="/compte/agence/clients" />
          <StatCard
            value={stats.reviews.average != null ? `${stats.reviews.average}/5` : "—"}
            label={`Avis (${stats.reviews.count})`}
            href="/compte/agence/statistiques"
          />
          <StatCard
            value={
              stats.listings.prixMoyenVente != null
                ? `${stats.listings.prixMoyenVente.toLocaleString("fr-FR")} €`
                : "—"
            }
            label="Prix moyen (vente)"
            href="/compte/agence/statistiques"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface px-6 py-5">
        <span className="text-[15px] text-ink">Un nouveau bien à publier ?</span>
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
