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
    <div className="animate-view-in max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="border-2 border-gold px-3 py-1.5 font-mono text-sm text-gold">
          PIÈCE 08
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          ARTISANS &amp; HABITAT
        </h2>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <p className="mt-6 max-w-[70ch] font-sans text-[15px] leading-[1.6] text-muted">
        Un espace dédié aux artisans et professionnels de l&apos;habitat en
        Pévèle : présentation, secteur géographique, spécialités et
        coordonnées. De quoi accompagner tout le parcours, de l&apos;achat aux
        travaux.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/artisans"
          className="border-[1.5px] px-3.5 py-2.5 font-mono text-[11px] font-medium"
          style={{
            borderColor: "var(--pvl-ink)",
            background: categorie === "" ? "var(--pvl-ink)" : "#fff",
            color: categorie === "" ? "#fff" : "var(--pvl-ink)",
          }}
        >
          TOUS
        </Link>
        {artisanCategories.map((cat) => (
          <Link
            key={cat}
            href={`/artisans?categorie=${encodeURIComponent(cat)}`}
            className="border-[1.5px] px-3.5 py-2.5 font-mono text-[11px] font-medium"
            style={{
              borderColor: "var(--pvl-ink)",
              background: categorie === cat ? "var(--pvl-ink)" : "#fff",
              color: categorie === cat ? "#fff" : "var(--pvl-ink)",
            }}
          >
            {cat}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="m-0 font-display text-xl text-ink">
          {artisans.length} ARTISAN{artisans.length > 1 ? "S" : ""}
          {categorie ? ` — ${categorie.toUpperCase()}` : ""}
        </h3>
        {artisans.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {artisans.map((a) => (
              <Link
                key={a.id}
                href={`/artisans/${a.id}`}
                className="flex flex-col gap-2 border-2 border-ink bg-white p-5 transition-colors hover:bg-[#FDEBC2]"
              >
                <span className="font-display text-xl text-gold">
                  {a.entreprise ?? a.nom}
                </span>
                {a.ville ? (
                  <span className="font-mono text-[10.5px] text-muted">
                    ◉ {a.ville.toUpperCase()}
                  </span>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {a.categories.map((c) => (
                    <span
                      key={c}
                      className="border border-line bg-[#F7F4EA] px-2 py-0.5 font-mono text-[9.5px] text-muted"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <span className="mt-auto font-mono text-[10.5px] font-medium text-blue">
                  VOIR LA FICHE →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 font-sans text-[14px] text-muted">
            Aucun artisan{categorie ? ` dans « ${categorie} »` : ""} pour le
            moment.
          </p>
        )}
      </div>

      <div className="mt-8 border-2 border-dashed border-gold bg-white p-7">
        <span className="font-mono text-[10.5px] font-medium text-gold">
          VOUS ÊTES ARTISAN EN PÉVÈLE ?
        </span>
        <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
          Créez votre compte pour figurer dans l&apos;annuaire — les demandes
          de devis en ligne arrivent dans une prochaine étape.{" "}
          <Link href="/inscription" className="text-blue">
            Créer un compte artisan →
          </Link>
        </p>
      </div>
    </div>
  );
}
