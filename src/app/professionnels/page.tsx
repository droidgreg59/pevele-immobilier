import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { getAgencies, getPendingAgencyPlaceholders } from "@/lib/agencies";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agences immobilières en Pévèle",
  description:
    "L'annuaire des agences immobilières partenaires de la Pévèle : coordonnées, annonces en ligne et avis clients.",
  alternates: {
    canonical: "/professionnels",
  },
};

export default async function ProfessionnelsPage() {
  const [agencies, pending] = await Promise.all([
    getAgencies(),
    getPendingAgencyPlaceholders(),
  ]);

  return (
    <div className="animate-fade-up mx-auto max-w-[1100px] px-9 py-8">
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
          Les professionnels de la Pévèle
        </h3>
        <p className="mt-1 text-[13px] font-medium text-muted">
          {agencies.length} agence{agencies.length > 1 ? "s" : ""} vérifiée
          {agencies.length > 1 ? "s" : ""}
          {pending.length > 0
            ? ` · ${pending.length} intégration${pending.length > 1 ? "s" : ""} en cours`
            : ""}
        </p>
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
                  {a.verified ? (
                    <span className="rounded-full bg-[#EAF3E8] px-2 py-0.5 text-[10.5px] font-semibold text-green">
                      ✓ Vérifiée
                    </span>
                  ) : null}
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

      {pending.length > 0 ? (
        <div className="mt-9">
          <h3 className="m-0 font-display text-xl text-ink">
            Professionnels en cours d&apos;intégration
          </h3>
          <p className="mt-1 max-w-[64ch] text-[13px] leading-[1.5] text-muted">
            Ces comptes ont été créés et sont en cours de vérification —
            leurs coordonnées complètes apparaîtront une fois validées.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pending.map((p, i) => (
              <div
                key={i}
                className="flex cursor-default flex-col gap-2 rounded-2xl border border-dashed border-line bg-surface p-5 opacity-80"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white">
                    <Building2 className="h-5 w-5 text-muted-2" strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-lg text-muted">
                    Agence immobilière{p.ville ? ` — ${p.ville}` : ""}
                  </span>
                  <span className="rounded-full bg-[#FBF3DC] px-2 py-0.5 text-[10.5px] font-semibold text-gold">
                    Validation en cours
                  </span>
                </div>
                <span className="text-[12.5px] font-medium text-muted-2">
                  Profil professionnel en cours d&apos;intégration
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-9 text-[13px] text-muted">
        Vous êtes une agence en Pévèle ?{" "}
        <Link href="/inscription" className="font-semibold text-blue">
          Créez votre compte professionnel →
        </Link>
      </p>
    </div>
  );
}
