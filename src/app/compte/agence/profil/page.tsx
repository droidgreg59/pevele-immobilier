import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAgencyById, getAgencyServiceAreas } from "@/lib/agencies";
import { getAgencyVerification } from "@/lib/agency-verification";
import AgencyProfileForm from "@/components/AgencyProfileForm";
import AgencyServiceAreaForm from "@/components/AgencyServiceAreaForm";
import AgencyVerificationCard from "@/components/AgencyVerificationCard";
import XmlImportPanel from "@/components/XmlImportPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon agence",
};

export default async function CompteAgenceProfilPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence/profil");
  if (session.type !== "AGENCE") redirect("/compte");

  const [agency, verification, serviceAreas] = await Promise.all([
    getAgencyById(session.userId),
    getAgencyVerification(session.userId),
    getAgencyServiceAreas(session.userId),
  ]);
  if (!agency || !verification) redirect("/compte");

  return (
    <div className="flex flex-col gap-1">
      <h2 className="m-0 font-display text-[24px] text-ink">Mon agence</h2>
      <p className="m-0 max-w-[64ch] text-[14px] leading-[1.6] text-muted">
        Ces informations apparaissent sur votre page agence publique, accessible depuis vos
        annonces et l&apos;annuaire des professionnels.
      </p>

      <div className="mt-6">
        <AgencyProfileForm agency={agency} />
      </div>

      <div className="mt-8">
        <AgencyServiceAreaForm serviceAreas={serviceAreas} />
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
