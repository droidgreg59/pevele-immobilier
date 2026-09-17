import type { Metadata } from "next";
import Link from "next/link";
import { villages, getVillageBySlug } from "@/data/villages";
import { getDvfStatsForVillage, getDvfBreakdownByType } from "@/lib/dvf";
import { estimateBien } from "@/lib/estimate";
import EstimateLeadForm from "@/components/EstimateLeadForm";

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

export default async function EstimerPage({
  searchParams,
}: PageProps<"/estimer">) {
  const params = await searchParams;
  const villageSlug = typeof params.village === "string" ? params.village : "";
  const surfaceRaw = typeof params.surface === "string" ? params.surface : "";
  const type = typeof params.type === "string" ? params.type : "Peu importe";
  const dpeRaw = typeof params.dpe === "string" ? params.dpe.toUpperCase() : "";
  const dpe = (DPE_CLASSES as readonly string[]).includes(dpeRaw) ? dpeRaw : "";

  const village = getVillageBySlug(villageSlug);
  const surface = Number(surfaceRaw);
  const hasQuery = Boolean(village && surface > 0);

  const [dvfStats, dvfByType] = hasQuery
    ? await Promise.all([
        getDvfStatsForVillage(village!.slug),
        type === "Peu importe" ? Promise.resolve([]) : getDvfBreakdownByType(village!.slug),
      ])
    : [null, []];

  const typeRow = dvfByType.find((r) => r.typeLocal === type);
  const estimate =
    dvfStats && surface > 0
      ? estimateBien({
          avgPrixM2: dvfStats.avgPrixM2,
          sampleCount: dvfStats.count,
          typeAvgPrixM2: typeRow && typeRow.count >= 3 ? typeRow.avgPrixM2 : null,
          surface,
          dpe: dpe || null,
        })
      : null;

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
                      Base : prix constaté à {village!.nom}
                      {typeRow && typeRow.count >= 3
                        ? ` pour un bien de type « ${type} »`
                        : ""}{" "}
                      ({(typeRow && typeRow.count >= 3
                        ? typeRow.avgPrixM2
                        : dvfStats.avgPrixM2
                      ).toLocaleString("fr-FR")}{" "}
                      € / m², {dvfStats.count} vente{dvfStats.count > 1 ? "s" : ""} DVF,{" "}
                      {dvfStats.minAnnee}–{dvfStats.maxAnnee}) × surface
                      {estimate.dpeAdjustPct !== 0
                        ? `, ${estimate.dpeAdjustPct > 0 ? "+" : ""}${estimate.dpeAdjustPct} % pour la classe énergie ${dpe}`
                        : ""}
                      . Fourchette ±{estimate.bandPct} %. Une estimation ne
                      remplace pas une visite : état, exposition, travaux peuvent
                      la faire varier nettement.
                    </p>

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
