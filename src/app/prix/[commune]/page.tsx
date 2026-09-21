import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVillageBySlug, nearestVillages, villages } from "@/data/villages";
import {
  getDvfMarketStatsForVillage,
  getDvfPriceByYear,
  getDvfBreakdownByType,
  getRecentDvfTransactions,
  getDvfMedianMaisonForAllVillages,
} from "@/lib/dvf";
import { getCronLastRun } from "@/lib/freshness";
import { formatDvfStreet } from "@/lib/market-summary";
import MarketSummary from "@/components/MarketSummary";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";

// Page de contenu (DVF) : rendu ISR, pré-générée pour les 44 communes. Le
// cache des lectures DVF est invalidé par le cron d'import.
export const revalidate = 3600;

export function generateStaticParams() {
  return villages.map((v) => ({ commune: v.slug }));
}

const eurM2 = (n: number) => `${n.toLocaleString("fr-FR")} € / m²`;

export async function generateMetadata({
  params,
}: PageProps<"/prix/[commune]">): Promise<Metadata> {
  const { commune } = await params;
  const village = getVillageBySlug(commune);
  if (!village) return {};
  const stats = await getDvfMarketStatsForVillage(village.slug, "Maison");

  const title = stats
    ? `Prix immobilier à ${village.nom} — ${stats.medianPrixM2.toLocaleString("fr-FR")} €/m² (médiane)`
    : `Prix immobilier à ${village.nom}`;
  const description = stats
    ? `Prix médian des maisons à ${village.nom} : ${stats.medianPrixM2.toLocaleString("fr-FR")} €/m², sur ${stats.retainedCount} vente${stats.retainedCount > 1 ? "s" : ""} DVF retenues (${stats.minAnnee}–${stats.maxAnnee}). Évolution, détail par type de bien, dernières ventes et comparaison aux communes voisines.`
    : `Prix de l'immobilier à ${village.nom} d'après les transactions DVF (data.gouv.fr).`;

  return {
    title,
    description,
    alternates: { canonical: `/prix/${village.slug}` },
    robots: stats ? undefined : { index: false, follow: true },
    openGraph: { title: `${title} — ${SITE_NAME}`, description },
  };
}

