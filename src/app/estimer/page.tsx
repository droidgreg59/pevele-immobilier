import type { Metadata } from "next";
import Link from "next/link";
import { villages, getVillageBySlug } from "@/data/villages";
import {
  getDvfStatsForVillage,
  getDvfComparableRows,
  MIN_RETAINED_SAMPLE,
} from "@/lib/dvf";
import { estimateBien, medianSelection, selectComparables } from "@/lib/estimate";
import EstimateLeadForm from "@/components/EstimateLeadForm";
import { formatDvfStreet } from "@/lib/market-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estimer son bien immobilier en Pévèle",
  description:
    "Estimez gratuitement votre maison ou appartement dans n'importe quelle commune de la Pévèle, à partir des prix DVF réellement constatés — sans engagement.",
  alternates: {
    canonical: "/estimer",
  },
};

const TYPES = ["Peu importe", "Maison", "Appartement"] as const;
const DPE_CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const;
/** En dessous, la base retombe sur toutes les ventes de la commune, tous types confondus. */
const MIN_SAMPLE_FOR_TYPE = 3;

/** Entier facultatif d'un `searchParam` : null si vide, invalide ou hors bornes. */
function parseOptionalInt(raw: string, min: number, max: number): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

export default async function EstimerPage({
  searchParams,
}: PageProps<"/estimer">) {
  const params = await searchParams;
  const villageSlug = typeof params.village === "string" ? params.village : "";
  const surfaceRaw = typeof params.surface === "string" ? params.surface : "";
  const type = typeof params.type === "string" ? params.type : "Peu importe";
  const dpeRaw = typeof params.dpe === "string" ? params.dpe.toUpperCase() : "";
  const dpe = (DPE_CLASSES as readonly string[]).includes(dpeRaw) ? dpeRaw : "";

  const chambresRaw = typeof params.chambres === "string" ? params.chambres : "";
  const terrainRaw = typeof params.terrain === "string" ? params.terrain : "";
  // Chambres et terrain ne servent qu'à la recherche de biens comparables,
  // qui exige un type de bien précis ; le terrain n'a de sens que pour une
  // maison (DVF ne le renseigne pas pour la plupart des appartements).
  const chambres =
    type === "Maison" || type === "Appartement" ? parseOptionalInt(chambresRaw, 0, 20) : null;
  const terrain = type === "Maison" ? parseOptionalInt(terrainRaw, 0, 100_000) : null;

  const village = getVillageBySlug(villageSlug);
  const surface = Number(surfaceRaw);
  const hasQuery = Boolean(village && surface > 0);
  const comparableType = type === "Maison" || type === "Appartement" ? type : null;
  const wantsComparables = comparableType !== null && (chambres !== null || terrain !== null);

  const [dvfStats, maisonRows, appartementRows] = hasQuery
    ? await Promise.all([
        getDvfStatsForVillage(village!.slug),
        getDvfComparableRows(village!.slug, "Maison"),
        getDvfComparableRows(village!.slug, "Appartement"),
      ])
    : [null, [], []];

  const allRows = [...maisonRows, ...appartementRows];
  const typedRows =
    comparableType === "Maison" ? maisonRows : comparableType === "Appartement" ? appartementRows : allRows;
  const comparables = wantsComparables
    ? selectComparables(typedRows, { chambres, terrain }, MIN_RETAINED_SAMPLE)
    : null;
  // Sans critère (ou critères inexploitables) : médiane des ventes du type de
  // bien dans la commune, ou de toutes les ventes si ce type est trop rare.
  const baseIsTyped = comparableType !== null && typedRows.length >= MIN_SAMPLE_FOR_TYPE;
  const selection = comparables ?? medianSelection(baseIsTyped ? typedRows : allRows);
  const estimate =
    dvfStats && selection && surface > 0
      ? estimateBien({
          avgPrixM2: selection.medianPrixM2,
          sampleCount: selection.count,
          surface,
          dpe: dpe || null,
        })
      : null;

  // Comparables affichés : les plus proches en surface habitable d'abord.
  const COMPARABLES_SHOWN = 12;
  const shownComparables = selection
    ? [...selection.rows]
        .sort((a, b) => Math.abs(a.surfaceBati - surface) - Math.abs(b.surfaceBati - surface))
        .slice(0, COMPARABLES_SHOWN)
    : [];

  // Critères saisis mais non retenus faute de ventes comparables suffisantes.
  const droppedCriteria: string[] = [];
  if (wantsComparables) {
    if (chambres !== null && !comparables?.usedPieces) droppedCriteria.push("du nombre de chambres");
    if (terrain !== null && !comparables?.usedTerrain) droppedCriteria.push("de la surface du terrain");
  }
  const comparablesLabel =
    type === "Maison" ? "maisons comparables vendues" : "appartements comparables vendus";
  const baseLabel = !baseIsTyped
    ? comparableType
      ? `ventes DVF tous types confondus (trop peu de ventes ${comparableType === "Maison" ? "de maisons" : "d'appartements"})`
      : "ventes DVF"
    : type === "Maison"
      ? "ventes DVF de maisons"
      : "ventes DVF d'appartements";
  const comparablesCriteriaLabel = comparables
    ? [
        comparables.usedPieces
          ? `${comparables.usedPieces.min} à ${comparables.usedPieces.max} pièces`
          : null,
        comparables.usedTerrain ? `terrain de ${comparables.usedTerrain.label}` : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div
      className="animate-fade-up box-border px-9 py-8"
      style={{ background: "var(--pvl-blue)", minHeight: "calc(100vh - 74px)" }}
    >
      <div className="max-w-[1320px]">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-4.5">
          <span className="rounded-full border border-yellow/40 px-3 py-1.5 text-[13px] font-semibold text-yellow">
            Estimer
          </span>
          <span className="text-[12.5px] font-semibold text-[#B9C2E2]">
            On parle chiffres ici
          </span>
        </div>
        <Link href="/" className="text-[13px] font-semibold text-[#B9C2E2]">
          ← Retour à l&apos;accueil
        </Link>

        <div className="mt-7.5 grid grid-cols-1 items-start gap-14 sm:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="m-0 font-display text-[44px] leading-none text-white sm:text-[68px]">
              Combien vaut
              <br />
              votre bien,
              <br />
              <span className="text-yellow">vraiment ?</span>
            </h2>

            {hasQuery ? (
              <div className="mt-8 max-w-[540px] rounded-2xl bg-cream p-6 shadow-sm">
                {dvfStats && estimate ? (
                  <>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Estimation indicative — {village!.nom}, {surface} m², {type}
                      {chambres !== null ? ` · ${chambres} ch.` : ""}
                      {terrain !== null ? ` · terrain ${terrain.toLocaleString("fr-FR")} m²` : ""}
                      {dpe ? ` · DPE ${dpe}` : ""}
                    </span>
                    <div className="mt-2 font-display text-[32px] text-ink sm:text-[38px]">
                      {estimate.low.toLocaleString("fr-FR")} € —{" "}
                      {estimate.high.toLocaleString("fr-FR")} €
                    </div>
                    <p className="m-0 mt-1 text-[12.5px] font-medium text-muted">
                      Valeur médiane ≈ {estimate.mid.toLocaleString("fr-FR")} € (
                      {estimate.prixM2.toLocaleString("fr-FR")} € / m²)
                    </p>
                    <p className="m-0 mt-3 text-[13.5px] leading-[1.6] text-muted">
                      {comparables ? (
                        <>
                          Base : prix médian de {comparables.count} {comparablesLabel} à {village!.nom} ({comparablesCriteriaLabel},{" "}
                          {comparables.medianPrixM2.toLocaleString("fr-FR")} € / m², ventes DVF{" "}
                          {dvfStats.minAnnee}–{dvfStats.maxAnnee}) × surface
                        </>
                      ) : (
                        <>
                          Base : prix médian de {selection!.count} {baseLabel} à {village!.nom} (
                          {selection!.medianPrixM2.toLocaleString("fr-FR")} € / m²,{" "}
                          {dvfStats.minAnnee}–{dvfStats.maxAnnee}) × surface
                        </>
                      )}
                      {estimate.dpeAdjustPct !== 0
                        ? `, ${estimate.dpeAdjustPct > 0 ? "+" : ""}${estimate.dpeAdjustPct} % pour la classe énergie ${dpe}`
                        : ""}
                      . Fourchette ±{estimate.bandPct} %.
                      {droppedCriteria.length > 0
                        ? ` Pas assez de ventes comparables à ${village!.nom} pour tenir compte ${droppedCriteria.join(" et ")}.`
                        : ""}{" "}
                      Une estimation ne remplace pas une visite : état, exposition,
                      travaux peuvent la faire varier nettement.
                    </p>

                    {selection ? (
                      <details className="mt-4 rounded-xl border border-line bg-white" open={Boolean(comparables)}>
                        <summary className="cursor-pointer px-4 py-3 text-[13px] font-semibold text-ink">
                          Les {selection.count} ventes {comparables ? "comparables" : "de référence"}
                          {selection.count > COMPARABLES_SHOWN
                            ? ` (les ${COMPARABLES_SHOWN} plus proches en surface)`
                            : ""}
                        </summary>
                        <ul className="m-0 list-none border-t border-line p-0 sm:hidden">
                          {shownComparables.map((t) => (
                            <li key={t.id} className="flex items-start justify-between gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                              <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-[12.5px] text-ink">
                                  {t.surfaceBati} m² · {t.nombrePieces ?? "—"} p.
                                  {t.surfaceTerrain != null
                                    ? ` · terrain ${t.surfaceTerrain.toLocaleString("fr-FR")} m²`
                                    : ""}
                                </span>
                                <span className="text-[11.5px] text-muted">
                                  {formatDvfStreet(t.adresse) ?? "Rue non renseignée"} ·{" "}
                                  {new Date(t.dateMutation).toLocaleDateString("fr-FR", {
                                    month: "2-digit",
                                    year: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-0.5">
                                <span className="text-[12.5px] font-semibold text-ink">
                                  {t.valeurFonciere.toLocaleString("fr-FR")} €
                                </span>
                                <span className="text-[11.5px] text-muted">
                                  {t.prixM2.toLocaleString("fr-FR")} € / m²
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="hidden border-t border-line sm:block">
                          <table className="w-full border-collapse text-[12.5px]">
                            <thead>
                              <tr className="border-b border-line bg-surface text-left">
                                {["Date", "Rue", "Pièces", "Surf. / terrain", "Prix", "€ / m²"].map((h) => (
                                  <th
                                    key={h}
                                    className="px-2.5 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {shownComparables.map((t) => (
                                <tr key={t.id} className="border-b border-line last:border-b-0">
                                  <td className="whitespace-nowrap px-2.5 py-2 text-muted">
                                    {new Date(t.dateMutation).toLocaleDateString("fr-FR", {
                                      month: "2-digit",
                                      year: "2-digit",
                                    })}
                                  </td>
                                  <td className="px-2.5 py-2 text-muted">{formatDvfStreet(t.adresse) ?? "—"}</td>
                                  <td className="px-2.5 py-2 text-muted">{t.nombrePieces ?? "—"}</td>
                                  <td className="whitespace-nowrap px-2.5 py-2 text-muted">
                                    {t.surfaceBati} m²
                                    {t.surfaceTerrain != null
                                      ? ` / ${t.surfaceTerrain.toLocaleString("fr-FR")} m²`
                                      : ""}
                                  </td>
                                  <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-ink">
                                    {t.valeurFonciere.toLocaleString("fr-FR")} €
                                  </td>
                                  <td className="whitespace-nowrap px-2.5 py-2 text-muted">
                                    {t.prixM2.toLocaleString("fr-FR")} €
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="m-0 border-t border-line px-4 py-2.5 text-[11.5px] leading-[1.5] text-muted-2">
                          Ventes réellement enregistrées (DVF, data.gouv.fr). Rue indiquée sans
                          numéro. Ventes au prix atypique exclues.
                        </p>
                      </details>
                    ) : null}

                    <EstimateLeadForm
                      villageSlug={village!.slug}
                      communeNom={village!.nom}
                      surface={surface}
                      type={type}
                      dpe={dpe || null}
                      low={estimate.low}
                      high={estimate.high}
                    />

                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Link
                        href="/vendre/deposer"
                        className="rounded-full bg-yellow px-4 py-3 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
                      >
                        Publier mon annonce →
                      </Link>
                      <Link
                        href={`/villages/${village!.slug}`}
                        className="rounded-full border border-line px-4 py-3 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
                      >
                        Voir {village!.nom} →
                      </Link>
                      <Link
                        href="/professionnels"
                        className="rounded-full border border-line px-4 py-3 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
                      >
                        Demander une estimation à une agence →
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-blue">
                      Données insuffisantes
                    </span>
                    <p className="m-0 mt-2 text-[13.5px] leading-[1.6] text-muted">
                      Pas assez de ventes DVF enregistrées à{" "}
                      {village ? village.nom : "cette commune"} pour ce type de
                      bien. Essayez « Peu importe », ou consultez directement{" "}
                      <Link href="/prix" className="text-blue">
                        les prix par village →
                      </Link>
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <form
            action="/estimer"
            method="get"
            className="flex flex-col gap-3.5"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#B9C2E2]">
                Village
              </span>
              <select
                name="village"
                required
                defaultValue={villageSlug}
                className="box-border w-full rounded-xl border border-line bg-cream px-4.5 py-3.5 text-[15px] text-ink outline-none transition focus:border-yellow focus:ring-2 focus:ring-yellow/30"
              >
                <option value="" disabled>
                  Choisir un village…
                </option>
                {villages.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#B9C2E2]">
                Surface (m²)
              </span>
              <input
                type="number"
                name="surface"
                min={1}
                required
                defaultValue={surfaceRaw}
                placeholder="ex. 120"
                className="box-border w-full rounded-xl border border-line bg-cream px-4.5 py-3.5 text-[15px] text-ink outline-none transition focus:border-yellow focus:ring-2 focus:ring-yellow/30"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#B9C2E2]">
                Type de bien
              </span>
              <select
                name="type"
                defaultValue={type}
                className="box-border w-full rounded-xl border border-line bg-cream px-4.5 py-3.5 text-[15px] text-ink outline-none transition focus:border-yellow focus:ring-2 focus:ring-yellow/30"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#B9C2E2]">
                  Chambres — facultatif
                </span>
                <input
                  type="number"
                  name="chambres"
                  min={0}
                  max={20}
                  defaultValue={chambresRaw}
                  placeholder="ex. 3"
                  className="box-border w-full rounded-xl border border-line bg-cream px-4.5 py-3.5 text-[15px] text-ink outline-none transition focus:border-yellow focus:ring-2 focus:ring-yellow/30"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#B9C2E2]">
                  Terrain (m²) — maison
                </span>
                <input
                  type="number"
                  name="terrain"
                  min={0}
                  defaultValue={terrainRaw}
                  placeholder="ex. 500"
                  className="box-border w-full rounded-xl border border-line bg-cream px-4.5 py-3.5 text-[15px] text-ink outline-none transition focus:border-yellow focus:ring-2 focus:ring-yellow/30"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#B9C2E2]">
                Classe énergie (DPE) — facultatif
              </span>
              <select
                name="dpe"
                defaultValue={dpe}
                className="box-border w-full rounded-xl border border-line bg-cream px-4.5 py-3.5 text-[15px] text-ink outline-none transition focus:border-yellow focus:ring-2 focus:ring-yellow/30"
              >
                <option value="">Non renseignée</option>
                {DPE_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="cursor-pointer rounded-full border-0 bg-yellow px-4.5 py-4 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
            >
              Estimer →
            </button>
            <span className="text-[12.5px] text-[#B9C2E2]">
              Estimation fondée sur les ventes DVF réellement enregistrées.
              Gratuit, sans engagement — vous restez maître de la suite.
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}
