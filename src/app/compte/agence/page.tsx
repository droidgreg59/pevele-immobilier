import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAgencyById } from "@/lib/agencies";
import AgencyProfileForm from "@/components/AgencyProfileForm";
import XmlImportPanel from "@/components/XmlImportPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coordonnées de mon agence — Pévèle Immobilier",
};

export default async function CompteAgencePage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") redirect("/compte");

  const agency = await getAgencyById(session.userId);
  if (!agency) redirect("/compte");

  return (
    <div className="animate-fade-up max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-blue">
        MON COMPTE
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        COORDONNÉES DE MON AGENCE
      </h1>
      <div className="flex flex-wrap gap-4">
        <Link href="/compte" className="font-mono text-[11.5px] font-medium text-blue">
          ← MON COMPTE
        </Link>
        <Link
          href={`/professionnels/${session.userId}`}
          className="font-mono text-[11.5px] font-medium text-blue"
        >
          VOIR MA PAGE PUBLIQUE →
        </Link>
      </div>

      <p className="mt-6 max-w-[64ch] font-sans text-[14.5px] leading-[1.6] text-muted">
        Ces informations apparaissent sur votre page agence publique,
        accessible depuis vos annonces et l&apos;annuaire des professionnels.
      </p>

      <div className="mt-7">
        <AgencyProfileForm agency={agency} />
      </div>

      <div className="mt-8">
        <XmlImportPanel agency={agency} />
      </div>
    </div>
  );
}
