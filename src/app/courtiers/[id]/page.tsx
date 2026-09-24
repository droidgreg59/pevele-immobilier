import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourtierById } from "@/lib/courtiers";
import { getVillageBySlug } from "@/data/villages";
import { getSession } from "@/lib/session";
import FinancingRequestForm from "@/components/FinancingRequestForm";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/courtiers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const courtier = await getCourtierById(id);
  if (!courtier) return {};
  const nom = courtier.entreprise ?? courtier.nom;
  const categorie = courtier.categories[0];
  return {
    title: `${nom} — Courtier bancaire en Pévèle`,
    description:
      courtier.description ??
      `${nom}, courtier en financement immobilier${categorie ? ` (${categorie})` : ""} intervenant en Pévèle. Coordonnées et demande d'étude de financement sur Pévèle Immobilier.`,
    alternates: {
      canonical: `/courtiers/${courtier.id}`,
    },
  };
}

export default async function CourtierPage({
  params,
}: PageProps<"/courtiers/[id]">) {
  const { id } = await params;
  const courtier = await getCourtierById(id);
  if (!courtier) notFound();

  const session = await getSession();
  const isOwner = session?.userId === courtier.id;
  const adresseLine = [courtier.codePostal, courtier.ville].filter(Boolean).join(" ");
  const communes = courtier.communesDesservies
    .map((slug) => getVillageBySlug(slug))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  return (
    <div className="animate-fade-up mx-auto max-w-[1000px] px-9 py-8">
      <JsonLd
        data={localBusinessJsonLd({
          id: courtier.id,
          path: "courtiers",
          nom: courtier.entreprise ?? courtier.nom,
          description: courtier.description,
          telephone: courtier.telephone,
          email: courtier.email,
          adresse: courtier.adresse,
          codePostal: courtier.codePostal,
          ville: courtier.ville,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Courtiers", url: "/courtiers" },
          { name: courtier.entreprise ?? courtier.nom, url: `/courtiers/${courtier.id}` },
        ])}
      />
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Courtier
      </span>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="m-0 font-display text-[36px] text-ink sm:text-[44px]">
          {courtier.entreprise ?? courtier.nom}
        </h1>
        <span className="rounded-full bg-[#EAF3E8] px-3 py-1 text-[12px] font-semibold text-green">
          ✓ Courtier vérifié
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link href="/" className="text-[13px] font-semibold text-blue">
          ← Retour à l&apos;accueil
        </Link>
        <Link href="/courtiers" className="text-[13px] font-semibold text-blue">
          ← Tous les courtiers
        </Link>
        {isOwner ? (
          <Link href="/compte/courtier/profil" className="text-[13px] font-semibold text-blue">
            Modifier ma fiche →
          </Link>
        ) : null}
      </div>

      {courtier.categories.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {courtier.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-blue-soft px-3 py-1.5 text-[12px] font-semibold text-blue"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}

      {courtier.description ? (
        <p className="mt-6 max-w-[70ch] text-[15px] leading-[1.6] text-muted">
          {courtier.description}
        </p>
      ) : null}

      <div
        className="mt-6 flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm"
        style={{ maxWidth: 420 }}
      >
        <span className="text-[11px] font-semibold text-muted">Coordonnées</span>
        {courtier.adresse || adresseLine ? (
          <p className="m-0 text-[14px] text-ink">
            {courtier.adresse}
            {courtier.adresse && adresseLine ? <br /> : null}
            {adresseLine}
          </p>
        ) : null}
        {courtier.telephone ? (
          <a href={`tel:${courtier.telephone}`} className="text-[14px] text-blue">
            {courtier.telephone}
          </a>
        ) : null}
        <a href={`mailto:${courtier.email}`} className="text-[14px] text-blue">
          {courtier.email}
        </a>
        {courtier.siteWeb ? (
          <a
            href={courtier.siteWeb}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-blue"
          >
            {courtier.siteWeb.replace(/^https?:\/\//, "")}
          </a>
        ) : null}
      </div>

      {communes.length > 0 ? (
        <div className="mt-6">
          <h2 className="m-0 font-display text-xl text-ink">Zones d&apos;intervention</h2>
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
        <h2 className="m-0 font-display text-xl text-ink">Demande d&apos;étude de financement</h2>
        {isOwner ? (
          <p className="mt-3 text-[14px] text-muted">
            Vous ne pouvez pas demander une étude à votre propre fiche.
          </p>
        ) : session ? (
          <div className="mt-3">
            <FinancingRequestForm courtierId={courtier.id} />
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            <Link
              href={`/connexion?next=${encodeURIComponent(`/courtiers/${courtier.id}`)}`}
              className="text-blue"
            >
              Connectez-vous
            </Link>{" "}
            pour envoyer une demande d&apos;étude de financement à ce courtier.
          </p>
        )}
      </div>
    </div>
  );
}
