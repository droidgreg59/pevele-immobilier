/**
 * Clés R2 des photos « en attente » : chaque photo est d'abord envoyée seule
 * sous staging/<userId>/ (voir stagePhotoAction), puis rattachée à l'annonce
 * à l'enregistrement du formulaire. Fonctions pures, testées sans R2.
 */

export const STAGING_PREFIX = "staging";

const EXT = /^(jpg|png|webp)$/;

export function stagedPhotoKey(userId: string, uuid: string, ext: string): string {
  return `${STAGING_PREFIX}/${userId}/${uuid}.${ext}`;
}

/** Vrai si la clé est une photo en attente appartenant bien à cet utilisateur. */
export function isOwnStagedKey(key: string, userId: string): boolean {
  const m = /^staging\/([^/]+)\/([0-9a-f-]{36})\.([a-z]+)$/.exec(key);
  return Boolean(m && m[1] === userId && EXT.test(m[3]));
}

/**
 * Valide la liste des photos en attente soumises avec un formulaire : clés
 * appartenant à l'utilisateur, sans doublon, et total (photos déjà présentes
 * + nouvelles) dans la limite du compte. Renvoie un message d'erreur ou null.
 */
export function validateStagedKeys(
  keys: string[],
  userId: string,
  existingCount: number,
  maxPhotos: number
): string | null {
  if (keys.some((k) => !isOwnStagedKey(k, userId))) return "Photo invalide, merci de la renvoyer.";
  if (new Set(keys).size !== keys.length) return "Photo en double.";
  if (existingCount + keys.length > maxPhotos) return `Maximum ${maxPhotos} photos par annonce.`;
  return null;
}

/** Clé définitive d'une photo en attente, une fois rattachée à l'annonce. */
export function listingKeyFromStaged(stagedKey: string, listingId: string): string {
  const file = stagedKey.slice(stagedKey.lastIndexOf("/") + 1);
  return `listings/${listingId}/${file}`;
}
