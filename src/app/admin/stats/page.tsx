import type { Metadata } from "next";
import Link from "next/link";
import { getEventStats, EVENT_LABELS } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistiques — entonnoir produit",
};

/** Étapes de l'entonnoir « demandeur » — sous-ensemble ordonné de EVENT_LABELS. */
const FUNNEL: { name: string; label: string }[] = [
  { name: "signup_completed", label: "Inscription" },
  { name: "saved_search_created", label: "Recherche sauvegardée" },
  { name: "favorite_added", label: "Favori ajouté" },
  { name: "visit_requested", label: "Demande de visite" },
];

export default async function AdminStatsPage() {
  const rows = await getEventStats();
  const byName = new Map(rows.map((r) => [r.name, r]));
  const labelFor = (name: string) => EVENT_LABELS.find((e) => e.name === name)?.label ?? name;

  const funnel = FUNNEL.map((step) => ({
    ...step,
    total: byName.get(step.name as never)?.total ?? 0,
  }));
  const funnelMax = Math.max(1, ...funnel.map((s) => s.total));

  return (
    <div className="animate-fade-up mx-auto max-w-[1100px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">Statistiques</h1>
      <Link href="/admin" className="text-[13px] font-semibold text-blue">
        ← Vue d&apos;ensemble
      </Link>

      <p className="mt-4 max-w-[70ch] text-[13px] leading-[1.6] text-muted">
        Entonnoir produit — évènements enregistrés côté serveur aux étapes clés du
        parcours. L&apos;audience (pages vues, référents, Web Vitals) est mesurée à
        part par Cloudflare Web Analytics. Les erreurs sont remontées à Sentry
        quand <code className="text-[12px]">SENTRY_DSN</code> est défini.
      </p>

      <section className="mt-8">
        <h2 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-muted">
          Entonnoir demandeur
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {funnel.map((step, i) => {
            const prev = i > 0 ? funnel[i - 1].total : null;
            const conv = prev && prev > 0 ? Math.round((step.total / prev) * 100) : null;
            return (
              <div key={step.name} className="flex items-center gap-3">
                <span className="w-52 shrink-0 text-[13px] text-ink">{step.label}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-surface">
                  <div
                    className="flex h-full items-center rounded-lg bg-blue px-2 text-[12px] font-semibold text-white"
                    style={{ width: `${Math.max((step.total / funnelMax) * 100, 6)}%` }}
                  >
                    {step.total}
                  </div>
                </div>
                <span className="w-16 shrink-0 text-right text-[12px] text-muted-2">
                  {conv != null ? `${conv}%` : ""}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-2">
          % = conversion depuis l&apos;étape précédente. Cumul depuis le début (pas
          une cohorte : un même utilisateur peut n&apos;avoir franchi qu&apos;une partie).
        </p>
      </section>

      <section className="mt-10">
        <h2 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-muted">
          Tous les évènements
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold text-muted">
                <th className="px-4 py-2.5">Évènement</th>
                <th className="px-4 py-2.5 text-right">7 j</th>
                <th className="px-4 py-2.5 text-right">30 j</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink">{labelFor(r.name)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink">{r.last7}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{r.last30}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-2">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
