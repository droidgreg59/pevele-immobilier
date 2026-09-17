import { permanentRedirect, notFound } from "next/navigation";
import { getVillageBySlug } from "@/data/villages";

/**
 * `/immobilier/<commune>` sans intention → renvoie vers la fiche complète de la
 * commune, qui fait déjà office de page « immobilier à <commune> ».
 */
export default async function ImmobilierCommunePage({
  params,
}: PageProps<"/immobilier/[commune]">) {
  const { commune } = await params;
  if (!getVillageBySlug(commune)) notFound();
  permanentRedirect(`/villages/${commune}`);
}
