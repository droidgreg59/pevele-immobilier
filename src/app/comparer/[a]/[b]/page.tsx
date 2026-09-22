import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getVillageBySlug } from "@/data/villages";
import { villageAmenities } from "@/data/village-amenities";
import { getDvfMarketStatsForVillage, getDvfPriceByYear } from "@/lib/dvf";
import {
  canonicalPairOrder,
  findGuideForPair,
  isIndexablePair,
  buildComparisonSummary,
  LAUNCH_PAIRS,
  type ComparateurSide,
} from "@/lib/comparateur";
import ComparateurTable from "@/components/ComparateurTable";
import VillageAmenitiesSummary from "@/components/VillageAmenitiesSummary";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd, SITE_NAME } from "@/lib/seo";

// Outil evergreen, même fraîcheur que /prix et les guides — le cache DVF est
// déjà invalidé à chaque import.
export const revalidate = 3600;

export function generateStaticParams() {
  // Seules les paires de lancement sont pré-générées (voir LAUNCH_PAIRS,
  // allowlist éditoriale) — pas les 946 combinaisons. dynamicParams reste à
  // true par défaut : une paire hors liste reste accessible à la demande
  // (l'outil fonctionne pour n'importe quelle paire), simplement en noindex.
  return LAUNCH_PAIRS.map(([a, b]) => ({ a, b }));
}

async function loadSide(slug: string): Promise<ComparateurSide | null> {
  const village = getVillageBySlug(slug);
  if (!village) return null;
  const [stats, byYear] = await Promise.all([
    getDvfMarketStatsForVillage(slug, "Maison"),
    getDvfPriceByYear(slug, "Maison"),
  ]);
  const evolutionPct =
    byYear.length >= 2
      ? Math.round(
          ((byYear[byYear.length - 1].medianPrixM2 - byYear[0].medianPrixM2) / byYear[0].medianPrixM2) * 1000
        ) / 10
      : null;
  const amenities = villageAmenities[village.insee] ?? {
    commerces: [],
    ecoles: [],
    transports: { gares: [], arretsBus: 0 },
  };
  return {
    slug,
    nom: village.nom,
    stats,
    evolutionPct,
    gares: amenities.transports.gares,
    commercesCount: amenities.commerces.length,
    ecolesCount: amenities.ecoles.length,
    arretsBus: amenities.transports.arretsBus,
  };
}

/** Valide les deux slugs et l'ordre canonique — partagé entre generateMetadata et la page. */
async function resolvePair(a: string, b: string) {
  const villageA = getVillageBySlug(a);
  const villageB = getVillageBySlug(b);
  if (!villageA || !villageB) notFound();
  if (a === b) notFound();

  const [canonA, canonB] = canonicalPairOrder(a, b);
  if (a !== canonA) {
    // Redirection PERMANENTE (308) — pas un simple canonical HTML, une vraie
    // redirection : /comparer/b/a ne doit jamais rester une URL accessible.
    permanentRedirect(`/comparer/${canonA}/${canonB}`);
  }
  return { a: canonA, b: canonB };
}

export async function generateMetadata({
  params,
}: PageProps<"/comparer/[a]/[b]">): Promise<Metadata> {
  const { a: rawA, b: rawB } = await params;
  const villageA = getVillageBySlug(rawA);
  const villageB = getVillageBySlug(rawB);
  if (!villageA || !villageB || rawA === rawB) return {};
  const [a, b] = canonicalPairOrder(rawA, rawB);

  const [guide, indexable] = await Promise.all([findGuideForPair(a, b), isIndexablePair(a, b)]);
  const nomA = getVillageBySlug(a)!.nom;
  const nomB = getVillageBySlug(b)!.nom;

  const title = `${nomA} ou ${nomB} : prix immobilier et comparaison`;
  const description = `Comparaison du prix de l'immobilier, de l'évolution et du cadre de vie entre ${nomA} et ${nomB}, à partir des transactions DVF et des données recensées sur Pévèle-Immobilier.fr.`;

  return {
    title,
    description,
    alternates: { canonical: `/comparer/${a}/${b}` },
    // noindex si un guide dédié existe (contenu SEO principal ailleurs) OU
    // si la paire ne remplit pas les critères d'indexation (5B.4) — jamais
    // bloqué par robots.txt pour autant, l'outil reste utilisable et la
    // directive noindex doit rester lisible par les robots.
    robots: guide || !indexable ? { index: false, follow: true } : undefined,
    openGraph: { title: `${title} — ${SITE_NAME}`, description },
  };
}

