import type { Metadata } from "next";
import Link from "next/link";
import { villages } from "@/data/villages";
import { getDvfMarketStatsPevele, getDvfMedianMaisonForAllVillages } from "@/lib/dvf";
import { getCronLastRun } from "@/lib/freshness";
import MarketSummary from "@/components/MarketSummary";

// Page de contenu (DVF, données quasi statiques) : rendu ISR. Le cache des
// lectures DVF est invalidé par le cron d'import (`revalidateTag("dvf")`).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Observatoire des prix immobiliers en Pévèle",
  description:
    "Le prix médian au m² dans chacune des 44 communes de la Pévèle, calculé à partir des ventes réellement enregistrées (DVF, data.gouv.fr) — maisons et appartements distincts, valeurs atypiques exclues.",
  alternates: {
    canonical: "/prix",
  },
};

export default async function PrixPage() {
  const [maisonPevele, appartementPevele, medianRows, dvfUpdatedAt] = await Promise.all([
    getDvfMarketStatsPevele("Maison"),
    getDvfMarketStatsPevele("Appartement"),
    getDvfMedianMaisonForAllVillages(),
    getCronLastRun("dvf-import"),
  ]);

  const medianBySlug = new Map(medianRows.map((r) => [r.villageSlug, r]));
  const rows = villages
    .map((v) => ({ village: v, stats: medianBySlug.get(v.slug) ?? null }))
    .sort((a, b) => (b.stats?.medianPrixM2 ?? 0) - (a.stats?.medianPrixM2 ?? 0));

  return (
    <div className="animate-fade-up max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
          Observatoire
        </span>
        <h1 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          Observatoire des prix immobiliers en Pévèle
        </h1>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      {maisonPevele ? (
        <div className="mt-6">
          <MarketSummary lieu="en Pévèle" {...maisonPevele} />
        </div>
      ) : null}

      {appartementPevele ? (
        <p className="mt-4 max-w-[70ch] text-[13.5px] leading-[1.6] text-muted">
          Côté appartements, le prix médian s&apos;établit à{" "}
          <b className="text-ink">{appartementPevele.medianPrixM2.toLocaleString("fr-FR")} €/m²</b>{" "}
          sur {appartementPevele.retainedCount} vente
          {appartementPevele.retainedCount > 1 ? "s" : ""} retenues, une typologie plus rare et
          concentrée sur les bourgs principaux de la Pévèle.
        </p>
      ) : null}

      <p className="mt-4 text-[13px] text-muted">
        <Link href="/guides/bilan-immobilier-pevele-2025" className="font-semibold text-blue">
          Lire le Bilan immobilier de la Pévèle 2025 →
        </Link>
      </p>

      <div className="mt-7 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Village</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Prix médian / m² (maisons)</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Ventes retenues</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ village, stats: s }) => (
              <tr key={village.slug} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3">
                  {s ? (
                    <Link href={`/prix/${village.slug}`} className="font-semibold text-blue">
                      {village.nom}
                    </Link>
                  ) : (
                    <Link href={`/villages/${village.slug}`} className="font-semibold text-muted">
                      {village.nom}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3 text-ink">
                  {s ? `${s.medianPrixM2.toLocaleString("fr-FR")} €` : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {s ? `${s.retainedCount} vente${s.retainedCount > 1 ? "s" : ""}` : "données insuffisantes"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11.5px] text-muted-2">
        Source : DVF (Demandes de valeurs foncières), data.gouv.fr / Etalab — prix médian des
        maisons, valeurs atypiques exclues (
        <Link href="/methodologie" className="text-blue">
          méthode de calcul détaillée
        </Link>
        ).
        {dvfUpdatedAt
          ? ` Données DVF mises à jour le ${dvfUpdatedAt.toLocaleDateString("fr-FR")}.`
          : null}
      </p>
    </div>
  );
}
