import Link from "next/link";
import { Check } from "lucide-react";
import type { Pack } from "@/data/packs";

export default function PackCard({ pack }: { pack: Pack }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-6.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="font-display text-[22px] text-ink">{pack.nom}</span>
      <p className="m-0 text-[14px] leading-[1.55] text-muted">
        {pack.description}
      </p>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {pack.inclus.map((item) => (
          <li
            key={item}
            className="flex items-center gap-1.5 text-[13px] font-medium text-green"
          >
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            {item}
          </li>
        ))}
      </ul>
      <Link
        href={`/vendre/deposer?pack=${pack.slug}`}
        className="mt-auto self-start rounded-full border border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
      >
        Choisir ce pack →
      </Link>
    </div>
  );
}
