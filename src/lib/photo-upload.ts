import "server-only";
import { randomUUID } from "node:crypto";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { r2Client, r2Bucket, r2PublicUrl } from "./r2";
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

async function putObject(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({ Bucket: r2Bucket, Key: key, Body: buffer, ContentType: contentType })
  );
  return `${r2PublicUrl}/${key}`;
}

/**
 * Envoie les fichiers sur R2 sous listings/{listingId}/ et renvoie leurs
 * URLs publiques (domaine public R2, cf. src/lib/r2.ts).
 */
export async function savePhotoFiles(
  listingId: string,
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return [];

  const urls: string[] = [];
  for (const file of files) {
    const ext = EXT_BY_MIME[file.type];
    const key = `listings/${listingId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    urls.push(await putObject(key, buffer, file.type));
  }
  return urls;
}

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Télécharge des photos depuis des URLs distantes (flux XML d'agence) et les
 * envoie sur R2 sous listings/{listingId}/, comme savePhotoFiles. Les URLs
 * qui échouent ou ne renvoient pas une image reconnue sont ignorées
 * (best-effort — un flux agence peut contenir des liens morts).
 */
export async function saveRemotePhotos(
  listingId: string,
  urls: string[]
): Promise<string[]> {
  if (urls.length === 0) return [];

  const saved: string[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
      const ext =
        EXT_BY_CONTENT_TYPE[contentType] ??
        (/\.(jpe?g|png|webp)$/i.exec(url)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "jpg");
      const key = `listings/${listingId}/${randomUUID()}.${ext}`;
      const buffer = Buffer.from(await res.arrayBuffer());
      saved.push(await putObject(key, buffer, contentType || "image/jpeg"));
    } catch {
      // URL injoignable — ignorée, sans bloquer l'import du reste
    }
  }
  return saved;
}

/** URL publique R2 -> clé objet, ou null si l'URL n'appartient pas au bucket. */
function keyFromUrl(url: string): string | null {
  if (!r2PublicUrl || !url.startsWith(`${r2PublicUrl}/`)) return null;
  return url.slice(r2PublicUrl.length + 1);
}

/** Supprime tous les objets d'une annonce (best-effort, ne lève pas si absent). */
export async function deleteListingUploadDir(listingId: string): Promise<void> {
  try {
    const prefix = `listings/${listingId}/`;
    const list = await r2Client.send(
      new ListObjectsV2Command({ Bucket: r2Bucket, Prefix: prefix })
    );
    const objects = (list.Contents ?? [])
      .map((o) => o.Key)
      .filter((key): key is string => Boolean(key))
      .map((Key) => ({ Key }));
    if (objects.length === 0) return;
    await r2Client.send(new DeleteObjectsCommand({ Bucket: r2Bucket, Delete: { Objects: objects } }));
  } catch {
    // best-effort — un échec de nettoyage ne doit pas bloquer l'appelant
  }
}

/** Supprime des objets photo individuels par leur URL publique (best-effort). */
export async function deletePhotoFilesByUrl(urls: string[]): Promise<void> {
  const objects = urls
    .map(keyFromUrl)
    .filter((key): key is string => key !== null)
    .map((Key) => ({ Key }));
  if (objects.length === 0) return;
  try {
    await r2Client.send(new DeleteObjectsCommand({ Bucket: r2Bucket, Delete: { Objects: objects } }));
  } catch {
    // best-effort
  }
}

export function pickLogoFile(formData: FormData): File | null {
  const entry = formData.get("logo");
  return entry instanceof File && entry.size > 0 ? entry : null;
}

export function validateLogoFile(file: File): string | null {
  if (!EXT_BY_MIME[file.type]) {
    return "Le logo doit être au format JPEG, PNG ou WebP.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Le logo doit faire moins de 5 Mo.";
  }
  return null;
}

/** Envoie le logo sur R2 sous logos/ et renvoie son URL publique. */
export async function saveLogoFile(userId: string, file: File): Promise<string> {
  const ext = EXT_BY_MIME[file.type];
  const key = `logos/${userId}-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  return putObject(key, buffer, file.type);
}

/** Supprime un objet logo par son URL publique (best-effort). */
export async function deleteLogoFile(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const key = keyFromUrl(url);
  if (!key || !key.startsWith("logos/")) return;
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }));
  } catch {
    // fichier déjà absent ou erreur réseau — sans conséquence
  }
}
