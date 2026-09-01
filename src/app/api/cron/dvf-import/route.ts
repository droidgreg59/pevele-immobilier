import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runDvfImport } from "@/lib/dvf-import";

export const maxDuration = 60;

/**
 * Ré-importe les transactions DVF (mêmes données que `npm run dvf:import`).
 * À appeler périodiquement (ex. hebdomadaire) par un ordonnanceur externe —
 * voir CRON_SECRET dans .env.example pour la configuration.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const results = await runDvfImport();
    return NextResponse.json({ success: true, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l'import DVF.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
