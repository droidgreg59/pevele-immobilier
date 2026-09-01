import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ClipboardCheck, ShieldCheck, Users, Star } from "lucide-react";
import { getAgencies } from "@/lib/agencies";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agences immobilières en Pévèle",
  description:
    "L'annuaire des agences immobilières partenaires de la Pévèle : coordonnées, annonces en ligne et avis clients.",
  alternates: {
    canonical: "/professionnels",
  },
};

const AVANTAGES = [
  {
    icon: ClipboardCheck,
    text: "Une page agence publique, avec vos annonces réunies au même endroit que celles des particuliers",
  },
  {
    icon: ShieldCheck,
    text: "Le même processus de vérification que pour les particuliers — pas de passe-droit",
  },
  {
    icon: Users,
    text: "Un hub clients : recherches confiées par des particuliers, propositions et statistiques d'activité",
  },
  {
    icon: Star,
    text: "Des avis publiés directement par vos clients sur votre page",
  },
];

export default async function ProfessionnelsPage() {
  const agencies = await getAgencies();

  return (
    <div className="animate-fade-up max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
          Professionnels
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          Les agences de la Pévèle
        </h2>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <p className="mt-6 max-w-[70ch] text-[15px] leading-[1.6] text-muted">
        Pévèle-Immobilier.fr n&apos;a pas vocation à concurrencer les agences
        de la Pévèle, mais à devenir le portail local sur lequel elles ont
        intérêt à être présentes. Vous vendez ou cherchez un bien ? Confiez
        votre projet à l&apos;une d&apos;elles, ou laissez un avis sur celle
        qui vous a accompagné.
      </p>

      <div className="mt-9">
        <h3 className="m-0 font-display text-xl text-ink">
          Les agences ({agencies.length})
        </h3>
        {agencies.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agencies.map((a) => (
              <Link
                key={a.id}
                href={`/professionnels/${a.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
                    {a.logoUrl ? (
                      <Image
                        src={a.logoUrl}
                        alt={`Logo ${a.entreprise ?? a.nom}`}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-display text-base text-muted-2">
                        {(a.entreprise ?? a.nom).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-display text-xl text-blue">
                    {a.entreprise ?? a.nom}
                  </span>
                </div>
                <span className="text-[12.5px] font-medium text-muted">
                  {a.listingCount} annonce{a.listingCount > 1 ? "s" : ""} en ligne
                </span>
                <span className="mt-auto text-[12.5px] font-semibold text-blue">
                  Voir la page →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Aucune agence inscrite pour le moment.
          </p>
        )}
      </div>

      <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {AVANTAGES.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3.5"
          >
            <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-blue" strokeWidth={1.75} />
            <span className="text-[14px] leading-[1.5] text-ink">{text}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-7">
        <span className="text-[13px] font-semibold text-blue">
          Import XML AC3 / Immofacile
        </span>
        <p className="m-0 mt-2 max-w-[60ch] text-[14px] leading-[1.6] text-muted">
          Votre logiciel de transaction exporte déjà vos biens au format AC3 ?
          Connectez le flux depuis votre compte agence et synchronisez votre
          catalogue en un clic, sans ressaisie. Vous êtes une agence en
          Pévèle ?{" "}
          <Link href="/inscription" className="text-blue">
            Créez votre compte professionnel →
          </Link>
        </p>
      </div>
    </div>
  );
}
