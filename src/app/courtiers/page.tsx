import type { Metadata } from "next";
import Link from "next/link";
import { courtierSpecialites } from "@/data/courtierSpecialites";
import { getVerifiedCourtiers } from "@/lib/courtiers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courtiers bancaires en Pévèle",
  description:
    "L'annuaire des courtiers bancaires vérifiés de la Pévèle : demandez une étude de financement gratuite pour votre projet immobilier.",
  alternates: {
    canonical: "/courtiers",
  },
};

export default async function CourtiersPage({
  searchParams,
}: PageProps<"/courtiers">) {
  const params = await searchParams;
  const categorie = typeof params.categorie === "string" ? params.categorie : "";
  const courtiers = await getVerifiedCourtiers(categorie || undefined);

  return (
    <div className="animate-fade-up mx-auto max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
          Courtiers
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          Courtiers bancaires
        </h2>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <p className="mt-6 max-w-[70ch] text-[15px] leading-[1.6] text-muted">
        Des courtiers en financement immobilier vérifiés pour vous accompagner
        dans le montage de votre dossier : recherche du meilleur taux,
        négociation avec les banques, suivi jusqu&apos;au déblocage des fonds.
        Demande d&apos;étude gratuite et sans engagement.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/courtiers"
          className="rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors"
          style={{
            background: categorie === "" ? "var(--pvl-ink)" : "#fff",
            color: categorie === "" ? "#fff" : "var(--pvl-ink)",
            border: `1px solid ${categorie === "" ? "transparent" : "var(--pvl-line)"}`,
          }}
        >
          Tous
        </Link>
        {courtierSpecialites.map((cat) => (
          <Link
            key={cat}
            href={`/courtiers?categorie=${encodeURIComponent(cat)}`}
            className="rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors"
            style={{
              background: categorie === cat ? "var(--pvl-ink)" : "#fff",
              color: categorie === cat ? "#fff" : "var(--pvl-ink)",
              border: `1px solid ${categorie === cat ? "transparent" : "var(--pvl-line)"}`,
            }}
          >
            {cat}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="m-0 font-display text-xl text-ink">
          {courtiers.length} courtier{courtiers.length > 1 ? "s" : ""}
          {categorie ? ` — ${categorie}` : ""}
        </h3>
        {courtiers.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {courtiers.map((c) => (
              <Link
                key={c.id}
                href={`/courtiers/${c.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex items-center gap-2 font-display text-xl text-ink">
                  {c.entreprise ?? c.nom}
                  <span className="rounded-full bg-[#EAF3E8] px-2 py-0.5 text-[10px] font-semibold text-green">
                    ✓ Vérifié
                  </span>
                </span>
                {c.ville ? (
                  <span className="text-[12px] font-medium text-muted">◉ {c.ville}</span>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {c.categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                <span className="mt-auto text-[12.5px] font-semibold text-blue">
                  Voir la fiche →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Aucun courtier{categorie ? ` dans « ${categorie} »` : ""} vérifié
            pour le moment.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-7">
        <span className="text-[13px] font-semibold text-blue">
          Vous êtes courtier en Pévèle ?
        </span>
        <p className="m-0 mt-2 max-w-[60ch] text-[14px] leading-[1.6] text-muted">
          Créez votre compte pour figurer dans l&apos;annuaire et recevoir les
          demandes d&apos;étude de financement envoyées directement depuis
          votre fiche publique.{" "}
          <Link href="/inscription?type=COURTIER" className="text-blue">
            Créer un compte courtier →
          </Link>
        </p>
      </div>
    </div>
  );
}
