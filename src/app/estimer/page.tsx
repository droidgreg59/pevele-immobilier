import type { Metadata } from "next";
import Link from "next/link";
import { villages, getVillageBySlug } from "@/data/villages";
import { getDvfStatsForVillage } from "@/lib/dvf";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estimer mon bien — Pévèle Immobilier",
  description:
    "Estimez gratuitement votre bien en Pévèle à partir des ventes DVF réellement enregistrées, sans engagement.",
};

const TYPES = ["Peu importe", "Maison", "Appartement"] as const;

export default async function EstimerPage({
  searchParams,
}: PageProps<"/estimer">) {
  const params = await searchParams;
  const villageSlug = typeof params.village === "string" ? params.village : "";
  const surfaceRaw = typeof params.surface === "string" ? params.surface : "";
  const type = typeof params.type === "string" ? params.type : "Peu importe";

  const village = getVillageBySlug(villageSlug);
  const surface = Number(surfaceRaw);
  const hasQuery = Boolean(village && surface > 0);

  const dvfStats = hasQuery
    ? await getDvfStatsForVillage(village!.slug, type === "Peu importe" ? undefined : type)
    : null;

  const estimateBasse = dvfStats ? Math.round((dvfStats.avgPrixM2 * surface * 0.9) / 1000) * 1000 : null;
  const estimateHaute = dvfStats ? Math.round((dvfStats.avgPrixM2 * surface * 1.1) / 1000) * 1000 : null;

  return (
    <div
      className="animate-view-in box-border px-9 py-8"
      style={{ background: "var(--pvl-blue)", minHeight: "calc(100vh - 74px)" }}
    >
      <div className="max-w-[1320px]">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-4.5">
          <span className="border-2 border-yellow px-3 py-1.5 font-mono text-sm text-yellow">
            PIÈCE 04
          </span>
          <span className="font-mono text-xs font-medium text-[#B9C2E2]">
            LA CUISINE — ON PARLE CHIFFRES ICI
          </span>
        </div>
        <Link href="/" className="font-mono text-[11.5px] font-medium text-[#B9C2E2]">
          ← RETOUR AU PLAN
        </Link>

        <div className="mt-7.5 grid grid-cols-1 items-start gap-14 sm:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="m-0 font-display text-[44px] leading-none text-white sm:text-[68px]">
              COMBIEN VAUT
              <br />
              VOTRE BIEN,
              <br />
              <span className="text-yellow">VRAIMENT ?</span>
            </h2>

            {hasQuery ? (
              <div className="mt-8 max-w-[540px] border-[2.5px] border-ink bg-cream p-6">
                {dvfStats && estimateBasse !== null && estimateHaute !== null ? (
                  <>
                    <span className="font-mono text-[10.5px] font-medium text-muted">
                      ESTIMATION INDICATIVE — {village!.nom.toUpperCase()},{" "}
                      {surface} M², {type.toUpperCase()}
                    </span>
                    <div className="mt-2 font-display text-[32px] text-ink sm:text-[38px]">
                      {estimateBasse.toLocaleString("fr-FR")} € — {estimateHaute.toLocaleString("fr-FR")} €
                    </div>
                    <p className="m-0 mt-3 font-sans text-[13.5px] leading-[1.6] text-muted">
                      Calculée à partir du prix moyen constaté à {village!.nom}{" "}
                      ({dvfStats.avgPrixM2.toLocaleString("fr-FR")} € / m², sur{" "}
                      {dvfStats.count} vente{dvfStats.count > 1 ? "s" : ""},{" "}
                      {dvfStats.minAnnee}–{dvfStats.maxAnnee}) × la surface indiquée.
                      Une estimation ne remplace pas une visite : l&apos;état du
                      bien, son exposition ou ses travaux peuvent la faire varier
                      nettement.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Link
                        href="/vendre/deposer"
                        className="bg-yellow px-4 py-3 font-mono text-[11px] font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px"
                      >
                        PUBLIER MON ANNONCE →
                      </Link>
                      <Link
                        href={`/villages/${village!.slug}`}
                        className="border-2 border-ink px-4 py-3 font-mono text-[11px] font-semibold text-ink hover:bg-[#FDEBC2]"
                      >
                        VOIR {village!.nom.toUpperCase()} →
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-[10.5px] font-medium text-blue">
                      DONNÉES INSUFFISANTES
                    </span>
                    <p className="m-0 mt-2 font-sans text-[13.5px] leading-[1.6] text-muted">
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
              <span className="font-mono text-[11px] font-medium text-[#B9C2E2]">
                VILLAGE
              </span>
              <select
                name="village"
                required
                defaultValue={villageSlug}
                className="box-border w-full border-[2.5px] border-ink bg-cream px-4.5 py-4 font-sans text-[15px] text-ink outline-none"
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
              <span className="font-mono text-[11px] font-medium text-[#B9C2E2]">
                SURFACE (M²)
              </span>
              <input
                type="number"
                name="surface"
                min={1}
                required
                defaultValue={surfaceRaw}
                placeholder="ex. 120"
                className="box-border w-full border-[2.5px] border-ink bg-cream px-4.5 py-4 font-sans text-[15px] text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium text-[#B9C2E2]">
                TYPE DE BIEN
              </span>
              <select
                name="type"
                defaultValue={type}
                className="box-border w-full border-[2.5px] border-ink bg-cream px-4.5 py-4 font-sans text-[15px] text-ink outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="cursor-pointer border-0 bg-yellow px-4.5 py-4.5 font-mono text-[13px] font-semibold text-ink shadow-[6px_6px_0_var(--pvl-ink)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_var(--pvl-ink)]"
            >
              ESTIMER →
            </button>
            <span className="font-sans text-[12.5px] text-[#B9C2E2]">
              Estimation fondée sur les ventes DVF réellement enregistrées.
              Gratuit, sans engagement — vous restez maître de la suite.
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}
