import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVillageBySlug, nearestVillages } from "@/data/villages";
import {
  getDvfStatsForVillage,
  getDvfPriceByYear,
  getDvfBreakdownByType,
  getRecentDvfTransactions,
  getDvfStatsForAllVillages,
} from "@/lib/dvf";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const eurM2 = (n: number) => `${n.toLocaleString("fr-FR")} € / m²`;

export async function generateMetadata({
  params,
}: PageProps<"/prix/[commune]">): Promise<Metadata> {
  const { commune } = await params;
  const village = getVillageBySlug(commune);
  if (!village) return {};
  const stats = await getDvfStatsForVillage(village.slug);

  const title = stats
    ? `Prix immobilier à ${village.nom} — ${stats.avgPrixM2.toLocaleString("fr-FR")} €/m²`
    : `Prix immobilier à ${village.nom}`;
  const description = stats
    ? `Prix moyen au m² à ${village.nom} : ${stats.avgPrixM2.toLocaleString("fr-FR")} €/m², sur ${stats.count} vente${stats.count > 1 ? "s" : ""} DVF (${stats.minAnnee}–${stats.maxAnnee}). Évolution, détail maison / appartement, dernières ventes et comparaison aux communes voisines.`
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

  const [stats, byYear, byType, recent, allStats] = await Promise.all([
    getDvfStatsForVillage(village.slug),
    getDvfPriceByYear(village.slug),
    getDvfBreakdownByType(village.slug),
    getRecentDvfTransactions(village.slug, 15),
    getDvfStatsForAllVillages(),
  ]);

  const statBySlug = new Map(allStats.map((s) => [s.villageSlug, s]));
  const voisines = nearestVillages(village.slug, 6).flatMap((v) => {
    const s = statBySlug.get(v.slug);
    return s ? [{ v, s }] : [];
  });

  const maxYearAvg = byYear.length > 0 ? Math.max(...byYear.map((p) => p.avgPrixM2)) : 0;

  return (
    <div className="animate-fade-up mx-auto max-w-[1000px] px-9 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Prix de l'immobilier", url: "/prix" },
          { name: village.nom, url: `/prix/${village.slug}` },
        ])}
      />

      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Prix
      </span>
      <h1 className="mt-3 font-display text-[34px] text-ink sm:text-[44px]">
        Prix immobilier à {village.nom}
      </h1>
      <div className="mt-1 flex flex-wrap gap-4">
        <Link href="/prix" className="text-[13px] font-semibold text-blue">
          ← Tous les villages
        </Link>
        <Link href={`/villages/${village.slug}`} className="text-[13px] font-semibold text-blue">
          Fiche complète de {village.nom} →
        </Link>
      </div>

      {!stats ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-6">
          <p className="m-0 max-w-[60ch] text-[14.5px] leading-[1.6] text-muted">
            Pas assez de ventes DVF enregistrées à {village.nom} pour établir un prix moyen
            fiable. {village.description}
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
          <p className="mt-5 max-w-[70ch] text-[15.5px] leading-[1.6] text-muted">
            {village.description}
          </p>

          <div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4 rounded-2xl bg-surface p-6">
            <div>
              <span className="font-display text-[40px] leading-none text-ink">
                {stats.avgPrixM2.toLocaleString("fr-FR")} €
              </span>
              <span className="ml-1.5 text-[13px] font-medium text-muted">/ m² en moyenne</span>
            </div>
            <span className="text-[13px] text-muted">
              {stats.count} vente{stats.count > 1 ? "s" : ""} constatée{stats.count > 1 ? "s" : ""} ·{" "}
              {stats.minAnnee}–{stats.maxAnnee}
            </span>
          </div>

          {byType.length > 0 ? (
            <section className="mt-9">
              <h2 className="m-0 font-display text-xl text-ink">Par type de bien</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {byType.map((t) => (
                  <div key={t.typeLocal} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {t.typeLocal}
                    </span>
                    <div className="mt-1 font-display text-[26px] text-ink">{eurM2(t.avgPrixM2)}</div>
                    <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[12.5px] text-muted">
                      <li>Médiane : {eurM2(t.medianPrixM2)}</li>
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
              <h2 className="m-0 font-display text-xl text-ink">Évolution</h2>
              <div className="mt-4 flex items-end gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
                {byYear.map((p, i) => {
                  const last = i === byYear.length - 1;
                  return (
                    <div key={p.year} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[12px] font-semibold text-ink">
                        {p.avgPrixM2.toLocaleString("fr-FR")} €
                      </span>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max((p.avgPrixM2 / maxYearAvg) * 120, 8)}px`,
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
                    {["Date", "Type", "Surface", "Pièces", "Prix", "€ / m²"].map((h) => (
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

          {voisines.length > 0 ? (
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
                        Prix moyen / m²
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        vs {village.nom}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {voisines.map(({ v, s }) => {
                      const diff = Math.round(((s.avgPrixM2 - stats.avgPrixM2) / stats.avgPrixM2) * 100);
                      return (
                        <tr key={v.slug} className="border-b border-line last:border-b-0">
                          <td className="px-4 py-2.5">
                            <Link href={`/prix/${v.slug}`} className="font-semibold text-blue">
                              {v.nom}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-ink">
                            {s.avgPrixM2.toLocaleString("fr-FR")} €
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
        </a>
        . Ventes de maisons et d&apos;appartements en un seul lot, hors valeurs atypiques.
      </p>
    </div>
  );
}
