import { PHOTO_JPEG_QUALITY, PHOTO_MAX_DIMENSION } from "./photo-constants";

/**
 * Réduit une photo dans le navigateur avant envoi : plus grand côté ramené à
 * PHOTO_MAX_DIMENSION, réencodage JPEG (fond blanc pour la transparence PNG),
 * orientation EXIF appliquée. Une photo d'appareil de 3 à 10 Mo passe à
 * quelques centaines de Ko. Si le navigateur ne sait pas décoder l'image,
 * le fichier d'origine est renvoyé tel quel (le serveur vérifiera sa taille).
 */
export async function compressImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, PHOTO_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY)
  );
  if (!blob) return file;
  // Déjà plus léger en JPEG d'origine (petite image) : on garde l'original.
  if (file.type === "image/jpeg" && blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
