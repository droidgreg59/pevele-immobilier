import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/stats", label: "Statistiques" },
  { href: "/admin/annonces", label: "Modération" },
  { href: "/admin/verifications", label: "Vérif. agences" },
  { href: "/admin/annonces/toutes", label: "Toutes les annonces" },
  { href: "/admin/comptes", label: "Comptes" },
  { href: "/admin/avis", label: "Avis Pévèle" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-1 px-9 py-3">
          <span className="mr-3 rounded-full bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted">
            Super admin
          </span>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:bg-surface"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
