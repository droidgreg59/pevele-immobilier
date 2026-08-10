import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Professionnels — Pévèle Immobilier",
  description:
    "Agences immobilières de la Pévèle : rejoignez le portail local et gagnez en visibilité auprès des acheteurs et vendeurs.",
};

const AVANTAGES = [
  "Page agence avec coordonnées, collaborateurs et secteur d'activité",
  "Toutes vos annonces réunies au même endroit que celles des particuliers",
  "Outils de génération de contacts et statistiques",
  "Visibilité renforcée possible sur certaines communes ou catégories",
];

export default function ProfessionnelsPage() {
  return (
    <div className="animate-view-in max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="border-2 border-blue px-3 py-1.5 font-mono text-sm text-blue">
          PIÈCE 09
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          LE BUREAU — PROFESSIONNELS
        </h2>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <p className="mt-6 max-w-[70ch] font-sans text-[15px] leading-[1.6] text-muted">
        Pévèle-Immobilier.fr n&apos;a pas vocation à concurrencer les agences
        de la Pévèle, mais à devenir le portail local sur lequel elles ont
        intérêt à être présentes.
      </p>

      <ul className="mt-7 flex max-w-[60ch] list-none flex-col gap-2.5 p-0">
        {AVANTAGES.map((item) => (
          <li
            key={item}
            className="border-2 border-ink bg-white px-4 py-3.5 font-sans text-[14px] text-ink"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-8 border-2 border-dashed border-blue bg-white p-7">
        <span className="font-mono text-[10.5px] font-medium text-blue">
          BIENTÔT DISPONIBLE
        </span>
        <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
          Le compte professionnel (gestion des annonces, synchronisation de
          catalogue, statistiques, leads) arrive dans une prochaine étape.
          Vous êtes une agence en Pévèle ? Contactez-nous pour rejoindre les
          premiers partenaires.
        </p>
      </div>
    </div>
  );
}
