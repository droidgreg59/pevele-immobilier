import type { BudgetBracketStat } from "@/lib/budget-brackets";

/** Tableau des paliers de budget (une ligne par budget) — voir src/lib/budget-brackets.ts. */
export default function BudgetBracketTable({ rows }: { rows: BudgetBracketStat[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-line bg-surface text-left">
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Budget</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Part des ventes ≤ budget
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Surface médiane
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Prix médian
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.budget} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3 font-semibold text-ink">{r.budget.toLocaleString("fr-FR")} €</td>
              <td className="px-4 py-3 text-ink">
                {r.pct.toLocaleString("fr-FR")} % ({r.count} sur {r.totalRetained})
              </td>
              <td className="px-4 py-3 text-muted">
                {r.medianSurface !== null ? `${r.medianSurface} m²` : "données insuffisantes"}
              </td>
              <td className="px-4 py-3 text-muted">
                {r.medianPrix !== null ? `${r.medianPrix.toLocaleString("fr-FR")} €` : "données insuffisantes"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
