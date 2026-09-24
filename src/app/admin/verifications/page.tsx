import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getPendingVerifications, getUnsubmittedAgencies } from "@/lib/agency-verification";
import {
  getPendingCourtierVerifications,
  getUnsubmittedCourtiers,
} from "@/lib/courtier-verification";
import { reviewAgencyVerificationAction, reviewCourtierVerificationAction } from "@/lib/admin-users-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vérifications professionnelles",
};

export default async function AdminVerificationsPage() {
  await requireAdmin();
  const [pending, unsubmitted, pendingCourtiers, unsubmittedCourtiers] = await Promise.all([
    getPendingVerifications(),
    getUnsubmittedAgencies(),
    getPendingCourtierVerifications(),
    getUnsubmittedCourtiers(),
  ]);

  return (
    <div className="animate-fade-up mx-auto max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Vérifications professionnelles
      </h1>
      <Link href="/compte" className="text-[13px] font-semibold text-blue">
        ← Mon compte
      </Link>

      <h2 className="m-0 mt-8 font-display text-2xl text-ink">Agences</h2>

      <p className="mt-6 max-w-[64ch] text-[14.5px] leading-[1.6] text-muted">
        {pending.length > 0
          ? `${pending.length} demande${pending.length > 1 ? "s" : ""} en attente. Contrôlez le SIRET et le numéro de carte professionnelle (carte T) avant de valider.`
          : "Aucune demande de vérification soumise."}
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
              <span className="text-muted">
                Diffusion :{" "}
                {a.modeAnnonces === "AUTOMATISE"
                  ? `automatisée (${a.logicielMetier ?? "logiciel non précisé"}) — à recontacter pour le branchement`
                  : "manuelle"}
              </span>
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

      <h2 className="m-0 mt-10 font-display text-xl text-ink">
        Agences inscrites, non soumises ({unsubmitted.length})
      </h2>
      <p className="mt-2 max-w-[64ch] text-[13.5px] leading-[1.6] text-muted">
        Elles n&apos;ont pas (encore) soumis leur SIRET et leur carte professionnelle
        depuis leur compte — mais restent invisibles dans l&apos;annuaire et sur leurs
        annonces tant que vous ne les validez pas, avec ou sans cette étape.
      </p>

      {unsubmitted.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">Aucune agence en attente.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {unsubmitted.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[16px] font-bold text-ink">{a.entreprise ?? a.nom}</span>
                <span className="text-[12px] text-muted-2">
                  Inscrite le {a.createdAt.toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[13px] text-ink sm:grid-cols-2">
                <span className="text-muted">Contact : {a.email}{a.telephone ? ` · ${a.telephone}` : ""}</span>
                <span className="text-muted">
                  Diffusion :{" "}
                  {a.modeAnnonces === "AUTOMATISE"
                    ? `automatisée (${a.logicielMetier ?? "logiciel non précisé"}) — à recontacter pour le branchement`
                    : "manuelle"}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-start gap-3">
                <form action={reviewAgencyVerificationAction}>
                  <input type="hidden" name="userId" value={a.id} />
                  <input type="hidden" name="decision" value="verifier" />
                  <button
                    type="submit"
                    className="rounded-full bg-yellow px-5 py-2.5 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
                  >
                    Valider quand même →
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
      )}

      <h2 className="m-0 mt-12 font-display text-2xl text-ink">Courtiers bancaires</h2>
      <p className="mt-2 max-w-[64ch] text-[14.5px] leading-[1.6] text-muted">
        {pendingCourtiers.length > 0
          ? `${pendingCourtiers.length} demande${pendingCourtiers.length > 1 ? "s" : ""} en attente. Contrôlez le numéro ORIAS avant de valider.`
          : "Aucune demande de vérification soumise."}
      </p>

      <div className="mt-7 flex flex-col gap-5">
        {pendingCourtiers.map((c) => (
          <div key={c.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[16px] font-bold text-ink">{c.entreprise ?? c.nom}</span>
              <span className="text-[12px] text-muted-2">
                {c.verifSoumiseLe ? c.verifSoumiseLe.toLocaleDateString("fr-FR") : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-[13px] text-ink sm:grid-cols-2">
              <span>
                ORIAS : <b>{c.orias}</b>
              </span>
              {c.siret ? (
                <span>
                  SIRET : <b>{c.siret}</b>
                </span>
              ) : (
                <span className="text-muted-2">SIRET non renseigné</span>
              )}
              {c.siretDenomination ? (
                <span className="text-muted">
                  Raison sociale (INSEE) : {c.siretDenomination}
                </span>
              ) : null}
              {c.zoneCouverte ? <span className="text-muted">Zone : {c.zoneCouverte}</span> : null}
              <span className="text-muted">Contact : {c.email}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[12.5px] font-semibold text-blue">
              <a
                href={`https://www.orias.fr/search?nom=${encodeURIComponent(c.entreprise ?? c.nom)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Vérifier sur l&apos;annuaire ORIAS ↗
              </a>
              {c.siret ? (
                <a
                  href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${c.siret}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir sur l&apos;annuaire des entreprises ↗
                </a>
              ) : null}
            </div>

            <div className="mt-1 flex flex-wrap items-start gap-3">
              <form action={reviewCourtierVerificationAction}>
                <input type="hidden" name="userId" value={c.id} />
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
                <form action={reviewCourtierVerificationAction} className="mt-2 flex flex-col gap-2">
                  <input type="hidden" name="userId" value={c.id} />
                  <input type="hidden" name="decision" value="refuser" />
                  <textarea
                    name="raison"
                    rows={2}
                    placeholder="Motif communiqué au courtier"
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

      <h3 className="m-0 mt-10 font-display text-xl text-ink">
        Courtiers inscrits, non soumis ({unsubmittedCourtiers.length})
      </h3>
      <p className="mt-2 max-w-[64ch] text-[13.5px] leading-[1.6] text-muted">
        Ils n&apos;ont pas (encore) soumis leur numéro ORIAS depuis leur compte —
        mais restent invisibles dans l&apos;annuaire tant que vous ne les validez pas,
        avec ou sans cette étape.
      </p>

      {unsubmittedCourtiers.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">Aucun courtier en attente.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {unsubmittedCourtiers.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[16px] font-bold text-ink">{c.entreprise ?? c.nom}</span>
                <span className="text-[12px] text-muted-2">
                  Inscrit le {c.createdAt.toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[13px] text-ink sm:grid-cols-2">
                <span className="text-muted">Contact : {c.email}{c.telephone ? ` · ${c.telephone}` : ""}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-start gap-3">
                <form action={reviewCourtierVerificationAction}>
                  <input type="hidden" name="userId" value={c.id} />
                  <input type="hidden" name="decision" value="verifier" />
                  <button
                    type="submit"
                    className="rounded-full bg-yellow px-5 py-2.5 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
                  >
                    Valider quand même →
                  </button>
                </form>
                <details className="flex-1">
                  <summary className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink">
                    Refuser…
                  </summary>
                  <form action={reviewCourtierVerificationAction} className="mt-2 flex flex-col gap-2">
                    <input type="hidden" name="userId" value={c.id} />
                    <input type="hidden" name="decision" value="refuser" />
                    <textarea
                      name="raison"
                      rows={2}
                      placeholder="Motif communiqué au courtier"
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
      )}
    </div>
  );
}
