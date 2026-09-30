"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, Map, Sparkles, Heart, Menu as MenuIcon } from "lucide-react";
import type { AccountType } from "@prisma/client";
import { useProjectDraft, projectDraftProgress } from "@/lib/project-draft";
import BottomSheet from "./BottomSheet";

const BASE_TABS = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Rechercher", href: "/acheter", icon: Search },
  { label: "Carte", href: "/carte", icon: Map },
];

// Réservés aux particuliers — masqués pour les comptes pro (agence, artisan, courtier).
const PARTICULIER_TABS = [
  { label: "Projet", href: "/mon-projet", icon: Sparkles },
  { label: "Favoris", href: "/compte/particulier/favoris", icon: Heart },
];

// Ces pages ont leur propre barre d'action sticky mobile — pas de double barre.
const HIDDEN_ON = [/^\/acheter\/[^/]+$/, /^\/louer\/[^/]+$/];

// Miroir du header desktop (MAIN_NAV + PEVELE_NAV, Header.tsx) — seule
// navigation possible vers ces pages sur mobile, où la nav du header est
// masquée (`hidden md:flex`) et où le footer ne les reprend pas toutes.
const MENU_SECTIONS: { label: string; href: string }[][] = [
  [
    { label: "Acheter", href: "/acheter" },
    { label: "Louer", href: "/louer" },
    { label: "Vendre", href: "/vendre" },
  ],
  [
    { label: "La carte", href: "/carte" },
    { label: "Les villages", href: "/villages" },
    { label: "Les agences", href: "/professionnels" },
    { label: "Prix de l'immobilier", href: "/prix" },
    { label: "Artisans & habitat", href: "/artisans" },
    { label: "Courtiers", href: "/courtiers" },
  ],
];

const ACCOUNT_HUB_HREF: Partial<Record<AccountType, string>> = {
  AGENCE: "/compte/agence",
  ARTISAN: "/compte/artisan",
  COURTIER: "/compte/courtier",
};

function menuLinkClass(active: boolean): string {
  return `block rounded-xl px-3.5 py-3 text-[15px] font-semibold transition-colors ${
    active ? "bg-surface text-ink" : "text-ink hover:bg-surface"
  }`;
}

export default function BottomNav() {
  const pathname = usePathname();
  const draft = useProjectDraft();
  const progress = draft ? projectDraftProgress(draft) : 0;
  const projectDot = progress > 0 && progress < 1;
  const [accountType, setAccountType] = useState<AccountType | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: { user: { type: AccountType } | null }) => {
        if (!cancelled) setAccountType(data.user?.type ?? null);
      })
      .catch(() => {
        if (!cancelled) setAccountType(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isPro = accountType === "AGENCE" || accountType === "ARTISAN" || accountType === "COURTIER";
  const TABS = isPro ? BASE_TABS : [...BASE_TABS, ...PARTICULIER_TABS];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const accountHref = accountType === undefined
    ? null
    : accountType === null
      ? "/connexion"
      : ACCOUNT_HUB_HREF[accountType] || "/compte";

  if (HIDDEN_ON.some((re) => re.test(pathname))) return null;

  return (
    <>
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
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            <MenuIcon
              className="h-6 w-6"
              strokeWidth={1.75}
              color={menuOpen ? "var(--pvl-blue)" : "var(--pvl-muted-2)"}
            />
            <span
              className="text-[10px] font-semibold"
              style={{ color: menuOpen ? "var(--pvl-blue)" : "var(--pvl-muted-2)" }}
            >
              Menu
            </span>
          </button>
        </div>
      </nav>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <div className="flex flex-col gap-5">
          {MENU_SECTIONS.map((section, i) => (
            <div key={i} className="flex flex-col gap-1">
              {section.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={menuLinkClass(isActive(item.href))}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          <Link
            href="/vendre/deposer"
            onClick={() => setMenuOpen(false)}
            className="rounded-full bg-yellow px-5 py-3.5 text-center text-[14px] font-bold text-ink shadow-sm transition hover:brightness-95"
          >
            Déposer une annonce
          </Link>

          {accountHref ? (
            <Link
              href={accountHref}
              onClick={() => setMenuOpen(false)}
              className="rounded-full border border-line px-5 py-3.5 text-center text-[14px] font-semibold text-ink transition hover:bg-surface"
            >
              {accountType ? "Mon compte" : "Se connecter"}
            </Link>
          ) : null}
        </div>
      </BottomSheet>
    </>
  );
}
