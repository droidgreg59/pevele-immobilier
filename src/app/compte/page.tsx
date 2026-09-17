import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  logoutAction,
  resendEmailVerificationAction,
  toggleDigestOptInAction,
} from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { getFavoriteCount } from "@/lib/favorites";
import { getSavedSearchesByUser, savedSearchUrl } from "@/lib/saved-searches";
import { deleteSavedSearchAction } from "@/lib/saved-search-actions";
import { sendMandateAction } from "@/lib/mandate-actions";
import { respondToProposalAction } from "@/lib/proposal-actions";
import { getDevisRequestsForArtisan } from "@/lib/devis";
import { getOpenHouseRegistrationsByUser } from "@/lib/open-house";
import { getEstimationRequestsByUser } from "@/lib/estimations";
import { getAgencies } from "@/lib/agencies";
import { isUserAdmin, getPendingListings } from "@/lib/admin";
import { getVillageBySlug } from "@/data/villages";
import { formatPrix } from "@/lib/format";
import DevisList from "@/components/DevisList";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import ErrorBoundary from "@/components/ErrorBoundary";

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

const TYPE_LABEL: Record<string, string> = {
  PARTICULIER: "Particulier",
  AGENCE: "Agence",
  ARTISAN: "Artisan",
};

export default async function ComptePage({ searchParams }: PageProps<"/compte">) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  // Espaces dédiés, type CRM (menu latéral, une page par activité) — voir
  // src/app/compte/agence/layout.tsx et src/app/compte/particulier/layout.tsx.
  // Remplacent l'empilement vertical ci-dessous, conservé tel quel pour le
  // seul type de compte restant ici, artisan (non redemandé pour l'instant).
  if (session.type === "AGENCE") redirect("/compte/agence");
  if (session.type === "PARTICULIER") redirect("/compte/particulier");

  const sp = await searchParams;
  const verifEmailRenvoye = sp.verif === "renvoye";
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { emailVerifiedAt: true, verifStatut: true, digestOptIn: true },
  });
  const emailNonVerifie = currentUser != null && currentUser.emailVerifiedAt == null;

  const [
    favoriteCount,
    mesRecherches,
    devisRequests,
    myOpenHouseRegistrations,
    myEstimationRequests,
    agencies,
    isAdmin,
  ] = await Promise.all([
    getFavoriteCount(session.userId),
    getSavedSearchesByUser(session.userId),
    getDevisRequestsForArtisan(session.userId),
    getOpenHouseRegistrationsByUser(session.userId),
    getEstimationRequestsByUser(session.userId),
    getAgencies(),
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
  const myOpenHouseItems = myOpenHouseRegistrations.map((r) => ({
    id: r.id,
    statut: r.statut,
    annulee: r.annulee,
    creneauLabel: formatCreneau(r.dateStartAt, r.dateEndAt),
    listingTitre: r.listingTitre,
    listingHref: r.listingHref,
  }));

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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-ink">Digest hebdomadaire du marché</span>
          <span className="text-[12.5px] text-muted">
            Un email chaque lundi : nouveaux biens, baisses de prix, prix moyen en Pévèle.
          </span>
        </div>
        <form action={toggleDigestOptInAction}>
          <input type="hidden" name="optIn" value={currentUser?.digestOptIn ? "false" : "true"} />
          <button
            type="submit"
            className="rounded-full px-4 py-2 text-[12.5px] font-semibold transition"
            style={{
              background: currentUser?.digestOptIn ? "var(--pvl-blue-soft)" : "#fff",
              color: currentUser?.digestOptIn ? "var(--pvl-blue)" : "var(--pvl-ink)",
              border: `1.5px solid ${currentUser?.digestOptIn ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
            }}
          >
            {currentUser?.digestOptIn ? "Activé — désactiver" : "Activer"}
          </button>
        </form>
      </div>

      <ErrorBoundary>
        <PushNotificationToggle />
      </ErrorBoundary>

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

      <div className="mt-4 flex flex-wrap gap-4">
        <Link href={`/artisans/${session.userId}`} className="text-[13px] font-semibold text-blue">
          Voir ma fiche publique →
        </Link>
        <Link href="/compte/artisan" className="text-[13px] font-semibold text-blue">
          Modifier ma fiche →
        </Link>
      </div>

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

      {myEstimationSection}
      {myOpenHouseSection}
      {favorisSection}
      {recherchesSection}
    </div>
  );
}
