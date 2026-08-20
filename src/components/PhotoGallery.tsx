"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";

export default function PhotoGallery({
  photos,
  alt,
  overlay,
}: {
  photos: { url: string }[];
  alt: string;
  overlay?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const current = photos[active];

  function next() {
    setActive((a) => (a + 1) % photos.length);
  }

  function prev() {
    setActive((a) => (a - 1 + photos.length) % photos.length);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-[360px] overflow-hidden rounded-2xl border border-line bg-surface">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={alt}
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0 h-full w-full cursor-zoom-in object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[12px] text-muted-2">
            Aucune photo pour le moment
          </div>
        )}
        {overlay}
        {photos.length > 1 ? (
          <span
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm"
            style={{ background: "var(--pvl-overlay)" }}
          >
            <Images className="h-3.5 w-3.5" strokeWidth={1.75} />
            {photos.length} photos
          </span>
        ) : null}
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setActive(i)}
              className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition"
              style={{
                borderColor: i === active ? "var(--pvl-blue)" : "transparent",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen && current ? (
        <div
          className="animate-fade-up fixed inset-0 z-[70] flex items-center justify-center bg-ink/95 px-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] object-contain"
          />

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Photo précédente"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Photo suivante"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <span className="absolute bottom-6 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-white">
                {active + 1} / {photos.length}
              </span>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