export default async function ComparateurPage({
  params,
}: PageProps<"/comparer/[a]/[b]">) {
  const { a: rawA, b: rawB } = await params;
  const { a, b } = await resolvePair(rawA, rawB);

  const [sideA, sideB, guide, indexable] = await Promise.all([
    loadSide(a),
    loadSide(b),
    findGuideForPair(a, b),
    isIndexablePair(a, b),
  ]);
  if (!sideA || !sideB) notFound();

  const summary = buildComparisonSummary(sideA, sideB);
  const isNoindex = Boolean(guide) || !indexable;

  return (
    <div className="animate-fade-up mx-auto max-w-[820px] px-6 py-14 sm:py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Comparateur", url: "/comparer" },
          { name: `${sideA.nom} ou ${sideB.nom}`, url: `/comparer/${a}/${b}` },
        ])}
      />
      <JsonLd
        data={webPageJsonLd({
          title: `${sideA.nom} ou ${sideB.nom} : prix immobilier et comparaison`,
          description: `Comparaison du prix de l'immobilier entre ${sideA.nom} et ${sideB.nom}.`,
          url: `/comparer/${a}/${b}`,
        })}
      />

      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Comparateur
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        {sideA.nom} ou {sideB.nom} : prix immobilier et cadre de vie
      </h1>

      {guide ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <p className="m-0 text-[14px] text-ink">
            <Link href={`/guides/${guide.slug}`} className="font-semibold text-blue">
              Lire notre analyse complète {sideA.nom} / {sideB.nom} →
            </Link>
          </p>
        </div>
      ) : null}

      <p className="mt-5 max-w-[70ch] text-[15px] leading-[1.6] text-ink">{summary[0]}</p>

      <section className="mt-8">
        <h2 className="m-0 font-display text-xl text-ink">Immobilier</h2>
        <ComparateurTable a={sideA} b={sideB} />
      </section>

      <section className="mt-9">
        <h2 className="m-0 font-display text-xl text-ink">Cadre de vie et équipements recensés</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <VillageAmenitiesSummary nom={sideA.nom} amenities={villageAmenities[getVillageBySlug(a)!.insee]} />
          <VillageAmenitiesSummary nom={sideB.nom} amenities={villageAmenities[getVillageBySlug(b)!.insee]} />
        </div>
      </section>

      <section className="mt-9">
        <h2 className="m-0 font-display text-xl text-ink">À retenir</h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[14.5px] leading-[1.6] text-muted">
          {summary.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-[12.5px]">
        <Link href={`/prix/${a}`} className="text-blue">
          Prix détaillé à {sideA.nom} →
        </Link>
        <Link href={`/prix/${b}`} className="text-blue">
          Prix détaillé à {sideB.nom} →
        </Link>
        <Link href={`/villages/${a}`} className="text-blue">
          Fiche {sideA.nom} →
        </Link>
        <Link href={`/villages/${b}`} className="text-blue">
          Fiche {sideB.nom} →
        </Link>
        <Link href="/methodologie" className="text-blue">
          Méthodologie →
        </Link>
      </p>

      {isNoindex ? (
        <p className="mt-6 text-[11px] text-muted-2">
          Outil de comparaison — cette page n&apos;est pas indexée par les moteurs de recherche.
        </p>
      ) : null}
    </div>
  );
}
