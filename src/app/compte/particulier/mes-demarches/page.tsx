import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getEstimationRequestsByUser } from "@/lib/estimations";
import { getOpenHouseRegistrationsByUser } from "@/lib/open-house";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes démarches",
};

function formatCreneau(start: Date, end: Date): string {
  const day = start.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
  const time = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time(start)} – ${time(end)}`;
}

export default async function CompteParticulierDemarchesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/particulier/mes-demarches");
  if (session.type !== "PARTICULIER") redirect("/compte");

  const [myEstimationRequests, myOpenHouseRegistrations] = await Promise.all([
    getEstimationRequestsByUser(session.userId),
    getOpenHouseRegistrationsByUser(session.userId),
  ]);

  const myEstimationItems = myEstimationRequests.map((e) => ({
    id: e.id,
    adresse: e.adresse,
    agencyId: e.agencyId,
    agencyNom: e.agencyNom,
    statut: e.statut,
    preferredDateLabel: e.preferredDate
      ? e.preferredDate.toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
  }));

  const myOpenHouseItems = myOpenHouseRegistrations.map((r) => ({
    id: r.id,
    statut: r.statut,
    annulee: r.annulee,
    creneauLabel: formatCreneau(r.dateStartAt, r.dateEndAt),
    listingTitre: r.listingTitre,
    listingHref: r.listingHref,
  }));

  return (
    <div className="flex flex-col gap-9">
      <div>
        <h2 className="m-0 font-display text-[24px] text-ink">
          Mes demandes d&apos;estimation ({myEstimationItems.length})
        </h2>
        {myEstimationItems.length > 0 ? (
          <div className="mt-5 flex flex-col gap-2">
            {myEstimationItems.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/professionnels/${e.agencyId}`}
                    className="text-[14px] font-semibold text-ink hover:text-blue"
                  >
                    {e.agencyNom}
                  </Link>
                  <span className="text-[13px] text-muted">
                    {e.adresse}
                    {e.preferredDateLabel ? ` · ${e.preferredDateLabel}` : ""}
                  </span>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background:
                      e.statut === "ACCEPTEE" ? "#EAF3E8" : e.statut === "REFUSEE" ? "var(--pvl-surface)" : "#FBF3DC",
                    color:
                      e.statut === "ACCEPTEE"
                        ? "var(--pvl-green)"
                        : e.statut === "REFUSEE"
                          ? "var(--pvl-muted)"
                          : "var(--pvl-gold)",
                  }}
                >
                  {e.statut === "ACCEPTEE" ? "Acceptée" : e.statut === "REFUSEE" ? "Refusée" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Les demandes de rendez-vous d&apos;estimation envoyées à une agence apparaîtront ici.
          </p>
        )}
      </div>

      <div>
        <h2 className="m-0 font-display text-[24px] text-ink">
          Mes inscriptions portes ouvertes ({myOpenHouseItems.length})
        </h2>
        {myOpenHouseItems.length > 0 ? (
          <div className="mt-5 flex flex-col gap-2">
            {myOpenHouseItems.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <Link href={e.listingHref} className="text-[14px] font-semibold text-ink hover:text-blue">
                    {e.listingTitre}
                  </Link>
                  <span className="text-[13px] text-muted">
                    {e.creneauLabel}
                    {e.annulee ? " · évènement annulé" : ""}
                  </span>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background:
                      e.statut === "ACCEPTEE" ? "#EAF3E8" : e.statut === "REFUSEE" ? "var(--pvl-surface)" : "#FBF3DC",
                    color:
                      e.statut === "ACCEPTEE"
                        ? "var(--pvl-green)"
                        : e.statut === "REFUSEE"
                          ? "var(--pvl-muted)"
                          : "var(--pvl-gold)",
                  }}
                >
                  {e.statut === "ACCEPTEE" ? "Confirmée" : e.statut === "REFUSEE" ? "Non retenue" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Vos inscriptions aux portes ouvertes d&apos;autres annonces apparaîtront ici.
          </p>
        )}
      </div>
    </div>
  );
}
