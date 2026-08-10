import Link from "next/link";
import type { Pack } from "@/data/packs";

export default function PackCard({ pack }: { pack: Pack }) {
  return (
    <div className="flex flex-col gap-3.5 border-[2.5px] border-ink bg-white p-6.5 shadow-[6px_6px_0_rgba(39,67,166,.18)]">
      <span className="font-display text-[22px] text-ink">{pack.nom}</span>
      <p className="m-0 font-sans text-[14px] leading-[1.55] text-muted">
        {pack.description}
      </p>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {pack.inclus.map((item) => (
          <li
            key={item}
            className="font-mono text-[11px] font-medium text-green"
          >
            ✓ {item}
          </li>
        ))}
      </ul>
      <Link
        href={`/vendre/deposer?pack=${pack.slug}`}
        className="mt-auto self-start border-2 border-ink px-4 py-2.5 font-mono text-[11px] font-semibold text-ink hover:bg-[#FDEBC2]"
      >
        CHOISIR CE PACK →
      </Link>
    </div>
  );
}
