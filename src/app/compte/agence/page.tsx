import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAgencyById } from "@/lib/agencies";
import { getAgencyVerification } from "@/lib/agency-verification";
import AgencyProfileForm from "@/components/AgencyProfileForm";
import AgencyVerificationCard from "@/components/AgencyVerificationCard";
import XmlImportPanel from "@/components/XmlImportPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coordonnées de mon agence",
};

export default async function CompteAgencePage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") redirect("/compte");

  const [agency, verification] = await Promise.all([
    getAgencyById(session.userId),
    getAgencyVerification(session.userId),
  ]);
  if (!agency || !verification) redirect("/compte");

  return (
    <div className="animate-fade-up max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Coordonnées de mon agence
      </h1>
      <div className="flex flex-wrap gap-4">
        <Link href="/compte" className="text-[13px] font-semibold text-blue">
          ← Mon compte
        </Link>
        <Link
          href={`/professionnels/${session.userId}`}
          className="text-[13px] font-semibold text-blue"
        >
          Voir ma page publique →
        </Link>
      </div>

      <p className="mt-6 max-w-[64ch] text-[14.5px] leading-[1.6] text-muted">
        Ces informations apparaissent sur votre page agence publique,
        accessible depuis vos annonces et l&apos;annuaire des professionnels.
      </p>

      <div className="mt-7">
        <AgencyProfileForm agency={agency} />
      </div>

      <div className="mt-8">
        <AgencyVerificationCard verification={verification} />
      </div>

      <div className="mt-8">
        <XmlImportPanel agency={agency} />
      </div>
    </div>
  );
}
