import { getCommuneRisques } from "@/lib/georisques";
import RiskLine from "./RiskLine";

/**
 * Composant serveur async isolé — jamais dans le Promise.all bloquant de la
 * page. L'API Géorisques répond normalement en ~100ms en local, mais met
 * régulièrement 8s (le timeout configuré, voir georisques.ts) à échouer
 * depuis l'infrastructure Vercel, gonflant le chargement de toute la fiche
 * annonce à 9-11s. En rendant ce bloc dans son propre <Suspense> (voir
 * acheter/[id]/page.tsx et louer/[id]/page.tsx), le reste de la page
 * s'affiche immédiatement et ce bloc apparaît — ou reste simplement absent —
 * quand Géorisques répond, sans jamais retarder le reste.
 */
const RADON_RISK_LABEL: Record<string, string> = {
  "1": "faible",
  "2": "faible, sur des formations géologiques particulières",
  "3": "significatif",
};

export default async function RisquesSection({
  insee,
  coords,
  communeNom,
}: {
  insee: string | null;
  coords: { lat: number; lng: number } | null;
  communeNom: string;
}) {
  const risques = insee ? await getCommuneRisques(insee, coords) : null;
  if (!risques || !risques.hasData) return null;

  return (
    <section className="mt-8">
      <h2 className="m-0 font-display text-2xl text-ink">État des risques</h2>
      <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
        {risques.categories.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-muted">
              Risques recensés sur la commune
            </span>
            <div className="flex flex-wrap gap-1.5">
              {risques.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-surface px-3 py-1 text-[12.5px] font-medium text-ink"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {risques.sismicite || risques.argile || risques.radonClasse || risques.catnat ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {risques.sismicite ? (
              <RiskLine label="Sismicité" value={`Zone ${risques.sismicite}`} />
            ) : null}
            {risques.argile ? (
              <RiskLine label="Retrait-gonflement des argiles" value={risques.argile} />
            ) : null}
            {risques.radonClasse ? (
              <RiskLine
                label="Potentiel radon"
                value={`Potentiel ${
                  RADON_RISK_LABEL[risques.radonClasse] ?? `classe ${risques.radonClasse}`
                }`}
              />
            ) : null}
            {risques.catnat ? (
              <RiskLine
                label="Catastrophes naturelles"
                value={`${risques.catnat.total} arrêté${
                  risques.catnat.total > 1 ? "s" : ""
                }${
                  risques.catnat.libelles.length > 0
                    ? ` — ${risques.catnat.libelles.slice(0, 3).join(", ").toLowerCase()}`
                    : ""
                }`}
              />
            ) : null}
          </div>
        ) : null}

        <p className="m-0 text-[11.5px] text-muted-2">
          Source : Géorisques (georisques.gouv.fr), au niveau de la commune de{" "}
          {communeNom}. N&apos;a pas valeur d&apos;état des risques et pollutions
          (ERP), qui reste annexé au bail ou à l&apos;acte.{" "}
          <a
            href="https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue"
          >
            Consulter Géorisques →
          </a>
        </p>
      </div>
    </section>
  );
}
