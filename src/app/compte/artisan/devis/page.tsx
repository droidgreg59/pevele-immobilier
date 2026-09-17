import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDevisRequestsForArtisan } from "@/lib/devis";
import { fullName } from "@/lib/format";
import DevisList from "@/components/DevisList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes de devis",
};

export default async function CompteArtisanDevisPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/artisan/devis");
  if (session.type !== "ARTISAN") redirect("/compte");

  const devisRequests = await getDevisRequestsForArtisan(session.userId);
  const devisItems = devisRequests.map((d) => ({
    id: d.id,
    message: d.message,
    telephone: d.telephone,
    traite: d.traite,
    createdLabel: d.createdAt.toLocaleDateString("fr-FR"),
    authorNom: fullName(d.author.prenom, d.author.nom),
    authorEmail: d.author.email,
  }));

  return (
    <div className="flex flex-col gap-1">
      <h2 className="m-0 font-display text-[24px] text-ink">
        Demandes de devis ({devisItems.length})
      </h2>
      {devisItems.length > 0 ? (
        <div className="mt-5">
          <DevisList items={devisItems} />
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Les demandes de devis envoyées depuis votre fiche publique apparaîtront ici.
        </p>
      )}
    </div>
  );
}
