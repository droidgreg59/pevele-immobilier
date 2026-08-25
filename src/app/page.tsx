import Link from "next/link";
import { Home as HomeIcon, TrendingUp, LayoutGrid } from "lucide-react";
import { villages } from "@/data/villages";
import { getPublicListings } from "@/lib/listings";
import { formatPrix } from "@/lib/format";

export const dynamic = "force-dynamic";

const FEATURED_VILLAGE_SLUGS = [
  "cysoing",
  "templeuve-en-pevele",
  "orchies",
  "genech",
  "sainghin-en-melantois",
  "merignies",
  "nomain",
  "bersee",
];

const ENTRIES = [
  {
    href: "/mon-projet",
    icon: HomeIcon,
    title: "Je cherche un bien",
    desc: "Acheter ou louer — on affine ensemble en 2 minutes.",
  },
  {
    href: "/vendre",
    icon: TrendingUp,
    title: "Je vends un bien",
    desc: "Estimer, publier ou être accompagné.",
  },
  {
    href: "/acheter",
    icon: LayoutGrid,
    title: "Je parcours les annonces",
    desc: "Explorer librement, sans définir de projet.",
  },
];

export default async function Home() {
  const recentVentes = await getPublicListings("VENTE");
  const featured = recentVentes.slice(0, 2);
  const featuredVillages = FEATURED_VILLAGE_SLUGS.map((slug) =>
    villages.find((v) => v.slug === slug)
  ).filter((v): v is (typeof villages)[number] => Boolean(v));
  const otherCount = villages.length - featuredVillages.length;

  return (
    <div className="mx-auto max-w-[1330px] px-6 py-8 sm:px-9">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[36px] font-extrabold leading-[1.05] text-ink sm:text-[44px]">
              Quel est votre projet ?
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              Toutes les annonces de la Pévèle — agences et particuliers, 35 communes.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {ENTRIES.map((entry) => {
              const Icon = entry.icon;
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="group flex items-center gap-4 rounded-2xl border border-line bg-white px-5.5 py-4.5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-soft">
                    <Icon className="h-[22px] w-[22px] text-blue" strokeWidth={1.75} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[17px] font-bold text-ink">{entry.title}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{entry.desc}</span>
                  </span>
                  <span className="text-[16px] text-muted-2 transition group-hover:translate-x-0.5 group-hover:text-blue">
                    →
                  </span>
                </Link>
              );
            })}
          </div>

          <form
            action="/acheter"
            method="GET"
            className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm sm:flex-row sm:items-stretch"
          >
            <label className="flex-1 border-b border-line px-4 py-2.5 sm:border-b-0 sm:border-r">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-2">
                Où ?
              </span>
              <select
                name="villages"
                defaultValue=""
                className="w-full bg-transparent text-[14px] text-ink outline-none"
              >
                <option value="">Toute la Pévèle</option>
                {villages.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-[0.85] border-b border-line px-4 py-2.5 sm:border-b-0 sm:border-r">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-2">
                Type
              </span>
              <select
                name="type"
                defaultValue=""
                className="w-full bg-transparent text-[14px] text-ink outline-none"
              >
                <option value="">Tous</option>
                <option value="MAISON">Maison</option>
                <option value="APPARTEMENT">Appartement</option>
                <option value="TERRAIN">Terrain</option>
              </select>
            </label>
            <label className="flex-[0.85] px-4 py-2.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-2">
                Budget
              </span>
              <input
                name="budget"
                type="number"
                min={0}
                step={5000}
                placeholder="Max…"
                className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-muted-2"
              />
            </label>
            <div className="flex items-center p-1.5">
              <button
                type="submit"
                className="w-full whitespace-nowrap rounded-xl bg-blue px-5.5 py-3 text-[14px] font-bold text-white transition hover:brightness-110 sm:w-auto"
              >
                Rechercher
              </button>
            </div>
          </form>
        </div>

        <div className="animate-fade-up flex flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[16px] font-bold text-ink">Nouveautés en Pévèle</span>
            <Link href="/acheter" className="text-[13px] font-semibold text-blue">
              Tout voir →
            </Link>
          </div>
          {featured.length > 0 ? (
            featured.map((listing) => (
              <Link
                key={listing.id}
                href={`/acheter/${listing.id}`}
                className="flex overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="h-[130px] w-[195px] shrink-0 bg-surface bg-cover bg-center"
                  style={
                    listing.photos[0]
                      ? { backgroundImage: `url(${listing.photos[0].url})` }
                      : undefined
                  }
                />
                <div className="flex flex-col justify-center gap-0.5 px-4.5 py-3.5">
                  <span className="font-display text-[19px] text-ink">
                    {formatPrix(listing.prix, listing.transaction)}
                  </span>
                  <span className="text-[14px] font-semibold text-ink">{listing.titre}</span>
                  <span className="text-[13px] text-muted">{listing.commune}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-[13px] text-muted">
              Les premières annonces arrivent bientôt.
            </div>
          )}
          <Link
            href="/carte"
            className="flex items-center gap-4 rounded-2xl bg-blue px-5.5 py-4.5 text-white transition hover:brightness-105"
          >
            <div>
              <span className="block text-[15px] font-bold">Vivre en Pévèle</span>
              <span className="mt-0.5 block text-[13px] text-white/80">
                35 communes · prix au m² réels (DVF) · guides villages
              </span>
            </div>
            <span className="ml-auto shrink-0 whitespace-nowrap rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-blue">
              Explorer la carte
            </span>
          </Link>
        </div>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-[13px] font-semibold text-muted">Par commune :</span>
        {featuredVillages.map((v) => (
          <Link
            key={v.slug}
            href={`/villages/${v.slug}`}
            className="whitespace-nowrap rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
          >
            {v.nom}
          </Link>
        ))}
        {otherCount > 0 ? (
          <Link href="/villages" className="whitespace-nowrap text-[13px] font-semibold text-blue">
            + {otherCount} autres
          </Link>
        ) : null}
      </div>
    </div>
  );
}
