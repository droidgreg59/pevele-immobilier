import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgencyById } from "@/lib/agencies";
import { getPublicListingsByOwner } from "@/lib/listings";
import { getFavoriteListingIds } from "@/lib/favorites";
import { getAgencyReviews, getAgencyReviewStats, getUserReviewForAgency } from "@/lib/reviews";
import { getSession } from "@/lib/session";
import ListingCard from "@/components/ListingCard";
import ReviewForm from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/professionnels/[id]">): Promise<Metadata> {
  const { id } = await params;
  const agency = await getAgencyById(id);
  if (!agency) return {};
  return {
    title: `${agency.entreprise ?? agency.nom} — Pévèle Immobilier`,
    description: `Les annonces de ${agency.entreprise ?? agency.nom} sur Pévèle Immobilier.`,
  };
}

function Stars({ note }: { note: number }) {
  return (
    <span className="font-sans text-[15px] leading-none" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= note ? "var(--pvl-yellow)" : "var(--pvl-line)" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default async function AgencyPage({
  params,
}: PageProps<"/professionnels/[id]">) {
  const { id } = await params;
  const agency = await getAgencyById(id);
  if (!agency) notFound();

  const [listings, session, reviews, reviewStats] = await Promise.all([
    getPublicListingsByOwner(agency.id),
    getSession(),
    getAgencyReviews(agency.id),
    getAgencyReviewStats(agency.id),
  ]);
  const favoriteIds = session
    ? await getFavoriteListingIds(session.userId)
    : new Set<string>();
  const isOwner = session?.userId === agency.id;
  const myReview = session && !isOwner
    ? await getUserReviewForAgency(agency.id, session.userId)
    : null;

  const adresseLine = [agency.codePostal, agency.ville].filter(Boolean).join(" ");

  return (
    <div className="animate-view-in max-w-[1200px] px-9 py-8">
      <span className="border-2 border-blue px-3 py-1.5 font-mono text-sm text-blue">
        AGENCE
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[48px]">
        {(agency.entreprise ?? agency.nom).toUpperCase()}
      </h1>
      <div className="flex flex-wrap gap-4">
        <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
          ← RETOUR AU PLAN
        </Link>
        <Link
          href="/professionnels"
          className="font-mono text-[11.5px] font-medium text-blue"
        >
          ← TOUTES LES AGENCES
        </Link>
        {isOwner ? (
          <Link
            href="/compte/agence"
            className="font-mono text-[11.5px] font-medium text-blue"
          >
            MODIFIER MES COORDONNÉES →
          </Link>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-4">
        <div className="flex flex-1 flex-col gap-2 border-2 border-ink bg-white p-5" style={{ minWidth: 260 }}>
          <span className="font-mono text-[10.5px] font-medium text-muted">
            COORDONNÉES
          </span>
          {agency.adresse || adresseLine ? (
            <p className="m-0 font-sans text-[14px] text-ink">
              {agency.adresse}
              {agency.adresse && adresseLine ? <br /> : null}
              {adresseLine}
            </p>
          ) : null}
          {agency.telephone ? (
            <a href={`tel:${agency.telephone}`} className="font-sans text-[14px] text-blue">
              {agency.telephone}
            </a>
          ) : null}
          <a href={`mailto:${agency.email}`} className="font-sans text-[14px] text-blue">
            {agency.email}
          </a>
          {agency.siteWeb ? (
            <a
              href={agency.siteWeb}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-[14px] text-blue"
            >
              {agency.siteWeb.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
          {!agency.adresse && !agency.telephone && !agency.siteWeb ? (
            <p className="m-0 font-sans text-[13px] text-muted-2">
              Coordonnées non renseignées.
            </p>
          ) : null}
        </div>

        {agency.googleAvisUrl ? (
          <a
            href={agency.googleAvisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 self-start border-2 border-ink bg-white px-4 py-3.5 font-mono text-[11px] font-semibold text-ink hover:bg-[#FDEBC2]"
          >
            VOIR NOS AVIS GOOGLE →
          </a>
        ) : null}
      </div>

      <p className="mt-4 font-mono text-[11px] text-muted-2">
        Sur Pévèle Immobilier depuis {agency.createdAt.getFullYear()}.
      </p>

      <div className="mt-9">
        <h3 className="m-0 font-display text-xl text-ink">
          ANNONCES EN LIGNE ({listings.length})
        </h3>
        {listings.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorited={favoriteIds.has(listing.id)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 font-sans text-[14px] text-muted">
            Aucune annonce en ligne pour le moment.
          </p>
        )}
      </div>

      <div className="mt-9">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="m-0 font-display text-xl text-ink">AVIS PÉVÈLE</h3>
          {reviewStats.average !== null ? (
            <span className="flex items-center gap-2 font-mono text-[12px] text-muted">
              <Stars note={Math.round(reviewStats.average)} />
              {reviewStats.average} / 5 ({reviewStats.count} avis)
            </span>
          ) : (
            <span className="font-mono text-[12px] text-muted-2">
              Pas encore d&apos;avis
            </span>
          )}
        </div>

        {reviews.length > 0 ? (
          <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
            {reviews.map((r) => (
              <li key={r.id} className="border-2 border-ink bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-sans text-[13.5px] font-semibold text-ink">
                    {r.author.nom}
                  </span>
                  <Stars note={r.note} />
                </div>
                <p className="m-0 mt-2 font-sans text-[13.5px] leading-[1.55] text-muted">
                  {r.commentaire}
                </p>
                <span className="mt-2 block font-mono text-[10px] text-muted-2">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  {r.updatedAt > r.createdAt ? " · modifié" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 max-w-[560px] border-2 border-dashed border-blue bg-white p-5">
          {isOwner ? (
            <p className="m-0 font-sans text-[13.5px] text-muted">
              Vous ne pouvez pas noter votre propre agence.
            </p>
          ) : session ? (
            <ReviewForm
              agencyId={agency.id}
              existingReview={
                myReview ? { note: myReview.note, commentaire: myReview.commentaire } : null
              }
            />
          ) : (
            <p className="m-0 font-sans text-[13.5px] text-muted">
              <Link
                href={`/connexion?next=${encodeURIComponent(`/professionnels/${agency.id}`)}`}
                className="text-blue"
              >
                Connectez-vous
              </Link>{" "}
              pour laisser un avis sur cette agence.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
