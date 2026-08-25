import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVillageBySlug } from "@/data/villages";
import { getPublicListingsByVillage } from "@/lib/listings";
import { getDvfStatsForVillage, getRecentDvfTransactions } from "@/lib/dvf";
import { getFavoriteListingIds } from "@/lib/favorites";
import { getSession } from "@/lib/session";
import ListingCard from "@/components/ListingCard";
import ResumeBanner from "@/components/ResumeBanner";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/villages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const village = getVillageBySlug(slug);
  if (!village) return {};
  const dvfStats = await getDvfStatsForVillage(village.slug);
  const priceLine = dvfStats
    ? `Prix moyen constaté : ${dvfStats.avgPrixM2.toLocaleString("fr-FR")} €/m² (${dvfStats.count} vente${dvfStats.count > 1 ? "s" : ""} DVF). `
    : "";
  return {
    title: `Prix immobilier et annonces à ${village.nom}`,
    description: `${priceLine}Annonces immobilières à vendre et à louer à ${village.nom} : ${village.description}`,
    alternates: {
      canonical: `/villages/${village.slug}`,
    },
    openGraph: {
      title: `Prix immobilier et annonces à ${village.nom} — Pévèle Immobilier`,
      description: priceLine || village.description,
    },
  };
}

const STUB_SECTIONS = ["Écoles", "Commerces", "Transports"];

export default async function VillagePage({
  params,
}: PageProps<"/villages/[slug]">) {
  const { slug } = await params;
  const village = getVillageBySlug(slug);
  if (!village) notFound();

  const [villageListings, dvfStats, dvfRecent, session] = await Promise.all([
    getPublicListingsByVillage(village.slug),
    getDvfStatsForVillage(village.slug),
    getRecentDvfTransactions(village.slug, 4),
    getSession(),
  ]);
  const favoriteIds = session
    ? await getFavoriteListingIds(session.userId)
    : new Set<string>();

  return (
    <div className="animate-fade-up max-w-[1200px] px-9 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Villages", url: "/villages" },
          { name: village.nom, url: `/villages/${village.slug}` },
        ])}
      />
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-green">
        Fiche village
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[48px]">{village.nom}</h1>
      <div className="flex flex-wrap gap-4">
        <Link href="/" className="text-[13px] font-semibold text-blue">
          ← Retour à l&apos;accueil
        </Link>
        <Link href="/villages" className="text-[13px] font-semibold text-blue">
          ← Tous les villages
        </Link>
        <Link
          href={`/carte?village=${village.slug}`}
          className="text-[13px] font-semibold text-blue"
        >
          Voir sur la carte →
        </Link>
      </div>

      <p className="mt-6 max-w-[64ch] text-[16px] leading-[1.6] text-muted">
        {village.description}
      </p>

      <div className="mt-6">
        <ResumeBanner />
      </div>

      <div className="mt-9">
        <h2 className="m-0 font-display text-xl text-ink">Biens à vendre à {village.nom}</h2>
        {villageListings.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {villageListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorited={favoriteIds.has(listing.id)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Aucune annonce en ligne à {village.nom} pour le moment.{" "}
            <Link href="/acheter" className="text-blue">
              Voir toutes les annonces →
            </Link>
          </p>
        )}
      </div>

      <div className="mt-9">
        <h2 className="m-0 font-display text-xl text-ink">Prix immobilier</h2>
        {dvfStats ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
            <div className="rounded-2xl bg-surface p-5">
              <span className="font-display text-[30px] text-ink">
                {dvfStats.avgPrixM2.toLocaleString("fr-FR")} €
              </span>
              <span className="ml-1.5 text-[12px] font-medium text-muted">/ m² en moyenne</span>
              <p className="m-0 mt-2 text-[12px] text-muted">
                {dvfStats.count} vente{dvfStats.count > 1 ? "s" : ""} constatée
                {dvfStats.count > 1 ? "s" : ""} ({dvfStats.minAnnee}–{dvfStats.maxAnnee})
              </p>
            </div>
            {dvfRecent.length > 0 ? (
              <div className="rounded-2xl border border-line bg-white">
                <div className="border-b border-line px-4 py-2 text-[11px] font-semibold text-muted">
                  Dernières ventes
                </div>
                <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                  {dvfRecent.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 px-4 py-2 text-[12.5px]"
                    >
                      <span className="text-muted">
                        {new Date(t.dateMutation).toLocaleDateString("fr-FR")} ·{" "}
                        {t.typeLocal} · {t.surfaceBati} m²
                      </span>
                      <span className="font-semibold text-ink">
                        {t.valeurFonciere.toLocaleString("fr-FR")} €
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Données insuffisantes pour {village.nom} pour le moment.
          </p>
        )}
        <p className="mt-3 text-[11px] text-muted-2">
          Source : DVF (data.gouv.fr / Etalab) —{" "}
          <Link href="/prix" className="text-blue">
            voir tous les villages →
          </Link>
        </p>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STUB_SECTIONS.map((section) => (
          <div
            key={section}
            className="rounded-2xl border border-dashed border-line bg-surface p-5"
          >
            <span className="text-[11px] font-semibold text-muted">{section}</span>
            <p className="m-0 mt-2 text-[13px] text-muted-2">Bientôt disponible.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
