import { buildMarketSummaryText, type MarketSummaryInput } from "@/lib/market-summary";

/**
 * Bloc de synthèse marché — un paragraphe autoporteur suivi d'une liste de
 * chiffres clés en <dl>, pensés pour être repris tels quels par un moteur de
 * recherche génératif. Ne fait aucun calcul : toute la donnée vient déjà
 * calculée de src/lib/dvf.ts, passée ici en props.
 */
export default function MarketSummary(props: MarketSummaryInput) {
  const { typeLocal, medianPrixM2, avgPrixM2, retainedCount, minAnnee, maxAnnee } = props;
  const periode = minAnnee === maxAnnee ? `${minAnnee}` : `${minAnnee}–${maxAnnee}`;

  return (
    <div className="rounded-2xl bg-surface p-6">
      <p className="m-0 max-w-[70ch] text-[15px] leading-[1.6] text-ink">
        {buildMarketSummaryText(props)}
      </p>
      <dl className="m-0 mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Médiane {typeLocal === "Maison" ? "maisons" : "appartements"}
          </dt>
          <dd className="m-0 mt-0.5 font-display text-[22px] text-ink">
            {medianPrixM2.toLocaleString("fr-FR")} €/m²
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Moyenne</dt>
          <dd className="m-0 mt-0.5 font-display text-[22px] text-ink">
            {avgPrixM2.toLocaleString("fr-FR")} €/m²
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Échantillon</dt>
          <dd className="m-0 mt-0.5 text-[15px] font-semibold text-ink">
            {retainedCount} vente{retainedCount > 1 ? "s" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Période</dt>
          <dd className="m-0 mt-0.5 text-[15px] font-semibold text-ink">{periode}</dd>
        </div>
      </dl>
    </div>
  );
}
