import type { Metadata } from "next";
import Link from "next/link";
import { villages, getVillageBySlug } from "@/data/villages";
import { getDvfStatsForVillage } from "@/lib/dvf";

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
                {dvfStats && estimateBasse !== null && estimateHaute !== null ? (
                  <>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Estimation indicative — {village!.nom},{" "}
                      {surface} m², {type}
                    </span>
                    <div className="mt-2 font-display text-[32px] text-ink sm:text-[38px]">
                      {estimateBasse.toLocaleString("fr-FR")} € — {estimateHaute.toLocaleString("fr-FR")} €
                    </div>
                    <p className="m-0 mt-3 text-[13.5px] leading-[1.6] text-muted">
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
                    <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-blue-soft px-4 py-3">
                      <span className="text-[13px] text-ink">
                        Vous préférez un avis professionnel ?
                      </span>
                      <Link
                        href="/professionnels"
                        className="ml-auto whitespace-nowrap text-[12.5px] font-semibold text-blue"
                      >
                        Prendre RDV estimation avec une agence →
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
