import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncAllAgencyFeeds } from "@/lib/ac3-sync";

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
  return NextResponse.json({ success: true, results });
}
