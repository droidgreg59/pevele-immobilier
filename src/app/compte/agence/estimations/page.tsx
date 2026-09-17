import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getEstimationRequestsForAgency } from "@/lib/estimations";
import EstimationList from "@/components/EstimationList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes d'estimation",
};

export default async function CompteAgenceEstimationsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence/estimations");
  if (session.type !== "AGENCE") redirect("/compte");

  const estimationRequests = await getEstimationRequestsForAgency(session.userId);
  const items = estimationRequests.map((e) => ({
    id: e.id,
    adresse: e.adresse,
    nom: e.nom,
    telephone: e.telephone,
    preferredDateLabel: e.preferredDate
      ? e.preferredDate.toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
    statut: e.statut,
    createdLabel: e.createdAt.toLocaleDateString("fr-FR"),
    authorEmail: e.author.email,
  }));

  return (
    <div className="flex flex-col gap-1">
      <h2 className="m-0 font-display text-[24px] text-ink">
        Demandes d&apos;estimation ({items.length})
      </h2>
      {items.length > 0 ? (
        <div className="mt-5">
          <EstimationList items={items} />
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Les demandes de rendez-vous d&apos;estimation envoyées depuis votre page agence
          apparaîtront ici.
        </p>
      )}
    </div>
  );
}
