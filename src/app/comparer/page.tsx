import type { Metadata } from "next";
import Link from "next/link";
import { getVillageBySlug } from "@/data/villages";
import { LAUNCH_PAIRS } from "@/lib/comparateur";
import ComparateurSelector from "@/components/ComparateurSelector";

export const metadata: Metadata = {
  title: "Comparateur de communes",
  description:
    "Comparez le prix de l'immobilier et le cadre de vie de deux communes de la Pévèle, à partir des données DVF et des équipements recensés.",
  alternates: { canonical: "/comparer" },
};

export default function ComparateurIndexPage() {
  // Uniquement les comparaisons éditorialement sélectionnées sont suggérées
  // ici — jamais une grille des 946 combinaisons possibles (voir Sprint 5,
  // point 18). L'outil ci-dessus reste utilisable pour n'importe quelle paire.
  const suggestions = LAUNCH_PAIRS.map(([a, b]) => ({
    a,
    b,
    nomA: getVillageBySlug(a)?.nom ?? a,
    nomB: getVillageBySlug(b)?.nom ?? b,
  }));

  return (
    <div className="animate-fade-up mx-auto max-w-[820px] px-6 py-14 sm:py-20">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Comparateur
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Comparer deux communes de la Pévèle
      </h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <p className="mt-5 max-w-[70ch] text-[15px] leading-[1.6] text-ink">
        Choisissez deux communes pour comparer le prix médian des maisons (DVF), son évolution, et
        les équipements recensés (gare, écoles, commerces, transports).
      </p>

      <div className="mt-6">
        <ComparateurSelector />
      </div>

      {suggestions.length > 0 ? (
        <div className="mt-9">
          <h2 className="m-0 font-display text-xl text-ink">Quelques comparaisons</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Link
                key={`${s.a}-${s.b}`}
                href={`/comparer/${s.a}/${s.b}`}
                className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
              >
                {s.nomA} / {s.nomB}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
