import type { Metadata } from "next";
import Link from "next/link";
import { getAgencies } from "@/lib/agencies";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Professionnels — Pévèle Immobilier",
  description:
    "Les agences immobilières partenaires de la Pévèle et leurs annonces en ligne.",
};

const AVANTAGES = [
  "Une page agence publique, avec vos annonces réunies au même endroit que celles des particuliers",
  "Le même processus de vérification que pour les particuliers — pas de passe-droit",
  "Un hub clients : recherches confiées par des particuliers, propositions et statistiques d'activité",
  "Des avis publiés directement par vos clients sur votre page",
];

export default async function ProfessionnelsPage() {
  const agencies = await getAgencies();

  return (
    <div className="animate-fade-up max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-blue">
          PROFESSIONNELS
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          LES AGENCES DE LA PÉVÈLE
        </h2>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR À L&apos;ACCUEIL
      </Link>

      <p className="mt-6 max-w-[70ch] font-sans text-[15px] leading-[1.6] text-muted">
        Pévèle-Immobilier.fr n&apos;a pas vocation à concurrencer les agences
        de la Pévèle, mais à devenir le portail local sur lequel elles ont
        intérêt à être présentes.
      </p>

      <div className="mt-9">
        <h3 className="m-0 font-display text-xl text-ink">
          LES AGENCES ({agencies.length})
        </h3>
        {agencies.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agencies.map((a) => (
              <Link
                key={a.id}
                href={`/professionnels/${a.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
                    {a.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.logoUrl}
                        alt=""
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
                <span className="font-mono text-[10.5px] font-medium text-muted">
                  {a.listingCount} annonce{a.listingCount > 1 ? "s" : ""} en ligne
                </span>
                <span className="mt-auto font-mono text-[10.5px] font-medium text-blue">
                  VOIR LA PAGE →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 font-sans text-[14px] text-muted">
            Aucune agence inscrite pour le moment.
          </p>
        )}
      </div>

      <ul className="mt-9 flex max-w-[60ch] list-none flex-col gap-2.5 p-0">
        {AVANTAGES.map((item) => (
          <li
            key={item}
            className="rounded-xl bg-surface px-4 py-3.5 font-sans text-[14px] text-ink"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-7">
        <span className="font-mono text-[10.5px] font-medium text-blue">
          IMPORT XML AC3 / IMMOFACILE
        </span>
        <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
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
