import Link from "next/link";
import type { ListingWithOwner } from "@/lib/listings";
import type { DvfTransactionSummary, DvfVillageStats } from "@/lib/dvf";
import { getVillageBySlug } from "@/data/villages";
import { formatPrix, formatPrixM2 } from "@/lib/format";
import FavoriteButton from "./FavoriteButton";
import PhotoGallery from "./PhotoGallery";

function sourceLabel(owner: ListingWithOwner["owner"]): string {
  if (owner.type === "PARTICULIER") return "ENTRE VOISINS — PARTICULIER";
  return `AGENCE — ${owner.entreprise ?? owner.nom}`;
}

function marketComparison(
  listingPrixM2: number | null,
  dvfStats: DvfVillageStats | null
): string | null {
  if (!listingPrixM2 || !dvfStats) return null;
  const diffPct = Math.round(
    ((listingPrixM2 - dvfStats.avgPrixM2) / dvfStats.avgPrixM2) * 100
  );
  if (diffPct > 3) return `${diffPct}% au-dessus du prix moyen constaté dans le secteur.`;
  if (diffPct < -3) return `${Math.abs(diffPct)}% en-dessous du prix moyen constaté dans le secteur.`;
  return "Dans la moyenne du secteur.";
}

export default function ListingDetail({
  listing,
  dvfStats,
  dvfRecent,
}: {
  listing: ListingWithOwner;
  dvfStats: DvfVillageStats | null;
  dvfRecent: DvfTransactionSummary[];
}) {
  const particulier = listing.owner.type === "PARTICULIER";
  const enVerification = listing.statut === "EN_VERIFICATION";
  const village = getVillageBySlug(listing.villageSlug);
  const listHref = listing.transaction === "VENTE" ? "/acheter" : "/louer";
  const listingPrixM2 =
    listing.transaction === "VENTE"
      ? Math.round(listing.prix / listing.surface)
      : null;
  const prixM2 = listingPrixM2 ? formatPrixM2(listing.prix, listing.surface) : null;
  const comparisonText = marketComparison(listingPrixM2, dvfStats);
  const equipements = listing.equipements
    ? listing.equipements.split(",").filter(Boolean)
    : [];

  return (
    <div className="animate-view-in max-w-[1200px] px-9 py-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={listHref} className="font-mono text-[11.5px] font-medium text-blue">
          ← {listing.transaction === "VENTE" ? "TOUTES LES ANNONCES" : "TOUTES LES LOCATIONS"}
        </Link>
        <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
          ← RETOUR AU PLAN
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-9 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <PhotoGallery
            photos={listing.photos}
            alt={listing.titre}
            overlay={
              <>
                <span
                  className="absolute left-3 top-3 whitespace-nowrap border-2 border-ink px-2.5 py-1.5 font-mono text-[9.5px] font-semibold"
                  style={{
                    background: particulier ? "#FBF3DC" : "#EDF1FB",
                    color: particulier ? "var(--pvl-gold)" : "var(--pvl-blue)",
                  }}
                >
                  {sourceLabel(listing.owner)}
                </span>
                <FavoriteButton className="absolute right-3 top-3 flex items-center justify-center rounded-full border-2 border-ink bg-white text-lg leading-none text-blue" />
                {enVerification ? (
                  <span className="absolute bottom-0 right-0 border-l-2 border-t-2 border-ink bg-blue px-3 py-2 font-mono text-[10px] font-semibold text-white">
                    EN VÉRIFICATION
                  </span>
                ) : listing.badge ? (
                  <span className="absolute bottom-0 right-0 border-l-2 border-t-2 border-ink bg-yellow px-3 py-2 font-mono text-[10px] font-semibold text-ink">
                    {listing.badge}
                  </span>
                ) : null}
              </>
            }
          />
          <p className="mt-2 font-mono text-[10px] text-muted-2">
            Visite virtuelle — bientôt disponible.
          </p>

          <section className="mt-8">
            <h2 className="m-0 font-display text-2xl text-ink">LE BIEN</h2>
            <p className="mt-3 max-w-[70ch] font-sans text-[15px] leading-[1.65] text-muted">
              {listing.description}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                ["PIÈCES", `${listing.pieces} P.`],
                ["CHAMBRES", `${listing.chambres} CH.`],
                ["SURFACE", `${listing.surface} M²`],
                ["EXTÉRIEUR", listing.exterieur],
              ].map(([label, value]) => (
                <span
                  key={label}
                  className="flex flex-col gap-1 border-2 border-ink bg-[#F7F4EA] px-3 py-2.5 text-center"
                >
                  <b className="font-sans text-sm font-semibold text-ink">
                    {value}
                  </b>
                  <span className="font-mono text-[8px] font-medium text-muted">
                    {label}
                  </span>
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {listing.dpe ? (
                <span className="border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-semibold text-ink">
                  DPE {listing.dpe}
                </span>
              ) : null}
              {equipements.map((eq) => (
                <span
                  key={eq}
                  className="border border-line bg-white px-2.5 py-1 font-mono text-[10.5px] text-muted"
                >
                  {eq}
                </span>
              ))}
            </div>
          </section>

          {listing.transaction === "VENTE" ? (
            <section className="mt-8">
              <h2 className="m-0 font-display text-2xl text-ink">LE MARCHÉ</h2>
              {dvfStats ? (
                <div className="mt-3 flex flex-col gap-4">
                  <div className="border-2 border-ink bg-[#F7F4EA] p-5">
                    <p className="m-0 font-sans text-[14.5px] leading-[1.6] text-ink">
                      Prix moyen constaté à <b>{village?.nom}</b> :{" "}
                      <b>{dvfStats.avgPrixM2.toLocaleString("fr-FR")} € / m²</b>{" "}
                      ({dvfStats.count} vente{dvfStats.count > 1 ? "s" : ""},{" "}
                      {dvfStats.minAnnee}–{dvfStats.maxAnnee}).
                    </p>
                    {comparisonText ? (
                      <p className="m-0 mt-2 font-mono text-[11.5px] text-blue">
                        {comparisonText}
                      </p>
                    ) : null}
                  </div>
                  {dvfRecent.length > 0 ? (
                    <div className="border-2 border-line bg-white">
                      <div className="border-b-2 border-line px-4 py-2 font-mono text-[10px] font-medium text-muted">
                        DERNIÈRES VENTES À {village?.nom.toUpperCase()}
                      </div>
                      <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                        {dvfRecent.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 font-mono text-[11.5px]"
                          >
                            <span className="text-muted">
                              {new Date(t.dateMutation).toLocaleDateString("fr-FR")} ·{" "}
                              {t.typeLocal} · {t.surfaceBati} m²
                            </span>
                            <span className="font-semibold text-ink">
                              {t.valeurFonciere.toLocaleString("fr-FR")} €
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className="m-0 font-mono text-[10px] text-muted-2">
                    Source : DVF (data.gouv.fr / Etalab) —{" "}
                    <Link href="/prix" className="text-blue">
                      voir tous les villages →
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="mt-3 border-2 border-dashed border-blue bg-white p-6">
                  <span className="font-mono text-[10.5px] font-medium text-blue">
                    DONNÉES INSUFFISANTES
                  </span>
                  <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
                    Pas assez de ventes DVF enregistrées à{" "}
                    {village ? village.nom : "cette commune"} pour établir une
                    moyenne fiable.
                  </p>
                </div>
              )}
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="m-0 font-display text-2xl text-ink">
              L&apos;ENVIRONNEMENT
            </h2>
            <div className="mt-3 border-2 border-dashed border-muted-2 bg-white p-6">
              <span className="font-mono text-[10.5px] font-medium text-muted">
                BIENTÔT DISPONIBLE
              </span>
              <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
                Écoles, commerces, transports et temps de trajet autour du
                bien.
              </p>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="relative border-[2.5px] border-ink bg-white p-6 shadow-[6px_6px_0_rgba(39,67,166,.22)]">
            <span className="font-mono text-[10.5px] font-medium text-muted">
              ◉ {listing.commune.toUpperCase()}
            </span>
            <h1 className="m-0 mt-1 font-display text-[28px] leading-tight text-ink">
              {listing.titre}
            </h1>
            <div className="mt-4 font-display text-[34px] tracking-[.02em] text-ink">
              {formatPrix(listing.prix, listing.transaction)}
            </div>
            {prixM2 ? (
              <span className="font-mono text-[11px] font-medium text-muted">
                soit {prixM2}
              </span>
            ) : null}
            <div className="mt-4 border-2 border-dashed border-muted-2 p-3.5">
              <span className="font-mono text-[10px] font-medium text-muted-2">
                HISTORIQUE DU PRIX
              </span>
              <p className="m-0 mt-1.5 font-sans text-[12.5px] text-muted-2">
                Bientôt disponible : chaque évolution de prix sera enregistrée
                et affichée ici.
              </p>
            </div>
            <p className="mt-4 font-sans text-[12.5px] leading-[1.6] text-muted">
              Contact et demande de visite : bientôt disponibles.
            </p>
            {enVerification ? (
              <span className="animate-stamp-in pointer-events-none absolute right-5 top-5 flex h-[92px] w-[92px] items-center justify-center rounded-full border-[3px] border-blue text-center font-mono text-[9.5px] font-medium leading-tight text-blue">
                EN COURS DE
                <br />
                VÉRIFICATION
                <br />· SOUS 24H ·
              </span>
            ) : null}
          </div>

          {village ? (
            <div className="border-2 border-ink bg-white p-6">
              <span className="font-mono text-[10.5px] font-medium text-green">
                LE VILLAGE
              </span>
              <h3 className="m-0 mt-1 font-display text-xl text-ink">
                {village.nom.toUpperCase()}
              </h3>
              <p className="m-0 mt-2 font-sans text-[13px] leading-[1.55] text-muted">
                {village.description}
              </p>
              <Link
                href={`/villages/${village.slug}`}
                className="mt-3 inline-block font-mono text-[11px] font-medium text-blue"
              >
                VOIR LA FICHE DU VILLAGE →
              </Link>
            </div>
          ) : null}

          <div className="border-2 border-ink bg-white p-6">
            <span className="font-mono text-[10.5px] font-medium text-gold">
              LES SERVICES
            </span>
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/estimer"
                className="border-2 border-ink px-3.5 py-2.5 text-center font-mono text-[11px] font-medium text-ink hover:bg-[#FDEBC2]"
              >
                ESTIMER UN BIEN SIMILAIRE
              </Link>
              <Link
                href="/vendre"
                className="border-2 border-ink px-3.5 py-2.5 text-center font-mono text-[11px] font-medium text-ink hover:bg-[#FDEBC2]"
              >
                VOIR LES PACKS VENDEUR
              </Link>
            </div>
          </div>

          <div className="border-2 border-dashed border-muted-2 bg-white p-6">
            <span className="font-mono text-[10.5px] font-medium text-muted">
              PROFESSIONNELS AUTOUR DU BIEN
            </span>
            <p className="m-0 mt-2 font-sans text-[12.5px] leading-[1.6] text-muted-2">
              Artisans, courtiers, diagnostiqueurs et notaires locaux —
              bientôt disponibles.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/artisans" className="font-mono text-[11px] text-blue">
                Artisans & Habitat →
              </Link>
              <Link
                href="/professionnels"
                className="font-mono text-[11px] text-blue"
              >
                Professionnels →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
