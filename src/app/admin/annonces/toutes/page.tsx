import type { Metadata } from "next";
import Link from "next/link";
import { getAllListingsSummary } from "@/lib/admin-listings";
import { formatPrix } from "@/lib/format";
import DeleteListingButton from "@/components/DeleteListingButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Toutes les annonces — Super admin",
};

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

const STATUT_LABEL: Record<string, string> = {
  EN_VERIFICATION: "En attente",
  PUBLIEE: "Publiée",
  REFUSEE: "Refusée",
};

const STATUT_STYLE: Record<string, { bg: string; color: string }> = {
  EN_VERIFICATION: { bg: "#FBF3DC", color: "var(--pvl-gold)" },
  PUBLIEE: { bg: "#EAF3E8", color: "var(--pvl-green)" },
  REFUSEE: { bg: "var(--pvl-surface)", color: "var(--pvl-muted)" },
};

export default async function AdminToutesAnnoncesPage({
  searchParams,
}: PageProps<"/admin/annonces/toutes">) {
  const params = await searchParams;
  const statutFilter = typeof params.statut === "string" ? params.statut : undefined;

  const all = await getAllListingsSummary();
  const listings = statutFilter ? all.filter((l) => l.statut === statutFilter) : all;

  return (
    <div className="animate-fade-up mx-auto max-w-[1100px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">Toutes les annonces</h1>
      <Link href="/admin" className="text-[13px] font-semibold text-blue">
        ← Vue d&apos;ensemble
      </Link>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { label: "Toutes", value: undefined },
          { label: "En attente", value: "EN_VERIFICATION" },
          { label: "Publiées", value: "PUBLIEE" },
          { label: "Refusées", value: "REFUSEE" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/annonces/toutes?statut=${f.value}` : "/admin/annonces/toutes"}
            className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition"
            style={{
              background: statutFilter === f.value ? "var(--pvl-blue-soft)" : "#fff",
              color: statutFilter === f.value ? "var(--pvl-blue)" : "var(--pvl-ink)",
              border: `1.5px solid ${statutFilter === f.value ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
            }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {listings.map((l) => (
          <div
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-semibold text-ink">{l.titre}</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                  style={{
                    background: STATUT_STYLE[l.statut].bg,
                    color: STATUT_STYLE[l.statut].color,
                  }}
                >
                  {STATUT_LABEL[l.statut] ?? l.statut}
                </span>
              </div>
              <span className="text-[12.5px] text-muted">
                {l.commune} · {TYPE_BIEN_LABEL[l.typeBien] ?? l.typeBien} ·{" "}
                {l.transaction === "VENTE" ? "Vente" : "Location"} ·{" "}
                {formatPrix(l.prix, l.transaction)}
              </span>
              <span className="text-[11.5px] text-muted-2">
                {l.ownerLabel} · {l.createdAt.toLocaleDateString("fr-FR")}
                {l.statut === "REFUSEE" && l.statutRaison ? ` · ${l.statutRaison}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/admin/annonces/${l.id}`}
                className="text-[12.5px] font-semibold text-blue"
              >
                Modifier →
              </Link>
              <DeleteListingButton listingId={l.id} titre={l.titre} />
            </div>
          </div>
        ))}
        {listings.length === 0 ? (
          <p className="text-[13.5px] text-muted">Aucune annonce pour ce filtre.</p>
        ) : null}
      </div>
    </div>
  );
}
