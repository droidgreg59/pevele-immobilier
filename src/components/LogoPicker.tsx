"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VIEW = 280; // côté du cadre de recadrage affiché (px)
const OUT = 512; // côté du logo final (px)
const MAX_ZOOM = 6;

export type LogoChange = { file: File; previewUrl: string };

/**
 * Sélecteur de logo avec recadrage carré (glisser pour déplacer, curseur ou
 * molette pour zoomer). Le fichier recadré (PNG 512×512) remplace celui choisi :
 * il est placé dans un <input type="file" name={name}> caché — donc envoyé avec
 * le formulaire parent — et renvoyé via `onChange` pour les écrans qui
 * construisent eux-mêmes leur FormData.
 */
export default function LogoPicker({
  currentUrl,
  initial,
  name = "logo",
  onChange,
}: {
  currentUrl: string | null;
  initial: string;
  name?: string;
  onChange?: (change: LogoChange) => void;
}) {
  const pickRef = useRef<HTMLInputElement>(null);
  const formInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function closeCropper() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (pickRef.current) pickRef.current.value = "";
  }

  function handleConfirm(file: File) {
    if (formInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      formInputRef.current.files = dt.files;
    }
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    onChange?.({ file, previewUrl });
    closeCropper();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        Logo de l&apos;agence
      </span>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-xl text-muted-2">
              {initial.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <label className="cursor-pointer rounded-full border border-line bg-white px-4 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface">
          {preview ? "Changer le logo" : "Ajouter un logo"}
          <input
            ref={pickRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setCropSrc(URL.createObjectURL(file));
            }}
          />
        </label>
      </div>
      <input ref={formInputRef} type="file" name={name} className="hidden" tabIndex={-1} />
      <span className="text-[12px] text-muted-2">
        JPEG, PNG ou WebP. Vous pourrez recadrer votre logo avant de l&apos;enregistrer.
      </span>

      {/* Portail : un ancêtre animé (transform) ferait de `fixed` un positionnement relatif à lui. */}
      {cropSrc
        ? createPortal(
            <CropDialog src={cropSrc} onCancel={closeCropper} onConfirm={handleConfirm} />,
            document.body
          )
        : null}
    </div>
  );
}

function CropDialog({
  src,
  onCancel,
  onConfirm,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const viewRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const live = useRef({ scale: 1, pos: { x: 0, y: 0 }, minScale: 1 });

  useEffect(() => {
    live.current.scale = scale;
    live.current.pos = pos;
  }, [scale, pos]);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const min = VIEW / Math.max(image.naturalWidth, image.naturalHeight);
      live.current.minScale = min;
      setScale(min);
      setPos({
        x: (VIEW - image.naturalWidth * min) / 2,
        y: (VIEW - image.naturalHeight * min) / 2,
      });
      setImg(image);
    };
    image.onerror = () => setFailed(true);
    image.src = src;
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Au moins 15 % de l'image doit rester dans le cadre : on ne la perd pas hors champ.
  function clampPos(x: number, y: number, s: number, image: HTMLImageElement) {
    const w = image.naturalWidth * s;
    const h = image.naturalHeight * s;
    return {
      x: Math.min(VIEW * 0.85, Math.max(VIEW * 0.15 - w, x)),
      y: Math.min(VIEW * 0.85, Math.max(VIEW * 0.15 - h, y)),
    };
  }

  function zoomTo(next: number, image: HTMLImageElement) {
    const { scale: s, pos: p, minScale } = live.current;
    const clamped = Math.min(minScale * MAX_ZOOM, Math.max(minScale, next));
    // Le point au centre du cadre reste au centre.
    const cx = (VIEW / 2 - p.x) / s;
    const cy = (VIEW / 2 - p.y) / s;
    setScale(clamped);
    setPos(clampPos(VIEW / 2 - cx * clamped, VIEW / 2 - cy * clamped, clamped, image));
  }

  useEffect(() => {
    const el = viewRef.current;
    if (!el || !img) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomTo(live.current.scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08), img);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  function confirm() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const k = OUT / VIEW;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      pos.x * k,
      pos.y * k,
      img.naturalWidth * scale * k,
      img.naturalHeight * scale * k
    );
    canvas.toBlob((blob) => {
      if (blob) onConfirm(new File([blob], "logo.png", { type: "image/png" }));
    }, "image/png");
  }

  const minScale = img ? VIEW / Math.max(img.naturalWidth, img.naturalHeight) : 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recadrer le logo"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/50 p-4"
    >
      <div className="flex w-full max-w-[360px] flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl">
        <div>
          <h2 className="m-0 font-display text-[22px] text-ink">Recadrer votre logo</h2>
          <p className="m-0 mt-1 text-[13px] text-muted">
            Faites glisser l&apos;image pour la placer, et zoomez pour ne garder que l&apos;essentiel.
          </p>
        </div>

        {failed ? (
          <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
            Impossible de lire cette image. Essayez un autre fichier.
          </p>
        ) : (
          <div
            ref={viewRef}
            className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl border border-line"
            style={{
              width: VIEW,
              height: VIEW,
              background:
                "repeating-conic-gradient(#f4f2ee 0% 25%, #ffffff 0% 50%) 50% / 20px 20px",
              cursor: dragging ? "grabbing" : "grab",
            }}
            onPointerDown={(e) => {
              if (!img) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
              setDragging(true);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || !img) return;
              setPos(clampPos(d.x + e.clientX - d.px, d.y + e.clientY - d.py, scale, img));
            }}
            onPointerUp={() => {
              drag.current = null;
              setDragging(false);
            }}
            onPointerCancel={() => {
              drag.current = null;
              setDragging(false);
            }}
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
                style={{
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                }}
              />
            ) : null}
          </div>
        )}

        <label className="flex items-center gap-3 text-[12px] font-medium text-muted">
          Zoom
          <input
            type="range"
            min={minScale}
            max={minScale * MAX_ZOOM}
            step={minScale / 100}
            value={scale}
            disabled={!img}
            onChange={(e) => img && zoomTo(Number(e.target.value), img)}
            className="flex-1"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line bg-white px-4 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!img}
            className="rounded-full bg-yellow px-5 py-2.5 text-[12.5px] font-semibold text-ink shadow-sm transition hover:brightness-95 disabled:opacity-60"
          >
            Valider le recadrage
          </button>
        </div>
      </div>
    </div>
  );
}