export default async function PrixCommunePage({
  params,
}: PageProps<"/prix/[commune]">) {
  const { commune } = await params;
  const village = getVillageBySlug(commune);
  if (!village) notFound();

  const [statsMaison, statsAppartement, byYear, byType, recent, medianRows, dvfUpdatedAt] =
    await Promise.all([
      getDvfMarketStatsForVillage(village.slug, "Maison"),
      getDvfMarketStatsForVillage(village.slug, "Appartement"),
      getDvfPriceByYear(village.slug, "Maison"),
      getDvfBreakdownByType(village.slug),
      getRecentDvfTransactions(village.slug, 15),
      getDvfMedianMaisonForAllVillages(),
      getCronLastRun("dvf-import"),
    ]);

  const medianBySlug = new Map(medianRows.map((r) => [r.villageSlug, r]));
  const voisines = nearestVillages(village.slug, 6).flatMap((v) => {
    const m = medianBySlug.get(v.slug);
    return m ? [{ v, m }] : [];
  });
  const villageMedian = medianBySlug.get(village.slug) ?? null;

  const maxYearMedian = byYear.length > 0 ? Math.max(...byYear.map((p) => p.medianPrixM2)) : 0;

  return (
    <div className="animate-fade-up mx-auto max-w-[1000px] px-9 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Observatoire des prix", url: "/prix" },
          { name: village.nom, url: `/prix/${village.slug}` },
        ])}
      />

      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Observatoire
      </span>
      <h1 className="mt-3 font-display text-[34px] text-ink sm:text-[44px]">
        Prix immobilier à {village.nom} : état du marché
      </h1>
      <div className="mt-1 flex flex-wrap gap-4">
        <Link href="/prix" className="text-[13px] font-semibold text-blue">
          ← Tous les villages
        </Link>
        <Link href={`/villages/${village.slug}`} className="text-[13px] font-semibold text-blue">
          Fiche complète de {village.nom} →
        </Link>
      </div>

      {!statsMaison ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-6">
          <p className="m-0 max-w-[60ch] text-[14.5px] leading-[1.6] text-muted">
            Pas assez de ventes de maisons DVF enregistrées à {village.nom} pour établir un prix
            médian fiable (moins de 5 ventes retenues).
          </p>
          <Link
            href={`/immobilier/${village.slug}/maisons-a-vendre`}
            className="mt-4 inline-block text-[13px] font-semibold text-blue"
          >
            Voir les annonces à {village.nom} →
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-7">
            <MarketSummary lieu={`à ${village.nom}`} {...statsMaison} />
          </div>

          {statsAppartement ? (
            <p className="mt-4 max-w-[70ch] text-[13.5px] leading-[1.6] text-muted">
              Côté appartements, le prix médian à {village.nom} s&apos;établit à{" "}
              <b className="text-ink">
                {statsAppartement.medianPrixM2.toLocaleString("fr-FR")} €/m²
              </b>{" "}
              sur {statsAppartement.retainedCount} vente
              {statsAppartement.retainedCount > 1 ? "s" : ""} retenues.
            </p>
          ) : null}

          {byType.length > 0 ? (
            <section className="mt-9">
              <h2 className="m-0 font-display text-xl text-ink">Par type de bien</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {byType.map((t) => (
                  <div key={t.typeLocal} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {t.typeLocal}
                    </span>
                    <div className="mt-1 font-display text-[26px] text-ink">{eurM2(t.medianPrixM2)}</div>
                    <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[12.5px] text-muted">
                      <li>Médiane (toutes ventes, sans filtre) : {eurM2(t.medianPrixM2)}</li>
                      <li>Moyenne : {eurM2(t.avgPrixM2)}</li>
                      <li>
                        Fourchette : {t.minPrixM2.toLocaleString("fr-FR")} –{" "}
                        {t.maxPrixM2.toLocaleString("fr-FR")} € / m²
                      </li>
                      <li>
                        {t.count} vente{t.count > 1 ? "s" : ""}
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {byYear.length > 1 ? (
            <section className="mt-9">
              <h2 className="m-0 font-display text-xl text-ink">Évolution (maisons)</h2>
              <div className="mt-4 flex items-end gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
                {byYear.map((p, i) => {
                  const last = i === byYear.length - 1;
                  return (
                    <div key={p.year} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[12px] font-semibold text-ink">
                        {p.medianPrixM2.toLocaleString("fr-FR")} €
                      </span>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max((p.medianPrixM2 / maxYearMedian) * 120, 8)}px`,
                          background: last ? "var(--pvl-green)" : "var(--pvl-line)",
                        }}
                      />
                      <span className="text-[11px] text-muted-2">
                        {p.year} · {p.count} vente{p.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="mt-9">
            <h2 className="m-0 font-display text-xl text-ink">Dernières ventes à {village.nom}</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
              <table className="w-full min-w-[560px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface text-left">
                    {["Date", "Rue", "Type", "Surface", "Pièces", "Prix", "€ / m²"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-2.5 text-muted">
                        {new Date(t.dateMutation).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-2.5 text-muted">{formatDvfStreet(t.adresse) ?? "—"}</td>
                      <td className="px-4 py-2.5 text-ink">{t.typeLocal}</td>
                      <td className="px-4 py-2.5 text-muted">{t.surfaceBati} m²</td>
                      <td className="px-4 py-2.5 text-muted">{t.nombrePieces ?? "—"}</td>
                      <td className="px-4 py-2.5 font-semibold text-ink">
                        {t.valeurFonciere.toLocaleString("fr-FR")} €
                      </td>
                      <td className="px-4 py-2.5 text-muted">{t.prixM2.toLocaleString("fr-FR")} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {voisines.length > 0 && villageMedian ? (
            <section className="mt-9">
              <h2 className="m-0 font-display text-xl text-ink">Communes proches</h2>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
                <table className="w-full min-w-[420px] border-collapse text-[13.5px]">
                  <thead>
                    <tr className="border-b border-line bg-surface text-left">
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Commune
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Prix médian / m² (maisons)
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        vs {village.nom}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {voisines.map(({ v, m }) => {
                      const diff = Math.round(
                        ((m.medianPrixM2 - villageMedian.medianPrixM2) / villageMedian.medianPrixM2) * 100
                      );
                      return (
                        <tr key={v.slug} className="border-b border-line last:border-b-0">
                          <td className="px-4 py-2.5">
                            <Link href={`/prix/${v.slug}`} className="font-semibold text-blue">
                              {v.nom}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-ink">
                            {m.medianPrixM2.toLocaleString("fr-FR")} €
                          </td>
                          <td
                            className="px-4 py-2.5 font-semibold"
                            style={{
                              color:
                                diff > 2
                                  ? "var(--pvl-gold)"
                                  : diff < -2
                                    ? "var(--pvl-green)"
                                    : "var(--pvl-muted)",
                            }}
                          >
                            {diff > 0 ? "+" : ""}
                            {diff}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="mt-9">
            <h2 className="m-0 font-display text-xl text-ink">Questions fréquentes</h2>
            <div className="mt-4 flex flex-col gap-4">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h3 className="m-0 text-[14.5px] font-semibold text-ink">
                  Quel est le prix moyen au m² d&apos;une maison à {village.nom} ?
                </h3>
                <p className="m-0 mt-2 text-[13.5px] leading-[1.6] text-muted">
                  D&apos;après les données DVF ({statsMaison.minAnnee}–{statsMaison.maxAnnee}), le prix
                  médian d&apos;une maison à {village.nom} est de{" "}
                  {statsMaison.medianPrixM2.toLocaleString("fr-FR")} €/m² (moyenne :{" "}
                  {statsMaison.avgPrixM2.toLocaleString("fr-FR")} €/m²), sur{" "}
                  {statsMaison.retainedCount} vente{statsMaison.retainedCount > 1 ? "s" : ""} retenues.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h3 className="m-0 text-[14.5px] font-semibold text-ink">
                  Comment ce prix est-il calculé ?
                </h3>
                <p className="m-0 mt-2 text-[13.5px] leading-[1.6] text-muted">
                  À partir des ventes de maisons réellement enregistrées (DVF), en excluant les
                  transactions atypiques (1 % les plus basses et 1 % les plus hautes, calculées sur
                  l&apos;ensemble de la Pévèle).{" "}
                  <Link href="/methodologie" className="text-blue">
                    Détail de la méthode →
                  </Link>
                </p>
              </div>
              {voisines.length > 0 && villageMedian ? (
                <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                  <h3 className="m-0 text-[14.5px] font-semibold text-ink">
                    {village.nom} est-elle plus chère que les communes voisines ?
                  </h3>
                  <p className="m-0 mt-2 text-[13.5px] leading-[1.6] text-muted">
                    {(() => {
                      const cheaper = voisines.filter((x) => x.m.medianPrixM2 < villageMedian.medianPrixM2).length;
                      return `Sur les ${voisines.length} communes voisines comparées, ${cheaper} affichent un prix médian inférieur à ${village.nom} et ${voisines.length - cheaper} un prix supérieur ou équivalent.`;
                    })()}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={`/immobilier/${village.slug}/maisons-a-vendre`}
              className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
            >
              Voir les annonces à {village.nom}
            </Link>
            <Link
              href={`/estimer?village=${village.slug}`}
              className="rounded-full border border-line px-5 py-3 text-[13px] font-semibold text-ink transition hover:bg-surface"
            >
              Estimer un bien à {village.nom}
            </Link>
          </div>
        </>
      )}

      <p className="mt-8 text-[11.5px] text-muted-2">
        Source : DVF (Demandes de valeurs foncières), data.gouv.fr / Etalab —{" "}
        <a href={`${SITE_URL}/prix`} className="text-blue">
          prix de toutes les communes
        </a>{" "}
        ·{" "}
        <Link href="/methodologie" className="text-blue">
          méthode de calcul
        </Link>
        .{" "}
        {dvfUpdatedAt
          ? `Données DVF mises à jour le ${dvfUpdatedAt.toLocaleDateString("fr-FR")}.`
          : null}
      </p>
    </div>
  );
}
