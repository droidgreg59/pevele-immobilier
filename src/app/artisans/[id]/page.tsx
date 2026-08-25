import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtisanById } from "@/lib/artisans";
import { getVillageBySlug } from "@/data/villages";
import { getSession } from "@/lib/session";
import DevisRequestForm from "@/components/DevisRequestForm";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/artisans/[id]">): Promise<Metadata> {
  const { id } = await params;
  const artisan = await getArtisanById(id);
  if (!artisan) return {};
  const nom = artisan.entreprise ?? artisan.nom;
  const categorie = artisan.categories[0];
  return {
    title: categorie ? `${nom} — ${categorie} en Pévèle` : `${nom} — Artisan en Pévèle`,
    description:
      artisan.description ??
      `${nom}, artisan${categorie ? ` (${categorie})` : ""} intervenant en Pévèle. Coordonnées et demande de devis sur Pévèle Immobilier.`,
    alternates: {
      canonical: `/artisans/${artisan.id}`,
    },
  };
}

export default async function ArtisanPage({
  params,
}: PageProps<"/artisans/[id]">) {
  const { id } = await params;
  const artisan = await getArtisanById(id);
  if (!artisan) notFound();

  const session = await getSession();
  const isOwner = session?.userId === artisan.id;
  const adresseLine = [artisan.codePostal, artisan.ville].filter(Boolean).join(" ");
  const communes = artisan.communesDesservies
    .map((slug) => getVillageBySlug(slug))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  return (
    <div className="animate-fade-up max-w-[1000px] px-9 py-8">
      <JsonLd
        data={localBusinessJsonLd({
          id: artisan.id,
          path: "artisans",
          nom: artisan.entreprise ?? artisan.nom,
          description: artisan.description,
          telephone: artisan.telephone,
          email: artisan.email,
          adresse: artisan.adresse,
          codePostal: artisan.codePostal,
          ville: artisan.ville,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Artisans", url: "/artisans" },
          { name: artisan.entreprise ?? artisan.nom, url: `/artisans/${artisan.id}` },
        ])}
      />
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-gold">
        Artisan
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">
        {artisan.entreprise ?? artisan.nom}
      </h1>
      <div className="flex flex-wrap gap-4">
        <Link href="/" className="text-[13px] font-semibold text-blue">
          ← Retour à l&apos;accueil
        </Link>
        <Link href="/artisans" className="text-[13px] font-semibold text-blue">
          ← Tous les artisans
        </Link>
        {isOwner ? (
          <Link href="/compte/artisan" className="text-[13px] font-semibold text-blue">
            Modifier ma fiche →
          </Link>
        ) : null}
      </div>

      {artisan.categories.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {artisan.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-[#FBF3DC] px-3 py-1.5 text-[12px] font-semibold text-gold"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}

      {artisan.description ? (
        <p className="mt-6 max-w-[70ch] text-[15px] leading-[1.6] text-muted">
          {artisan.description}
        </p>
      ) : null}

      <div
        className="mt-6 flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm"
        style={{ maxWidth: 420 }}
      >
        <span className="text-[11px] font-semibold text-muted">Coordonnées</span>
        {artisan.adresse || adresseLine ? (
          <p className="m-0 text-[14px] text-ink">
            {artisan.adresse}
            {artisan.adresse && adresseLine ? <br /> : null}
            {adresseLine}
          </p>
        ) : null}
        {artisan.telephone ? (
          <a href={`tel:${artisan.telephone}`} className="text-[14px] text-blue">
            {artisan.telephone}
          </a>
        ) : null}
        <a href={`mailto:${artisan.email}`} className="text-[14px] text-blue">
          {artisan.email}
        </a>
        {artisan.siteWeb ? (
          <a
            href={artisan.siteWeb}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-blue"
          >
            {artisan.siteWeb.replace(/^https?:\/\//, "")}
          </a>
        ) : null}
      </div>

      {communes.length > 0 ? (
        <div className="mt-6">
          <h2 className="m-0 font-display text-xl text-ink">Communes desservies</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {communes.map((v) => (
              <Link
                key={v.slug}
                href={`/villages/${v.slug}`}
                className="rounded-full border border-line bg-white px-3 py-2 text-[12px] font-semibold text-ink transition hover:bg-surface"
              >
                {v.nom}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="m-0 font-display text-xl text-ink">Demande de devis</h2>
        {isOwner ? (
          <p className="mt-3 text-[14px] text-muted">
            Vous ne pouvez pas demander un devis à votre propre fiche.
          </p>
        ) : session ? (
          <div className="mt-3">
            <DevisRequestForm artisanId={artisan.id} />
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            <Link
              href={`/connexion?next=${encodeURIComponent(`/artisans/${artisan.id}`)}`}
              className="text-blue"
            >
              Connectez-vous
            </Link>{" "}
            pour envoyer une demande de devis à cet artisan.
          </p>
        )}
      </div>
    </div>
  );
}
