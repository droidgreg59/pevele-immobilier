import type { Metadata } from "next";
import VillageMap from "@/components/VillageMap";

export const metadata: Metadata = {
  title: "La carte de la Pévèle — Pévèle Immobilier",
  description:
    "Explorez la Pévèle village par village sur la carte interactive.",
};

export default async function CartePage({
  searchParams,
}: PageProps<"/carte">) {
  const params = await searchParams;
  const village = typeof params.village === "string" ? params.village : undefined;

  return <VillageMap initialSlug={village} />;
}
