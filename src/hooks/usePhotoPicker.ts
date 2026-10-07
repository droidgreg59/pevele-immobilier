"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPTED_PHOTO_TYPES, MAX_SOURCE_PHOTO_BYTES } from "@/lib/photo-constants";
import { compressImage } from "@/lib/compress-image";
import { stagePhotoAction } from "@/lib/photo-actions";

export type PhotoPick = {
  id: string;
  /** Aperçu local (object URL). */
  url: string;
  status: "uploading" | "done" | "error";
  /** Clé R2 en attente une fois l'envoi terminé (voir stagePhotoAction). */
  key?: string;
  error?: string;
};

/** Photos envoyées en parallèle — assez pour aller vite, sans saturer une connexion modeste. */
const CONCURRENCY = 3;

/**
 * Sélection multiple de photos (un dossier entier en une fois), puis envoi
 * automatique en arrière-plan : chaque photo est compressée dans le
 * navigateur et envoyée seule. Le formulaire ne transmet ensuite que les
 * clés (champs cachés `photoKeys`, rendus par PhotoDropzone).
 */
export function usePhotoPicker(maxPhotos: number) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoPick[]>([]);
  const [rejected, setRejected] = useState<string | null>(null);
  const queue = useRef<{ id: string; file: File }[]>([]);
  const running = useRef(0);
  const photosRef = useRef<PhotoPick[]>([]);
  photosRef.current = photos;

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  function update(id: string, patch: Partial<PhotoPick>) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function uploadOne(id: string, file: File) {
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("photo", compressed);
      const res = await stagePhotoAction(fd);
      if ("key" in res) update(id, { status: "done", key: res.key });
      else update(id, { status: "error", error: res.error });
    } catch {
      update(id, { status: "error", error: "Échec de l'envoi." });
    }
  }

  function pump() {
    while (running.current < CONCURRENCY && queue.current.length > 0) {
      const job = queue.current.shift()!;
      // Retirée entre-temps par l'utilisateur : on ne l'envoie pas.
      if (!photosRef.current.some((p) => p.id === job.id)) continue;
      running.current++;
      uploadOne(job.id, job.file).finally(() => {
        running.current--;
        pump();
      });
    }
  }

  function addFiles(incoming: FileList | File[]) {
    const all = Array.from(incoming);
    const accepted = all.filter(
      (f) => ACCEPTED_PHOTO_TYPES.includes(f.type) && f.size <= MAX_SOURCE_PHOTO_BYTES
    );
    const room = Math.max(maxPhotos - photosRef.current.length, 0);
    const kept = accepted.slice(0, room);
    const ignored = all.length - kept.length;
    setRejected(
      ignored > 0
        ? `${ignored} photo${ignored > 1 ? "s" : ""} non ajoutée${ignored > 1 ? "s" : ""} (format non pris en charge, fichier trop lourd ou nombre maximum de photos atteint).`
        : null
    );
    if (kept.length === 0) return;
    const picks = kept.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    const next = [...photosRef.current, ...picks.map(({ id, url }) => ({ id, url, status: "uploading" as const }))];
    photosRef.current = next;
    setPhotos(next);
    queue.current.push(...picks.map(({ id, file }) => ({ id, file })));
    pump();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      const next = prev.filter((p) => p.id !== id);
      photosRef.current = next;
      return next;
    });
  }

  const busy = photos.some((p) => p.status === "uploading");
  return { fileInputRef, photos, addFiles, removePhoto, busy, rejected };
}
