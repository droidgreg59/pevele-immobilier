import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { TransactionType, TypeBien } from "@prisma/client";
import { getVillageBySlug, nearestVillages } from "@/data/villages";
import { villageAmenities } from "@/data/village-amenities";
import { getListingsForIntent } from "@/lib/listings";
import { getDvfStatsForVillage } from "@/lib/dvf";
import { getSession } from "@/lib/session";
import { getFavoriteListingIds } from "@/lib/favorites";
import ListingCard from "@/components/ListingCard";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd, SITE_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

type IntentConfig = {
  typeBien: TypeBien;
  transaction: TransactionType;
  /** « Maisons à vendre » */
  label: string;
  /** « maison » (singulier, pour les phrases) */
  singulier: string;
  /** « à vendre » / « à louer » */
  action: string;
  dvfType?: string;
};

const INTENTS: Record<string, IntentConfig> = {
  "maisons-a-vendre": { typeBien: "MAISON", transaction: "VENTE", label: "Maisons à vendre", singulier: "maison", action: "à vendre", dvfType: "Maison" },
  "appartements-a-vendre": { typeBien: "APPARTEMENT", transaction: "VENTE", label: "Appartements à vendre", singulier: "appartement", action: "à vendre", dvfType: "Appartement" },
  "terrains-a-vendre": { typeBien: "TERRAIN", transaction: "VENTE", label: "Terrains à vendre", singulier: "terrain", action: "à vendre" },
  "maisons-a-louer": { typeBien: "MAISON", transaction: "LOCATION", label: "Maisons à louer", singulier: "maison", action: "à louer", dvfType: "Maison" },
  "appartements-a-louer": { typeBien: "APPARTEMENT", transaction: "LOCATION", label: "Appartements à louer", singulier: "appartement", action: "à louer", dvfType: "Appartement" },
  "terrains-a-louer": { typeBien: "TERRAIN", transaction: "LOCATION", label: "Terrains à louer", singulier: "terrain", action: "à louer" },
};

const INTENT_SLUGS = Object.keys(INTENTS);

export async function generateMetadata({
  params,
}: PageProps<"/immobilier/[commune]/[intent]">): Promise<Metadata> {
  const { commune, intent } = await params;
  const village = getVillageBySlug(commune);
  const cfg = INTENTS[intent];
  if (!village || !cfg) return {};

  const listings = await getListingsForIntent(village.slug, cfg.typeBien, cfg.transaction);
  const description =
    listings.length > 0
      ? `${listings.length} ${cfg.singulier}${listings.length > 1 ? "s" : ""} ${cfg.action} à ${village.nom} — annonces d'agences et de particuliers, prix au m² constatés, sur ${SITE_NAME}.`
      : `Annonces de ${cfg.singulier}s ${cfg.action} à ${village.nom} : aucune en ligne actuellement. Créez une alerte pour être prévenu dès qu'un bien correspond.`;

  return {
    title: `${cfg.label} à ${village.nom}`,
    description,
    alternates: { canonical: `/immobilier/${village.slug}/${intent}` },
    // Page mince (aucune annonce et pas de données de prix) → on n'indexe pas.
    robots:
      listings.length === 0
        ? { index: false, follow: true }
        : undefined,
    openGraph: { title: `${cfg.label} à ${village.nom} — ${SITE_NAME}`, description },
  };
}

