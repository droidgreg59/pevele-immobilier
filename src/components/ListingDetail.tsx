"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Heart,
  Thermometer,
  Gauge,
  TreePine,
  Warehouse,
  SquareParking,
  DoorOpen,
  Sun,
  Archive,
  Waves,
  Flame,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ListingWithOwner, PriceHistoryEntry } from "@/lib/listings";
import type { DvfTransactionSummary, DvfVillageStats } from "@/lib/dvf";
import type { ArtisanSummary } from "@/lib/artisans";
import { getVideoEmbedUrl } from "@/lib/video-embed";
import { getVillageBySlug } from "@/data/villages";
import { formatPrix, formatPrixM2 } from "@/lib/format";
import { markListingViewed } from "@/lib/viewed-listings";
import FavoriteButton from "./FavoriteButton";
import PhotoGallery from "./PhotoGallery";
import VisitRequestForm from "./VisitRequestForm";
import BottomSheet from "./BottomSheet";

const EQUIPEMENT_ICON: Record<string, LucideIcon> = {
  Jardin: TreePine,
  Garage: Warehouse,
  Parking: SquareParking,
  Balcon: DoorOpen,
  Terrasse: Sun,
  Cave: Archive,
  Piscine: Waves,
  Cheminée: Flame,
};

const TYPE_MAISON_LABEL_LOWER: Record<string, string> = {
  INDIVIDUELLE: "individuelle",
  SEMI_INDIVIDUELLE: "semi-individuelle",
  MITOYENNE: "mitoyenne",
};

