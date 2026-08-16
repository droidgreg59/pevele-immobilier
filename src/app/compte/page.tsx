import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";
import { getListingsByUser } from "@/lib/listings";
import { getFavoriteListingIds, getFavoriteCount } from "@/lib/favorites";
import { getSavedSearchesByUser, savedSearchUrl } from "@/lib/saved-searches";
import { deleteSavedSearchAction } from "@/lib/saved-search-actions";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon compte — Pévèle Immobilier",
};

const STUBS_PARTICULIER = ["Mes alertes"];
const STUBS_AGENCE = ["Mes collaborateurs", "Statistiques et leads"];
const STUBS_ARTISAN = ["Demandes de devis"];

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
  const [mesAnnonces, favoriteIds, favoriteCount, mesRecherches] = await Promise.all([
    isArtisan ? Promise.resolve([]) : getListingsByUser(session.userId),
    getFavoriteListingIds(session.userId),
    getFavoriteCount(session.userId),
    getSavedSearchesByUser(session.userId),
  ]);

  return (
    <div className="animate-view-in max-w-[900px] px-9 py-8">
      <span className="border-2 border-blue px-3 py-1.5 font-mono text-sm text-blue">
        MON COMPTE
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">
        {session.nom.toUpperCase()}
      </h1>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 border-[2.5px] border-ink bg-white p-6 shadow-[6px_6px_0_rgba(39,67,166,.18)]">
        <div className="flex flex-col gap-1.5 font-mono text-[12px] text-ink">
          <span>EMAIL — {session.email}</span>
          <span>TYPE DE COMPTE — {TYPE_LABEL[session.type]}</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="border-2 border-ink px-4 py-2.5 font-mono text-[11px] font-semibold text-ink hover:bg-[#FDEBC2]"
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

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-white px-5 py-4">
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
        <span className="font-mono text-[10.5px] font-medium text-ink">
          MES RECHERCHES SAUVEGARDÉES ({mesRecherches.length})
        </span>
        {mesRecherches.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {mesRecherches.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-white px-5 py-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-[14px] text-ink">
                    {s.transaction === "VENTE" ? "Achat" : "Location"}
                    {s.q ? ` · ${s.q}` : " · toute la Pévèle"}
                    {s.budgetMax != null ? ` · ≤ ${s.budgetMax.toLocaleString("fr-FR")} €` : ""}
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
            ))}
          </div>
        ) : (
          <p className="mt-3 font-sans text-[14px] text-muted">
            Enregistrez une recherche depuis « Acheter » ou « Louer » pour la
            retrouver ici.
          </p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stubs.map((label) => (
          <div
            key={label}
            className="border-2 border-dashed border-muted-2 bg-white p-5"
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

      {!isArtisan ? (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-5 border-2 border-dashed border-blue px-6 py-5">
          <span className="font-sans text-[15px] text-ink">
            Prêt à publier votre premier bien sur le plan ?
          </span>
          <Link
            href="/vendre/deposer"
            className="bg-yellow px-5 py-3.5 font-mono text-[11.5px] font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px"
          >
            + DÉPOSER UNE ANNONCE
          </Link>
        </div>
      ) : null}
    </div>
  );
}
