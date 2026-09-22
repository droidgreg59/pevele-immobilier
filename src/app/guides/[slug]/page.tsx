import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_SLUGS, loadGuide, type GuideSlug } from "@/lib/guides";
import { getDvfMedianMaisonForAllVillages, getDvfMarketStatsForVillage } from "@/lib/dvf";
import { getBudgetBracketStatsPevele, getBudgetBracketStatsForVillage } from "@/lib/budget-brackets";
import { villages, getVillageBySlug } from "@/data/villages";
import { villageAmenities } from "@/data/village-amenities";
import type { VillagePriceRow } from "@/components/AllVillagesPriceTable";
import type { VillageBudgetRow } from "@/components/BudgetVillageRanking";
import type { VillageComparisonSide } from "@/components/VillageComparison";
import GuideByline from "@/components/GuideByline";
import DataFreshnessNote from "@/components/DataFreshnessNote";
import JsonLd from "@/components/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, SITE_NAME } from "@/lib/seo";

// Guides éditoriaux (Sprint 4) : evergreen, ISR — même fraîcheur que /prix,
// le cache DVF sous-jacent est déjà invalidé à chaque import.
export const revalidate = 3600;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}
export const dynamicParams = false;

const GARE_VILLAGE_SLUGS = ["baisieux", "templeuve-en-pevele", "nomain", "orchies", "landas", "rosult"];
const BUDGET_PALIERS = [250000, 300000, 350000, 400000, 500000];

function villageName(slug: string): string {
  return getVillageBySlug(slug)?.nom ?? slug;
}

async function priceRows(): Promise<VillagePriceRow[]> {
  const rows = await getDvfMedianMaisonForAllVillages();
  return rows.map((r) => ({
    slug: r.villageSlug,
    nom: villageName(r.villageSlug),
    medianPrixM2: r.medianPrixM2,
    retainedCount: r.retainedCount,
  }));
}

type GuideProps = Record<string, unknown>;

async function buildGuideProps(slug: GuideSlug): Promise<GuideProps> {
  if (slug === "44-communes-comparees") {
    const rows = await priceRows();
    const sorted = [...rows].sort((a, b) => b.medianPrixM2 - a.medianPrixM2);
    return {
      rows,
      top5Expensive: sorted.slice(0, 5),
      top5Affordable: sorted.slice(-5).reverse(),
    };
  }

  if (slug === "quel-budget-pour-acheter-en-pevele") {
    const [peveleRows, perVillage] = await Promise.all([
      getBudgetBracketStatsPevele(BUDGET_PALIERS, "Maison"),
      Promise.all(
        villages.map(async (v) => {
          const stats = await getBudgetBracketStatsForVillage(v.slug, [300000], "Maison");
          return stats ? { slug: v.slug, nom: v.nom, ...stats[0] } : null;
        })
      ),
    ]);
    const villageRanking300k: VillageBudgetRow[] = perVillage.filter((r) => r !== null);
    return { peveleRows: peveleRows ?? [], villageRanking300k };
  }

  if (slug === "communes-pevele-avec-gare") {
    const allRows = await priceRows();
    const bySlug = new Map(allRows.map((r) => [r.slug, r]));
    const rows = GARE_VILLAGE_SLUGS.map((s) => {
      const village = getVillageBySlug(s);
      const gares = village ? (villageAmenities[village.insee]?.transports.gares ?? []) : [];
      const priceRow = bySlug.get(s);
      return {
        slug: s,
        nom: villageName(s),
        gares,
        medianPrixM2: priceRow?.medianPrixM2 ?? null,
        retainedCount: priceRow?.retainedCount ?? 0,
      };
    });
    return { rows };
  }

  if (slug === "cysoing-ou-templeuve-en-pevele") {
    const [statsA, statsB] = await Promise.all([
      getDvfMarketStatsForVillage("cysoing", "Maison"),
      getDvfMarketStatsForVillage("templeuve-en-pevele", "Maison"),
    ]);
    const villageA = getVillageBySlug("cysoing")!;
    const villageB = getVillageBySlug("templeuve-en-pevele")!;
    const side = (
      slugV: string,
      village: { nom: string; insee: string },
      stats: { medianPrixM2: number; retainedCount: number } | null
    ): VillageComparisonSide => ({
      slug: slugV,
      nom: village.nom,
      medianPrixM2: stats?.medianPrixM2 ?? null,
      retainedCount: stats?.retainedCount ?? 0,
      gares: villageAmenities[village.insee]?.transports.gares ?? [],
    });
    return {
      a: side("cysoing", villageA, statsA),
      b: side("templeuve-en-pevele", villageB, statsB),
      amenitiesA: villageAmenities[villageA.insee],
      amenitiesB: villageAmenities[villageB.insee],
    };
  }

  return {};
}

export async function generateMetadata({
  params,
}: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) return {};
  return {
    title: guide.metadata.title,
    description: guide.metadata.description,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: { title: `${guide.metadata.title} — ${SITE_NAME}`, description: guide.metadata.description },
  };
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) notFound();
  const { default: GuideContent, metadata } = guide;
  const contentProps = await buildGuideProps(slug as GuideSlug);

  return (
    <div className="animate-fade-up mx-auto max-w-[820px] px-6 py-14 sm:py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Guides", url: "/guides" },
          { name: metadata.title, url: `/guides/${slug}` },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          title: metadata.title,
          description: metadata.description,
          url: `/guides/${slug}`,
          publishedAt: metadata.publishedAt,
          updatedAt: metadata.updatedAt,
        })}
      />
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        {metadata.type === "bilan" ? "Bilan" : metadata.type === "comparatif" ? "Comparatif" : "Guide"}
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">{metadata.title}</h1>
      <Link href="/guides" className="text-[13px] font-semibold text-blue">
        ← Tous les guides
      </Link>
      <GuideByline author={metadata.author} publishedAt={metadata.publishedAt} updatedAt={metadata.updatedAt} />
      {metadata.type !== "bilan" && <DataFreshnessNote />}

      <div className="mt-6 font-sans">
        <GuideContent {...contentProps} />
      </div>
    </div>
  );
}
