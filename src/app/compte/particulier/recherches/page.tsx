import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSavedSearchesByUser, savedSearchUrl } from "@/lib/saved-searches";
import { deleteSavedSearchAction } from "@/lib/saved-search-actions";
import { sendMandateAction } from "@/lib/mandate-actions";
import { respondToProposalAction } from "@/lib/proposal-actions";
import { getAgencies } from "@/lib/agencies";
import { getVillageBySlug } from "@/data/villages";
import { formatPrix } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes recherches",
};

const MANDATE_LABEL: Record<string, string> = {
  EN_ATTENTE: "en attente",
  ACCEPTEE: "acceptée",
  REFUSEE: "refusée",
};

const TYPE_MAISON_LABEL: Record<string, string> = {
  INDIVIDUELLE: "individuelle",
  SEMI_INDIVIDUELLE: "semi-individuelle",
  MITOYENNE: "mitoyenne",
};

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

function locationLabel(villageSlugs: string | null, q: string | null): string {
  if (villageSlugs) {
    const noms = villageSlugs
      .split(",")
      .filter(Boolean)
      .map((slug) => getVillageBySlug(slug)?.nom)
      .filter((n): n is string => Boolean(n));
    if (noms.length > 0) return noms.join(", ");
  }
  return q || "toute la Pévèle";
}

export default async function CompteParticulierRecherchesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/particulier/recherches");
  if (session.type !== "PARTICULIER") redirect("/compte");

  const [mesRecherches, agencies] = await Promise.all([
    getSavedSearchesByUser(session.userId),
    getAgencies(),
  ]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-[24px] text-ink">
          Mes recherches sauvegardées ({mesRecherches.length})
        </h2>
        <Link href="/mon-projet" className="text-[13px] font-semibold text-blue">
          + Définir un nouveau projet →
        </Link>
      </div>
      {mesRecherches.length > 0 ? (
        <p className="m-0 mt-1.5 text-[12.5px] text-muted">
          🔔 Vous recevez un email dès qu&apos;un nouveau bien correspond à l&apos;une de ces
          recherches.
        </p>
      ) : null}

      {mesRecherches.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          {mesRecherches.map((s) => {
            const availableAgencies = agencies.filter(
              (a) => !s.mandates.some((m) => m.agencyId === a.id)
            );
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-ink">
                      {s.transaction === "VENTE" ? "Achat" : "Location"}
                      {s.typeBien ? ` · ${TYPE_BIEN_LABEL[s.typeBien]}` : ""}
                      {s.typeBien === "MAISON" && s.typeMaison
                        ? ` (${TYPE_MAISON_LABEL[s.typeMaison]})`
                        : ""}
                      {` · ${locationLabel(s.villageSlugs, s.q)}`}
                      {s.chambresMin != null ? ` · ${s.chambresMin}+ chambres` : ""}
                      {s.equipements
                        ? ` · ${s.equipements.split(",").filter(Boolean).join(", ")}`
                        : ""}
                      {s.budgetMin != null && s.budgetMax != null
                        ? ` · ${s.budgetMin.toLocaleString("fr-FR")} – ${s.budgetMax.toLocaleString("fr-FR")} €`
                        : s.budgetMax != null
                          ? ` · ≤ ${s.budgetMax.toLocaleString("fr-FR")} €`
                          : s.budgetMin != null
                            ? ` · ≥ ${s.budgetMin.toLocaleString("fr-FR")} €`
                            : ""}
                    </span>
                    <span className="text-[12px] font-semibold text-blue">
                      {s.newMatches > 0
                        ? `${s.newMatches} nouvelle${s.newMatches > 1 ? "s" : ""} annonce${s.newMatches > 1 ? "s" : ""} depuis l'enregistrement`
                        : "Aucune nouvelle annonce depuis l'enregistrement"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={savedSearchUrl(s)} className="text-[12.5px] font-semibold text-blue">
                      Relancer →
                    </Link>
                    <form action={deleteSavedSearchAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-[12.5px] font-semibold text-muted hover:text-ink"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>

                {s.mandates.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {s.mandates.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted"
                      >
                        {m.agencyNom} · {MANDATE_LABEL[m.statut]}
                      </span>
                    ))}
                  </div>
                ) : null}

                {s.mandates.some((m) => m.proposals.length > 0) ? (
                  <div className="flex flex-col gap-2">
                    {s.mandates
                      .filter((m) => m.proposals.length > 0)
                      .map((m) => (
                        <div key={m.id} className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold text-muted-2">
                            Propositions de {m.agencyNom}
                          </span>
                          {m.proposals.map((p) => (
                            <div
                              key={p.proposalId}
                              className="flex flex-col gap-2 rounded-xl bg-[#FBF3DC] px-3 py-2"
                            >
                              <Link
                                href={`/${p.transaction === "VENTE" ? "acheter" : "louer"}/${p.listingId}`}
                                className="flex flex-wrap items-center justify-between gap-2 hover:underline"
                              >
                                <span className="text-[13px] font-medium text-ink">{p.titre}</span>
                                <span className="text-[12px] font-semibold text-gold">
                                  {formatPrix(p.prix, p.transaction)}
                                </span>
                              </Link>
                              {p.statut === "PROPOSEE" ? (
                                <form action={respondToProposalAction} className="flex items-center gap-4">
                                  <input type="hidden" name="proposalId" value={p.proposalId} />
                                  <button
                                    type="submit"
                                    name="decision"
                                    value="interesse"
                                    className="text-[12px] font-semibold text-green"
                                  >
                                    ♥ Intéressé(e)
                                  </button>
                                  <button
                                    type="submit"
                                    name="decision"
                                    value="pas_interesse"
                                    className="text-[12px] font-medium text-muted hover:text-ink"
                                  >
                                    Pas pour moi
                                  </button>
                                </form>
                              ) : (
                                <span
                                  className="text-[12px] font-semibold"
                                  style={{
                                    color:
                                      p.statut === "INTERESSE" ? "var(--pvl-green)" : "var(--pvl-muted)",
                                  }}
                                >
                                  {p.statut === "INTERESSE"
                                    ? "♥ Vous avez indiqué être intéressé(e)"
                                    : "Vous avez indiqué que ce bien ne vous intéresse pas"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                ) : null}

                {availableAgencies.length > 0 ? (
                  <form action={sendMandateAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="savedSearchId" value={s.id} />
                    <select
                      name="agencyId"
                      required
                      defaultValue=""
                      className="rounded-full border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                    >
                      <option value="" disabled>
                        Choisir une agence…
                      </option>
                      {availableAgencies.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.entreprise ?? a.nom}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-full border border-line px-3.5 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
                    >
                      Confier cette recherche →
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-muted">
          Enregistrez une recherche depuis « Acheter » ou « Louer » pour la retrouver ici.
        </p>
      )}
    </div>
  );
}
