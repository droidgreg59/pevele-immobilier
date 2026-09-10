import type { Metadata } from "next";
import Link from "next/link";
import { getEstimationLeads } from "@/lib/estimate-leads";
import { markEstimationLeadAction } from "@/lib/estimate-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads estimation en ligne — Super admin",
};

const eur = (n: number) => `${n.toLocaleString("fr-FR")} €`;

export default async function AdminEstimationLeadsPage() {
  const leads = await getEstimationLeads();
  const untreated = leads.filter((l) => !l.traite).length;

  return (
    <div className="animate-fade-up mx-auto max-w-[1100px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Leads estimation en ligne
      </h1>
      <Link href="/admin" className="text-[13px] font-semibold text-blue">
        ← Vue d&apos;ensemble
      </Link>

      <p className="mt-4 text-[13px] text-muted">
        {leads.length} lead{leads.length > 1 ? "s" : ""} · {untreated} à traiter. Captés
        sur <code className="text-[12px]">/estimer</code> — le visiteur a demandé à
        recevoir sa fourchette. À recontacter ou router vers une agence.
      </p>

      {leads.length === 0 ? (
        <p className="mt-8 text-[14px] text-muted">Aucun lead pour l&apos;instant.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold text-muted">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Bien</th>
                <th className="px-4 py-2.5">Fourchette</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-line last:border-0"
                  style={{ opacity: l.traite ? 0.5 : 1 }}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-2">
                    {l.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-ink">{l.nom}</div>
                    <div className="text-muted-2">
                      <a href={`mailto:${l.email}`} className="text-blue">
                        {l.email}
                      </a>
                      {l.telephone ? ` · ${l.telephone}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink">
                    {l.surface} m² · {l.typeBien}
                    {l.dpe ? ` · DPE ${l.dpe}` : ""}
                    <div className="text-muted-2">
                      <Link href={`/prix/${l.villageSlug}`} className="text-blue">
                        {l.commune}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-ink">
                    {eur(l.estimLow)} – {eur(l.estimHigh)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={markEstimationLeadAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="traite" value={l.traite ? "false" : "true"} />
                      <button
                        type="submit"
                        className="rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-ink transition hover:bg-surface"
                      >
                        {l.traite ? "Rouvrir" : "Marquer traité"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
