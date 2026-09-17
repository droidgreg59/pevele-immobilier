import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPendingOpenHouseRegistrationsForOwner } from "@/lib/open-house";
import OpenHouseRegistrationList from "@/components/OpenHouseRegistrationList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portes ouvertes",
};

function formatCreneau(start: Date, end: Date): string {
  const day = start.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
  const time = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time(start)} – ${time(end)}`;
}

export default async function CompteAgencePortesOuvertesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence/portes-ouvertes");
  if (session.type !== "AGENCE") redirect("/compte");

  const registrations = await getPendingOpenHouseRegistrationsForOwner(session.userId);
  const items = registrations.map((r) => ({
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
    <div className="flex flex-col gap-1">
      <h2 className="m-0 font-display text-[24px] text-ink">
        Inscriptions portes ouvertes ({items.length})
      </h2>
      {items.length > 0 ? (
        <div className="mt-5">
          <OpenHouseRegistrationList items={items} />
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Les inscriptions aux portes ouvertes de vos annonces apparaîtront ici. Créez un
          évènement depuis « Modifier cette annonce ».
        </p>
      )}
    </div>
  );
}
