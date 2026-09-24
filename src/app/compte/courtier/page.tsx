import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFinancingRequestsForCourtier } from "@/lib/financing";

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

export default async function CompteCourtierDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/courtier");
  if (session.type !== "COURTIER") redirect("/compte");

  const financingRequests = await getFinancingRequestsForCourtier(session.userId);
  const enAttente = financingRequests.filter((r) => !r.traite).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="m-0 font-display text-[24px] text-ink">Tableau de bord</h2>
        <p className="m-0 mt-1 text-[14px] text-muted">
          {enAttente > 0
            ? `${enAttente} demande${enAttente > 1 ? "s" : ""} de financement à traiter.`
            : "Rien en attente — tout est à jour."}
        </p>
      </div>

      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Mon activité
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            value={String(enAttente)}
            label="Demandes en attente"
            href="/compte/courtier/financements"
            accent={enAttente > 0}
          />
          <StatCard
            value={String(financingRequests.length)}
            label="Demandes reçues"
            href="/compte/courtier/financements"
          />
        </div>
      </div>
    </div>
  );
}
