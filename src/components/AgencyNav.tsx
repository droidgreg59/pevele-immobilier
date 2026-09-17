"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  DoorOpen,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

export type AgencyNavCounts = {
  visites: number;
  portesOuvertes: number;
  estimations: number;
  clients: number;
};

const ITEMS = [
  { href: "/compte/agence", label: "Tableau de bord", icon: LayoutDashboard, key: null },
  { href: "/compte/agence/annonces", label: "Mes annonces", icon: Building2, key: null },
  { href: "/compte/agence/visites", label: "Demandes de visite", icon: CalendarCheck, key: "visites" },
  { href: "/compte/agence/portes-ouvertes", label: "Portes ouvertes", icon: DoorOpen, key: "portesOuvertes" },
  { href: "/compte/agence/estimations", label: "Demandes d'estimation", icon: ClipboardList, key: "estimations" },
  { href: "/compte/agence/clients", label: "Mes clients", icon: Users, key: "clients" },
  { href: "/compte/agence/statistiques", label: "Statistiques", icon: BarChart3, key: null },
  { href: "/compte/agence/profil", label: "Mon agence", icon: Settings, key: null },
  { href: "/compte/agence/parametres", label: "Paramètres", icon: SlidersHorizontal, key: null },
] as const;

export default function AgencyNav({ counts }: { counts: AgencyNavCounts }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 flex-row gap-2 overflow-x-auto pb-1 sm:w-60 sm:flex-col sm:gap-1 sm:overflow-visible sm:pb-0"
      aria-label="Navigation espace agence"
    >
      {ITEMS.map((item) => {
        const active = item.href === "/compte/agence" ? pathname === item.href : pathname.startsWith(item.href);
        const count = item.key ? counts[item.key as keyof AgencyNavCounts] : 0;
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
