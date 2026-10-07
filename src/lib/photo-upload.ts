import "server-only";
import { randomUUID } from "node:crypto";
import {
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { r2Client, r2Bucket, r2PublicUrl } from "./r2";
import { MAX_PHOTO_BYTES } from "./photo-constants";
import { listingKeyFromStaged, stagedPhotoKey } from "./photo-keys";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Vérifie une photo envoyée seule (déjà compressée dans le navigateur). */
export function validatePhotoFile(file: File): string | null {
  if (!EXT_BY_MIME[file.type]) return "Les photos doivent être au format JPEG, PNG ou WebP.";
  if (file.size > MAX_PHOTO_BYTES) return "Photo trop lourde, même après compression.";
  return null;
}

async function putObject(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({ Bucket: r2Bucket, Key: key, Body: buffer, ContentType: contentType })
  );
  return `${r2PublicUrl}/${key}`;
}

/** Envoie une photo seule sous staging/<userId>/ et renvoie sa clé. */
export async function stagePhotoFile(userId: string, file: File): Promise<string> {
  const key = stagedPhotoKey(userId, randomUUID(), EXT_BY_MIME[file.type]);
  await putObject(key, Buffer.from(await file.arrayBuffer()), file.type);
  return key;
}

/**
 * Rattache des photos en attente (clés déjà validées par validateStagedKeys)
 * à une annonce : copie sous listings/<listingId>/ dans l'ordre reçu, puis
 * supprime les originaux en attente. Renvoie les URLs publiques.
 */
export async function commitStagedPhotos(listingId: string, stagedKeys: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const key of stagedKeys) {
    const dest = listingKeyFromStaged(key, listingId);
    await r2Client.send(
      new CopyObjectCommand({ Bucket: r2Bucket, Key: dest, CopySource: `${r2Bucket}/${key}` })
    );
    urls.push(`${r2PublicUrl}/${dest}`);
  }
  if (stagedKeys.length > 0) {
    try {
      await r2Client.send(
        new DeleteObjectsCommand({ Bucket: r2Bucket, Delete: { Objects: stagedKeys.map((Key) => ({ Key })) } })
      );
    } catch {
      // best-effort — une copie en attente oubliée ne gêne pas l'annonce
    }
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
 * envoie sur R2 sous listings/{listingId}/, comme commitStagedPhotos. Les URLs
 * qui échouent ou ne renvoient pas une image reconnue sont ignorées
 * (best-effort — un flux agence peut contenir des liens morts).
 */
export async function saveRemotePhotos(
  listingId: string,
  urls: string[]
): Promise<string[]> {
  if (urls.length === 0) return [];

  // Par lots de 4 (l'ordre du flux est conservé) : séquentiel, une grosse
  // annonce suffisait à elle seule à frôler la limite de durée de la fonction.
  const CONCURRENCY = 4;
  const saved: string[] = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      urls.slice(i, i + CONCURRENCY).map(async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
          const ext =
            EXT_BY_CONTENT_TYPE[contentType] ??
            (/\.(jpe?g|png|webp)$/i.exec(url)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "jpg");
          const key = `listings/${listingId}/${randomUUID()}.${ext}`;
          const buffer = Buffer.from(await res.arrayBuffer());
          return await putObject(key, buffer, contentType || "image/jpeg");
        } catch {
          // URL injoignable — ignorée, sans bloquer l'import du reste
          return null;
        }
      })
    );
    for (const u of batch) if (u) saved.push(u);
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
