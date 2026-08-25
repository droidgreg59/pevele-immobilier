import type { Metadata } from "next";
import VillageMap from "@/components/VillageMap";
import { getDvfStatsForAllVillages } from "@/lib/dvf";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La carte des 35 communes de la Pévèle",
  description:
    "Explorez la Pévèle village par village sur la carte interactive : accédez aux annonces et aux prix immobiliers de chaque commune.",
  alternates: {
    canonical: "/carte",
  },
};

export default async function CartePage({
  searchParams,
}: PageProps<"/carte">) {
  const params = await searchParams;
  const village = typeof params.village === "string" ? params.village : undefined;
  const dvfStats = await getDvfStatsForAllVillages();
  const dvfBySlug = Object.fromEntries(dvfStats.map((s) => [s.villageSlug, s]));

  return <VillageMap initialSlug={village} dvfBySlug={dvfBySlug} />;
}
