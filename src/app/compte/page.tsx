import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logoutAction, resendEmailVerificationAction } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { getListingsByUser } from "@/lib/listings";
import { getFavoriteListingIds, getFavoriteCount } from "@/lib/favorites";
import { getSavedSearchesByUser, savedSearchUrl } from "@/lib/saved-searches";
import { deleteSavedSearchAction } from "@/lib/saved-search-actions";
import { sendMandateAction } from "@/lib/mandate-actions";
import { respondToProposalAction } from "@/lib/proposal-actions";
import { getPendingMandateCount, getClientCount } from "@/lib/mandates";
import { getDevisRequestsForArtisan } from "@/lib/devis";
import { getVisitRequestsForOwner } from "@/lib/visits";
import {
  getPendingOpenHouseRegistrationsForOwner,
  getOpenHouseRegistrationsByUser,
} from "@/lib/open-house";
import { getEstimationRequestsForAgency, getEstimationRequestsByUser } from "@/lib/estimations";
import { getAgencies } from "@/lib/agencies";
import { isUserAdmin, getPendingListings } from "@/lib/admin";
import { getVillageBySlug } from "@/data/villages";
import { formatPrix } from "@/lib/format";
import ListingCard from "@/components/ListingCard";
import DevisList from "@/components/DevisList";
import VisitRequestList from "@/components/VisitRequestList";
import OpenHouseRegistrationList from "@/components/OpenHouseRegistrationList";
import EstimationList from "@/components/EstimationList";

