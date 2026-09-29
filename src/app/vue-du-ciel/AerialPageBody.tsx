import Link from "next/link";
import AerialTimeMachineLoader from "@/components/AerialTimeMachineLoader";
import { getAerialVillages } from "@/lib/aerial-villages";

export default function AerialPageBody({
  title,
  intro,
  villageSlug,
  villageNom,
}: {
  title: string;
  intro: string;
  villageSlug?: string;
  villageNom?: string;
}) {
  return (
    <div className="animate-fade-up mx-auto max-w-[1240px] px-4 py-8 sm:px-9 sm:py-10">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Vue du ciel
      </span>
      <h1 className="mt-3 font-display text-[30px] leading-tight text-ink sm:text-[40px]">{title}</h1>
      <p className="m-0 mt-2 max-w-[70ch] text-[15px] leading-[1.6] text-muted">{intro}</p>

      <div className="mt-6">
        <AerialTimeMachineLoader villages={getAerialVillages()} initialVillageSlug={villageSlug} />
      </div>

      <p className="m-0 mt-3 text-[13px] leading-[1.6] text-muted">
        Faites glisser le rond blanc pour passer d&apos;une époque à l&apos;autre, zoomez sur votre rue, puis
        partagez le lien : il garde les époques et l&apos;endroit choisis.
      </p>

      {villageSlug && villageNom ? (
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href={`/villages/${villageSlug}`}
            className="rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
          >
            Vivre à {villageNom} →
          </Link>
          <Link
            href={`/prix/${villageSlug}`}
            className="rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-surface"
          >
            Prix immobilier à {villageNom} →
          </Link>
        </div>
      ) : null}

      <p className="m-0 mt-8 text-[12px] leading-[1.6] text-muted-2">
        Photographies aériennes : IGN — BD ORTHO® et BD ORTHO® Historique (Géoplateforme), réutilisées
        sous Licence Ouverte Etalab 2.0. Les dates indiquent la période de prise de vue ; les clichés
        les plus anciens sont en noir et blanc.
      </p>
    </div>
  );
}
