import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

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

export function validatePhotoFiles(files: File[]): string | null {
  if (files.length > MAX_PHOTOS) {
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
