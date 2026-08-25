import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAgencyById } from "@/lib/agencies";
import { getArtisanById } from "@/lib/artisans";
import AgencyOnboardingWizard from "@/components/AgencyOnboardingWizard";
import ArtisanOnboardingWizard from "@/components/ArtisanOnboardingWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Créez votre page professionnelle",
  robots: { index: false, follow: false },
};

export default async function BienvenuePage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.type === "PARTICULIER") redirect("/compte");

  if (session.type === "AGENCE") {
    const agency = await getAgencyById(session.userId);
    if (!agency) redirect("/compte");
    return <AgencyOnboardingWizard agency={agency} />;
  }

  const artisan = await getArtisanById(session.userId);
  if (!artisan) redirect("/compte");
  return <ArtisanOnboardingWizard artisan={artisan} />;
}
