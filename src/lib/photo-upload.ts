import "server-only";
import { mkdir, writeFile, rm, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { MAX_PHOTOS, MAX_PHOTO_BYTES } from "./photo-constants";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function pickPhotoFiles(formData: FormData): File[] {
  return formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export function validatePhotoFiles(files: File[], existingCount = 0): string | null {
  if (existingCount + files.length > MAX_PHOTOS) {
    return `Maximum ${MAX_PHOTOS} photos par annonce.`;
  }
  for (const file of files) {
    if (!EXT_BY_MIME[file.type]) {
      return "Les photos doivent être au format JPEG, PNG ou WebP.";
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return "Chaque photo doit faire moins de 5 Mo.";
    }
  }
  return null;
}

/**
 * Écrit les fichiers sur disque sous public/uploads/listings/{listingId}/ et
 * renvoie leurs URLs publiques. Stockage local uniquement pour l'instant —
 * à remplacer par un stockage objet (S3, R2...) avant un déploiement sur une
 * plateforme serverless.
 */
export async function savePhotoFiles(
  listingId: string,
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return [];

  const dir = join(process.cwd(), "public", "uploads", "listings", listingId);
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const ext = EXT_BY_MIME[file.type];
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
    urls.push(`/uploads/listings/${listingId}/${filename}`);
  }
  return urls;
}

/** Supprime tous les fichiers d'une annonce (best-effort, ne lève pas si absent). */
export async function deleteListingUploadDir(listingId: string): Promise<void> {
  const dir = join(process.cwd(), "public", "uploads", "listings", listingId);
  await rm(dir, { recursive: true, force: true });
}

/** Supprime des fichiers photo individuels par leur URL publique (best-effort). */
export async function deletePhotoFilesByUrl(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map(async (url) => {
      if (!url.startsWith("/uploads/listings/")) return;
      try {
        await unlink(join(process.cwd(), "public", url));
      } catch {
        // fichier déjà absent — sans conséquence
      }
    })
  );
}
