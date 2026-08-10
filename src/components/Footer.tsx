"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SHEETS: { prefix: string; label: string }[] = [
  { prefix: "/vendre/deposer", label: "03 — ATELIER · DÉPÔT" },
  { prefix: "/vendre", label: "03 — ATELIER · VENDRE" },
  { prefix: "/acheter", label: "02 — SÉJOUR · ACHETER" },
  { prefix: "/louer", label: "02 — ENTRÉE · LOUER" },
  { prefix: "/estimer", label: "04 — CUISINE · ESTIMATION" },
  { prefix: "/villages", label: "05 — JARDIN · VILLAGES" },
  { prefix: "/carte", label: "06 — PLAN DE MASSE · CARTE" },
  { prefix: "/prix", label: "07 — PRIX DE L'IMMOBILIER" },
  { prefix: "/artisans", label: "08 — ARTISANS & HABITAT" },
  { prefix: "/professionnels", label: "09 — BUREAU · PROFESSIONNELS" },
];

function sheetLabel(pathname: string): string {
  const match = SHEETS.find(
    (s) => pathname === s.prefix || pathname.startsWith(s.prefix + "/")
  );
  return match ? match.label : "01 — ACCUEIL";
}

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className="mt-6 flex flex-wrap justify-between gap-2 border-t-2 border-blue bg-cream px-8 py-3 font-mono text-[10.5px] font-medium text-muted-2">
      <span>
        FEUILLE {sheetLabel(pathname)} — RÉV. A — © PÉVÈLE-IMMOBILIER.FR
      </span>
      <Link href="/" className="text-blue">
        ↖ REVENIR AU PLAN D&apos;ENSEMBLE
      </Link>
    </footer>
  );
}
