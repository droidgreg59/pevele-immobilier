import type { Metadata } from "next";
import Link from "next/link";
import { villages } from "@/data/villages";
import { getDvfStatsForAllVillages } from "@/lib/dvf";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prix de l'immobilier en Pévèle — Pévèle Immobilier",
  description:
    "Le prix moyen au m² dans les 19 communes de la Pévèle, à partir des transactions DVF (data.gouv.fr).",
};

export default async function PrixPage() {
  const stats = await getDvfStatsForAllVillages();
  const statsBySlug = new Map(stats.map((s) => [s.villageSlug, s]));
  const rows = villages
    .map((v) => ({ village: v, stats: statsBySlug.get(v.slug) ?? null }))
    .sort((a, b) => (b.stats?.avgPrixM2 ?? 0) - (a.stats?.avgPrixM2 ?? 0));

  const anneeMin = Math.min(...stats.map((s) => s.minAnnee).filter(Boolean));
  const anneeMax = Math.max(...stats.map((s) => s.maxAnnee).filter(Boolean));

  return (
    <div className="animate-view-in max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-blue">
          PRIX
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          PRIX DE L&apos;IMMOBILIER
        </h2>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR À L&apos;ACCUEIL
      </Link>

      <p className="mt-6 max-w-[70ch] font-sans text-[15px] leading-[1.6] text-muted">
        Prix moyen au m² constaté dans chaque village, calculé à partir des
        ventes de maisons et d&apos;appartements réellement enregistrées
        (DVF, {anneeMin}–{anneeMax}). L&apos;historique du prix propre à
        chaque annonce est visible directement sur sa fiche.
      </p>

      <div className="mt-7 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[560px] border-collapse font-mono text-[12.5px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left">
              <th className="px-4 py-3 font-medium text-muted">VILLAGE</th>
              <th className="px-4 py-3 font-medium text-muted">PRIX MOYEN / M²</th>
              <th className="px-4 py-3 font-medium text-muted">VENTES CONSTATÉES</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ village, stats: s }) => (
              <tr key={village.slug} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3">
                  <Link href={`/villages/${village.slug}`} className="font-semibold text-blue">
                    {village.nom}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink">
                  {s ? `${s.avgPrixM2.toLocaleString("fr-FR")} €` : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {s ? `${s.count} vente${s.count > 1 ? "s" : ""}` : "données insuffisantes"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 font-mono text-[10px] text-muted-2">
        Source : DVF (Demandes de valeurs foncières), data.gouv.fr / Etalab —
        ventes de maisons et appartements en un seul lot, hors valeurs
        atypiques.
      </p>
    </div>
  );
}
