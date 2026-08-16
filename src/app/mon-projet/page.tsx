import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import ProjectWizard from "@/components/ProjectWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Définir mon projet — Pévèle Immobilier",
  description:
    "Décrivez votre projet immobilier en quelques clics pour retrouver les annonces qui vous correspondent.",
};

export default async function MonProjetPage() {
  const session = await getSession();

  return <ProjectWizard isLoggedIn={session !== null} />;
}