function formatCreneau(start: Date, end: Date): string {
  const day = start.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const time = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time(start)} – ${time(end)}`;
}

const MANDATE_LABEL: Record<string, string> = {
  EN_ATTENTE: "en attente",
  ACCEPTEE: "acceptée",
  REFUSEE: "refusée",
};

const TYPE_MAISON_LABEL: Record<string, string> = {
  INDIVIDUELLE: "individuelle",
  SEMI_INDIVIDUELLE: "semi-individuelle",
  MITOYENNE: "mitoyenne",
};

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

function locationLabel(villageSlugs: string | null, q: string | null): string {
  if (villageSlugs) {
    const noms = villageSlugs
      .split(",")
      .filter(Boolean)
      .map((slug) => getVillageBySlug(slug)?.nom)
      .filter((n): n is string => Boolean(n));
    if (noms.length > 0) return noms.join(", ");
  }
  return q || "toute la Pévèle";
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon compte",
};

const STUBS_PARTICULIER: string[] = [];
const STUBS_AGENCE = ["Mes collaborateurs"];
const STUBS_ARTISAN: string[] = [];

const TYPE_LABEL: Record<string, string> = {
  PARTICULIER: "Particulier",
  AGENCE: "Agence",
  ARTISAN: "Artisan",
};

export default async function ComptePage({ searchParams }: PageProps<"/compte">) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const sp = await searchParams;
  const verifEmailRenvoye = sp.verif === "renvoye";
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { emailVerifiedAt: true, verifStatut: true },
  });
  const emailNonVerifie = currentUser != null && currentUser.emailVerifiedAt == null;

  const isAgence = session.type === "AGENCE";
  const agenceNonVerifiee =
    isAgence &&
    (currentUser?.verifStatut === "NON_SOUMISE" || currentUser?.verifStatut === "REFUSEE");
  const isArtisan = session.type === "ARTISAN";
  const stubs = isAgence ? STUBS_AGENCE : isArtisan ? STUBS_ARTISAN : STUBS_PARTICULIER;
  const [
    mesAnnonces,
    favoriteIds,
    favoriteCount,
    mesRecherches,
    devisRequests,
    visitRequests,
    openHouseReceived,
    myOpenHouseRegistrations,
    estimationRequests,
    myEstimationRequests,
    agencies,
    pendingMandateCount,
    clientCount,
    isAdmin,
  ] = await Promise.all([
    isArtisan ? Promise.resolve([]) : getListingsByUser(session.userId),
    getFavoriteListingIds(session.userId),
    getFavoriteCount(session.userId),
    getSavedSearchesByUser(session.userId),
    isArtisan ? getDevisRequestsForArtisan(session.userId) : Promise.resolve([]),
    isArtisan ? Promise.resolve([]) : getVisitRequestsForOwner(session.userId),
    isArtisan
      ? Promise.resolve([])
      : getPendingOpenHouseRegistrationsForOwner(session.userId),
    getOpenHouseRegistrationsByUser(session.userId),
    isAgence ? getEstimationRequestsForAgency(session.userId) : Promise.resolve([]),
    getEstimationRequestsByUser(session.userId),
    getAgencies(),
    isAgence ? getPendingMandateCount(session.userId) : Promise.resolve(0),
    isAgence ? getClientCount(session.userId) : Promise.resolve(0),
    isUserAdmin(session.userId),
  ]);
  const pendingModerationCount = isAdmin ? (await getPendingListings()).length : 0;
  const devisItems = devisRequests.map((d) => ({
    id: d.id,
    message: d.message,
    telephone: d.telephone,
    traite: d.traite,
    createdLabel: d.createdAt.toLocaleDateString("fr-FR"),
    authorNom: d.author.nom,
    authorEmail: d.author.email,
  }));
  const estimationItems = estimationRequests.map((e) => ({
    id: e.id,
    adresse: e.adresse,
    nom: e.nom,
    telephone: e.telephone,
    preferredDateLabel: e.preferredDate
      ? e.preferredDate.toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
    statut: e.statut,
    createdLabel: e.createdAt.toLocaleDateString("fr-FR"),
    authorEmail: e.author.email,
  }));
  const myEstimationItems = myEstimationRequests.map((e) => ({
    id: e.id,
    adresse: e.adresse,
    agencyId: e.agencyId,
    agencyNom: e.agencyNom,
    statut: e.statut,
    preferredDateLabel: e.preferredDate
      ? e.preferredDate.toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
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
  const openHouseItems = openHouseReceived.map((r) => ({
    id: r.id,
    nom: r.nom,
    prenom: r.prenom,
    telephone: r.telephone,
    email: r.email,
    createdLabel: r.createdAt.toLocaleDateString("fr-FR"),
    creneauLabel: formatCreneau(r.dateStartAt, r.dateEndAt),
    listingTitre: r.listingTitre,
    listingHref: r.listingHref,
    manageHref: `/compte/annonces/${r.listingId}`,
  }));
  const myOpenHouseItems = myOpenHouseRegistrations.map((r) => ({
    id: r.id,
    statut: r.statut,
    annulee: r.annulee,
    creneauLabel: formatCreneau(r.dateStartAt, r.dateEndAt),
    listingTitre: r.listingTitre,
    listingHref: r.listingHref,
  }));

  const totalNewMatches = mesRecherches.reduce((sum, s) => sum + s.newMatches, 0);
  const pendingProposals = mesRecherches.reduce(
    (sum, s) =>
      sum +
      s.mandates.reduce(
        (mSum, m) => mSum + m.proposals.filter((p) => p.statut === "PROPOSEE").length,
        0
      ),
    0
  );
  // Un particulier qui n'a encore rien déposé est ici pour chercher, pas pour
  // vendre : ses favoris et ses recherches sauvegardées sont ce qui compte,
  // pas deux sections "(0)" vides sur ses annonces et ses demandes de visite.
  const isChercheur = !isAgence && !isArtisan && mesAnnonces.length === 0;

  const favorisSection = (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-ink">Mes favoris ({favoriteCount})</span>
        <span className="text-[13.5px] text-muted">
          Visité, à surveiller, contacté — organisez vos coups de cœur.
        </span>
      </div>
      <Link href="/compte/favoris" className="text-[13px] font-semibold text-blue">
        Gérer mes favoris →
      </Link>
    </div>
  );

  const recherchesSection = (
    <div id="recherches" className="mt-8 scroll-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-ink">
          Mes recherches sauvegardées ({mesRecherches.length})
        </span>
        <Link href="/mon-projet" className="text-[13px] font-semibold text-blue">
          + Définir un nouveau projet →
        </Link>
      </div>
      {mesRecherches.length > 0 ? (
        <p className="mt-1.5 text-[12.5px] text-muted">
          🔔 Vous recevez un email dès qu&apos;un nouveau bien correspond à
          l&apos;une de ces recherches.
        </p>
      ) : null}
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
                    <span className="text-[14px] text-ink">
                      {s.transaction === "VENTE" ? "Achat" : "Location"}
                      {s.typeBien ? ` · ${TYPE_BIEN_LABEL[s.typeBien]}` : ""}
                      {s.typeBien === "MAISON" && s.typeMaison
                        ? ` (${TYPE_MAISON_LABEL[s.typeMaison]})`
                        : ""}
                      {` · ${locationLabel(s.villageSlugs, s.q)}`}
                      {s.chambresMin != null ? ` · ${s.chambresMin}+ chambres` : ""}
                      {s.equipements
                        ? ` · ${s.equipements.split(",").filter(Boolean).join(", ")}`
                        : ""}
                      {s.budgetMin != null && s.budgetMax != null
                        ? ` · ${s.budgetMin.toLocaleString("fr-FR")} – ${s.budgetMax.toLocaleString("fr-FR")} €`
                        : s.budgetMax != null
                          ? ` · ≤ ${s.budgetMax.toLocaleString("fr-FR")} €`
                          : s.budgetMin != null
                            ? ` · ≥ ${s.budgetMin.toLocaleString("fr-FR")} €`
                            : ""}
                    </span>
                    <span className="text-[12px] font-semibold text-blue">
                      {s.newMatches > 0
                        ? `${s.newMatches} nouvelle${s.newMatches > 1 ? "s" : ""} annonce${s.newMatches > 1 ? "s" : ""} depuis l'enregistrement`
                        : "Aucune nouvelle annonce depuis l'enregistrement"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={savedSearchUrl(s)} className="text-[12.5px] font-semibold text-blue">
                      Relancer →
                    </Link>
                    <form action={deleteSavedSearchAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-[12.5px] font-semibold text-muted hover:text-ink"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>

                {s.mandates.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {s.mandates.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted"
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
                          <span className="text-[11px] font-semibold text-muted-2">
                            Propositions de {m.agencyNom}
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
                                <span className="text-[13px] font-medium text-ink">{p.titre}</span>
                                <span className="text-[12px] font-semibold text-gold">
                                  {formatPrix(p.prix, p.transaction)}
                                </span>
                              </Link>
                              {p.statut === "PROPOSEE" ? (
                                <form action={respondToProposalAction} className="flex items-center gap-4">
                                  <input type="hidden" name="proposalId" value={p.proposalId} />
                                  <button
                                    type="submit"
                                    name="decision"
                                    value="interesse"
                                    className="text-[12px] font-semibold text-green"
                                  >
                                    ♥ Intéressé(e)
                                  </button>
                                  <button
                                    type="submit"
                                    name="decision"
                                    value="pas_interesse"
                                    className="text-[12px] font-medium text-muted hover:text-ink"
                                  >
                                    Pas pour moi
                                  </button>
                                </form>
                              ) : (
                                <span
                                  className="text-[12px] font-semibold"
                                  style={{
                                    color:
                                      p.statut === "INTERESSE" ? "var(--pvl-green)" : "var(--pvl-muted)",
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
                  <form action={sendMandateAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="savedSearchId" value={s.id} />
                    <select
                      name="agencyId"
                      required
                      defaultValue=""
                      className="rounded-full border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
                      className="rounded-full border border-line px-3.5 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
                    >
                      Confier cette recherche →
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Enregistrez une recherche depuis « Acheter » ou « Louer » pour la retrouver ici.
        </p>
      )}
    </div>
  );

  const annoncesSection = (
    <div className="mt-8">
      <span className="text-[11px] font-semibold text-ink">
        Mes annonces ({mesAnnonces.length})
      </span>
      {mesAnnonces.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {mesAnnonces.map((listing) => (
            <div key={listing.id} className="flex flex-col gap-2">
              <ListingCard listing={listing} isFavorited={favoriteIds.has(listing.id)} />
              {listing.statut === "REFUSEE" ? (
                <p className="m-0 text-[12.5px] text-muted">
                  Refusée
                  {listing.statutRaison ? ` — ${listing.statutRaison}` : ""}
                </p>
              ) : null}
              <Link
                href={`/compte/annonces/${listing.id}`}
                className="self-start text-[12.5px] font-semibold text-blue"
              >
                Modifier cette annonce →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">Vous n&apos;avez pas encore déposé d&apos;annonce.</p>
      )}
    </div>
  );

  const visitesSection = (
    <div className="mt-8">
      <span className="text-[11px] font-semibold text-ink">
        Demandes de visite ({visitItems.length})
      </span>
      {visitItems.length > 0 ? (
        <VisitRequestList items={visitItems} />
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Les demandes de visite envoyées sur vos annonces apparaîtront ici.
        </p>
      )}
    </div>
  );

  const openHouseReceivedSection = (
    <div className="mt-8">
      <span className="text-[11px] font-semibold text-ink">
        Inscriptions portes ouvertes ({openHouseItems.length})
      </span>
      {openHouseItems.length > 0 ? (
        <OpenHouseRegistrationList items={openHouseItems} />
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Les inscriptions aux portes ouvertes de vos annonces apparaîtront ici. Créez un
          évènement depuis « Modifier cette annonce ».
        </p>
      )}
    </div>
  );

  const myOpenHouseSection =
    myOpenHouseItems.length > 0 ? (
      <div className="mt-8">
        <span className="text-[11px] font-semibold text-ink">
          Mes inscriptions portes ouvertes ({myOpenHouseItems.length})
        </span>
        <div className="mt-3 flex flex-col gap-2">
          {myOpenHouseItems.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-0.5">
                <Link
                  href={e.listingHref}
                  className="text-[14px] font-semibold text-ink hover:text-blue"
                >
                  {e.listingTitre}
                </Link>
                <span className="text-[13px] text-muted">
                  {e.creneauLabel}
                  {e.annulee ? " · évènement annulé" : ""}
                </span>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background:
                    e.statut === "ACCEPTEE"
                      ? "#EAF3E8"
                      : e.statut === "REFUSEE"
                        ? "var(--pvl-surface)"
                        : "#FBF3DC",
                  color:
                    e.statut === "ACCEPTEE"
                      ? "var(--pvl-green)"
                      : e.statut === "REFUSEE"
                        ? "var(--pvl-muted)"
                        : "var(--pvl-gold)",
                }}
              >
                {e.statut === "ACCEPTEE"
                  ? "Confirmée"
                  : e.statut === "REFUSEE"
                    ? "Non retenue"
                    : "En attente"}
              </span>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  const myEstimationSection = (
    <div className="mt-8">
      <span className="text-[11px] font-semibold text-ink">
        Mes demandes d&apos;estimation ({myEstimationItems.length})
      </span>
      {myEstimationItems.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {myEstimationItems.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-0.5">
                <Link
                  href={`/professionnels/${e.agencyId}`}
                  className="text-[14px] font-semibold text-ink hover:text-blue"
                >
                  {e.agencyNom}
                </Link>
                <span className="text-[13px] text-muted">
                  {e.adresse}
                  {e.preferredDateLabel ? ` · ${e.preferredDateLabel}` : ""}
                </span>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background:
                    e.statut === "ACCEPTEE" ? "#EAF3E8" : e.statut === "REFUSEE" ? "var(--pvl-surface)" : "#FBF3DC",
                  color:
                    e.statut === "ACCEPTEE"
                      ? "var(--pvl-green)"
                      : e.statut === "REFUSEE"
                        ? "var(--pvl-muted)"
                        : "var(--pvl-gold)",
                }}
              >
                {e.statut === "ACCEPTEE" ? "Acceptée" : e.statut === "REFUSEE" ? "Refusée" : "En attente"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Les demandes de rendez-vous d&apos;estimation envoyées à une agence apparaîtront ici.
        </p>
      )}
    </div>
  );

  return (
    <div className="animate-fade-up max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">{session.nom}</h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      {agenceNonVerifiee ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7D9A8] bg-[#FBF3DC] px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-ink">
              Faites vérifier votre agence
            </span>
            <span className="text-[13px] text-muted">
              Ajoutez votre SIRET et votre carte professionnelle pour afficher le badge
              « Agence vérifiée » sur votre page et vos annonces.
            </span>
          </div>
          <Link
            href="/compte/agence"
            className="rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
          >
            Compléter →
          </Link>
        </div>
      ) : null}

      {emailNonVerifie ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7D9A8] bg-[#FBF3DC] px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-ink">
              Vérifiez votre adresse email
            </span>
            <span className="text-[13px] text-muted">
              {verifEmailRenvoye
                ? "Email de vérification renvoyé — pensez à regarder vos spams."
                : "Un lien de confirmation vous a été envoyé à l'inscription. Certaines actions (déposer une annonce) l'exigent."}
            </span>
          </div>
          {!verifEmailRenvoye ? (
            <form action={resendEmailVerificationAction}>
              <button
                type="submit"
                className="rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
              >
                Renvoyer l&apos;email
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1.5 text-[13px] text-ink">
          <span>Email — {session.email}</span>
          <span>Type de compte — {TYPE_LABEL[session.type]}</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
          >
            Se déconnecter
          </button>
        </form>
      </div>

      {isAdmin ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-ink">Administration</span>
            <span className="text-[13.5px] text-muted">
              {pendingModerationCount > 0
                ? `${pendingModerationCount} annonce${pendingModerationCount > 1 ? "s" : ""} en attente de vérification`
                : "Aucune annonce en attente."}
            </span>
          </div>
          <Link href="/admin" className="text-[13px] font-semibold text-blue">
            Ouvrir le super admin →
          </Link>
        </div>
      ) : null}

      {isAgence ? (
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href={`/professionnels/${session.userId}`} className="text-[13px] font-semibold text-blue">
            Voir ma page agence publique →
          </Link>
          <Link href="/compte/agence" className="text-[13px] font-semibold text-blue">
            Modifier mes coordonnées →
          </Link>
          <Link href="/compte/agence/statistiques" className="text-[13px] font-semibold text-blue">
            Voir mes statistiques →
          </Link>
        </div>
      ) : null}

      {isAgence ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-ink">Mes clients ({clientCount})</span>
            <span className="text-[13.5px] text-muted">
              {pendingMandateCount > 0
                ? `${pendingMandateCount} demande${pendingMandateCount > 1 ? "s" : ""} de recherche en attente`
                : "Recherches confiées par des particuliers."}
            </span>
          </div>
          <Link href="/compte/agence/clients" className="text-[13px] font-semibold text-blue">
            Voir mes clients →
          </Link>
        </div>
      ) : null}

      {isAgence ? (
        <div className="mt-8">
          <span className="text-[11px] font-semibold text-ink">
            Demandes d&apos;estimation ({estimationItems.length})
          </span>
          {estimationItems.length > 0 ? (
            <EstimationList items={estimationItems} />
          ) : (
            <p className="mt-3 text-[14px] text-muted">
              Les demandes de rendez-vous d&apos;estimation envoyées depuis votre page agence apparaîtront ici.
            </p>
          )}
        </div>
      ) : null}

      {!isAgence && !isArtisan ? (
        <div className="mt-6 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
          <span className="text-[11px] font-semibold text-ink">Mes alertes</span>
          {totalNewMatches > 0 || pendingProposals > 0 ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {totalNewMatches > 0 ? (
                <Link href="#recherches" className="text-[13.5px] text-ink hover:text-blue">
                  🔔{" "}
                  <b>
                    {totalNewMatches} nouvelle{totalNewMatches > 1 ? "s" : ""} annonce
                    {totalNewMatches > 1 ? "s" : ""}
                  </b>{" "}
                  correspondant à vos recherches
                </Link>
              ) : null}
              {pendingProposals > 0 ? (
                <Link href="#recherches" className="text-[13.5px] text-ink hover:text-blue">
                  📨{" "}
                  <b>
                    {pendingProposals} proposition{pendingProposals > 1 ? "s" : ""}
                  </b>{" "}
                  à examiner
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="m-0 mt-2 text-[13.5px] text-muted">Rien de nouveau pour le moment.</p>
          )}
        </div>
      ) : null}

      {isArtisan ? (
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href={`/artisans/${session.userId}`} className="text-[13px] font-semibold text-blue">
            Voir ma fiche publique →
          </Link>
          <Link href="/compte/artisan" className="text-[13px] font-semibold text-blue">
            Modifier ma fiche →
          </Link>
        </div>
      ) : null}

      {isArtisan ? (
        <div className="mt-8">
          <span className="text-[11px] font-semibold text-ink">
            Demandes de devis ({devisItems.length})
          </span>
          {devisItems.length > 0 ? (
            <DevisList items={devisItems} />
          ) : (
            <p className="mt-3 text-[14px] text-muted">
              Les demandes de devis envoyées depuis votre fiche publique apparaîtront ici.
            </p>
          )}
        </div>
      ) : null}

      {isChercheur ? (
        <>
          {favorisSection}
          {recherchesSection}
          {annoncesSection}
          {visitesSection}
          {openHouseReceivedSection}
          {myEstimationSection}
          {myOpenHouseSection}
        </>
      ) : (
        <>
          {!isArtisan ? annoncesSection : null}
          {!isArtisan ? visitesSection : null}
          {!isArtisan ? openHouseReceivedSection : null}
          {myEstimationSection}
          {myOpenHouseSection}
          {favorisSection}
          {recherchesSection}
        </>
      )}

      {stubs.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stubs.map((label) => (
            <div key={label} className="rounded-2xl border border-dashed border-line bg-surface p-5">
              <span className="text-[11px] font-semibold text-muted">{label}</span>
              <p className="m-0 mt-2 text-[13px] text-muted-2">Bientôt disponible.</p>
            </div>
          ))}
        </div>
      ) : null}

      {!isArtisan ? (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface px-6 py-5">
          <span className="text-[15px] text-ink">
            Prêt à publier votre premier bien ?
          </span>
          <Link
            href="/vendre/deposer"
            className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
          >
            + Déposer une annonce
          </Link>
        </div>
      ) : null}
    </div>
  );
}
