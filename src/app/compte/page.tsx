import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/**
 * Aiguillage vers l'espace dédié type CRM de chaque type de compte — voir
 * src/app/compte/agence/layout.tsx, src/app/compte/particulier/layout.tsx et
 * src/app/compte/artisan/layout.tsx.
 */
export default async function ComptePage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.type === "AGENCE") redirect("/compte/agence");
  if (session.type === "PARTICULIER") redirect("/compte/particulier");
  redirect("/compte/artisan");
}
