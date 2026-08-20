"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useProjectDraft, projectDraftProgress } from "@/lib/project-draft";

type ProjectSummary = { matchCount: number } | null;

/**
 * Pill "Mon projet" du header. Priorité à la recherche sauvegardée côté
 * serveur (utilisateur connecté) ; à défaut, reflète le brouillon local.
 */
export default function ProjectPill() {
  const pathname = usePathname();
  const draft = useProjectDraft();
  const [project, setProject] = useState<ProjectSummary | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: { project: ProjectSummary }) => {
        if (!cancelled) setProject(data.project ?? null);
      })
      .catch(() => {
        if (!cancelled) setProject(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (project) {
    return (
      <Link
        href="/mon-projet"
        className="flex items-center gap-2 whitespace-nowrap rounded-full bg-blue-soft px-3.5 py-2 text-[13px] font-semibold text-blue transition hover:brightness-95"
      >
        Mon projet
        <span>· {project.matchCount} bien{project.matchCount > 1 ? "s" : ""}</span>
      </Link>
    );
  }

  const progress = draft ? projectDraftProgress(draft) : null;

  if (!progress) {
    return (
      <Link
        href="/mon-projet"
        className="whitespace-nowrap rounded-full border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:bg-surface"
      >
        Définir mon projet
      </Link>
    );
  }

  const pct = Math.round(progress * 100);

  return (
    <Link
      href="/mon-projet"
      className="flex items-center gap-2 whitespace-nowrap rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:bg-line/60"
    >
      Mon projet
      <span className="text-muted">· {pct}%</span>
    </Link>
  );
}
