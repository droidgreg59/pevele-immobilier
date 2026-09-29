import { villages } from "@/data/villages";
import { villageCoords } from "@/data/village-coords";
import type { AerialVillage } from "@/components/AerialTimeMachine";

/** Communes de la Pévèle avec leur centre géographique réel, pour « Vue du ciel ». */
export function getAerialVillages(): AerialVillage[] {
  return villages
    .filter((v) => villageCoords[v.insee])
    .map((v) => ({ slug: v.slug, nom: v.nom, lat: villageCoords[v.insee].lat, lng: villageCoords[v.insee].lng }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
