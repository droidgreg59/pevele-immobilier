"use client";

import { useState, type ReactNode } from "react";

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
  const current = photos[active];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-[360px] overflow-hidden border-[2.5px] border-ink">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,#EDEAE1_0_14px,#E4E0D3_14px_28px)] px-4 text-center font-mono text-[10.5px] text-muted-2">
            Aucune photo pour le moment
          </div>
        )}
        {overlay}
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setActive(i)}
              className="h-16 w-16 shrink-0 overflow-hidden border-2"
              style={{
                borderColor: i === active ? "var(--pvl-blue)" : "var(--pvl-ink)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
