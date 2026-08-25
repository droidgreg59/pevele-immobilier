"use client";

import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { MAX_PHOTOS } from "@/lib/photo-constants";

export default function PhotoDropzone({
  maxNewPhotos = MAX_PHOTOS,
}: {
  /** Nombre de photos qu'il reste possible d'ajouter (MAX_PHOTOS - photos existantes). */
  maxNewPhotos?: number;
}) {
  const { fileInputRef, photos, addFiles, removePhoto } = usePhotoPicker(maxNewPhotos);

  if (maxNewPhotos <= 0) {
    return (
      <p className="m-0 text-[12px] text-muted-2">
        Nombre maximum de photos atteint ({MAX_PHOTOS}). Retirez-en une pour
        en ajouter une autre.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        name="photos"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer items-center justify-center gap-3.5 rounded-2xl border border-dashed border-line bg-surface p-7 transition hover:border-blue"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-sans text-xl font-semibold text-blue shadow-sm">
          ↑
        </span>
        <span className="font-sans text-[14px] leading-[1.5] text-muted">
          Glissez vos photos ici, ou cliquez pour les choisir.
          <br />
          <b className="text-ink">
            JPEG, PNG ou WebP, 5 Mo max chacune — {maxNewPhotos} de plus au maximum.
          </b>
        </span>
      </div>

      {photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div
              key={p.url}
              className="relative h-20 w-20 overflow-hidden rounded-xl border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Retirer cette photo"
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] leading-none text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
