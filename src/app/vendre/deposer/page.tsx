import type { Metadata } from "next";
import PublishWizard from "@/components/PublishWizard";

export const metadata: Metadata = {
  title: "Déposer une annonce — Pévèle Immobilier",
  description: "Publiez votre annonce immobilière en Pévèle en 3 étapes.",
};

export default function DeposerPage() {
  return <PublishWizard />;
}
