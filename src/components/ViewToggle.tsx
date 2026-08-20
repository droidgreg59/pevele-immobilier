"use client";

import { type BrowseView, setBrowseView } from "@/lib/browse-view";

const OPTIONS: { value: BrowseView; label: string }[] = [
  { value: "liste", label: "Liste" },
  { value: "liste_carte", label: "Liste + carte" },
  { value: "carte", label: "Carte" },
];

export default function ViewToggle({ value }: { value: BrowseView }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-surface p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setBrowseView(opt.value)}
          className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${
            value === opt.value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
