import type { Metadata } from "next";
import AerialPageBody from "./AerialPageBody";

export const metadata: Metadata = {
  title: "La Pévèle vue du ciel, des années 1950 à aujourd'hui",
  description:
    "Comparez les photographies aériennes de l'IGN de chaque commune de la Pévèle, des années 1950 à aujourd'hui : faites glisser le curseur et voyez votre village changer.",
  alternates: {
    canonical: "/vue-du-ciel",
  },
};

export default function VueDuCielPage() {
  return (
    <AerialPageBody
      title="La Pévèle vue du ciel, hier et aujourd'hui"
      intro="Les photographies aériennes de l'IGN, des années 1950 à aujourd'hui, superposées : choisissez une commune et deux époques, puis faites glisser le curseur pour voir les champs devenir des lotissements, les routes apparaître, les villages grandir."
    />
  );
}
