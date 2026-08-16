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
  title: "Mes clients — Pévèle Immobilier",
};

function searchSummary(s: { transaction: "VENTE" | "LOCATION"; q: string | null; budgetMax: number | null }) {
  const parts = [s.transaction === "VENTE" ? "Achat" : "Location"];
  parts.push(s.q || "toute la Pévèle");
  if (s.budgetMax != null) parts.push(`≤ ${s.budgetMax.toLocaleString("fr-FR")} €`);
  return parts.join(" · ");
}

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
    <div className="animate-view-in max-w-[1000px] px-9 py-8">
      <span className="border-2 border-blue px-3 py-1.5 font-mono text-sm text-blue">
        MON COMPTE
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        MES CLIENTS
      </h1>
      <Link href="/compte" className="font-mono text-[11.5px] font-medium text-blue">
        ← MON COMPTE
      </Link>

      <p className="mt-6 max-w-[64ch] font-sans text-[14.5px] leading-[1.6] text-muted">
        Les particuliers vous confient leurs recherches sauvegardées depuis
        leur compte. Acceptez une demande pour faire apparaître sa fiche
        client ci-dessous.
      </p>

      <div className="mt-8">
        <span className="font-mono text-[10.5px] font-medium text-ink">
          DEMANDES EN ATTENTE ({pending.length})
        </span>
        {pending.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {pending.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-white px-5 py-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-[14px] font-semibold text-ink">
                    {m.client.nom}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted-2">
                    {searchSummary(m.search)}
                  </span>
                </div>
                <form action={respondToMandateAction} className="flex items-center gap-3">
                  <input type="hidden" name="mandateId" value={m.id} />
                  <button
                    type="submit"
                    name="decision"
                    value="accept"
                    className="border-2 border-ink bg-yellow px-3.5 py-2 font-mono text-[11px] font-semibold text-ink hover:bg-[#FDEBC2]"
                  >
                    ACCEPTER
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="refuse"
                    className="font-mono text-[11px] font-medium text-muted hover:text-ink"
                  >
                    REFUSER
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 font-sans text-[14px] text-muted">
            Aucune demande en attente pour le moment.
          </p>
        )}
      </div>

      <div className="mt-9">
        <span className="font-mono text-[10.5px] font-medium text-ink">
          FICHES CLIENTS ({clients.length})
        </span>
        {clients.length > 0 ? (
          <div className="mt-3 flex flex-col gap-4">
            {clients.map((c) => (
              <div key={c.clientId} className="border-2 border-ink bg-white p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-sans text-[16.5px] font-bold text-ink">
                    {c.nom}
                  </span>
                  <a
                    href={`mailto:${c.email}`}
                    className="font-mono text-[11px] font-medium text-blue"
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
                        className="flex flex-col gap-2 border border-line bg-[#F7F4EA] px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-sans text-[13px] text-ink">
                            {searchSummary(s)}
                          </span>
                          {s.acceptedAt ? (
                            <span className="font-mono text-[10px] text-muted-2">
                              confiée le {s.acceptedAt.toLocaleDateString("fr-FR")}
                            </span>
                          ) : null}
                        </div>

                        {s.proposals.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {s.proposals.map((p) => (
                              <div
                                key={p.proposalId}
                                className="flex flex-wrap items-center justify-between gap-2 border border-ink bg-white px-2.5 py-1.5"
                              >
                                <Link
                                  href={`/${p.transaction === "VENTE" ? "acheter" : "louer"}/${p.listingId}`}
                                  className="font-sans text-[12.5px] font-medium text-blue"
                                >
                                  {p.titre} — {formatPrix(p.prix, p.transaction)}
                                </Link>
                                <form action={removeProposalAction}>
                                  <input type="hidden" name="proposalId" value={p.proposalId} />
                                  <button
                                    type="submit"
                                    className="font-mono text-[9.5px] font-medium text-muted hover:text-ink"
                                  >
                                    RETIRER
                                  </button>
                                </form>
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
                              className="border-2 border-ink bg-white px-2.5 py-1.5 font-mono text-[10.5px] text-ink outline-none focus:border-blue"
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
                              className="border-2 border-ink px-3 py-1.5 font-mono text-[10.5px] font-medium text-ink hover:bg-white"
                            >
                              PROPOSER →
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
          <p className="mt-3 font-sans text-[14px] text-muted">
            Aucun client pour le moment — les recherches acceptées
            apparaîtront ici.
          </p>
        )}
      </div>
    </div>
  );
}
