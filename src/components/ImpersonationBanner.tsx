"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { stopImpersonationAction } from "@/lib/impersonation-actions";

type Info = { nom: string; email: string } | null;

// Client (via /api/session, comme le header) : lire les cookies dans le
// layout racine rendrait dynamiques toutes les pages statiques/ISR du site.
export default function ImpersonationBanner() {
  const pathname = usePathname();
  const [info, setInfo] = useState<Info>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then(
        (data: { user: { nom: string; email: string } | null; impersonating?: boolean }) => {
          if (!cancelled) setInfo(data.impersonating && data.user ? data.user : null);
        }
      )
      .catch(() => {
        if (!cancelled) setInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!info) return null;

  return (
    <div className="sticky top-0 z-[100] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink px-4 py-2 text-[13px] text-white">
      <span>
        Mode support — vous êtes connecté en tant que <b>{info.nom}</b> ({info.email})
      </span>
      <form action={stopImpersonationAction}>
        <button
          type="submit"
          className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink transition hover:bg-surface"
        >
          Quitter et revenir à l&apos;admin
        </button>
      </form>
    </div>
  );
}
