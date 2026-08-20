"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, User } from "lucide-react";
import type { AccountType } from "@prisma/client";
import ProjectPill from "./ProjectPill";

type SessionUser = { nom: string; type: AccountType; email: string };

const MAIN_NAV = [
  { label: "Acheter", href: "/acheter" },
  { label: "Louer", href: "/louer" },
  { label: "Vendre", href: "/vendre" },
];

const PEVELE_NAV = [
  { label: "La carte", href: "/carte" },
  { label: "Les villages", href: "/villages" },
  { label: "Prix de l'immobilier", href: "/prix" },
  { label: "Artisans & habitat", href: "/artisans" },
  { label: "Professionnels", href: "/professionnels" },
];

function navLinkClass(active: boolean): string {
  return `rounded-full px-3 py-2 text-[14px] font-semibold transition-colors ${
    active ? "bg-surface text-ink" : "text-muted hover:bg-surface hover:text-ink"
  }`;
}

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: { user: SessionUser | null }) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const peveleActive = PEVELE_NAV.some((item) => isActive(item.href));
  const accountHref = user ? "/compte" : "/connexion";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:h-18 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow" />
          </span>
          <span className="hidden font-display text-[18px] font-extrabold tracking-tight text-ink sm:inline">
            Pévèle <span className="text-blue">Immobilier</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(isActive(item.href))}>
              {item.label}
            </Link>
          ))}
          <details className="group relative">
            <summary
              className={`${navLinkClass(peveleActive)} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}
            >
              La Pévèle
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            </summary>
            <div className="absolute left-0 top-full mt-2 flex w-56 flex-col gap-0.5 rounded-2xl border border-line bg-white p-2 shadow-md">
              {PEVELE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-surface text-ink"
                      : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden md:block">
            <ProjectPill />
          </div>

          {user ? (
            <Link
              href="/compte"
              className="hidden whitespace-nowrap text-[13px] font-semibold text-blue md:inline"
            >
              Mon compte
            </Link>
          ) : user === null ? (
            <Link
              href="/connexion"
              className="hidden whitespace-nowrap text-[13px] font-semibold text-blue md:inline"
            >
              Se connecter
            </Link>
          ) : null}

          <Link
            href="/vendre/deposer"
            className="hidden rounded-full bg-yellow px-4.5 py-2.5 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 md:inline-block"
          >
            Déposer une annonce
          </Link>

          <Link
            href={accountHref}
            aria-label={user ? "Mon compte" : "Se connecter"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-[12px] font-bold text-ink md:hidden"
          >
            {user ? user.nom.charAt(0).toUpperCase() : <User className="h-4 w-4" strokeWidth={1.75} />}
          </Link>
        </div>
      </div>
    </header>
  );
}
