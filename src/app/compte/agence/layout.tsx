import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logoutAction, resendEmailVerificationAction } from "@/lib/auth-actions";
import { getVisitRequestsForOwner } from "@/lib/visits";
import { getPendingOpenHouseRegistrationsForOwner } from "@/lib/open-house";
import { getEstimationRequestsForAgency } from "@/lib/estimations";
import { getPendingMandateCount } from "@/lib/mandates";
import { isUserAdmin, getPendingListings } from "@/lib/admin";
import AgencyNav from "@/components/AgencyNav";

export const dynamic = "force-dynamic";

/**
 * Coquille partagée par tout l'espace agence (/compte/agence/*) : identité,
 * bannières de vérification, et navigation latérale de type CRM — remplace
 * l'ancienne page /compte unique (tout empilé verticalement, peu lisible dès
 * qu'une agence a un peu d'activité). Les compteurs de la nav sont calculés
 * ici une fois pour toutes les pages ; chaque page charge ensuite son propre
 * détail complet (léger doublon de requêtes, mais évite un cache partagé
 * complexe pour un gain marginal à ce volume).
 */
export default async function AgenceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") redirect("/compte");

  const [currentUser, visitRequests, pendingOpenHouse, estimationRequests, pendingMandateCount, isAdmin] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { emailVerifiedAt: true, verifStatut: true },
      }),
      getVisitRequestsForOwner(session.userId),
      getPendingOpenHouseRegistrationsForOwner(session.userId),
      getEstimationRequestsForAgency(session.userId),
      getPendingMandateCount(session.userId),
      isUserAdmin(session.userId),
    ]);
  const pendingModerationCount = isAdmin ? (await getPendingListings()).length : 0;

  const emailNonVerifie = currentUser != null && currentUser.emailVerifiedAt == null;
  const agenceNonVerifiee =
    currentUser?.verifStatut === "NON_SOUMISE" || currentUser?.verifStatut === "REFUSEE";

  const counts = {
    visites: visitRequests.filter((v) => !v.traite).length,
    portesOuvertes: pendingOpenHouse.length,
    estimations: estimationRequests.filter((e) => e.statut === "EN_ATTENTE").length,
    clients: pendingMandateCount,
  };

  return (
    <div className="animate-fade-up mx-auto max-w-[1240px] px-6 py-8 sm:px-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
            Espace agence
          </span>
          <h1 className="mt-3 font-display text-[30px] text-ink sm:text-[36px]">{session.nom}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/professionnels/${session.userId}`}
            className="rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
          >
            Voir ma page publique →
          </Link>
          <Link href="/" className="text-[13px] font-semibold text-blue">
            ← Retour au site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      {isAdmin ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
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

      {agenceNonVerifiee ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7D9A8] bg-[#FBF3DC] px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-ink">Faites vérifier votre agence</span>
            <span className="text-[13px] text-muted">
              Ajoutez votre SIRET et votre carte professionnelle pour afficher le badge « Agence
              vérifiée » sur votre page et vos annonces.
            </span>
          </div>
          <Link
            href="/compte/agence/profil"
            className="rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
          >
            Compléter →
          </Link>
        </div>
      ) : null}

      {emailNonVerifie ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7D9A8] bg-[#FBF3DC] px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-ink">Vérifiez votre adresse email</span>
            <span className="text-[13px] text-muted">
              Un lien de confirmation vous a été envoyé à l&apos;inscription. Certaines actions
              l&apos;exigent.
            </span>
          </div>
          <form action={resendEmailVerificationAction}>
            <button
              type="submit"
              className="rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
            >
              Renvoyer l&apos;email
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <AgencyNav counts={counts} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
