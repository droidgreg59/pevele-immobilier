"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { AccountType } from "@prisma/client";

type SessionUser = { nom: string; type: AccountType; email: string };

const NAV_ITEMS = [
  { label: "ACHETER", href: "/acheter" },
  { label: "LOUER", href: "/louer" },
  { label: "VENDRE", href: "/vendre" },
  { label: "LA CARTE", href: "/carte" },
  { label: "LES VILLAGES", href: "/villages" },
  { label: "PRIX DE L'IMMOBILIER", href: "/prix" },
  { label: "ARTISANS & HABITAT", href: "/artisans" },
  { label: "PROFESSIONNELS", href: "/professionnels" },
];

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

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-5 border-b border-line bg-cream/90 px-6 py-3 backdrop-blur">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue">
          <span className="animate-pin-pulse h-2.5 w-2.5 rounded-full bg-yellow" />
        </span>
        <span className="font-display text-[18px] font-extrabold tracking-tight text-ink">
          Pévèle <span className="text-blue">Immobilier</span>
        </span>
      </Link>

      <nav className="flex flex-wrap gap-1 font-mono text-[10.5px] font-medium">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
                active
                  ? "bg-surface text-ink"
                  : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-4">
        {user ? (
          <Link
            href="/compte"
            className="whitespace-nowrap font-mono text-[10.5px] font-medium text-blue"
          >
            MON COMPTE
          </Link>
        ) : user === null ? (
          <Link
            href="/connexion"
            className="whitespace-nowrap font-mono text-[10.5px] font-medium text-blue"
          >
            SE CONNECTER
          </Link>
        ) : null}

        <Link
          href="/vendre/deposer"
          className="rounded-full bg-yellow px-4.5 py-2.5 font-mono text-[11.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          + DÉPOSER UNE ANNONCE
        </Link>
      </div>
    </header>
  );
}
