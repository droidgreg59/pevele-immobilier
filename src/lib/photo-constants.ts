/** Nombre maximum de photos par annonce, selon le type de compte du propriétaire. */
export const MAX_PHOTOS_PARTICULIER = 8;
export const MAX_PHOTOS_AGENCE = 15;

export function maxPhotosFor(accountType: string | null | undefined): number {
  return accountType === "AGENCE" ? MAX_PHOTOS_AGENCE : MAX_PHOTOS_PARTICULIER;
}

/**
 * Taille maximale d'un fichier choisi par l'utilisateur, AVANT compression
 * dans le navigateur (une photo d'appareil peut dépasser 10 Mo).
 */
export const MAX_SOURCE_PHOTO_BYTES = 30 * 1024 * 1024;

/**
 * Taille maximale d'une photo envoyée au serveur, APRÈS compression — doit
 * rester sous la limite de corps de requête des fonctions Vercel (4,5 Mo,
 * erreur 413 FUNCTION_PAYLOAD_TOO_LARGE au-delà). Chaque photo part dans sa
 * propre requête (voir stagePhotoAction), jamais toutes ensemble.
 */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/** Plus grand côté d'une photo après compression dans le navigateur. */
export const PHOTO_MAX_DIMENSION = 2000;
export const PHOTO_JPEG_QUALITY = 0.82;

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
