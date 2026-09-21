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

export type ListingsFreshness = {
  /**
   * Synchro RÉUSSIE la plus ancienne parmi les agences actives (xmlImportUrl
   * configuré) — donc la moins fraîche du lot, pour ne jamais afficher une
   * date plus optimiste que la réalité. Null si le portail n'a aucune agence
   * active, ou si l'une d'elles n'a JAMAIS réussi ne serait-ce qu'une fois
   * (dans ce cas on ne peut rien affirmer honnêtement au niveau du site).
   * Ne couvre que les annonces synchronisées automatiquement : une annonce
   * déposée manuellement (particulier, ou agence sans flux XML) n'a pas de
   * notion de « synchro » — elle reflète toujours exactement ce que son
   * auteur a saisi, sans décalage possible.
   */
  oldestSuccessfulSyncAt: Date | null;
  /** Nombre d'agences actives dont la dernière tentative est actuellement en échec — signal secondaire, pas encore affiché publiquement. */
  agenciesWithFailingSync: number;
};

export async function getListingsFreshness(): Promise<ListingsFreshness> {
  const agencies = await prisma.user.findMany({
    where: { type: "AGENCE", xmlImportUrl: { not: null } },
    select: { xmlLastSuccessAt: true, xmlLastSyncError: true },
  });

  const successDates = agencies
    .map((a) => a.xmlLastSuccessAt)
    .filter((d): d is Date => d !== null);

  const oldestSuccessfulSyncAt =
    agencies.length > 0 && successDates.length === agencies.length
      ? successDates.reduce((oldest, d) => (d < oldest ? d : oldest), successDates[0])
      : null;

  return {
    oldestSuccessfulSyncAt,
    agenciesWithFailingSync: agencies.filter((a) => a.xmlLastSyncError !== null).length,
  };
}
