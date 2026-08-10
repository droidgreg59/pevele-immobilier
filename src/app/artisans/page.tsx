import type { Metadata } from "next";
import Link from "next/link";
import { artisanCategories } from "@/data/artisanCategories";

export const metadata: Metadata = {
  title: "Artisans & Habitat — Pévèle Immobilier",
  description:
    "L'annuaire des artisans et professionnels de l'habitat en Pévèle : rénovation, toiture, électricité, jardin et plus.",
};

export default function ArtisansPage() {
  return (
    <div className="animate-view-in max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="border-2 border-gold px-3 py-1.5 font-mono text-sm text-gold">
          PIÈCE 08
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          ARTISANS &amp; HABITAT
        </h2>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <p className="mt-6 max-w-[70ch] font-sans text-[15px] leading-[1.6] text-muted">
        Un espace dédié aux artisans et professionnels de l&apos;habitat en
        Pévèle : présentation, secteur géographique, spécialités et demande de
        devis. De quoi accompagner tout le parcours, de l&apos;achat aux
        travaux.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {artisanCategories.map((cat) => (
          <span
            key={cat}
            className="border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-mono text-[11px] font-medium text-ink"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="mt-8 border-2 border-dashed border-gold bg-white p-7">
        <span className="font-mono text-[10.5px] font-medium text-gold">
          BIENTÔT DISPONIBLE
        </span>
        <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
          Les fiches artisan (coordonnées, réalisations, communes desservies,
          demande de devis) arrivent dans une prochaine étape. Vous êtes
          artisan en Pévèle et souhaitez figurer parmi les premiers ?
          Contactez-nous.
        </p>
      </div>
    </div>
  );
}
