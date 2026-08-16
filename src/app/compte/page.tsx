import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";
import { getListingsByUser } from "@/lib/listings";
import { getFavoriteListingIds, getFavoriteCount } from "@/lib/favorites";
import { getSavedSearchesByUser, savedSearchUrl } from "@/lib/saved-searches";
import { deleteSavedSearchAction } from "@/lib/saved-search-actions";
import { sendMandateAction } from "@/lib/mandate-actions";
import { respondToProposalAction } from "@/lib/proposal-actions";
import { getPendingMandateCount, getClientCount } from "@/lib/mandates";
import { getDevisRequestsForArtisan } from "@/lib/devis";
import { getVisitRequestsForOwner } from "@/lib/visits";
import { getAgencies } from "@/lib/agencies";
import { formatPrix } from "@/lib/format";
import ListingCard from "@/components/ListingCard";
import DevisList from "@/components/DevisList";
import VisitRequestList from "@/components/VisitRequestList";

const MANDATE_LABEL: Record<string, string> = {
  EN_ATTENTE: "en attente",
  ACCEPTEE: "acceptée",
  REFUSEE: "refusée",
};

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon compte — Pévèle Immobilier",
};

const STUBS_PARTICULIER = ["Mes alertes"];
const STUBS_AGENCE = ["Mes collaborateurs"];
const STUBS_ARTISAN: string[] = [];

const TYPE_LABEL: Record<string, string> = {
  PARTICULIER: "PARTICULIER",
  AGENCE: "AGENCE",
  ARTISAN: "ARTISAN",
};

