import type { Metadata } from "next";
import Link from "next/link";
import { villages } from "@/data/villages";
import VillageCard from "@/components/VillageCard";

export const metadata: Metadata = {
  title: "Les 19 villages de la Pévèle — Pévèle Immobilier",
  description:
    "Découvrez les 19 communes de la Pévèle : présentation, annonces et prix village par village.",
};

export default function VillagesPage() {
  return (
    <div className="animate-view-in max-w-[1400px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-green">
          VILLAGES
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          LES 19 VILLAGES DE LA PÉVÈLE
        </h2>
        <Link
          href="/carte"
          className="ml-auto font-mono text-[11px] font-medium text-blue"
        >
          VOIR SUR LA CARTE →
        </Link>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR À L&apos;ACCUEIL
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {villages.map((village) => (
          <VillageCard key={village.slug} village={village} />
        ))}
      </div>
    </div>
  );
}