function sourceLabel(owner: ListingWithOwner["owner"]): string {
  if (owner.type === "PARTICULIER") return "Entre voisins — particulier";
  return `Agence — ${owner.entreprise ?? owner.nom}`;
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

function PriceHistoryChart({ history }: { history: PriceHistoryEntry[] }) {
  const maxPrix = Math.max(...history.map((h) => h.prix));
  return (
    <div className="flex h-14 items-end gap-1.5">
      {history.map((h, i) => {
        const isLast = i === history.length - 1;
        const heightPct = Math.max((h.prix / maxPrix) * 100, 12);
        return (
          <div
            key={h.id}
            title={`${h.prix.toLocaleString("fr-FR")} € — ${new Date(h.changedAt).toLocaleDateString("fr-FR")}`}
            className="flex-1 rounded-t-md transition-all"
            style={{
              height: `${heightPct}%`,
              background: isLast ? "var(--pvl-green)" : "var(--pvl-line)",
            }}
          />
        );
      })}
    </div>
  );
}

export default function ListingDetail({
  listing,
  dvfStats,
  dvfRecent,
  priceHistory,
  isOwner,
  isLoggedIn,
  isFavorited,
  artisans,
}: {
  listing: ListingWithOwner;
  dvfStats: DvfVillageStats | null;
  dvfRecent: DvfTransactionSummary[];
  priceHistory: PriceHistoryEntry[];
  isOwner: boolean;
  isLoggedIn: boolean;
  isFavorited: boolean;
  artisans: ArtisanSummary[];
}) {
  const [visitSheetOpen, setVisitSheetOpen] = useState(false);

  useEffect(() => {
    markListingViewed(listing.id);
  }, [listing.id]);

  const particulier = listing.owner.type === "PARTICULIER";
  const enVerification = listing.statut === "EN_VERIFICATION";
  const refusee = listing.statut === "REFUSEE";
  const village = getVillageBySlug(listing.villageSlug);
  const listHref = listing.transaction === "VENTE" ? "/acheter" : "/louer";
  const listingPrixM2 =
    listing.transaction === "VENTE"
      ? Math.round(listing.prix / listing.surface)
      : null;
  const prixM2 = listingPrixM2 ? formatPrixM2(listing.prix, listing.surface) : null;
  const comparisonText = marketComparison(listingPrixM2, dvfStats);
  const videoEmbedUrl = listing.videoUrl ? getVideoEmbedUrl(listing.videoUrl) : null;
  const equipements = listing.equipements
    ? listing.equipements.split(",").filter(Boolean)
    : [];
  const features: { label: string; value?: string; Icon: LucideIcon }[] = [
    ...(listing.modeChauffage
      ? [{ label: "Chauffage", value: listing.modeChauffage, Icon: Thermometer }]
      : []),
    ...(listing.dpe ? [{ label: `DPE ${listing.dpe}`, Icon: Gauge }] : []),
    ...equipements.map((eq) => ({ label: eq, Icon: EQUIPEMENT_ICON[eq] ?? Sparkles })),
  ];
  const prixInitial = priceHistory[0]?.prix ?? listing.prix;
  const enBaisse = priceHistory.length > 1 && listing.prix < prixInitial;
  const baissePct = enBaisse
    ? Math.round(((prixInitial - listing.prix) / prixInitial) * 100)
    : 0;

  const statusBadge = enVerification
    ? { label: "En vérification", bg: "var(--pvl-blue)", fg: "#fff" }
    : refusee
      ? { label: "Refusée", bg: "var(--pvl-ink)", fg: "#fff" }
      : listing.badge
        ? { label: listing.badge, bg: "var(--pvl-yellow)", fg: "var(--pvl-ink)" }
        : null;

  return (
    <div className="animate-fade-up max-w-[1200px] px-9 pb-28 pt-8 md:pb-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={listHref} className="text-[13px] font-semibold text-blue">
          ← {listing.transaction === "VENTE" ? "Toutes les annonces" : "Toutes les locations"}
        </Link>
        <Link href="/" className="text-[13px] font-semibold text-blue">
          ← Retour à l&apos;accueil
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-9 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          <PhotoGallery
            photos={listing.photos}
            alt={`${listing.titre} — ${listing.commune}`}
            overlay={
              <>
                <span
                  className="absolute left-3 top-3 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                  style={{
                    background: particulier ? "#FBF3DC" : "#EDF1FB",
                    color: particulier ? "var(--pvl-gold)" : "var(--pvl-blue)",
                  }}
                >
                  {sourceLabel(listing.owner)}
                </span>
                <FavoriteButton
                  listingId={listing.id}
                  initialFavorited={isFavorited}
                  className="absolute right-3 top-3 flex items-center justify-center rounded-full border border-line bg-white text-lg leading-none text-blue shadow-sm"
                />
                {statusBadge ? (
                  <span
                    className="absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm"
                    style={{ background: statusBadge.bg, color: statusBadge.fg }}
                  >
                    {statusBadge.label}
                  </span>
                ) : null}
              </>
            }
          />
          {listing.videoUrl || listing.visiteVirtuelleUrl ? (
            <div className="mt-3 flex flex-col gap-3">
              {listing.videoUrl && videoEmbedUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line">
                  <iframe
                    src={videoEmbedUrl}
                    title="Vidéo du bien"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : listing.videoUrl ? (
                <a
                  href={listing.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-blue"
                >
                  ▶ Voir la vidéo →
                </a>
              ) : null}
              {listing.visiteVirtuelleUrl ? (
                <a
                  href={listing.visiteVirtuelleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit rounded-full border border-line px-5 py-3 text-[13px] font-semibold text-ink transition hover:bg-surface"
                >
                  Voir la visite virtuelle 360° →
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:grid-cols-4">
            {[
              ["Pièces", `${listing.pieces} p.`],
              ["Chambres", `${listing.chambres} ch.`],
              ["Surface", `${listing.surface} m²`],
              ["Extérieur", listing.exterieur],
            ].map(([label, value]) => (
              <span
                key={label}
                className="flex flex-col gap-1 rounded-xl bg-surface px-3 py-3 text-center"
              >
                <b className="font-display text-xl text-ink">{value}</b>
                <span className="text-[10px] font-semibold text-muted">{label}</span>
              </span>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="m-0 font-display text-2xl text-ink">Le bien</h2>
            <p className="mt-3 max-w-[70ch] font-sans text-[15px] leading-[1.65] text-muted">
              {listing.description}
            </p>
          </section>

          {features.length > 0 ? (
            <section className="mt-8">
              <h2 className="m-0 font-display text-2xl text-ink">Les équipements</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {features.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm transition hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-soft text-blue">
                      <f.Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13.5px] font-semibold text-ink">
                        {f.label}
                      </span>
                      {f.value ? (
                        <span className="truncate text-[11.5px] text-muted">{f.value}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {listing.transaction === "VENTE" ? (
            <section className="mt-8">
              <h2 className="m-0 font-display text-2xl text-ink">Le marché</h2>
              {dvfStats ? (
                <div className="mt-3 flex flex-col gap-4">
                  <div className="rounded-2xl bg-surface p-5">
                    <p className="m-0 font-sans text-[14.5px] leading-[1.6] text-ink">
                      Prix moyen constaté à <b>{village?.nom}</b> :{" "}
                      <b>{dvfStats.avgPrixM2.toLocaleString("fr-FR")} € / m²</b>{" "}
                      ({dvfStats.count} vente{dvfStats.count > 1 ? "s" : ""},{" "}
                      {dvfStats.minAnnee}–{dvfStats.maxAnnee}).
                    </p>
                    {comparisonText ? (
                      <p className="m-0 mt-2 text-[12.5px] font-semibold text-blue">
                        {comparisonText}
                      </p>
                    ) : null}
                  </div>
                  {dvfRecent.length > 0 ? (
                    <div className="rounded-2xl border border-line bg-white">
                      <div className="border-b border-line px-4 py-2 text-[11px] font-semibold text-muted">
                        Dernières ventes à {village?.nom}
                      </div>
                      <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                        {dvfRecent.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12.5px]"
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
                  <p className="m-0 text-[11px] text-muted-2">
                    Source : DVF (data.gouv.fr / Etalab) —{" "}
                    <Link href="/prix" className="text-blue">
                      voir tous les villages →
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-line bg-surface p-6">
                  <span className="text-[11px] font-semibold text-blue">
                    Données insuffisantes
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
            <h2 className="m-0 font-display text-2xl text-ink">L&apos;environnement</h2>
            <div className="mt-3 rounded-2xl border border-dashed border-line bg-surface p-6">
              <span className="text-[11px] font-semibold text-muted">
                Bientôt disponible
              </span>
              <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
                Écoles, commerces, transports et temps de trajet autour du
                bien.
              </p>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-[88px] lg:self-start">
          <div className="relative rounded-2xl border border-line bg-white p-6 shadow-sm">
            <span className="text-[11px] font-semibold text-muted">
              ◉ {listing.commune} ·{" "}
              {listing.typeBien === "MAISON"
                ? "Maison"
                : listing.typeBien === "APPARTEMENT"
                  ? "Appartement"
                  : "Terrain"}
              {listing.typeBien === "MAISON" && listing.typeMaison
                ? ` ${TYPE_MAISON_LABEL_LOWER[listing.typeMaison]}`
                : ""}
            </span>
            <h1 className="m-0 mt-1 font-display text-[28px] leading-tight text-ink">
              {listing.titre}
            </h1>
            <div className="mt-4 font-display text-[34px] tracking-[.02em] text-ink">
              {formatPrix(listing.prix, listing.transaction)}
            </div>
            {prixM2 ? (
              <span className="text-[12px] font-medium text-muted">soit {prixM2}</span>
            ) : null}
            {enBaisse ? (
              <span className="ml-2 rounded-full bg-[#EAF3E8] px-2 py-0.5 text-[11px] font-semibold text-green">
                ↓ Prix en baisse (-{baissePct}%)
              </span>
            ) : null}
            <div className="mt-4 rounded-xl bg-surface p-3.5">
              <span className="text-[10.5px] font-semibold text-muted-2">
                Historique du prix
              </span>
              {priceHistory.length > 1 ? (
                <div className="mt-2">
                  <PriceHistoryChart history={priceHistory} />
                </div>
              ) : null}
              {priceHistory.length > 0 ? (
                <ul className="m-0 mt-2.5 flex list-none flex-col gap-1.5 p-0">
                  {priceHistory.map((h, i) => {
                    const prev = priceHistory[i - 1];
                    const delta = prev ? h.prix - prev.prix : null;
                    return (
                      <li
                        key={h.id}
                        className="flex items-center justify-between gap-2 text-[12px]"
                      >
                        <span className="text-muted-2">
                          {new Date(h.changedAt).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="text-ink">
                          {h.prix.toLocaleString("fr-FR")} €
                          {delta ? (
                            <span
                              className="ml-1.5"
                              style={{ color: delta < 0 ? "var(--pvl-green)" : "var(--pvl-gold)" }}
                            >
                              ({delta > 0 ? "+" : ""}
                              {delta.toLocaleString("fr-FR")} €)
                            </span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="m-0 mt-1.5 font-sans text-[12.5px] text-muted-2">
                  Aucun changement de prix enregistré depuis la publication.
                </p>
              )}
            </div>
            {isOwner ? (
              <Link
                href={`/compte/annonces/${listing.id}`}
                className="mt-4 inline-block rounded-full border border-line px-5 py-3 text-[13px] font-semibold text-ink transition hover:bg-surface"
              >
                Modifier l&apos;annonce
              </Link>
            ) : isLoggedIn ? (
              <div className="hidden md:block">
                <VisitRequestForm listingId={listing.id} />
              </div>
            ) : (
              <p className="mt-4 font-sans text-[12.5px] leading-[1.6] text-muted">
                <Link
                  href={`/connexion?next=${encodeURIComponent(`${listHref}/${listing.id}`)}`}
                  className="text-blue"
                >
                  Connectez-vous
                </Link>{" "}
                pour contacter le propriétaire et demander une visite.
              </p>
            )}
            {enVerification ? (
              <span className="animate-scale-press pointer-events-none absolute right-5 top-5 flex h-[92px] w-[92px] items-center justify-center rounded-full border-2 border-blue text-center text-[9.5px] font-semibold leading-tight text-blue">
                En cours de
                <br />
                vérification
                <br />· sous 24h ·
              </span>
            ) : null}
          </div>

          {village ? (
            <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <span className="text-[11px] font-semibold text-green">Le village</span>
              <h3 className="m-0 mt-1 font-display text-xl text-ink">{village.nom}</h3>
              <p className="m-0 mt-2 font-sans text-[13px] leading-[1.55] text-muted">
                {village.description}
              </p>
              <Link
                href={`/villages/${village.slug}`}
                className="mt-3 inline-block text-[12.5px] font-semibold text-blue"
              >
                Voir la fiche du village →
              </Link>
            </div>
          ) : null}

          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <span className="text-[11px] font-semibold text-gold">Les services</span>
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/estimer"
                className="rounded-full border border-line px-3.5 py-2.5 text-center text-[12.5px] font-semibold text-ink transition hover:bg-surface"
              >
                Estimer un bien similaire
              </Link>
              <Link
                href="/vendre"
                className="rounded-full border border-line px-3.5 py-2.5 text-center text-[12.5px] font-semibold text-ink transition hover:bg-surface"
              >
                Voir les packs vendeur
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <span className="text-[11px] font-semibold text-muted">
              Artisans autour du bien
            </span>
            {artisans.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2.5">
                {artisans.map((a) => (
                  <Link
                    key={a.id}
                    href={`/artisans/${a.id}`}
                    className="flex flex-col gap-0.5 rounded-xl bg-surface px-3 py-2 transition hover:bg-[#FDEBC2]"
                  >
                    <span className="font-sans text-[13px] font-semibold text-ink">
                      {a.entreprise ?? a.nom}
                    </span>
                    {a.categories.length > 0 ? (
                      <span className="text-[11px] text-muted-2">
                        {a.categories.join(" · ")}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="m-0 mt-2 font-sans text-[12.5px] leading-[1.6] text-muted-2">
                Aucun artisan référencé pour cette commune pour le moment.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/artisans" className="text-[12px] font-semibold text-blue">
                Tous les artisans →
              </Link>
              <Link href="/professionnels" className="text-[12px] font-semibold text-blue">
                Professionnels →
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {!isOwner ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-white/97 px-4 py-3 backdrop-blur md:hidden"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <FavoriteButton
            listingId={listing.id}
            initialFavorited={isFavorited}
            size={48}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-white text-[20px] leading-none text-blue"
          />
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setVisitSheetOpen(true)}
              className="flex-1 rounded-full bg-yellow px-5 py-3.5 text-center text-[14px] font-bold text-ink shadow-sm"
            >
              Demander une visite
            </button>
          ) : (
            <Link
              href={`/connexion?next=${encodeURIComponent(`${listHref}/${listing.id}`)}`}
              className="flex-1 rounded-full bg-yellow px-5 py-3.5 text-center text-[14px] font-bold text-ink shadow-sm"
            >
              Se connecter pour visiter
            </Link>
          )}
        </div>
      ) : null}

      <BottomSheet
        open={visitSheetOpen}
        onClose={() => setVisitSheetOpen(false)}
        title="Demander une visite"
      >
        <span className="mb-1 flex items-center gap-1.5 text-[12.5px] text-muted">
          <Heart className="h-3.5 w-3.5" strokeWidth={1.75} />
          {listing.titre}
        </span>
        <VisitRequestForm listingId={listing.id} />
      </BottomSheet>
    </div>
  );
}
