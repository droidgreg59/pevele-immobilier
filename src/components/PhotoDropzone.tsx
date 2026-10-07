"use client";

import { useEffect } from "react";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";

export default function PhotoDropzone({
  maxPhotos,
  maxNewPhotos = maxPhotos,
  onBusyChange,
}: {
  /** Limite totale de photos de l'annonce (selon le type de compte, voir maxPhotosFor). */
  maxPhotos: number;
  /** Nombre de photos qu'il reste possible d'ajouter (maxPhotos - photos existantes). */
  maxNewPhotos?: number;
  /** Prévenu quand des photos sont encore en cours d'envoi (pour bloquer la validation). */
  onBusyChange?: (busy: boolean) => void;
}) {
  const { fileInputRef, photos, addFiles, removePhoto, busy, rejected } = usePhotoPicker(maxNewPhotos);
  const done = photos.filter((p) => p.status === "done").length;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  if (maxNewPhotos <= 0) {
    return (
      <p className="m-0 text-[12px] text-muted-2">
        Nombre maximum de photos atteint ({maxPhotos}). Retirez-en une pour
        en ajouter une autre.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Pas d'attribut name : les fichiers ne partent jamais avec le formulaire,
          seulement leurs clés une fois envoyées une par une. */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
        }}
      />
      {photos.map((p) =>
        p.status === "done" && p.key ? <input key={p.id} type="hidden" name="photoKeys" value={p.key} /> : null
      )}
      {busy ? <input type="hidden" name="photosPending" value="1" /> : null}
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
          Glissez vos photos ici, ou cliquez pour les choisir — vous pouvez toutes les sélectionner d&apos;un coup.
          <br />
          <b className="text-ink">
            JPEG, PNG ou WebP — jusqu&apos;à {maxNewPhotos} photo{maxNewPhotos > 1 ? "s" : ""}.
          </b>
        </span>
      </div>

      {photos.length > 0 ? (
        <span className="text-[12.5px] font-medium text-muted" aria-live="polite">
          {busy ? `Envoi des photos… ${done}/${photos.length}` : `${done} photo${done > 1 ? "s" : ""} prête${done > 1 ? "s" : ""}.`}
        </span>
      ) : null}
      {rejected ? <span className="text-[12.5px] text-muted">{rejected}</span> : null}

      {photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative h-20 w-20 overflow-hidden rounded-xl border"
              style={{ borderColor: p.status === "error" ? "#c0392b" : "var(--pvl-line)" }}
              title={p.error}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="h-full w-full object-cover"
                style={{ opacity: p.status === "done" ? 1 : 0.45 }}
              />
              {p.status === "uploading" ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-blue" />
                </span>
              ) : null}
              {p.status === "error" ? (
                <span className="absolute inset-x-0 bottom-0 bg-[#c0392b] px-1 py-0.5 text-center text-[10px] font-semibold text-white">
                  Échec
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
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
