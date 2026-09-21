import type { VillageAmenities } from "@/data/village-amenities";

/**
 * Résumé factuel des équipements recensés (OpenStreetMap / Éducation
 * nationale) pour une commune — reste strictement descriptif : ne traduit
 * jamais un nombre de commerces/écoles en jugement de qualité de vie (voir
 * AGENTS.md, discipline « données réelles uniquement »).
 */
export default function VillageAmenitiesSummary({
  nom,
  amenities,
}: {
  nom: string;
  amenities: VillageAmenities;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h4 className="m-0 font-display text-[16px] text-ink">{nom}</h4>
      <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[13px] text-muted">
        <li>
          {amenities.commerces.length} commerce{amenities.commerces.length > 1 ? "s" : ""} recensé
          {amenities.commerces.length > 1 ? "s" : ""}
        </li>
        <li>
          {amenities.ecoles.length} établissement{amenities.ecoles.length > 1 ? "s" : ""} scolaire
          {amenities.ecoles.length > 1 ? "s" : ""} recensé{amenities.ecoles.length > 1 ? "s" : ""}
        </li>
        <li>
          {amenities.transports.gares.length > 0
            ? `Gare${amenities.transports.gares.length > 1 ? "s" : ""} : ${amenities.transports.gares.join(", ")}`
            : "Aucune gare recensée dans la commune"}
        </li>
        <li>
          {amenities.transports.arretsBus} arrêt{amenities.transports.arretsBus > 1 ? "s" : ""} de bus recensé
          {amenities.transports.arretsBus > 1 ? "s" : ""}
        </li>
      </ul>
    </div>
  );
}
