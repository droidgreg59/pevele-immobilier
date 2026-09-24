import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCourtierByIdOwner } from "@/lib/courtiers";
import { getCourtierVerification } from "@/lib/courtier-verification";
import CourtierProfileForm from "@/components/CourtierProfileForm";
import CourtierVerificationCard from "@/components/CourtierVerificationCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ma fiche courtier",
};

export default async function CompteCourtierProfilPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/courtier/profil");
  if (session.type !== "COURTIER") redirect("/compte");

  const [courtier, verification] = await Promise.all([
    getCourtierByIdOwner(session.userId),
    getCourtierVerification(session.userId),
  ]);
  if (!courtier || !verification) redirect("/compte");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-display text-[24px] text-ink">Ma fiche courtier</h2>
        <p className="m-0 max-w-[64ch] text-[14px] leading-[1.6] text-muted">
          Ces informations apparaissent sur votre fiche publique dans l&apos;annuaire des
          courtiers — visible uniquement une fois votre compte vérifié.
        </p>
        <div className="mt-6">
          <CourtierProfileForm courtier={courtier} />
        </div>
      </div>

      <CourtierVerificationCard verification={verification} />
    </div>
  );
}
