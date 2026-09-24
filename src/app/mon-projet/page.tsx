import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPublicListings } from "@/lib/listings";
import { getVerifiedCourtierCount } from "@/lib/courtiers";
import ProjectWizard from "@/components/ProjectWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Définir mon projet",
  description:
    "Décrivez votre projet immobilier en quelques clics pour retrouver les annonces qui vous correspondent.",
  alternates: { canonical: "/mon-projet" },
};

export default async function MonProjetPage() {
  const [session, ventes, locations, courtierCount] = await Promise.all([
    getSession(),
    getPublicListings("VENTE"),
    getPublicListings("LOCATION"),
    getVerifiedCourtierCount(),
  ]);
  if (session && session.type !== "PARTICULIER") redirect("/compte");

  return (
    <ProjectWizard
      isLoggedIn={session !== null}
      listings={[...ventes, ...locations]}
      hasCourtiers={courtierCount > 0}
    />
  );
}
