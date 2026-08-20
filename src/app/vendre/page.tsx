import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Home as HomeIcon, Users } from "lucide-react";
import { packs } from "@/data/packs";
import PackCard from "@/components/PackCard";

export const metadata: Metadata = {
  title: "Vendre en Pévèle — Pévèle Immobilier",
  description:
    "Composez votre accompagnement pour vendre votre bien en Pévèle : annonce seule, ou services à la carte.",
};

const ACTIONS = [
  {
    href: "/estimer",
    icon: Calculator,
    iconBg: "var(--pvl-blue-soft)",
    iconColor: "var(--pvl-blue)",
    title: "Demander une estimation",
    desc: "Gratuite, en 30 secondes, fondée sur les ventes DVF réelles de votre village.",
  },
  {
    href: "/vendre/deposer",
    icon: HomeIcon,
    iconBg: "#FBF3DC",
    iconColor: "var(--pvl-gold)",
    title: "Publier mon annonce",
    desc: "En ligne en quelques minutes, sans commission si vous vendez seul.",
  },
  {
    href: "/professionnels",
    icon: Users,
    iconBg: "#EAF3E8",
    iconColor: "var(--pvl-green)",
    title: "Être accompagné",
    desc: "Confiez tout ou partie de la vente à une agence de la Pévèle.",
  },
];

export default function VendrePage() {
  return (
    <div className="animate-fade-up max-w-[1200px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-gold">
        Vendre
      </span>
      <h1 className="mt-3 font-display text-[36px] font-extrabold leading-[1.05] text-ink sm:text-[44px]">
        Vendez votre bien, à votre rythme
      </h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <p className="mt-5 max-w-[70ch] text-[15px] leading-[1.6] text-muted">
        Au lieu de choisir entre vendre seul ou confier entièrement votre bien
        à une agence, composez votre accompagnement : uniquement les services
        dont vous avez besoin, pas de commission imposée sur ce que vous ne
        voulez pas.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue hover:shadow-md"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: action.iconBg }}
              >
                <Icon className="h-[22px] w-[22px]" style={{ color: action.iconColor }} strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-[16.5px] font-bold text-ink">{action.title}</span>
                <span className="mt-1 block text-[13px] leading-[1.5] text-muted">{action.desc}</span>
              </span>
              <span className="mt-auto text-[13px] font-semibold text-blue transition group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-11">
        <h2 className="m-0 font-display text-2xl text-ink">Composez votre accompagnement</h2>
        <p className="mt-2 max-w-[70ch] text-[14.5px] leading-[1.6] text-muted">
          Quatre formules, du simple dépôt d&apos;annonce à l&apos;accompagnement complet.
          Choisissez, vous pourrez toujours ajuster ensuite.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {packs.map((pack) => (
            <PackCard key={pack.slug} pack={pack} />
          ))}
        </div>
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface px-6 py-5">
        <span className="text-[15px] text-ink">
          Pas sûr de votre choix ?{" "}
          <b>Déposez votre annonce, vous ajusterez l&apos;accompagnement après.</b>
        </span>
        <Link
          href="/vendre/deposer"
          className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          + Déposer une annonce
        </Link>
      </div>
    </div>
  );
}
