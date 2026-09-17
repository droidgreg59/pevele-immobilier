import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toggleDigestOptInAction } from "@/lib/auth-actions";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import ErrorBoundary from "@/components/ErrorBoundary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default async function CompteAgenceParametresPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence/parametres");
  if (session.type !== "AGENCE") redirect("/compte");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, digestOptIn: true },
  });

  return (
    <div className="flex flex-col gap-1">
      <h2 className="m-0 font-display text-[24px] text-ink">Paramètres</h2>

      <div className="mt-5 flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-6 text-[13px] text-ink shadow-sm">
        <span>Email — {currentUser?.email}</span>
        <span>Type de compte — Agence</span>
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
    </div>
  );
}
