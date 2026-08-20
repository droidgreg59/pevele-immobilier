"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Feuille modale mobile générique : poignée, glisser vers le bas pour
 * fermer, fond assombri cliquable. Utilisée pour la demande de visite sur
 * mobile (fiche annonce) et les filtres de recherche.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  function handlePointerDown(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }

  function handlePointerUp() {
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
    dragStartY.current = null;
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl border border-line bg-white shadow-lg"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? "transform 200ms ease-out" : "none",
        }}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-2 pb-1 pt-3 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>
        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          {title ? <span className="text-[16px] font-bold text-ink">{title}</span> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface"
          >
            <X className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
