import "server-only";
import { prisma } from "./prisma";
import { upsertImportedListing, retireStaleImportedListings } from "./listings";
import {
  MB_IMPORT_SOURCE,
  MB_ORIGIN,
  annonceIdsFromAgentPage,
  isMeilleursBiensAgentPage,
  parseMbProperty,
  propertyFromHtml,
} from "./site-meilleursbiens";

/**
 * Reprise quotidienne des annonces des mandataires MeilleursBiens qui l'ont
 * autorisée (case cochée à l'inscription → `repriseAutoriseeLe`, ou accord
 * reçu par l'exploitant) et dont le `siteWeb` est leur page MeilleursBiens.
 * Appelée par la route cron /api/cron/sync-agencies, à la suite des flux XML.
 */

// Agent identifié, sans camouflage : le site ne filtre pas les robots.
const USER_AGENT = "Mozilla/5.0 (compatible; PeveleImmobilier/1.0; +https://www.pevele-immobilier.fr)";
const PAUSE_MS = 500;

async function getHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${url} : HTTP ${res.status}`);
  return res.text();
}

export type SiteSyncResult =
  | { created: number; updated: number; removed: number; skipped: number; complete: boolean }
  | { error: string };

export async function syncMeilleursBiensAgent(agencyId: string, pageUrl: string): Promise<SiteSyncResult> {
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { verifStatut: true },
  });
  if (agency?.verifStatut !== "VERIFIEE") {
    return { error: "Compte non vérifié : aucune reprise automatique." };
  }

  try {
    const ids = annonceIdsFromAgentPage(await getHtml(pageUrl));
    // Page vide (panne, refonte du site) : surtout ne rien retirer.
    if (ids.length === 0) return { error: "Aucune annonce trouvée sur la page du mandataire." };

    // Annonces supprimées à la main (ex. sous compromis) : jamais reprises.
    const hidden = new Set(
      (
        await prisma.listing.findMany({
          where: { ownerId: agencyId, importSource: MB_IMPORT_SOURCE, hiddenByAdminAt: { not: null } },
          select: { externalRef: true },
        })
      ).map((l) => l.externalRef)
    );

    let complete = true;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const seen: string[] = [];
    for (const id of ids) {
      if (hidden.has(id)) continue;
      await new Promise((r) => setTimeout(r, PAUSE_MS));
      let html: string;
      try {
        html = await getHtml(`${MB_ORIGIN}/annonce/${id}`);
      } catch {
        complete = false;
        continue;
      }
      const property = propertyFromHtml(html);
      if (!property) {
        complete = false;
        continue;
      }
      const availability = /"availability":"([^"]+)"/.exec(html)?.[1] ?? null;
      const parsed = parseMbProperty(property, availability);
      if (!("listing" in parsed)) {
        skipped += 1;
        continue;
      }
      const r = await upsertImportedListing(agencyId, { ...parsed.listing, importSource: MB_IMPORT_SOURCE });
      seen.push(parsed.listing.externalRef);
      if (r.created) created += 1;
      else updated += 1;
    }

    // Une collecte partielle ne doit jamais retirer des annonces peut-être encore en ligne.
    const removed =
      complete && seen.length > 0
        ? (await retireStaleImportedListings(agencyId, MB_IMPORT_SOURCE, seen)).length
        : 0;
    return { created, updated, removed, skipped, complete };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec de la reprise." };
  }
}

export type AllSiteSyncResult = { agencyId: string; agencyNom: string; result: SiteSyncResult };

/** Tous les mandataires MeilleursBiens ayant autorisé la reprise de leur page. */
export async function syncAllMeilleursBiensAgents(): Promise<AllSiteSyncResult[]> {
  const agents = await prisma.user.findMany({
    where: { type: "AGENCE", repriseAutoriseeLe: { not: null }, siteWeb: { contains: "meilleursbiens.com/site/" } },
    select: { id: true, nom: true, entreprise: true, siteWeb: true },
  });
  const results: AllSiteSyncResult[] = [];
  for (const a of agents) {
    if (!isMeilleursBiensAgentPage(a.siteWeb)) continue;
    const result = await syncMeilleursBiensAgent(a.id, a.siteWeb!);
    results.push({ agencyId: a.id, agencyNom: a.entreprise ?? a.nom, result });
  }
  return results;
}
