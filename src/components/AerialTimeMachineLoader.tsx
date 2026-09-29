"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type AerialTimeMachineType from "./AerialTimeMachine";

// Leaflet manipule `window` dès l'import : chargement côté client uniquement.
const AerialTimeMachine = dynamic(() => import("./AerialTimeMachine"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[68vh] min-h-[420px] items-center justify-center rounded-2xl border border-line bg-surface text-[14px] text-muted">
      Chargement des photographies aériennes…
    </div>
  ),
});

export default function AerialTimeMachineLoader(props: ComponentProps<typeof AerialTimeMachineType>) {
  return <AerialTimeMachine {...props} />;
}
