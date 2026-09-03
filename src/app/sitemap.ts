import type { MetadataRoute } from "next";
import { villages } from "@/data/villages";
import { getPublicListings } from "@/lib/listings";
import { getAgencies } from "@/lib/agencies";
import { getArtisans } from "@/lib/artisans";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/acheter", priority: 0.9, changeFrequency: "daily" },
  { path: "/louer", priority: 0.9, changeFrequency: "daily" },
  { path: "/vendre", priority: 0.8, changeFrequency: "weekly" },
  { path: "/estimer", priority: 0.8, changeFrequency: "weekly" },
  { path: "/carte", priority: 0.7, changeFrequency: "weekly" },
  { path: "/villages", priority: 0.9, changeFrequency: "weekly" },
  { path: "/prix", priority: 0.9, changeFrequency: "weekly" },
  { path: "/artisans", priority: 0.7, changeFrequency: "weekly" },
  { path: "/professionnels", priority: 0.7, changeFrequency: "weekly" },
  { path: "/espace-professionnel", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ventes, locations, agencies, artisans] = await Promise.all([
    getPublicListings("VENTE"),
    getPublicListings("LOCATION"),
    getAgencies(),
    getArtisans(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const villageEntries: MetadataRoute.Sitemap = villages.map((v) => ({
    url: `${SITE_URL}/villages/${v.slug}`,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  // Pages d'atterrissage par intention : uniquement les combinaisons
  // commune × type × transaction qui ont au moins une annonce en ligne (les
  // pages sans annonce sont en noindex, inutile de les soumettre).
  const INTENT_SLUG: Record<string, Record<string, string>> = {
    MAISON: { VENTE: "maisons-a-vendre", LOCATION: "maisons-a-louer" },
    APPARTEMENT: { VENTE: "appartements-a-vendre", LOCATION: "appartements-a-louer" },
    TERRAIN: { VENTE: "terrains-a-vendre", LOCATION: "terrains-a-louer" },
  };
  const intentKeys = new Set<string>();
  for (const l of [...ventes, ...locations]) {
    const intent = INTENT_SLUG[l.typeBien]?.[l.transaction];
    if (intent) intentKeys.add(`${l.villageSlug}/${intent}`);
  }
  const intentEntries: MetadataRoute.Sitemap = [...intentKeys].map((key) => ({
    url: `${SITE_URL}/immobilier/${key}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const ventesEntries: MetadataRoute.Sitemap = ventes.map((l) => ({
    url: `${SITE_URL}/acheter/${l.id}`,
    lastModified: l.createdAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const locationEntries: MetadataRoute.Sitemap = locations.map((l) => ({
    url: `${SITE_URL}/louer/${l.id}`,
    lastModified: l.createdAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const agencyEntries: MetadataRoute.Sitemap = agencies.map((a) => ({
    url: `${SITE_URL}/professionnels/${a.id}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const artisanEntries: MetadataRoute.Sitemap = artisans.map((a) => ({
    url: `${SITE_URL}/artisans/${a.id}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...villageEntries,
    ...intentEntries,
    ...ventesEntries,
    ...locationEntries,
    ...agencyEntries,
    ...artisanEntries,
  ];
}
