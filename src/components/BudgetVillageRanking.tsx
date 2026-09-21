import Link from "next/link";

export type VillageBudgetRow = {
  slug: string;
  nom: string;
  pct: number;
  count: number;
  totalRetained: number;
  medianSurface: number | null;
  medianTerrain: number | null;
};

/**
 * Classement des communes à UN budget donné (une ligne par commune, pas par
 * palier) — distinct de BudgetBracketTable, qui montre les 5 paliers pour un
 * seul périmètre. Utilisé par le guide budget pour « communes accessibles à
 * 300 000 € ». Ne montre que les communes dont l'échantillon global est
 * suffisant (filtré par la page appelante, voir getBudgetBracketStatsForVillage).
 */
export default function BudgetVillageRanking({ rows, budget }: { rows: VillageBudgetRow[]; budget: number }) {
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-line bg-surface text-left">
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Commune</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Part des ventes ≤ {budget.toLocaleString("fr-FR")} €
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Surface médiane
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Terrain médian
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.slug} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3">
                <Link href={`/prix/${r.slug}`} className="font-semibold text-blue">
                  {r.nom}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink">
                {r.pct.toLocaleString("fr-FR")} % ({r.count} sur {r.totalRetained})
              </td>
              <td className="px-4 py-3 text-muted">
                {r.medianSurface !== null ? `${r.medianSurface} m²` : "données insuffisantes"}
              </td>
              <td className="px-4 py-3 text-muted">
                {r.medianTerrain !== null ? `${r.medianTerrain} m²` : "données insuffisantes"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
