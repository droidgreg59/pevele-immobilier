import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getPublicListings } from "@/lib/listings";
import ProjectWizard from "@/components/ProjectWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Définir mon projet",
  description:
    "Décrivez votre projet immobilier en quelques clics pour retrouver les annonces qui vous correspondent.",
};

export default async function MonProjetPage() {
  const [session, ventes, locations] = await Promise.all([
    getSession(),
    getPublicListings("VENTE"),
    getPublicListings("LOCATION"),
  ]);

  return (
    <ProjectWizard isLoggedIn={session !== null} listings={[...ventes, ...locations]} />
  );
}
