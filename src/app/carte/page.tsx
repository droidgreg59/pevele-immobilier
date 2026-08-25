import type { Metadata } from "next";
import VillageMap from "@/components/VillageMap";

export const metadata: Metadata = {
  title: "La carte des 19 communes de la Pévèle",
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

  return <VillageMap initialSlug={village} />;
}
