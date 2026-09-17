import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getVisitRequestsForOwner } from "@/lib/visits";
import VisitRequestList from "@/components/VisitRequestList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes de visite",
};

export default async function CompteAgenceVisitesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence/visites");
  if (session.type !== "AGENCE") redirect("/compte");

  const visitRequests = await getVisitRequestsForOwner(session.userId);
  const items = visitRequests.map((v) => ({
    id: v.id,
    message: v.message,
    telephone: v.telephone,
    preferredDateLabel: v.preferredDate ? v.preferredDate.toLocaleDateString("fr-FR") : null,
    traite: v.traite,
    createdLabel: v.createdAt.toLocaleDateString("fr-FR"),
    authorNom: v.author.nom,
    authorEmail: v.author.email,
    listingId: v.listing.id,
    listingTitre: v.listing.titre,
    listingHref: `/${v.listing.transaction === "VENTE" ? "acheter" : "louer"}/${v.listing.id}`,
  }));

  return (
    <div className="flex flex-col gap-1">
      <h2 className="m-0 font-display text-[24px] text-ink">Demandes de visite ({items.length})</h2>
      {items.length > 0 ? (
        <div className="mt-5">
          <VisitRequestList items={items} />
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Les demandes de visite envoyées sur vos annonces apparaîtront ici.
        </p>
      )}
    </div>
  );
}
