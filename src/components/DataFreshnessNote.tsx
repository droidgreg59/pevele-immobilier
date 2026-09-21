import { getDvfMarketStatsPevele } from "@/lib/dvf";
import { getCronLastRun } from "@/lib/freshness";

/**
 * Période DVF couverte et date de dernière actualisation — calculées en
 * direct à chaque rendu, jamais figées dans les métadonnées d'un guide
 * evergreen (voir GuideMetadata.publishedAt/updatedAt, distincts de la
 * fraîcheur des données elles-mêmes).
 */
export default async function DataFreshnessNote() {
  const [pevele, dvfUpdatedAt] = await Promise.all([
    getDvfMarketStatsPevele("Maison"),
    getCronLastRun("dvf-import"),
  ]);

  return (
    <p className="mt-1 text-[12.5px] text-muted-2">
      Données DVF{pevele ? ` : ${pevele.minAnnee}–${pevele.maxAnnee}` : ""}
      {dvfUpdatedAt ? ` · actualisées le ${dvfUpdatedAt.toLocaleDateString("fr-FR")}` : ""}
    </p>
  );
}
