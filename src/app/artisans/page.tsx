import type { Metadata } from "next";
import Link from "next/link";
import { artisanCategories } from "@/data/artisanCategories";
import { getArtisans } from "@/lib/artisans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artisans & Habitat — Pévèle Immobilier",
  description:
    "L'annuaire des artisans et professionnels de l'habitat en Pévèle : rénovation, toiture, électricité, jardin et plus.",
};

export default async function ArtisansPage({
  searchParams,
}: PageProps<"/artisans">) {
  const params = await searchParams;
  const categorie = typeof params.categorie === "string" ? params.categorie : "";
  const artisans = await getArtisans(categorie || undefined);

  return (
    <div className="animate-fade-up max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-gold">
          Artisans
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          Artisans &amp; habitat
        </h2>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <p className="mt-6 max-w-[70ch] text-[15px] leading-[1.6] text-muted">
        Un espace dédié aux artisans et professionnels de l&apos;habitat en
        Pévèle : présentation, secteur géographique, spécialités et
        coordonnées. De quoi accompagner tout le parcours, de l&apos;achat aux
        travaux.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/artisans"
          className="rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors"
          style={{
            background: categorie === "" ? "var(--pvl-ink)" : "#fff",
            color: categorie === "" ? "#fff" : "var(--pvl-ink)",
            border: `1px solid ${categorie === "" ? "transparent" : "var(--pvl-line)"}`,
          }}
        >
          Tous
        </Link>
        {artisanCategories.map((cat) => (
          <Link
            key={cat}
            href={`/artisans?categorie=${encodeURIComponent(cat)}`}
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
          {artisans.length} artisan{artisans.length > 1 ? "s" : ""}
          {categorie ? ` — ${categorie}` : ""}
        </h3>
        {artisans.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {artisans.map((a) => (
              <Link
                key={a.id}
                href={`/artisans/${a.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="font-display text-xl text-ink">
                  {a.entreprise ?? a.nom}
                </span>
                {a.ville ? (
                  <span className="text-[12px] font-medium text-muted">◉ {a.ville}</span>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {a.categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted"
                    >
                      {c}
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
            Aucun artisan{categorie ? ` dans « ${categorie} »` : ""} pour le
            moment.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-7">
        <span className="text-[13px] font-semibold text-gold">
          Vous êtes artisan en Pévèle ?
        </span>
        <p className="m-0 mt-2 max-w-[60ch] text-[14px] leading-[1.6] text-muted">
          Créez votre compte pour figurer dans l&apos;annuaire et recevoir les
          demandes de devis envoyées directement depuis votre fiche
          publique.{" "}
          <Link href="/inscription" className="text-blue">
            Créer un compte artisan →
          </Link>
        </p>
      </div>
    </div>
  );
}
