import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getPendingVerifications } from "@/lib/agency-verification";
import { reviewAgencyVerificationAction } from "@/lib/admin-users-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vérification des agences",
};

export default async function AdminVerificationsPage() {
  await requireAdmin();
  const pending = await getPendingVerifications();

  return (
    <div className="animate-fade-up max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Vérification des agences
      </h1>
      <Link href="/compte" className="text-[13px] font-semibold text-blue">
        ← Mon compte
      </Link>

      <p className="mt-6 max-w-[64ch] text-[14.5px] leading-[1.6] text-muted">
        {pending.length > 0
          ? `${pending.length} demande${pending.length > 1 ? "s" : ""} en attente. Contrôlez le SIRET et le numéro de carte professionnelle (carte T) avant de valider.`
          : "Aucune demande de vérification en attente."}
      </p>

      <div className="mt-7 flex flex-col gap-5">
        {pending.map((a) => (
          <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[16px] font-bold text-ink">{a.entreprise ?? a.nom}</span>
              <span className="text-[12px] text-muted-2">
                {a.verifSoumiseLe ? a.verifSoumiseLe.toLocaleDateString("fr-FR") : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-[13px] text-ink sm:grid-cols-2">
              <span>
                SIRET : <b>{a.siret}</b>
              </span>
              <span>
                Carte T : <b>{a.carteProfessionnelle}</b> ({a.carteProCci})
              </span>
              {a.siretDenomination ? (
                <span className="text-muted">
                  Raison sociale (INSEE) : {a.siretDenomination}
                </span>
              ) : (
                <span className="text-muted-2">Raison sociale INSEE non résolue</span>
              )}
              {a.zoneCouverte ? <span className="text-muted">Zone : {a.zoneCouverte}</span> : null}
              <span className="text-muted">Contact : {a.email}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[12.5px] font-semibold text-blue">
              {a.siret ? (
                <a
                  href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${a.siret}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir sur l&apos;annuaire des entreprises ↗
                </a>
              ) : null}
            </div>

            <div className="mt-1 flex flex-wrap items-start gap-3">
              <form action={reviewAgencyVerificationAction}>
                <input type="hidden" name="userId" value={a.id} />
                <input type="hidden" name="decision" value="verifier" />
                <button
                  type="submit"
                  className="rounded-full bg-yellow px-5 py-2.5 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
                >
                  Vérifier →
                </button>
              </form>
              <details className="flex-1">
                <summary className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink">
                  Refuser…
                </summary>
                <form action={reviewAgencyVerificationAction} className="mt-2 flex flex-col gap-2">
                  <input type="hidden" name="userId" value={a.id} />
                  <input type="hidden" name="decision" value="refuser" />
                  <textarea
                    name="raison"
                    rows={2}
                    placeholder="Motif communiqué à l'agence"
                    className="rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                  />
                  <button
                    type="submit"
                    className="self-start rounded-full border border-line px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
                  >
                    Confirmer le refus
                  </button>
                </form>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
