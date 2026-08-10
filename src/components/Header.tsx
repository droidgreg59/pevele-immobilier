"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-5 border-b-[3px] border-blue bg-cream px-8 py-3">
      <Link href="/" className="flex items-center gap-3.5">
        <span className="relative flex h-11 w-11 items-center justify-center border-[3px] border-blue bg-white">
          <span className="animate-pin-pulse h-3 w-3 rounded-full border-[2.5px] border-ink bg-yellow" />
          <span className="absolute -left-[3px] top-3 h-[3px] w-2 bg-cream" />
          <span className="absolute -right-[3px] bottom-2.5 h-[3px] w-2 bg-cream" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-[21px] font-normal tracking-[.02em] text-ink">
            PÉVÈLE <span className="text-blue">IMMOBILIER</span>
          </span>
          <span className="mt-1 font-mono text-[8.5px] font-medium tracking-[.1em] text-muted">
            LE PLAN DES ANNONCES DE LA PÉVÈLE
          </span>
        </span>
      </Link>

      <nav className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10.5px] font-medium text-ink">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap border-b-2 pb-0.5"
              style={{ borderColor: active ? "var(--pvl-yellow)" : "transparent" }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/vendre/deposer"
        className="shrink-0 bg-yellow px-4.5 py-3 font-mono text-[11.5px] font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] transition-transform hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--pvl-blue)]"
      >
        + DÉPOSER UNE ANNONCE
      </Link>
    </header>
  );
}