export default async function IntentLandingPage({
  params,
}: PageProps<"/immobilier/[commune]/[intent]">) {
  const { commune, intent } = await params;
  const village = getVillageBySlug(commune);
  const cfg = INTENTS[intent];
  if (!village || !cfg) notFound();

  const [listings, dvfStats, session] = await Promise.all([
    getListingsForIntent(village.slug, cfg.typeBien, cfg.transaction),
    getDvfStatsForVillage(village.slug, cfg.dvfType),
    getSession(),
  ]);
  const favoriteIds = session ? await getFavoriteListingIds(session.userId) : new Set<string>();
  const amenities = villageAmenities[village.insee];
  const listBase = cfg.transaction === "VENTE" ? "/acheter" : "/louer";
  const otherIntents = INTENT_SLUGS.filter((s) => s !== intent);
  const voisines = nearestVillages(village.slug, 5);

  return (
    <div className="animate-fade-up mx-auto max-w-[1200px] px-9 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: cfg.transaction === "VENTE" ? "Acheter" : "Louer", url: listBase },
          { name: village.nom, url: `/villages/${village.slug}` },
          { name: cfg.label, url: `/immobilier/${village.slug}/${intent}` },
        ])}
      />
      {listings.length > 0 ? (
        <JsonLd
          data={itemListJsonLd(
            listings.map((l) => ({
              url: `${listBase}/${l.id}`,
              name: `${l.titre} — ${l.commune}`,
            }))
          )}
        />
      ) : null}

      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        {cfg.transaction === "VENTE" ? "Acheter" : "Louer"} en Pévèle
      </span>
      <h1 className="mt-3 font-display text-[34px] text-ink sm:text-[44px]">
        {cfg.label} à {village.nom}
      </h1>
      <div className="mt-1 flex flex-wrap gap-4">
        <Link href={`/villages/${village.slug}`} className="text-[13px] font-semibold text-blue">
          Fiche complète de {village.nom} →
        </Link>
        <Link href={listBase} className="text-[13px] font-semibold text-blue">
          Toute la Pévèle →
        </Link>
      </div>

      <p className="mt-5 max-w-[68ch] text-[15.5px] leading-[1.65] text-muted">
        {listings.length > 0
          ? `${listings.length} ${cfg.singulier}${listings.length > 1 ? "s" : ""} ${cfg.action} à ${village.nom}, d'agences et de particuliers.`
          : `Aucune annonce de ${cfg.singulier} ${cfg.action} à ${village.nom} en ligne pour le moment.`}{" "}
        {dvfStats
          ? `Prix moyen constaté à ${village.nom} : ${dvfStats.avgPrixM2.toLocaleString("fr-FR")} €/m² (${dvfStats.count} vente${dvfStats.count > 1 ? "s" : ""} DVF, ${dvfStats.minAnnee}–${dvfStats.maxAnnee}). `
          : ""}
        {village.description}
      </p>

      {amenities ? (
        <p className="mt-3 max-w-[68ch] text-[13.5px] leading-[1.6] text-muted-2">
          À {village.nom} : {amenities.commerces.length} commerce
          {amenities.commerces.length > 1 ? "s" : ""} de proximité, {amenities.ecoles.length} établissement
          {amenities.ecoles.length > 1 ? "s" : ""} scolaire{amenities.ecoles.length > 1 ? "s" : ""}
          {amenities.transports.gares.length > 0
            ? `, gare ${amenities.transports.gares.join(" / ")}`
            : amenities.transports.arretsBus > 0
              ? `, ${amenities.transports.arretsBus} arrêts de bus`
              : ""}
          .{" "}
          <Link href={`/villages/${village.slug}`} className="text-blue">
            Voir le détail →
          </Link>
        </p>
      ) : null}

      <div className="mt-8">
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorited={favoriteIds.has(listing.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-8">
            <p className="m-0 text-[15px] font-semibold text-ink">
              Soyez prévenu dès qu&apos;un bien correspond
            </p>
            <p className="m-0 max-w-[52ch] text-[13.5px] leading-[1.6] text-muted">
              Le marché de la Pévèle est petit. Enregistrez une recherche et vous recevrez
              un email dès qu&apos;{cfg.singulier === "appartement" ? "un" : "une"} {cfg.singulier} {cfg.action} est
              publié{cfg.singulier === "maison" ? "e" : ""} à {village.nom}.
            </p>
            <Link
              href={`${listBase}?villages=${village.slug}&type=${cfg.typeBien}`}
              className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
            >
              Créer mon alerte →
            </Link>
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Autres recherches à {village.nom}
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {otherIntents.map((s) => (
            <Link
              key={s}
              href={`/immobilier/${village.slug}/${s}`}
              className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
            >
              {INTENTS[s].label}
            </Link>
          ))}
        </div>

        <span className="mt-6 block text-[11px] font-semibold uppercase tracking-wide text-muted">
          {cfg.label} dans les communes proches
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {voisines.map((v) => (
            <Link
              key={v.slug}
              href={`/immobilier/${v.slug}/${intent}`}
              className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
            >
              {v.nom}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
