import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Espace professionnel — Pévèle Immobilier",
  description:
    "Agences immobilières et artisans de la Pévèle : développez votre activité sur le portail local.",
};

const AVANTAGES = [
  {
    emoji: "📣",
    titre: "Une visibilité locale",
    desc: "Une page publique pour votre activité, réunie au même endroit que les annonces et demandes de la Pévèle.",
  },
  {
    emoji: "🤝",
    titre: "Des clients qualifiés",
    desc: "Demandes de devis, demandes de visite ou mandats de recherche envoyés directement par des particuliers de la région.",
  },
  {
    emoji: "📊",
    titre: "Des outils de suivi",
    desc: "Statistiques d'activité et hub clients pour garder une vue d'ensemble sur vos annonces et vos échanges.",
  },
  {
    emoji: "✅",
    titre: "Une inscription simple",
    desc: "Un compte gratuit, en moins de deux minutes, sans engagement.",
  },
];

export default function EspaceProfessionnelPage() {
  return (
    <div className="animate-fade-up mx-auto max-w-[900px] px-6 py-14 sm:py-20">
      <div className="flex flex-col gap-3 text-center">
        <span className="text-[36px] leading-none">🏢</span>
        <h1 className="m-0 font-display text-[32px] font-extrabold leading-tight text-ink sm:text-[40px]">
          Développez votre activité en Pévèle
        </h1>
        <p className="mx-auto mt-1 max-w-[60ch] font-sans text-[15px] leading-[1.6] text-muted">
          Agence immobilière ou artisan de l&apos;habitat : rejoignez le
          portail local et connectez-vous directement avec les particuliers
          de la région.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {AVANTAGES.map((a) => (
          <div
            key={a.titre}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-6 shadow-sm"
          >
            <span className="text-[26px] leading-none">{a.emoji}</span>
            <span className="font-display text-[16px] font-extrabold text-ink">
              {a.titre}
            </span>
            <span className="font-sans text-[13.5px] leading-[1.5] text-muted">
              {a.desc}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/inscription?type=AGENCE"
          className="group flex flex-col items-start gap-2 rounded-2xl bg-blue p-7 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="text-[28px] leading-none">🏡</span>
          <span className="font-display text-[18px] font-extrabold">
            Je suis une agence immobilière
          </span>
          <span className="font-sans text-[13.5px] leading-[1.5] text-white/80">
            Créez votre page agence et publiez vos annonces.
          </span>
          <span className="mt-1 font-mono text-[11px] font-medium">
            Créer mon compte →
          </span>
        </Link>
        <Link
          href="/inscription?type=ARTISAN"
          className="group flex flex-col items-start gap-2 rounded-2xl bg-ink p-7 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="text-[28px] leading-none">🔨</span>
          <span className="font-display text-[18px] font-extrabold">
            Je suis un artisan
          </span>
          <span className="font-sans text-[13.5px] leading-[1.5] text-white/80">
            Figurez dans l&apos;annuaire et recevez des demandes de devis.
          </span>
          <span className="mt-1 font-mono text-[11px] font-medium">
            Créer mon compte →
          </span>
        </Link>
      </div>

      <p className="mt-8 text-center font-mono text-[11.5px] text-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="text-blue">
          Se connecter →
        </Link>
      </p>
    </div>
  );
}
