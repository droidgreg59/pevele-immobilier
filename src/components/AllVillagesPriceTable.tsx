import Link from "next/link";

export type VillagePriceRow = {
  slug: string;
  nom: string;
  medianPrixM2: number;
  retainedCount: number;
};

/**
 * Tableau des communes triées par prix médian des maisons au m² (décroissant).
 * Données injectées par la page appelante (jamais recalculées côté client) —
 * voir getDvfMedianMaisonForAllVillages() dans src/lib/dvf.ts.
 */
export default function AllVillagesPriceTable({ rows }: { rows: VillagePriceRow[] }) {
  const sorted = [...rows].sort((a, b) => b.medianPrixM2 - a.medianPrixM2);

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-line bg-surface text-left">
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Commune</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Prix médian / m² (maisons)
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Ventes retenues
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
              <td className="px-4 py-3 text-ink">{r.medianPrixM2.toLocaleString("fr-FR")} €</td>
              <td className="px-4 py-3 text-muted">
                {r.retainedCount} vente{r.retainedCount > 1 ? "s" : ""} ·{" "}
                <Link href={`/villages/${r.slug}`} className="text-blue">
                  fiche village
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
