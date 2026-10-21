import "server-only";
import sharp from "sharp";
import { prisma } from "./prisma";
import { imageStats, isFloorPlan } from "./photo-classify";

/** Télécharge une image et dit si c'est un plan. Ne lève jamais (false en cas d'échec). */
export async function detectFloorPlan(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    const data = await sharp(buf).resize(96, 96, { fit: "inside" }).removeAlpha().raw().toBuffer();
    return isFloorPlan(imageStats(data));
  } catch {
    return false;
  }
}

/**
 * Marque comme plans les photos d'une annonce qui en sont (analyse de
 * l'image). Best-effort : une photo non analysée reste une photo ordinaire.
 */
export async function classifyListingPhotos(listingId: string, urls?: string[]): Promise<number> {
  const photos = await prisma.listingPhoto.findMany({
    where: { listingId, ...(urls ? { url: { in: urls } } : {}) },
    select: { id: true, url: true, isPlan: true },
  });
  let plans = 0;
  for (let i = 0; i < photos.length; i += 4) {
    const batch = photos.slice(i, i + 4);
    const results = await Promise.all(batch.map((p) => detectFloorPlan(p.url)));
    for (let j = 0; j < batch.length; j++) {
      if (results[j]) plans++;
      if (results[j] !== batch[j].isPlan) {
        await prisma.listingPhoto.update({ where: { id: batch[j].id }, data: { isPlan: results[j] } });
      }
    }
  }
  return plans;
}
