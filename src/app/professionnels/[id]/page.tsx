import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Globe, ExternalLink, Send, Calculator } from "lucide-react";
import { getAgencyById } from "@/lib/agencies";
import { getPublicListingsByOwner } from "@/lib/listings";
import { getFavoriteListingIds } from "@/lib/favorites";
import { getAgencyReviews, getAgencyReviewStats, getUserReviewForAgency } from "@/lib/reviews";
import { getSavedSearchesByUser } from "@/lib/saved-searches";
import { sendMandateAction } from "@/lib/mandate-actions";
import { getVillageBySlug } from "@/data/villages";
import { getSession } from "@/lib/session";
import ListingCard from "@/components/ListingCard";
import ReviewForm from "@/components/ReviewForm";
import EstimationCta from "@/components/EstimationCta";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/professionnels/[id]">): Promise<Metadata> {
  const { id } = await params;
  const agency = await getAgencyById(id);
  if (!agency) return {};
  const nom = agency.entreprise ?? agency.nom;
  return {
    title: `${nom} — Agence immobilière en Pévèle`,
    description: `${nom}, agence immobilière en Pévèle : annonces à vendre et à louer, coordonnées et avis clients sur Pévèle Immobilier.`,
    alternates: {
      canonical: `/professionnels/${agency.id}`,
    },
    openGraph: {
      title: `${nom} — Agence immobilière en Pévèle`,
      images: agency.logoUrl ? [{ url: agency.logoUrl }] : undefined,
    },
  };
}

