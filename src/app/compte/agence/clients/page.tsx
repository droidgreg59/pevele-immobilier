import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPendingMandatesForAgency, getClientsForAgency } from "@/lib/mandates";
import { respondToMandateAction } from "@/lib/mandate-actions";
import { createProposalAction, removeProposalAction } from "@/lib/proposal-actions";
import { getListingsByUser } from "@/lib/listings";
import { formatPrix } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes clients",
};

function searchSummary(s: { transaction: "VENTE" | "LOCATION"; q: string | null; budgetMax: number | null }) {
  const parts = [s.transaction === "VENTE" ? "Achat" : "Location"];
  parts.push(s.q || "toute la Pévèle");
  if (s.budgetMax != null) parts.push(`≤ ${s.budgetMax.toLocaleString("fr-FR")} €`);
  return parts.join(" · ");
}

const PROPOSAL_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PROPOSEE: { label: "en attente de réponse", color: "var(--pvl-muted-2)" },
  INTERESSE: { label: "♥ intéressé(e)", color: "var(--pvl-green)" },
  PAS_INTERESSE: { label: "pas intéressé(e)", color: "var(--pvl-muted-2)" },
};

export default async function AgenceClientsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence/clients");
  if (session.type !== "AGENCE") redirect("/compte");

  const [pending, clients, ownListings] = await Promise.all([
    getPendingMandatesForAgency(session.userId),
    getClientsForAgency(session.userId),
    getListingsByUser(session.userId),
  ]);

  return (
    <div className="animate-fade-up max-w-[1000px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Mes clients
      </h1>
      <Link href="/compte" className="text-[13px] font-semibold text-blue">
        ← Mon compte
      </Link>

      <p className="mt-6 max-w-[64ch] text-[14.5px] leading-[1.6] text-muted">
        Les particuliers vous confient leurs recherches sauvegardées depuis
        leur compte. Acceptez une demande pour faire apparaître sa fiche
        client ci-dessous.
      </p>

      <div className="mt-8">
        <span className="text-[11px] font-semibold text-ink">
          Demandes en attente ({pending.length})
        </span>
        {pending.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {pending.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] font-semibold text-ink">
                    {m.client.nom}
                  </span>
                  <span className="text-[12px] text-muted-2">
                    {searchSummary(m.search)}
                  </span>
                </div>
                <form action={respondToMandateAction} className="flex items-center gap-3">
                  <input type="hidden" name="mandateId" value={m.id} />
                  <button
                    type="submit"
                    name="decision"
                    value="accept"
                    className="rounded-full bg-yellow px-3.5 py-2 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
                  >
                    Accepter
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="refuse"
                    className="text-[12.5px] font-semibold text-muted hover:text-ink"
                  >
                    Refuser
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Aucune demande en attente pour le moment.
          </p>
        )}
      </div>

      <div className="mt-9">
        <span className="text-[11px] font-semibold text-ink">
          Fiches clients ({clients.length})
        </span>
        {clients.length > 0 ? (
          <div className="mt-3 flex flex-col gap-4">
            {clients.map((c) => (
              <div key={c.clientId} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[16.5px] font-bold text-ink">
                    {c.nom}
                  </span>
                  <a
                    href={`mailto:${c.email}`}
                    className="text-[12.5px] font-semibold text-blue"
                  >
                    {c.email}
                  </a>
                </div>
                <div className="mt-3 flex flex-col gap-2.5">
                  {c.searches.map((s) => {
                    const proposedIds = new Set(s.proposals.map((p) => p.listingId));
                    const matching = ownListings.filter(
                      (l) =>
                        l.transaction === s.transaction &&
                        l.statut === "PUBLIEE" &&
                        !proposedIds.has(l.id)
                    );
                    return (
                      <div
                        key={s.mandateId}
                        className="flex flex-col gap-2 rounded-xl bg-surface px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13px] text-ink">
                            {searchSummary(s)}
                          </span>
                          {s.acceptedAt ? (
                            <span className="text-[11.5px] text-muted-2">
                              confiée le {s.acceptedAt.toLocaleDateString("fr-FR")}
                            </span>
                          ) : null}
                        </div>

                        {s.proposals.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {s.proposals.map((p) => (
                              <div
                                key={p.proposalId}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5"
                              >
                                <Link
                                  href={`/${p.transaction === "VENTE" ? "acheter" : "louer"}/${p.listingId}`}
                                  className="text-[12.5px] font-semibold text-blue"
                                >
                                  {p.titre} — {formatPrix(p.prix, p.transaction)}
                                </Link>
                                <div className="flex items-center gap-3">
                                  <span
                                    className="text-[11px] font-semibold"
                                    style={{ color: PROPOSAL_STATUS_LABEL[p.statut].color }}
                                  >
                                    {PROPOSAL_STATUS_LABEL[p.statut].label}
                                  </span>
                                  <form action={removeProposalAction}>
                                    <input type="hidden" name="proposalId" value={p.proposalId} />
                                    <button
                                      type="submit"
                                      className="text-[11px] font-semibold text-muted hover:text-ink"
                                    >
                                      Retirer
                                    </button>
                                  </form>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {matching.length > 0 ? (
                          <form
                            action={createProposalAction}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input type="hidden" name="mandateId" value={s.mandateId} />
                            <select
                              name="listingId"
                              required
                              defaultValue=""
                              className="rounded-full border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
                            >
                              <option value="" disabled>
                                Proposer une de mes annonces…
                              </option>
                              {matching.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.titre} — {formatPrix(l.prix, l.transaction)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="rounded-full border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
                            >
                              Proposer →
                            </button>
                          </form>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            Aucun client pour le moment — les recherches acceptées
            apparaîtront ici.
          </p>
        )}
      </div>
    </div>
  );
}
