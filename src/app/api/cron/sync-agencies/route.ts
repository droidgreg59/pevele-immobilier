import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncAllAgencyFeeds } from "@/lib/ac3-sync";
import { recordCronRun } from "@/lib/freshness";

export const maxDuration = 60;

/**
 * Resynchronise le flux XML (AC3/Immofacile) de toutes les agences qui en
 * ont configuré un — même effet que le bouton « Synchroniser maintenant »
 * sur /compte/agence, rejoué pour chaque agence. À appeler périodiquement
 * (ex. quotidien) par un ordonnanceur externe — voir CRON_SECRET dans
 * .env.example pour la configuration.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const results = await syncAllAgencyFeeds();
  const failed = results.filter((r) => "error" in r.result).length;
  // Signal « le job a tourné » — pas « les données sont fraîches » : une
  // agence individuelle peut échouer sans faire échouer la route (chaque
  // agence a déjà son propre xmlLastSyncError/xmlLastSuccessAt, agrégés par
  // getListingsFreshness). C'est CETTE fonction qui fait foi pour une
  // affirmation publique de fraîcheur, pas ce CronRun.
  await recordCronRun("sync-agencies", `${results.length} agence(s), ${failed} échec(s)`);
  return NextResponse.json({ success: true, results });
}