export default async function ComptePage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const isAgence = session.type === "AGENCE";
  const isArtisan = session.type === "ARTISAN";
  const stubs = isAgence ? STUBS_AGENCE : isArtisan ? STUBS_ARTISAN : STUBS_PARTICULIER;
  const [
    mesAnnonces,
    favoriteIds,
    favoriteCount,
    mesRecherches,
    devisRequests,
    visitRequests,
    agencies,
    pendingMandateCount,
    clientCount,
  ] = await Promise.all([
    isArtisan ? Promise.resolve([]) : getListingsByUser(session.userId),
    getFavoriteListingIds(session.userId),
    getFavoriteCount(session.userId),
    getSavedSearchesByUser(session.userId),
    isArtisan ? getDevisRequestsForArtisan(session.userId) : Promise.resolve([]),
    isArtisan ? Promise.resolve([]) : getVisitRequestsForOwner(session.userId),
    getAgencies(),
    isAgence ? getPendingMandateCount(session.userId) : Promise.resolve(0),
    isAgence ? getClientCount(session.userId) : Promise.resolve(0),
  ]);
  const devisItems = devisRequests.map((d) => ({
    id: d.id,
    message: d.message,
    telephone: d.telephone,
    traite: d.traite,
    createdLabel: d.createdAt.toLocaleDateString("fr-FR"),
    authorNom: d.author.nom,
    authorEmail: d.author.email,
  }));
  const visitItems = visitRequests.map((v) => ({
    id: v.id,
    message: v.message,
    telephone: v.telephone,
    preferredDateLabel: v.preferredDate ? v.preferredDate.toLocaleDateString("fr-FR") : null,
    traite: v.traite,
    createdLabel: v.createdAt.toLocaleDateString("fr-FR"),
    authorNom: v.author.nom,
    authorEmail: v.author.email,
    listingId: v.listing.id,
    listingTitre: v.listing.titre,
    listingHref: `/${v.listing.transaction === "VENTE" ? "acheter" : "louer"}/${v.listing.id}`,
  }));

  return (
    <div className="animate-view-in max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-blue">
        MON COMPTE
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">
        {session.nom.toUpperCase()}
      </h1>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR À L&apos;ACCUEIL
      </Link>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1.5 font-mono text-[12px] text-ink">
          <span>EMAIL — {session.email}</span>
          <span>TYPE DE COMPTE — {TYPE_LABEL[session.type]}</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2.5 font-mono text-[11px] font-semibold text-ink transition hover:bg-surface"
          >
            SE DÉCONNECTER
          </button>
        </form>
      </div>

      {isAgence ? (
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/professionnels/${session.userId}`}
            className="font-mono text-[11.5px] font-medium text-blue"
          >
            VOIR MA PAGE AGENCE PUBLIQUE →
          </Link>
          <Link
            href="/compte/agence"
            className="font-mono text-[11.5px] font-medium text-blue"
          >
            MODIFIER MES COORDONNÉES →
          </Link>
          <Link
            href="/compte/agence/statistiques"
            className="font-mono text-[11.5px] font-medium text-blue"
          >
            VOIR MES STATISTIQUES →
          </Link>
        </div>
      ) : null}

      {isAgence ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10.5px] font-medium text-ink">
              MES CLIENTS ({clientCount})
            </span>
            <span className="font-sans text-[13.5px] text-muted">
              {pendingMandateCount > 0
                ? `${pendingMandateCount} demande${pendingMandateCount > 1 ? "s" : ""} de recherche en attente`
                : "Recherches confiées par des particuliers."}
            </span>
          </div>
          <Link
            href="/compte/agence/clients"
            className="font-mono text-[11px] font-medium text-blue"
          >
            VOIR MES CLIENTS →
          </Link>
        </div>
      ) : null}

      {isArtisan ? (
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/artisans/${session.userId}`}
            className="font-mono text-[11.5px] font-medium text-blue"
          >
            VOIR MA FICHE PUBLIQUE →
          </Link>
          <Link
            href="/compte/artisan"
            className="font-mono text-[11.5px] font-medium text-blue"
          >
            MODIFIER MA FICHE →
          </Link>
        </div>
      ) : null}

      {isArtisan ? (
        <div className="mt-8">
          <span className="font-mono text-[10.5px] font-medium text-ink">
            DEMANDES DE DEVIS ({devisItems.length})
          </span>
          {devisItems.length > 0 ? (
            <DevisList items={devisItems} />
          ) : (
            <p className="mt-3 font-sans text-[14px] text-muted">
              Les demandes de devis envoyées depuis votre fiche publique
              apparaîtront ici.
            </p>
          )}
        </div>
      ) : null}

      {!isArtisan ? (
        <div className="mt-8">
          <span className="font-mono text-[10.5px] font-medium text-ink">
            MES ANNONCES ({mesAnnonces.length})
          </span>
          {mesAnnonces.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {mesAnnonces.map((listing) => (
                <div key={listing.id} className="flex flex-col gap-2">
                  <ListingCard
                    listing={listing}
                    isFavorited={favoriteIds.has(listing.id)}
                  />
                  <Link
                    href={`/compte/annonces/${listing.id}`}
                    className="self-start font-mono text-[11px] font-medium text-blue"
                  >
                    MODIFIER CETTE ANNONCE →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 font-sans text-[14px] text-muted">
              Vous n&apos;avez pas encore déposé d&apos;annonce.
            </p>
          )}
        </div>
      ) : null}

      {!isArtisan ? (
        <div className="mt-8">
          <span className="font-mono text-[10.5px] font-medium text-ink">
            DEMANDES DE VISITE ({visitItems.length})
          </span>
          {visitItems.length > 0 ? (
            <VisitRequestList items={visitItems} />
          ) : (
            <p className="mt-3 font-sans text-[14px] text-muted">
              Les demandes de visite envoyées sur vos annonces apparaîtront
              ici.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10.5px] font-medium text-ink">
            MES FAVORIS ({favoriteCount})
          </span>
          <span className="font-sans text-[13.5px] text-muted">
            Visité, à surveiller, contacté — organisez vos coups de cœur.
          </span>
        </div>
        <Link
          href="/compte/favoris"
          className="font-mono text-[11px] font-medium text-blue"
        >
          GÉRER MES FAVORIS →
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10.5px] font-medium text-ink">
            MES RECHERCHES SAUVEGARDÉES ({mesRecherches.length})
          </span>
          <Link
            href="/mon-projet"
            className="font-mono text-[11px] font-medium text-blue"
          >
            + DÉFINIR UN NOUVEAU PROJET →
          </Link>
        </div>
        {mesRecherches.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {mesRecherches.map((s) => {
              const availableAgencies = agencies.filter(
                (a) => !s.mandates.some((m) => m.agencyId === a.id)
              );
              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-[14px] text-ink">
                        {s.transaction === "VENTE" ? "Achat" : "Location"}
                        {s.typeBien ? ` · ${TYPE_BIEN_LABEL[s.typeBien]}` : ""}
                        {s.q ? ` · ${s.q}` : " · toute la Pévèle"}
                        {s.budgetMin != null && s.budgetMax != null
                          ? ` · ${s.budgetMin.toLocaleString("fr-FR")} – ${s.budgetMax.toLocaleString("fr-FR")} €`
                          : s.budgetMax != null
                            ? ` · ≤ ${s.budgetMax.toLocaleString("fr-FR")} €`
                            : s.budgetMin != null
                              ? ` · ≥ ${s.budgetMin.toLocaleString("fr-FR")} €`
                              : ""}
                      </span>
                      <span className="font-mono text-[10.5px] font-medium text-blue">
                        {s.newMatches > 0
                          ? `${s.newMatches} nouvelle${s.newMatches > 1 ? "s" : ""} annonce${s.newMatches > 1 ? "s" : ""} depuis l'enregistrement`
                          : "Aucune nouvelle annonce depuis l'enregistrement"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link
                        href={savedSearchUrl(s)}
                        className="font-mono text-[11px] font-medium text-blue"
                      >
                        RELANCER →
                      </Link>
                      <form action={deleteSavedSearchAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="font-mono text-[11px] font-medium text-muted hover:text-ink"
                        >
                          SUPPRIMER
                        </button>
                      </form>
                    </div>
                  </div>

                  {s.mandates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {s.mandates.map((m) => (
                        <span
                          key={m.id}
                          className="rounded-full bg-surface px-2.5 py-1 font-mono text-[10px] font-medium text-muted"
                        >
                          {m.agencyNom} · {MANDATE_LABEL[m.statut]}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {s.mandates.some((m) => m.proposals.length > 0) ? (
                    <div className="flex flex-col gap-2">
                      {s.mandates
                        .filter((m) => m.proposals.length > 0)
                        .map((m) => (
                          <div key={m.id} className="flex flex-col gap-1.5">
                            <span className="font-mono text-[10px] font-medium text-muted-2">
                              PROPOSITIONS DE {m.agencyNom.toUpperCase()}
                            </span>
                            {m.proposals.map((p) => (
                              <div
                                key={p.proposalId}
                                className="flex flex-col gap-2 rounded-xl bg-[#FBF3DC] px-3 py-2"
                              >
                                <Link
                                  href={`/${p.transaction === "VENTE" ? "acheter" : "louer"}/${p.listingId}`}
                                  className="flex flex-wrap items-center justify-between gap-2 hover:underline"
                                >
                                  <span className="font-sans text-[13px] font-medium text-ink">
                                    {p.titre}
                                  </span>
                                  <span className="font-mono text-[11px] font-semibold text-gold">
                                    {formatPrix(p.prix, p.transaction)}
                                  </span>
                                </Link>
                                {p.statut === "PROPOSEE" ? (
                                  <form
                                    action={respondToProposalAction}
                                    className="flex items-center gap-4"
                                  >
                                    <input type="hidden" name="proposalId" value={p.proposalId} />
                                    <button
                                      type="submit"
                                      name="decision"
                                      value="interesse"
                                      className="font-mono text-[10.5px] font-semibold text-green"
                                    >
                                      ♥ INTÉRESSÉ(E)
                                    </button>
                                    <button
                                      type="submit"
                                      name="decision"
                                      value="pas_interesse"
                                      className="font-mono text-[10.5px] font-medium text-muted hover:text-ink"
                                    >
                                      PAS POUR MOI
                                    </button>
                                  </form>
                                ) : (
                                  <span
                                    className="font-mono text-[10.5px] font-semibold"
                                    style={{
                                      color:
                                        p.statut === "INTERESSE"
                                          ? "var(--pvl-green)"
                                          : "var(--pvl-muted)",
                                    }}
                                  >
                                    {p.statut === "INTERESSE"
                                      ? "♥ Vous avez indiqué être intéressé(e)"
                                      : "Vous avez indiqué que ce bien ne vous intéresse pas"}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  ) : null}

                  {availableAgencies.length > 0 ? (
                    <form
                      action={sendMandateAction}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="savedSearchId" value={s.id} />
                      <select
                        name="agencyId"
                        required
                        defaultValue=""
                        className="rounded-full border border-line bg-white px-3 py-2 font-mono text-[11px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                      >
                        <option value="" disabled>
                          Choisir une agence…
                        </option>
                        {availableAgencies.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.entreprise ?? a.nom}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full border border-line px-3.5 py-2 font-mono text-[11px] font-medium text-ink transition hover:bg-surface"
                      >
                        CONFIER CETTE RECHERCHE →
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 font-sans text-[14px] text-muted">
            Enregistrez une recherche depuis « Acheter » ou « Louer » pour la
            retrouver ici.
          </p>
        )}
      </div>

      {stubs.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stubs.map((label) => (
            <div
              key={label}
              className="rounded-2xl border border-dashed border-line bg-surface p-5"
            >
              <span className="font-mono text-[10.5px] font-medium text-muted">
                {label.toUpperCase()}
              </span>
              <p className="m-0 mt-2 font-sans text-[13px] text-muted-2">
                Bientôt disponible.
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {!isArtisan ? (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface px-6 py-5">
          <span className="font-sans text-[15px] text-ink">
            Prêt à publier votre premier bien ?
          </span>
          <Link
            href="/vendre/deposer"
            className="rounded-full bg-yellow px-5 py-3 font-mono text-[11.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
          >
            + DÉPOSER UNE ANNONCE
          </Link>
        </div>
      ) : null}
    </div>
  );
}
