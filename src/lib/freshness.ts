import "server-only";
import { prisma } from "./prisma";

/**
 * Enregistre l'horodatage du dernier passage réussi d'une tâche cron — voir
 * le modèle `CronRun`. Appelé en fin de traitement par les routes cron dont
 * la fraîcheur doit un jour être affichée publiquement (DVF, snapshot des
 * annonces). `meta` est un résumé texte libre (ex. nombre de lignes traitées),
 * pas structuré : usage diagnostique, pas d'exploitation programmatique prévue.
 */
export async function recordCronRun(job: string, meta?: string): Promise<void> {
  await prisma.cronRun.upsert({
    where: { job },
    create: { job, meta },
    update: { ranAt: new Date(), meta },
  });
}

/** Dernier passage réussi d'une tâche cron, ou null si elle n'a jamais tourné. */
export async function getCronLastRun(job: string): Promise<Date | null> {
  const row = await prisma.cronRun.findUnique({ where: { job }, select: { ranAt: true } });
  return row?.ranAt ?? null;
}
