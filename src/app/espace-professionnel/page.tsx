import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Espace professionnel",
  description:
    "Agences immobilières, artisans et courtiers bancaires de la Pévèle : développez votre activité sur le portail local.",
  alternates: {
    canonical: "/espace-professionnel",
  },
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

// Vidéos de présentation agences (Reels de campagne), hébergées sur R2 sous
// videos/ — suffixe -vN à incrémenter si une vidéo est refaite (cache immutable).
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

const VIDEOS = [
  {
    slug: "agences-demandes-v1",
    titre: "Vos demandes, centralisées",
    desc: "Visites, recherches confiées, estimations : tout arrive dans votre tableau de bord.",
  },
  {
    slug: "agences-recherche-ia-v1",
    titre: "Visible dans la recherche IA",
    desc: "Votre agence et vos annonces, décrites pour être lues par les moteurs IA.",
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
          Agence immobilière, artisan de l&apos;habitat ou courtier bancaire :
          rejoignez le portail local et connectez-vous directement avec les
          particuliers de la région.
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

      {R2_PUBLIC_URL ? (
        <section className="mt-12">
          <h2 className="m-0 text-center font-display text-[24px] font-extrabold text-ink">
            Pévèle Immobilier en vidéo
          </h2>
          <div className="mx-auto mt-6 grid max-w-[680px] grid-cols-1 gap-6 sm:grid-cols-2">
            {VIDEOS.map((v) => (
              <div key={v.slug} className="flex flex-col gap-3">
                <video
                  controls
                  playsInline
                  preload="none"
                  poster={`${R2_PUBLIC_URL}/videos/${v.slug}.jpg`}
                  className="aspect-[9/16] w-full rounded-2xl bg-ink shadow-sm"
                >
                  <source src={`${R2_PUBLIC_URL}/videos/${v.slug}.mp4`} type="video/mp4" />
                </video>
                <div className="flex flex-col gap-1 px-1">
                  <span className="font-display text-[16px] font-extrabold text-ink">{v.titre}</span>
                  <span className="font-sans text-[13.5px] leading-[1.5] text-muted">{v.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-muted-2">
            Écrans présentés avec des données fictives.
          </p>
        </section>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/inscription?type=AGENCE"
          className="group flex flex-col items-start gap-2 rounded-2xl bg-blue p-7 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="text-[28px] leading-none">🏡</span>
          <span className="font-display text-[18px] font-extrabold">
            Je suis une agence immobilière
          </span>
          <span className="text-[13.5px] leading-[1.5] text-white/80">
            Créez votre page agence et publiez vos annonces.
          </span>
          <span className="mt-1 text-[13px] font-semibold">
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
          <span className="text-[13.5px] leading-[1.5] text-white/80">
            Figurez dans l&apos;annuaire et recevez des demandes de devis.
          </span>
          <span className="mt-1 text-[13px] font-semibold">
            Créer mon compte →
          </span>
        </Link>
        <Link
          href="/inscription?type=COURTIER"
          className="group flex flex-col items-start gap-2 rounded-2xl bg-[var(--pvl-blue)] p-7 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="text-[28px] leading-none">🏦</span>
          <span className="font-display text-[18px] font-extrabold">
            Je suis courtier bancaire
          </span>
          <span className="text-[13.5px] leading-[1.5] text-white/80">
            Figurez dans l&apos;annuaire et recevez des demandes d&apos;étude
            de financement.
          </span>
          <span className="mt-1 text-[13px] font-semibold">
            Créer mon compte →
          </span>
        </Link>
      </div>

      <p className="mt-8 text-center text-[13.5px] text-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="text-blue">
          Se connecter →
        </Link>
      </p>
    </div>
  );
}
