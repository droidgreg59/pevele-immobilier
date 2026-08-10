import type { Metadata } from "next";
import Link from "next/link";
import { villages } from "@/data/villages";

export const metadata: Metadata = {
  title: "Prix de l'immobilier en Pévèle — Pévèle Immobilier",
  description:
    "Comprendre les prix de l'immobilier en Pévèle, village par village, à partir des données du marché local.",
};

export default function PrixPage() {
  return (
    <div className="animate-view-in max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="border-2 border-blue px-3 py-1.5 font-mono text-sm text-blue">
          PIÈCE 07
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          PRIX DE L&apos;IMMOBILIER
        </h2>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <p className="mt-6 max-w-[70ch] font-sans text-[15px] leading-[1.6] text-muted">
        L&apos;objectif : présenter les données publiques du marché immobilier
        (transactions DVF, prix au m², évolution) de façon simple et locale —
        village par village, et directement autour de chaque bien.
      </p>

      <div className="mt-8 border-2 border-dashed border-blue bg-white p-7">
        <span className="font-mono text-[10.5px] font-medium text-blue">
          BIENTÔT DISPONIBLE
        </span>
        <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
          Prix moyen au m² par commune, dernières transactions constatées,
          évolution du marché et historique des prix des annonces. En
          attendant, chaque village a sa propre fiche.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {villages.map((v) => (
          <Link
            key={v.slug}
            href={`/villages/${v.slug}`}
            className="border-[1.5px] border-ink bg-white px-3 py-2 font-mono text-[10.5px] font-medium text-ink hover:bg-[#FDEBC2]"
          >
            {v.nom}
          </Link>
        ))}
      </div>
    </div>
  );
}
