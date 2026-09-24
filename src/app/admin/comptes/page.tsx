import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getAllUsers } from "@/lib/admin-users";
import { revertToVerificationPendingAction } from "@/lib/admin-users-actions";
import DeleteUserButton from "@/components/DeleteUserButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comptes — Super admin",
};

const TYPE_LABEL: Record<string, string> = {
  PARTICULIER: "Particulier",
  AGENCE: "Agence",
  ARTISAN: "Artisan",
  COURTIER: "Courtier",
};

const VERIF_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  VERIFIEE: { label: "✓ Vérifiée — visible", bg: "#EAF3E8", color: "var(--pvl-green)" },
  EN_ATTENTE: { label: "En attente — masquée", bg: "#FBF3DC", color: "var(--pvl-gold)" },
  NON_SOUMISE: { label: "Non soumise — masquée", bg: "var(--pvl-surface)", color: "var(--pvl-muted)" },
  REFUSEE: { label: "Refusée — masquée", bg: "#FBEAEA", color: "var(--pvl-ink)" },
};

export default async function AdminComptesPage({
  searchParams,
}: PageProps<"/admin/comptes">) {
  const params = await searchParams;
  const typeFilter = typeof params.type === "string" ? params.type : undefined;
  const session = await getSession();

  const allUsers = await getAllUsers();
  const users = typeFilter ? allUsers.filter((u) => u.type === typeFilter) : allUsers;

  return (
    <div className="animate-fade-up mx-auto max-w-[1100px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">Comptes</h1>
      <Link href="/admin" className="text-[13px] font-semibold text-blue">
        ← Vue d&apos;ensemble
      </Link>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { label: "Tous", value: undefined },
          { label: "Particuliers", value: "PARTICULIER" },
          { label: "Agences", value: "AGENCE" },
          { label: "Artisans", value: "ARTISAN" },
          { label: "Courtiers", value: "COURTIER" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/comptes?type=${f.value}` : "/admin/comptes"}
            className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition"
            style={{
              background: typeFilter === f.value ? "var(--pvl-blue-soft)" : "#fff",
              color: typeFilter === f.value ? "var(--pvl-blue)" : "var(--pvl-ink)",
              border: `1.5px solid ${typeFilter === f.value ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
            }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-semibold text-muted">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Vérification</th>
              <th className="px-4 py-3">Annonces</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const badge = u.verifStatut ? VERIF_BADGE[u.verifStatut] : null;
              return (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-ink">{u.entreprise ?? u.nom}</span>
                    {u.isAdmin ? (
                      <span className="ml-2 rounded-full bg-blue-soft px-2 py-0.5 text-[10.5px] font-semibold text-blue">
                        Admin
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted">{TYPE_LABEL[u.type] ?? u.type}</td>
                  <td className="px-4 py-3">
                    {badge ? (
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                        {u.verifStatut === "VERIFIEE" ? (
                          <form action={revertToVerificationPendingAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="accountType" value={u.type} />
                            <button
                              type="submit"
                              className="text-[11.5px] font-semibold text-blue transition hover:text-ink"
                            >
                              Repasser en attente
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-2">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.listingCount}</td>
                  <td className="px-4 py-3 text-muted">{u.createdAt.toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 text-right">
                    {session && u.id !== session.userId ? (
                      <DeleteUserButton userId={u.id} label={u.entreprise ?? u.nom} />
                    ) : (
                      <span className="text-[11.5px] text-muted-2">Vous</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 ? (
          <p className="p-6 text-[13.5px] text-muted">Aucun compte pour ce filtre.</p>
        ) : null}
      </div>
    </div>
  );
}
