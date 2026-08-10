import Link from "next/link";
import type { Listing } from "@/data/listings";
import { getVillageBySlug } from "@/data/villages";
import FavoriteButton from "./FavoriteButton";

function formatEuros(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

export default function ListingDetail({ listing }: { listing: Listing }) {
  const particulier = listing.type === "particulier";
  const village = getVillageBySlug(listing.villageSlug);
  const listHref = listing.transaction === "vente" ? "/acheter" : "/louer";
  const prixM2 =
    listing.transaction === "vente"
      ? formatEuros(Math.round(listing.prixNombre / listing.surfaceM2)) + " / M²"
      : null;

  return (
    <div className="animate-view-in max-w-[1200px] px-9 py-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={listHref} className="font-mono text-[11.5px] font-medium text-blue">
          ← {listing.transaction === "vente" ? "TOUTES LES ANNONCES" : "TOUTES LES LOCATIONS"}
        </Link>
        <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
          ← RETOUR AU PLAN
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-9 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="relative h-[360px] overflow-hidden border-[2.5px] border-ink">
            <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,#EDEAE1_0_14px,#E4E0D3_14px_28px)] px-4 text-center font-mono text-[10.5px] text-muted-2">
              {listing.photoLabel}
            </div>
            {listing.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.photo}
                alt={listing.titre}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <span
              className="absolute left-3 top-3 whitespace-nowrap border-2 border-ink px-2.5 py-1.5 font-mono text-[9.5px] font-semibold"
              style={{
                background: particulier ? "#FBF3DC" : "#EDF1FB",
                color: particulier ? "var(--pvl-gold)" : "var(--pvl-blue)",
              }}
            >
              {listing.source}
            </span>
            <FavoriteButton className="absolute right-3 top-3 flex items-center justify-center rounded-full border-2 border-ink bg-white text-lg leading-none text-blue" />
            <span className="absolute bottom-0 right-0 border-l-2 border-t-2 border-ink bg-yellow px-3 py-2 font-mono text-[10px] font-semibold text-ink">
              {listing.badge}
            </span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-2">
            Galerie complète et visite virtuelle — bientôt disponibles.
          </p>

          <section className="mt-8">
            <h2 className="m-0 font-display text-2xl text-ink">LE BIEN</h2>
            <p className="mt-3 max-w-[70ch] font-sans text-[15px] leading-[1.65] text-muted">
              {listing.description}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                ["PIÈCES", listing.pieces],
                ["CHAMBRES", listing.chambres],
                ["SURFACE", listing.surface],
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
              <span className="border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-semibold text-ink">
                DPE {listing.dpe}
              </span>
              {listing.equipements.map((eq) => (
                <span
                  key={eq}
                  className="border border-line bg-white px-2.5 py-1 font-mono text-[10.5px] text-muted"
                >
                  {eq}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="m-0 font-display text-2xl text-ink">LE MARCHÉ</h2>
            <div className="mt-3 border-2 border-dashed border-blue bg-white p-6">
              <span className="font-mono text-[10.5px] font-medium text-blue">
                BIENTÔT DISPONIBLE
              </span>
              <p className="m-0 mt-2 max-w-[60ch] font-sans text-[14px] leading-[1.6] text-muted">
                Transactions DVF à proximité, prix moyen constaté dans le
                secteur et comparaison avec {village ? village.nom : "la commune"}
                {" "}
                arrivent dans une prochaine étape.{" "}
                <Link href="/prix" className="text-blue">
                  Voir les prix de l&apos;immobilier →
                </Link>
              </p>
            </div>
          </section>

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
          <div className="border-[2.5px] border-ink bg-white p-6 shadow-[6px_6px_0_rgba(39,67,166,.22)]">
            <span className="font-mono text-[10.5px] font-medium text-muted">
              ◉ {listing.commune.toUpperCase()}
            </span>
            <h1 className="m-0 mt-1 font-display text-[28px] leading-tight text-ink">
              {listing.titre}
            </h1>
            <div className="mt-4 font-display text-[34px] tracking-[.02em] text-ink">
              {listing.prix}
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
