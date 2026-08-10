import Link from "next/link";
import type { Village } from "@/data/villages";

export default function VillageCard({ village }: { village: Village }) {
  return (
    <Link
      href={`/villages/${village.slug}`}
      className="flex flex-col gap-2.5 border-2 border-ink bg-white p-5 transition-colors hover:bg-[#FDEBC2]"
    >
      <span className="font-display text-[22px] text-green">
        {village.nom}
      </span>
      <p className="m-0 font-sans text-[13px] leading-[1.5] text-muted">
        {village.description}
      </p>
      <span className="mt-auto font-mono text-[10.5px] font-medium text-blue">
        VOIR LA FICHE →
      </span>
    </Link>
  );
}
