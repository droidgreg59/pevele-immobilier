import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Estimer mon bien — Pévèle Immobilier",
  description:
    "Estimez gratuitement votre bien en Pévèle, sans engagement, avant de le publier.",
};

export default function EstimerPage() {
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

        <div className="mt-7.5 grid grid-cols-1 items-center gap-14 sm:grid-cols-[1.3fr_1fr]">
          <h2 className="m-0 font-display text-[44px] leading-none text-white sm:text-[68px]">
            COMBIEN VAUT
            <br />
            VOTRE BIEN,
            <br />
            <span className="text-yellow">VRAIMENT ?</span>
          </h2>
          <form
            action="/vendre/deposer"
            method="get"
            className="flex flex-col gap-3.5"
          >
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium text-[#B9C2E2]">
                VOTRE ADRESSE
              </span>
              <input
                name="adresse"
                placeholder="ex. 8 rue du Moulin, Genech"
                className="box-border w-full border-[2.5px] border-ink bg-cream px-4.5 py-4 font-sans text-[15px] text-ink outline-none"
              />
            </label>
            <button
              type="submit"
              className="cursor-pointer border-0 bg-yellow px-4.5 py-4.5 font-mono text-[13px] font-semibold text-ink shadow-[6px_6px_0_var(--pvl-ink)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_var(--pvl-ink)]"
            >
              ESTIMER — PUIS PUBLIER SI ÇA VOUS PLAÎT →
            </button>
            <span className="font-sans text-[12.5px] text-[#B9C2E2]">
              Estimation fondée sur les annonces et ventes du village.
              Gratuit, sans engagement — vous restez maître de la suite.
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}
