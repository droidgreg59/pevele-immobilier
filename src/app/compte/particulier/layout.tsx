import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logoutAction, resendEmailVerificationAction } from "@/lib/auth-actions";
import { getSavedSearchesByUser } from "@/lib/saved-searches";
import { getVisitRequestsForOwner } from "@/lib/visits";
import { getPendingOpenHouseRegistrationsForOwner } from "@/lib/open-house";
import ParticulierNav from "@/components/ParticulierNav";

export const dynamic = "force-dynamic";

/**
 * Coquille de l'espace particulier (/compte/particulier/*), sur le modèle de
 * l'espace agence (/compte/agence/*) : identité, bannière de vérification
 * email, navigation latérale type CRM au lieu de l'ancien /compte unique tout
 * empilé. « Mes favoris » reste à son adresse historique (/compte/favoris,
 * aussi liée depuis la barre de nav mobile globale BottomNav.tsx) plutôt que
 * déplacée ici, pour ne pas casser ce lien.
 */
export default async function ParticulierLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/particulier");
  if (session.type !== "PARTICULIER") redirect("/compte");

  const [currentUser, mesRecherches, visitRequests, pendingOpenHouse] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { emailVerifiedAt: true } }),
    getSavedSearchesByUser(session.userId),
    getVisitRequestsForOwner(session.userId),
    getPendingOpenHouseRegistrationsForOwner(session.userId),
  ]);

  const emailNonVerifie = currentUser != null && currentUser.emailVerifiedAt == null;

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

  const counts = {
    recherches: totalNewMatches + pendingProposals,
    demandes: visitRequests.filter((v) => !v.traite).length + pendingOpenHouse.length,
  };

  return (
    <div className="animate-fade-up mx-auto max-w-[1240px] px-6 py-8 sm:px-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
            Mon compte
          </span>
          <h1 className="mt-3 font-display text-[30px] text-ink sm:text-[36px]">{session.nom}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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

      {emailNonVerifie ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7D9A8] bg-[#FBF3DC] px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-ink">Vérifiez votre adresse email</span>
            <span className="text-[13px] text-muted">
              Un lien de confirmation vous a été envoyé à l&apos;inscription. Certaines actions
              (déposer une annonce) l&apos;exigent.
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
        <ParticulierNav counts={counts} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
