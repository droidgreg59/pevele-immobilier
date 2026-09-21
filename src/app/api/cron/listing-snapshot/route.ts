import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runListingSnapshot } from "@/lib/listing-snapshot";
import { recordCronRun } from "@/lib/freshness";

export const maxDuration = 60;

/**
 * Instantané quotidien du stock d'annonces actives par commune — fondation
 * de l'historisation (durée d'exposition, évolution du stock, etc., voir le
 * modèle `ListingSnapshot`). À appeler après le cron de synchro des flux
 * agence (sync-agencies) pour refléter le stock du jour, pas celui de la
 * veille — voir vercel.json pour l'ordonnancement.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { rows, sourceRows } = await runListingSnapshot();
  await recordCronRun("listing-snapshot", `${rows} lignes, ${sourceRows} sources`);
  return NextResponse.json({ success: true, rows, sourceRows });
}
