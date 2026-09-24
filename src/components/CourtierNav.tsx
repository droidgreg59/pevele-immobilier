"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Settings, SlidersHorizontal } from "lucide-react";

export type CourtierNavCounts = {
  financements: number;
};

const ITEMS = [
  { href: "/compte/courtier", label: "Tableau de bord", icon: LayoutDashboard, key: null },
  { href: "/compte/courtier/financements", label: "Demandes de financement", icon: ClipboardList, key: "financements" },
  { href: "/compte/courtier/profil", label: "Ma fiche", icon: Settings, key: null },
  { href: "/compte/courtier/parametres", label: "Paramètres", icon: SlidersHorizontal, key: null },
] as const;

export default function CourtierNav({ counts }: { counts: CourtierNavCounts }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 flex-row gap-2 overflow-x-auto pb-1 sm:w-60 sm:flex-col sm:gap-1 sm:overflow-visible sm:pb-0"
      aria-label="Navigation mon compte"
    >
      {ITEMS.map((item) => {
        const active =
          item.href === "/compte/courtier" ? pathname === item.href : pathname.startsWith(item.href);
        const count = item.key ? counts[item.key as keyof CourtierNavCounts] : 0;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[13.5px] font-semibold transition sm:rounded-xl sm:whitespace-normal"
            style={{
              background: active ? "var(--pvl-blue-soft)" : "transparent",
              color: active ? "var(--pvl-blue)" : "var(--pvl-ink)",
            }}
          >
            <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
            <span className="flex-1">{item.label}</span>
            {count > 0 ? (
              <span
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                style={{
                  background: active ? "var(--pvl-blue)" : "var(--pvl-gold)",
                  color: "#fff",
                }}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
