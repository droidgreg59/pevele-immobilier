import "server-only";
import { prisma } from "./prisma";
import { upsertImportedListing, retireStaleImportedListings } from "./listings";
import type { Parsed4mListing } from "./site-4m";
import {
  MB_IMPORT_SOURCE,
  MB_ORIGIN,
  annonceIdsFromAgentPage,
  isMeilleursBiensAgentPage,
  parseMbProperty,
  propertyFromHtml,
} from "./site-meilleursbiens";
import {
  BSK_IMPORT_SOURCE,
  bskBiensPageUrl,
  bskListingUrls,
  bskRefFromUrl,
  isBskAgentPage,
  parseBskListing,
} from "./site-bsk";

/**
 * Reprise quotidienne des annonces des mandataires de réseau (MeilleursBiens,
 * BSK…) depuis leur page publique — ces réseaux ne fournissent pas de flux
 * XML à leurs mandataires. Seulement pour les comptes qui l'ont autorisée
 * (`repriseAutoriseeLe`, case cochée à l'inscription) et dont le `siteWeb`
 * est leur page sur le site du réseau. Appelée par la route cron
 * /api/cron/sync-agencies, à la suite des flux XML.
 */

type ParseResult = { listing: Parsed4mListing } | { externalRef: string; reason: string } | null;

type NetworkAdapter = {
  importSource: string;
  matches: (siteWeb: string | null) => boolean;
  /** URLs des fiches de l'agent, à partir de sa page. */
  listingUrls: (pageUrl: string, pageHtml: string) => Promise<string[]>;
  refFromUrl: (url: string) => string | null;
  /** null = page illisible (la collecte est alors incomplète). */
  parse: (html: string, url: string) => ParseResult;
};

const ADAPTERS: NetworkAdapter[] = [
  {
    importSource: MB_IMPORT_SOURCE,
    matches: isMeilleursBiensAgentPage,
    listingUrls: async (_url, html) => annonceIdsFromAgentPage(html).map((id) => `${MB_ORIGIN}/annonce/${id}`),
    refFromUrl: (url) => /\/annonce\/([0-9a-f-]{36})/.exec(url)?.[1] ?? null,
    parse: (html) => {
      const property = propertyFromHtml(html);
      if (!property) return null;
      return parseMbProperty(property, /"availability":"([^"]+)"/.exec(html)?.[1] ?? null);
    },
  },
  {
    importSource: BSK_IMPORT_SOURCE,
    matches: isBskAgentPage,
    // La page de l'agent n'affiche qu'une sélection : on y ajoute sa page « biens ».
    listingUrls: async (_url, html) => {
      const biens = bskBiensPageUrl(html);
      const more = biens ? bskListingUrls(await getHtml(biens)) : [];
      return [...new Set([...bskListingUrls(html), ...more])];
    },
    refFromUrl: bskRefFromUrl,
    parse: parseBskListing,
  },
];

// Agent identifié, sans camouflage : ces sites ne filtrent pas les robots.
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

export async function syncNetworkAgent(agencyId: string, pageUrl: string): Promise<SiteSyncResult> {
  const adapter = ADAPTERS.find((a) => a.matches(pageUrl));
  if (!adapter) return { error: "Site non pris en charge pour la reprise automatique." };

  const agency = await prisma.user.findUnique({ where: { id: agencyId }, select: { verifStatut: true } });
  if (agency?.verifStatut !== "VERIFIEE") return { error: "Compte non vérifié : aucune reprise automatique." };

  try {
    const urls = await adapter.listingUrls(pageUrl, await getHtml(pageUrl));
    // Page vide (panne, refonte du site) : surtout ne rien retirer.
    if (urls.length === 0) return { error: "Aucune annonce trouvée sur la page du mandataire." };

    // Annonces supprimées à la main (ex. sous compromis) : jamais reprises.
    const hidden = new Set(
      (
        await prisma.listing.findMany({
          where: { ownerId: agencyId, importSource: adapter.importSource, hiddenByAdminAt: { not: null } },
          select: { externalRef: true },
        })
      ).map((l) => l.externalRef)
    );

    let complete = true;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const seen: string[] = [];
    for (const url of urls) {
      const ref = adapter.refFromUrl(url);
      if (ref && hidden.has(ref)) continue;
      await new Promise((r) => setTimeout(r, PAUSE_MS));
      let parsed: ParseResult;
      try {
        parsed = adapter.parse(await getHtml(url), url);
      } catch {
        parsed = null;
      }
      if (!parsed) {
        complete = false;
        continue;
      }
      if (!("listing" in parsed)) {
        skipped += 1;
        continue;
      }
      const r = await upsertImportedListing(agencyId, { ...parsed.listing, importSource: adapter.importSource });
      seen.push(parsed.listing.externalRef);
      if (r.created) created += 1;
      else updated += 1;
    }

    // Une collecte partielle ne doit jamais retirer des annonces peut-être encore en ligne.
    const removed =
      complete && seen.length > 0
        ? (await retireStaleImportedListings(agencyId, adapter.importSource, seen)).length
        : 0;
    return { created, updated, removed, skipped, complete };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec de la reprise." };
  }
}

export type AllSiteSyncResult = { agencyId: string; agencyNom: string; result: SiteSyncResult };

/** Tous les mandataires de réseau ayant autorisé la reprise de leur page. */
export async function syncAllNetworkAgents(): Promise<AllSiteSyncResult[]> {
  const agents = await prisma.user.findMany({
    where: { type: "AGENCE", repriseAutoriseeLe: { not: null }, siteWeb: { not: null } },
    select: { id: true, nom: true, entreprise: true, siteWeb: true },
  });
  const results: AllSiteSyncResult[] = [];
  for (const a of agents) {
    if (!ADAPTERS.some((ad) => ad.matches(a.siteWeb))) continue;
    const result = await syncNetworkAgent(a.id, a.siteWeb!);
    results.push({ agencyId: a.id, agencyNom: a.entreprise ?? a.nom, result });
  }
  return results;
}
