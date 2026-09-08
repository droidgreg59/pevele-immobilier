import type { Metadata } from "next";
import Link from "next/link";
import { villages } from "@/data/villages";
import VillageCard from "@/components/VillageCard";

export const metadata: Metadata = {
  title: "Les 38 communes de la Pévèle",
  description:
    "Découvrez les 38 communes de la Pévèle : présentation, annonces immobilières et prix au m² village par village.",
  alternates: {
    canonical: "/villages",
  },
};

export default function VillagesPage() {
  return (
    <div className="animate-fade-up max-w-[1400px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-green">
          Villages
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          Les {villages.length} villages de la Pévèle
        </h2>
        <Link href="/carte" className="ml-auto text-[13px] font-semibold text-blue">
          Voir sur la carte →
        </Link>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {villages.map((village) => (
          <VillageCard key={village.slug} village={village} />
        ))}
      </div>
    </div>
  );
}
