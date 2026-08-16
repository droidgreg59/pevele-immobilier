"use client";

import { useId, useState } from "react";
import { villages } from "@/data/villages";

export default function VillageMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
}) {
  const [text, setText] = useState("");
  const listId = useId();

  function tryAdd(raw: string) {
    const match = villages.find(
      (v) => v.nom.toLowerCase() === raw.trim().toLowerCase()
    );
    if (match && !value.includes(match.slug)) {
      onChange([...value, match.slug]);
    }
    setText("");
  }

  function remove(slug: string) {
    onChange(value.filter((s) => s !== slug));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input
        list={listId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            tryAdd(text);
          }
        }}
        onBlur={() => {
          if (text.trim()) tryAdd(text);
        }}
        placeholder="Ajouter un village…"
        className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
      />
      <datalist id={listId}>
        {villages
          .filter((v) => !value.includes(v.slug))
          .map((v) => (
            <option key={v.slug} value={v.nom} />
          ))}
      </datalist>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((slug) => {
            const village = villages.find((v) => v.slug === slug);
            if (!village) return null;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => remove(slug)}
                className="flex items-center gap-1.5 rounded-full bg-[#EDF1FB] px-3 py-1.5 font-mono text-[11px] font-medium text-blue transition hover:bg-[#DEE6F8]"
              >
                {village.nom}
                <span aria-hidden="true">×</span>
              </button>
            );
          })}
        </div>
      ) : (
        <span className="font-sans text-[12.5px] text-muted-2">
          Aucun village sélectionné — toute la Pévèle sera prise en compte.
        </span>
      )}
    </div>
  );
}
