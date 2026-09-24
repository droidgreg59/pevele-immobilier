import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logoutAction, resendEmailVerificationAction } from "@/lib/auth-actions";
import { getFinancingRequestsForCourtier } from "@/lib/financing";
import CourtierNav from "@/components/CourtierNav";

export const dynamic = "force-dynamic";

/** Coquille de l'espace courtier (/compte/courtier/*) — même modèle que les espaces agence et artisan. */
export default async function CourtierLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/courtier");
  if (session.type !== "COURTIER") redirect("/compte");

  const [currentUser, financingRequests] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { emailVerifiedAt: true } }),
    getFinancingRequestsForCourtier(session.userId),
  ]);

  const emailNonVerifie = currentUser != null && currentUser.emailVerifiedAt == null;

  const counts = {
    financements: financingRequests.filter((r) => !r.traite).length,
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
          <Link
            href={`/courtiers/${session.userId}`}
            className="rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
          >
            Voir ma fiche publique →
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
        <CourtierNav counts={counts} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
