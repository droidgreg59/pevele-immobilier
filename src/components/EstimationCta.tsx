"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import EstimationRequestForm from "./EstimationRequestForm";

export default function EstimationCta({ agencyId }: { agencyId: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return <EstimationRequestForm agencyId={agencyId} />;
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
    >
      <Calendar className="h-4 w-4" strokeWidth={1.75} />
      Rdv estimation →
    </button>
  );
}