function Stars({ note }: { note: number }) {
  return (
    <span className="text-[15px] leading-none" aria-label={`${note} sur 5`}>
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

function searchLabel(search: {
  transaction: "VENTE" | "LOCATION";
  typeBien: "MAISON" | "APPARTEMENT" | "TERRAIN" | null;
  q: string | null;
  villageSlugs: string | null;
  budgetMax: number | null;
}): string {
  const parts = [search.transaction === "VENTE" ? "Achat" : "Location"];
  if (search.typeBien) {
    parts.push(
      search.typeBien === "MAISON" ? "Maison" : search.typeBien === "APPARTEMENT" ? "Appartement" : "Terrain"
    );
  }
  const villageNoms = search.villageSlugs
    ? search.villageSlugs
        .split(",")
        .filter(Boolean)
        .map((slug) => getVillageBySlug(slug)?.nom)
        .filter((n): n is string => Boolean(n))
    : [];
  parts.push(villageNoms.length > 0 ? villageNoms.join(", ") : search.q || "toute la Pévèle");
  if (search.budgetMax != null) parts.push(`≤ ${search.budgetMax.toLocaleString("fr-FR")} €`);
  return parts.join(" · ");
}

const MANDATE_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente de réponse", color: "var(--pvl-muted)" },
  ACCEPTEE: { label: "Acceptée", color: "var(--pvl-green)" },
  REFUSEE: { label: "Déclinée", color: "var(--pvl-muted-2)" },
};

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
  const mySearches =
    session && !isOwner && session.type === "PARTICULIER"
      ? await getSavedSearchesByUser(session.userId)
      : [];
  const searchesWithMandate = mySearches.filter((s) =>
    s.mandates.some((m) => m.agencyId === agency.id)
  );
  const searchesAvailable = mySearches.filter(
    (s) => !s.mandates.some((m) => m.agencyId === agency.id)
  );

  const adresseLine = [agency.codePostal, agency.ville].filter(Boolean).join(" ");

  return (
    <div className="animate-fade-up max-w-[1200px] px-9 py-8">
      <JsonLd
        data={localBusinessJsonLd({
          id: agency.id,
          path: "professionnels",
          nom: agency.entreprise ?? agency.nom,
          telephone: agency.telephone,
          email: agency.email,
          adresse: agency.adresse,
          codePostal: agency.codePostal,
          ville: agency.ville,
          logoUrl: agency.logoUrl,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Professionnels", url: "/professionnels" },
          { name: agency.entreprise ?? agency.nom, url: `/professionnels/${agency.id}` },
        ])}
      />
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          {agency.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agency.logoUrl}
              alt={`Logo ${agency.entreprise ?? agency.nom}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-3xl text-muted-2">
              {(agency.entreprise ?? agency.nom).charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
            Agence
          </span>
          <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[48px]">
            {agency.entreprise ?? agency.nom}
          </h1>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link href="/" className="text-[13px] font-semibold text-blue">
          ← Retour à l&apos;accueil
        </Link>
        <Link href="/professionnels" className="text-[13px] font-semibold text-blue">
          ← Toutes les agences
        </Link>
        {isOwner ? (
          <Link href="/compte/agence" className="text-[13px] font-semibold text-blue">
            Modifier mes coordonnées →
          </Link>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-4">
        <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm" style={{ minWidth: 260 }}>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Coordonnées
          </span>
          {agency.adresse || adresseLine ? (
            <p className="m-0 flex items-start gap-2 text-[14px] text-ink">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-2" strokeWidth={1.75} />
              <span>
                {agency.adresse}
                {agency.adresse && adresseLine ? <br /> : null}
                {adresseLine}
              </span>
            </p>
          ) : null}
          {agency.telephone ? (
            <a href={`tel:${agency.telephone}`} className="flex items-center gap-2 text-[14px] text-blue">
              <Phone className="h-4 w-4 shrink-0 text-muted-2" strokeWidth={1.75} />
              {agency.telephone}
            </a>
          ) : null}
          <a href={`mailto:${agency.email}`} className="flex items-center gap-2 text-[14px] text-blue">
            <Mail className="h-4 w-4 shrink-0 text-muted-2" strokeWidth={1.75} />
            {agency.email}
          </a>
          {agency.siteWeb ? (
            <a
              href={agency.siteWeb}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[14px] text-blue"
            >
              <Globe className="h-4 w-4 shrink-0 text-muted-2" strokeWidth={1.75} />
              {agency.siteWeb.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
          {!agency.adresse && !agency.telephone && !agency.siteWeb ? (
            <p className="m-0 text-[13px] text-muted-2">
              Coordonnées non renseignées.
            </p>
          ) : null}
        </div>

        {agency.googleAvisUrl ? (
          <a
            href={agency.googleAvisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 self-start rounded-full border border-line bg-white px-4 py-3 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
          >
            Voir nos avis Google
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        ) : null}
      </div>

      <p className="mt-4 text-[12px] text-muted-2">
        Sur Pévèle Immobilier depuis {agency.createdAt.getFullYear()}.
      </p>

      {!isOwner ? (
        <div className="mt-8 rounded-2xl border border-line bg-blue-soft p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
              <Send className="h-[19px] w-[19px] text-blue" strokeWidth={1.75} />
            </span>
            <div>
              <span className="block text-[16px] font-bold text-ink">
                Confier ma recherche à cette agence
              </span>
              <p className="m-0 mt-1 max-w-[60ch] text-[13.5px] leading-[1.5] text-muted">
                {agency.entreprise ?? agency.nom} recevra votre recherche et pourra
                vous proposer directement des biens qui correspondent.
              </p>
            </div>
          </div>

          <div className="mt-4">
            {!session ? (
              <Link
                href={`/connexion?next=${encodeURIComponent(`/professionnels/${agency.id}`)}`}
                className="rounded-full bg-blue px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
              >
                Se connecter pour confier ma recherche →
              </Link>
            ) : session.type !== "PARTICULIER" ? (
              <p className="m-0 text-[13.5px] text-muted">
                Cette action est réservée aux comptes particuliers.
              </p>
            ) : searchesAvailable.length > 0 ? (
              <form action={sendMandateAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="agencyId" value={agency.id} />
                <select
                  name="savedSearchId"
                  required
                  defaultValue=""
                  className="rounded-full border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                >
                  <option value="" disabled>
                    Choisir une recherche…
                  </option>
                  {searchesAvailable.map((s) => (
                    <option key={s.id} value={s.id}>
                      {searchLabel(s)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-blue px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
                >
                  Confier cette recherche →
                </button>
              </form>
            ) : mySearches.length === 0 ? (
              <Link
                href="/mon-projet"
                className="rounded-full bg-blue px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
              >
                Définir mon projet →
              </Link>
            ) : (
              <p className="m-0 text-[13.5px] text-muted">
                Toutes vos recherches ont déjà été confiées à cette agence.
              </p>
            )}

            {searchesWithMandate.length > 0 ? (
              <div className="mt-3 flex flex-col gap-1.5">
                {searchesWithMandate.map((s) => {
                  const mandate = s.mandates.find((m) => m.agencyId === agency.id)!;
                  const status = MANDATE_STATUS_LABEL[mandate.statut];
                  return (
                    <div key={s.id} className="flex flex-wrap items-center gap-2 text-[13px] text-ink">
                      <span>{searchLabel(s)}</span>
                      <span className="font-semibold" style={{ color: status.color }}>
                        · {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isOwner ? (
        <div className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBF3DC]">
              <Calculator className="h-[19px] w-[19px] text-gold" strokeWidth={1.75} />
            </span>
            <div>
              <span className="block text-[16px] font-bold text-ink">
                Rdv estimation
              </span>
              <p className="m-0 mt-1 max-w-[60ch] text-[13.5px] leading-[1.5] text-muted">
                Choisissez une date et une heure, {agency.entreprise ?? agency.nom} vous
                recontacte pour valider le rendez-vous à l&apos;adresse de votre bien.
              </p>
            </div>
          </div>

          <div className="mt-4">
            {!session ? (
              <Link
                href={`/connexion?next=${encodeURIComponent(`/professionnels/${agency.id}`)}`}
                className="rounded-full bg-blue px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
              >
                Se connecter pour prendre RDV →
              </Link>
            ) : (
              <EstimationCta agencyId={agency.id} />
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-9">
        <h3 className="m-0 font-display text-xl text-ink">
          Annonces en ligne ({listings.length})
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
          <p className="mt-3 text-[14px] text-muted">
            Aucune annonce en ligne pour le moment.
          </p>
        )}
      </div>

      <div className="mt-9">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="m-0 font-display text-xl text-ink">Avis Pévèle</h3>
          {reviewStats.average !== null ? (
            <span className="flex items-center gap-2 text-[13px] text-muted">
              <Stars note={Math.round(reviewStats.average)} />
              {reviewStats.average} / 5 ({reviewStats.count} avis)
            </span>
          ) : (
            <span className="text-[13px] text-muted-2">
              Pas encore d&apos;avis
            </span>
          )}
        </div>

        {reviews.length > 0 ? (
          <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                    {r.isOfficial ? "Pévèle Immobilier" : r.author.nom}
                    {r.isOfficial ? (
                      <span className="rounded-full bg-blue-soft px-2 py-0.5 text-[10.5px] font-semibold text-blue">
                        ✓ Avis officiel
                      </span>
                    ) : null}
                  </span>
                  <Stars note={r.note} />
                </div>
                <p className="m-0 mt-2 text-[13.5px] leading-[1.55] text-muted">
                  {r.commentaire}
                </p>
                <span className="mt-2 block text-[11.5px] text-muted-2">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  {r.updatedAt > r.createdAt ? " · modifié" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 max-w-[560px] rounded-2xl border border-line bg-white p-5 shadow-sm">
          <span className="block text-[15px] font-bold text-ink">
            {isOwner
              ? "Votre agence"
              : myReview
                ? "Modifier mon avis"
                : "Laisser un avis"}
          </span>
          <div className="mt-3">
            {isOwner ? (
              <p className="m-0 text-[13.5px] text-muted">
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
              <p className="m-0 text-[13.5px] text-muted">
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
    </div>
  );
}
