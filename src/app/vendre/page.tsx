import type { Metadata } from "next";
import Link from "next/link";
import { packs } from "@/data/packs";
import PackCard from "@/components/PackCard";

export const metadata: Metadata = {
  title: "Vendre en Pévèle — Pévèle Immobilier",
  description:
    "Composez votre accompagnement pour vendre votre bien en Pévèle : annonce seule, ou services à la carte.",
};

export default function VendrePage() {
  return (
    <div className="animate-fade-up max-w-[1200px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-gold">
          VENDRE
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          VENDRE VOTRE BIEN
        </h2>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR À L&apos;ACCUEIL
      </Link>

      <p className="mt-6 max-w-[70ch] font-sans text-[15px] leading-[1.6] text-muted">
        Au lieu de choisir entre vendre seul ou confier entièrement votre bien
        à une agence, composez votre accompagnement : uniquement les services
        dont vous avez besoin, pas de commission imposée sur ce que vous ne
        voulez pas.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {packs.map((pack) => (
          <PackCard key={pack.slug} pack={pack} />
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface px-6 py-5">
        <span className="font-sans text-[15px] text-ink">
          Pas sûr de votre choix ?{" "}
          <b>Déposez votre annonce, vous ajusterez l&apos;accompagnement après.</b>
        </span>
        <Link
          href="/vendre/deposer"
          className="rounded-full bg-yellow px-5 py-3 font-mono text-[11.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          + DÉPOSER UNE ANNONCE
        </Link>
      </div>
    </div>
  );
}
