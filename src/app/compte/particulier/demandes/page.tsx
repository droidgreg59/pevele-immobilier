import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getVisitRequestsForOwner } from "@/lib/visits";
import { getPendingOpenHouseRegistrationsForOwner } from "@/lib/open-house";
import { fullName, formatPreferredDateTime } from "@/lib/format";
import VisitRequestList from "@/components/VisitRequestList";
import OpenHouseRegistrationList from "@/components/OpenHouseRegistrationList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes reçues",
};

function formatCreneau(start: Date, end: Date): string {
  const day = start.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
  const time = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time(start)} – ${time(end)}`;
}

export default async function CompteParticulierDemandesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/particulier/demandes");
  if (session.type !== "PARTICULIER") redirect("/compte");

  const [visitRequests, pendingOpenHouse] = await Promise.all([
    getVisitRequestsForOwner(session.userId),
    getPendingOpenHouseRegistrationsForOwner(session.userId),
  ]);

  const visitItems = visitRequests.map((v) => ({
    id: v.id,
    message: v.message,
    telephone: v.telephone,
    preferredDateLabel: formatPreferredDateTime(v.preferredDate),
    traite: v.traite,
    createdLabel: v.createdAt.toLocaleDateString("fr-FR"),
    authorNom: fullName(v.author.prenom, v.author.nom),
    authorEmail: v.author.email,
    listingId: v.listing.id,
    listingTitre: v.listing.titre,
    listingHref: `/${v.listing.transaction === "VENTE" ? "acheter" : "louer"}/${v.listing.id}`,
  }));

  const openHouseItems = pendingOpenHouse.map((r) => ({
    id: r.id,
    nom: r.nom,
    prenom: r.prenom,
    telephone: r.telephone,
    email: r.email,
    createdLabel: r.createdAt.toLocaleDateString("fr-FR"),
    creneauLabel: formatCreneau(r.dateStartAt, r.dateEndAt),
    listingTitre: r.listingTitre,
    listingHref: r.listingHref,
    manageHref: `/compte/annonces/${r.listingId}`,
  }));

  return (
    <div className="flex flex-col gap-9">
      <div>
        <h2 className="m-0 font-display text-[24px] text-ink">
          Demandes de visite ({visitItems.length})
        </h2>
        {visitItems.length > 0 ? (
          <div className="mt-5">
            <VisitRequestList items={visitItems} />
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Les demandes de visite envoyées sur vos annonces apparaîtront ici.
          </p>
        )}
      </div>

      <div>
        <h2 className="m-0 font-display text-[24px] text-ink">
          Inscriptions portes ouvertes ({openHouseItems.length})
        </h2>
        {openHouseItems.length > 0 ? (
          <div className="mt-5">
            <OpenHouseRegistrationList items={openHouseItems} />
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Les inscriptions aux portes ouvertes de vos annonces apparaîtront ici. Créez un
            évènement depuis « Modifier cette annonce ».
          </p>
        )}
      </div>
    </div>
  );
}
