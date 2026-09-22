import type { ComparateurSide } from "@/lib/comparateur";

const ROWS: { label: string; render: (s: ComparateurSide) => string }[] = [
  {
    label: "Prix médian maisons / m²",
    render: (s) => (s.stats ? `${s.stats.medianPrixM2.toLocaleString("fr-FR")} €` : "données insuffisantes"),
  },
  {
    label: "Prix moyen maisons / m²",
    render: (s) => (s.stats ? `${s.stats.avgPrixM2.toLocaleString("fr-FR")} €` : "—"),
  },
  {
    label: "Ventes retenues (DVF)",
    render: (s) =>
      s.stats
        ? `${s.stats.retainedCount} sur ${s.stats.count} recensées (${s.stats.minAnnee}–${s.stats.maxAnnee})`
        : "—",
  },
  {
    label: "Évolution de la médiane",
    render: (s) => (s.evolutionPct !== null ? `${s.evolutionPct > 0 ? "+" : ""}${s.evolutionPct} %` : "données insuffisantes"),
  },
  {
    label: "Gare SNCF recensée",
    render: (s) => (s.gares.length > 0 ? s.gares.join(", ") : "aucune"),
  },
  {
    label: "Écoles recensées",
    render: (s) => String(s.ecolesCount),
  },
  {
    label: "Commerces recensés",
    render: (s) => String(s.commercesCount),
  },
  {
    label: "Arrêts de bus recensés",
    render: (s) => String(s.arretsBus),
  },
];

/** Tableau de comparaison factuel — toutes les données viennent des fonctions dvf.ts / village-amenities déjà vérifiées, rien de recalculé ici. */
export default function ComparateurTable({ a, b }: { a: ComparateurSide; b: ComparateurSide }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-line bg-surface text-left">
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted"></th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{a.nom}</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{b.nom}</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{row.label}</td>
              <td className="px-4 py-3 text-ink">{row.render(a)}</td>
              <td className="px-4 py-3 text-ink">{row.render(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
