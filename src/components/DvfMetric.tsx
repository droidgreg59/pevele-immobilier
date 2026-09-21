/**
 * Afficheur de valeur unique pour une statistique DVF citée en prose dans un
 * guide (Sprint 4) — rend uniquement le chiffre formaté, jamais une phrase
 * complète : la prose reste écrite à la main dans le MDX autour, pour garder
 * un contrôle grammatical total (accords, ponctuation).
 */
export type DvfMetricUnit = "eur" | "pct" | "m2" | "count";

export default function DvfMetric({ value, unit }: { value: number; unit: DvfMetricUnit }) {
  const formatted =
    unit === "eur"
      ? `${value.toLocaleString("fr-FR")} €`
      : unit === "pct"
        ? `${value.toLocaleString("fr-FR")} %`
        : unit === "m2"
          ? `${value.toLocaleString("fr-FR")} m²`
          : value.toLocaleString("fr-FR");
  return <strong className="text-ink">{formatted}</strong>;
}
