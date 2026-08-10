"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPTED_PHOTO_TYPES } from "@/lib/photo-constants";

export type PhotoPick = { file: File; url: string };

export function usePhotoPicker(maxPhotos: number) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoPick[]>([]);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncFileInput(files: File[]) {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  }

  function addFiles(incoming: FileList | File[]) {
    const accepted = Array.from(incoming).filter((f) =>
      ACCEPTED_PHOTO_TYPES.includes(f.type)
    );
    if (accepted.length === 0) return;
    setPhotos((prev) => {
      const next = [
        ...prev,
        ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ].slice(0, Math.max(maxPhotos, 0));
      syncFileInput(next.map((p) => p.file));
      return next;
    });
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      const next = prev.filter((_, i) => i !== index);
      syncFileInput(next.map((p) => p.file));
      return next;
    });
  }

  return { fileInputRef, photos, addFiles, removePhoto };
}
