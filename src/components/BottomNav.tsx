"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Map, Sparkles, Heart } from "lucide-react";
import { useProjectDraft, projectDraftProgress } from "@/lib/project-draft";

const TABS = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Rechercher", href: "/acheter", icon: Search },
  { label: "Carte", href: "/carte", icon: Map },
  { label: "Projet", href: "/mon-projet", icon: Sparkles },
  { label: "Favoris", href: "/compte/favoris", icon: Heart },
];

// Ces pages ont leur propre barre d'action sticky mobile — pas de double barre.
const HIDDEN_ON = [/^\/acheter\/[^/]+$/, /^\/louer\/[^/]+$/];

export default function BottomNav() {
  const pathname = usePathname();
  const draft = useProjectDraft();
  const progress = draft ? projectDraftProgress(draft) : 0;
  const projectDot = progress > 0 && progress < 1;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  if (HIDDEN_ON.some((re) => re.test(pathname))) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-cream/97 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch justify-around">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon
                className="h-6 w-6"
                strokeWidth={1.75}
                color={active ? "var(--pvl-blue)" : "var(--pvl-muted-2)"}
                fill={active && tab.href === "/mon-projet" ? "var(--pvl-blue)" : "none"}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? "var(--pvl-blue)" : "var(--pvl-muted-2)" }}
              >
                {tab.label}
              </span>
              {tab.href === "/mon-projet" && projectDot ? (
                <span className="absolute right-[26%] top-1 h-2 w-2 rounded-full border-[1.5px] border-cream bg-blue" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
