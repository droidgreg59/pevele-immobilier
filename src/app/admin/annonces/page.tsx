import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, getPendingListings } from "@/lib/admin";
import { publishListingAction, rejectListingAction } from "@/lib/admin-actions";
import { formatPrix } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modération des annonces — Pévèle Immobilier",
};

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

export default async function AdminAnnoncesPage() {
  await requireAdmin();
  const pending = await getPendingListings();

  return (
    <div className="animate-view-in max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-blue">
        ADMINISTRATION
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        MODÉRATION DES ANNONCES
      </h1>
      <Link href="/compte" className="font-mono text-[11.5px] font-medium text-blue">
        ← MON COMPTE
      </Link>

      <p className="mt-6 max-w-[64ch] font-sans text-[14.5px] leading-[1.6] text-muted">
        {pending.length > 0
          ? `${pending.length} annonce${pending.length > 1 ? "s" : ""} en attente de vérification.`
          : "Aucune annonce en attente — tout est à jour."}
      </p>

      <div className="mt-7 flex flex-col gap-5">
        {pending.map((listing) => (
          <div
            key={listing.id}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:flex-row"
          >
            <div className="h-[120px] w-full shrink-0 overflow-hidden rounded-xl bg-surface sm:w-[160px]">
              {listing.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.coverUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-muted-2">
                  Aucune photo
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-sans text-[16px] font-bold text-ink">
                  {listing.titre}
                </span>
                <span className="font-mono text-[13px] font-semibold text-blue">
                  {formatPrix(listing.prix, listing.transaction)}
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted">
                {listing.commune.toUpperCase()} · {TYPE_BIEN_LABEL[listing.typeBien] ?? listing.typeBien} ·{" "}
                {listing.transaction === "VENTE" ? "Vente" : "Location"}
              </span>
              <span className="font-mono text-[10.5px] text-muted-2">
                Déposée par {listing.ownerLabel} le{" "}
                {listing.createdAt.toLocaleDateString("fr-FR")}
              </span>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <form action={publishListingAction}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-yellow px-5 py-2.5 font-mono text-[11px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
                  >
                    PUBLIER →
                  </button>
                </form>
                <details className="flex-1">
                  <summary className="cursor-pointer font-mono text-[11px] font-medium text-muted hover:text-ink">
                    REFUSER…
                  </summary>
                  <form
                    action={rejectListingAction}
                    className="mt-2 flex flex-col gap-2"
                  >
                    <input type="hidden" name="listingId" value={listing.id} />
                    <textarea
                      name="raison"
                      rows={2}
                      placeholder="Motif communiqué au dépositaire (optionnel)"
                      className="rounded-xl border border-line bg-white px-3 py-2 font-sans text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                    />
                    <button
                      type="submit"
                      className="self-start rounded-full border border-line px-4 py-2 font-mono text-[11px] font-medium text-ink transition hover:bg-surface"
                    >
                      CONFIRMER LE REFUS
                    </button>
                  </form>
                </details>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
