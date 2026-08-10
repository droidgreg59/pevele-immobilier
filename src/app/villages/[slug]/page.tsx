import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { villages, getVillageBySlug } from "@/data/villages";
import { getListingsByVillage } from "@/data/listings";
import ListingCard from "@/components/ListingCard";

export function generateStaticParams() {
  return villages.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/villages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const village = getVillageBySlug(slug);
  if (!village) return {};
  return {
    title: `Immobilier à ${village.nom} — Pévèle Immobilier`,
    description: village.description,
  };
}

const STUB_SECTIONS = ["Écoles", "Commerces", "Transports", "Prix immobilier"];

export default async function VillagePage({
  params,
}: PageProps<"/villages/[slug]">) {
  const { slug } = await params;
  const village = getVillageBySlug(slug);
  if (!village) notFound();

  const villageListings = getListingsByVillage(village.slug);

  return (
    <div className="animate-view-in max-w-[1200px] px-9 py-8">
      <span className="border-2 border-green px-3 py-1.5 font-mono text-sm text-green">
        FICHE VILLAGE
      </span>
      <h2 className="mt-3 font-display text-[36px] text-ink sm:text-[52px]">
        {village.nom.toUpperCase()}
      </h2>
      <div className="flex flex-wrap gap-4">
        <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
          ← RETOUR AU PLAN
        </Link>
        <Link
          href="/villages"
          className="font-mono text-[11.5px] font-medium text-blue"
        >
          ← TOUS LES VILLAGES
        </Link>
        <Link
          href={`/carte?village=${village.slug}`}
          className="font-mono text-[11.5px] font-medium text-blue"
        >
          VOIR SUR LA CARTE →
        </Link>
      </div>

      <p className="mt-6 max-w-[64ch] font-sans text-[16px] leading-[1.6] text-muted">
        {village.description}
      </p>

      <div className="mt-9">
        <h3 className="m-0 font-display text-xl text-ink">
          BIENS À VENDRE À {village.nom.toUpperCase()}
        </h3>
        {villageListings.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {villageListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="mt-3 font-sans text-[14px] text-muted">
            Aucune annonce en ligne à {village.nom} pour le moment.{" "}
            <Link href="/acheter" className="text-blue">
              Voir toutes les annonces →
            </Link>
          </p>
        )}
      </div>

      <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STUB_SECTIONS.map((section) => (
          <div
            key={section}
            className="border-2 border-dashed border-muted-2 bg-white p-5"
          >
            <span className="font-mono text-[10.5px] font-medium text-muted">
              {section.toUpperCase()}
            </span>
            <p className="m-0 mt-2 font-sans text-[13px] text-muted-2">
              Bientôt disponible.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
