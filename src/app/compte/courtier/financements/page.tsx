import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFinancingRequestsForCourtier } from "@/lib/financing";
import { fullName } from "@/lib/format";
import FinancingRequestList from "@/components/FinancingRequestList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes de financement",
};

export default async function CompteCourtierFinancementsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/courtier/financements");
  if (session.type !== "COURTIER") redirect("/compte");

  const financingRequests = await getFinancingRequestsForCourtier(session.userId);
  const items = financingRequests.map((r) => ({
    id: r.id,
    message: r.message,
    telephone: r.telephone,
    traite: r.traite,
    createdLabel: r.createdAt.toLocaleDateString("fr-FR"),
    authorNom: fullName(r.author.prenom, r.author.nom),
    authorEmail: r.author.email,
    listing: r.listing
      ? {
          id: r.listing.id,
          titre: r.listing.titre,
          href: `/${r.listing.transaction === "VENTE" ? "acheter" : "louer"}/${r.listing.id}`,
        }
      : null,
  }));

  return (
    <div className="flex flex-col gap-1">
      <h2 className="m-0 font-display text-[24px] text-ink">
        Demandes de financement ({items.length})
      </h2>
      {items.length > 0 ? (
        <div className="mt-5">
          <FinancingRequestList items={items} />
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Les demandes d&apos;étude de financement envoyées depuis votre fiche
          publique ou une fiche annonce apparaîtront ici.
        </p>
      )}
    </div>
  );
}
