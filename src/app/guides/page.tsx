import type { Metadata } from "next";
import Link from "next/link";
import { getAllGuidesMetadata } from "@/lib/guides";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Guides immobiliers de la Pévèle",
  description:
    "Guides et comparatifs sur l'immobilier en Pévèle, fondés sur les transactions DVF et l'Observatoire Pévèle-Immobilier.fr : prix par commune, budgets, gares, comparaisons.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesPage() {
  const guides = await getAllGuidesMetadata();

  return (
    <div className="animate-fade-up mx-auto max-w-[820px] px-6 py-14 sm:py-20">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Guides
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Guides immobiliers de la Pévèle
      </h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <div className="mt-8 flex flex-col gap-4">
        {guides.map(({ slug, metadata: m }) => (
          <Link
            key={slug}
            href={`/guides/${slug}`}
            className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {m.type === "comparatif" ? "Comparatif" : "Guide"}
            </span>
            <h2 className="m-0 mt-1 font-display text-[19px] text-ink">{m.title}</h2>
            <p className="m-0 mt-2 text-[13.5px] leading-[1.6] text-muted">{m.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
