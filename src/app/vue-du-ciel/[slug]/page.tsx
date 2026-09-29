import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { villages, getVillageBySlug } from "@/data/villages";
import AerialPageBody from "../AerialPageBody";

export function generateStaticParams() {
  return villages.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/vue-du-ciel/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const village = getVillageBySlug(slug);
  if (!village) return {};
  return {
    title: `${village.nom} vu du ciel : des années 1950 à aujourd'hui`,
    description: `Photographies aériennes de ${village.nom} (Pévèle) par l'IGN, des années 1950 à aujourd'hui : comparez les époques en faisant glisser le curseur.`,
    alternates: {
      canonical: `/vue-du-ciel/${village.slug}`,
    },
  };
}

export default async function VueDuCielVillagePage({ params }: PageProps<"/vue-du-ciel/[slug]">) {
  const { slug } = await params;
  const village = getVillageBySlug(slug);
  if (!village) notFound();

  return (
    <AerialPageBody
      title={`${village.nom} vu du ciel, hier et aujourd'hui`}
      intro={`Les photographies aériennes de l'IGN de ${village.nom}, des années 1950 à aujourd'hui, superposées : faites glisser le curseur pour voir comment la commune a changé.`}
      villageSlug={village.slug}
      villageNom={village.nom}
    />
  );
}
