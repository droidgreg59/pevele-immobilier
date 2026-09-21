import Link from "next/link";

export type VillageComparisonSide = {
  slug: string;
  nom: string;
  medianPrixM2: number | null;
  retainedCount: number;
  gares: string[];
};

/**
 * Comparaison côte à côte de deux communes — prix médian des maisons (DVF)
 * et présence d'une gare, strictement factuel. Modèle réutilisable pour de
 * futurs comparatifs éditoriaux (Sprint 4, guide pilote Cysoing/Templeuve).
 */
export default function VillageComparison({
  a,
  b,
}: {
  a: VillageComparisonSide;
  b: VillageComparisonSide;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[a, b].map((v) => (
        <div key={v.slug} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h4 className="m-0 font-display text-[18px] text-ink">{v.nom}</h4>
          {v.medianPrixM2 !== null ? (
            <>
              <div className="mt-2 font-display text-[24px] text-ink">
                {v.medianPrixM2.toLocaleString("fr-FR")} € / m²
              </div>
              <p className="m-0 mt-1 text-[12.5px] text-muted">
                médiane maisons · {v.retainedCount} vente{v.retainedCount > 1 ? "s" : ""} retenue
                {v.retainedCount > 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p className="m-0 mt-2 text-[13px] text-muted">Données insuffisantes</p>
          )}
          <p className="m-0 mt-3 text-[13px] text-ink">
            {v.gares.length > 0 ? `Gare${v.gares.length > 1 ? "s" : ""} : ${v.gares.join(", ")}` : "Aucune gare"}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-[12.5px]">
            <Link href={`/prix/${v.slug}`} className="text-blue">
              Prix détaillé →
            </Link>
            <Link href={`/villages/${v.slug}`} className="text-blue">
              Fiche village →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
