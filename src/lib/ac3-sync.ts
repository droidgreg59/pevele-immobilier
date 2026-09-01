import "server-only";
import { prisma } from "./prisma";
import { fetchAc3Feed, parseAc3Feed } from "./ac3-import";
import { upsertImportedListing } from "./listings";
import { recordXmlSyncResult } from "./agencies";

/**
 * Synchronise le flux XML d'une agence — logique partagée entre l'action
 * manuelle (« Synchroniser maintenant » sur /compte/agence) et la route
 * cron `/api/cron/sync-agencies` qui la rejoue pour toutes les agences.
 */
export async function syncAgencyFeed(
  agencyId: string,
  xmlImportUrl: string
): Promise<{ created: number; updated: number; skipped: number } | { error: string }> {
  try {
    const xml = await fetchAc3Feed(xmlImportUrl);
    const { imported, skipped } = parseAc3Feed(xml);

    let created = 0;
    let updated = 0;
    for (const bien of imported) {
      const { created: wasCreated } = await upsertImportedListing(agencyId, {
        ...bien,
        importSource: "AC3",
      });
      if (wasCreated) created += 1;
      else updated += 1;
    }

    await recordXmlSyncResult(agencyId, { count: imported.length });
    return { created, updated, skipped: skipped.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de la synchronisation.";
    await recordXmlSyncResult(agencyId, { error: message });
    return { error: message };
  }
}

export type AllAgenciesSyncResult = {
  agencyId: string;
  agencyNom: string;
  result: Awaited<ReturnType<typeof syncAgencyFeed>>;
};

/** Rejoue syncAgencyFeed pour toutes les agences ayant configuré un flux XML. */
export async function syncAllAgencyFeeds(): Promise<AllAgenciesSyncResult[]> {
  const agencies = await prisma.user.findMany({
    where: { type: "AGENCE", xmlImportUrl: { not: null } },
    select: { id: true, nom: true, entreprise: true, xmlImportUrl: true },
  });

  const results: AllAgenciesSyncResult[] = [];
  for (const agency of agencies) {
    if (!agency.xmlImportUrl) continue;
    const result = await syncAgencyFeed(agency.id, agency.xmlImportUrl);
    results.push({ agencyId: agency.id, agencyNom: agency.entreprise ?? agency.nom, result });
  }
  return results;
}
