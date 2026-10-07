"use server";

import { getSession } from "./session";
import { stagePhotoFile, validatePhotoFile } from "./photo-upload";

export type StagePhotoResult = { key: string } | { error: string };

/**
 * Reçoit UNE photo (déjà compressée dans le navigateur) et la met en attente
 * sous staging/<userId>/. Les photos d'une annonce partent chacune dans sa
 * propre requête : un envoi groupé dépassait la limite de 4,5 Mo des
 * fonctions Vercel (413). Le formulaire de l'annonce ne transmet ensuite que
 * les clés, rattachées par commitStagedPhotos.
 */
export async function stagePhotoAction(formData: FormData): Promise<StagePhotoResult> {
  const session = await getSession();
  if (!session) return { error: "Session expirée, reconnectez-vous." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Photo manquante." };
  const error = validatePhotoFile(file);
  if (error) return { error };

  try {
    return { key: await stagePhotoFile(session.userId, file) };
  } catch {
    return { error: "Échec de l'envoi de la photo, réessayez." };
  }
}
