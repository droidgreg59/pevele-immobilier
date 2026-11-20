import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncAllNetworkAgents } from "@/lib/network-site-sync";
import { recordCronRun } from "@/lib/freshness";

export const maxDuration = 60;

/**
 * Reprend chaque matin les annonces des mandataires de réseau (pages
 * MeilleursBiens, BSK, SAFTI) qui l'ont autorisé — voir
 * src/lib/network-site-sync.ts. Séparée de /api/cron/sync-agencies (flux
 * XML) pour que chacune garde sa propre limite de durée.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const results = await syncAllNetworkAgents();
  const failed = results.filter((r) => "error" in r.result).length;
  await recordCronRun("sync-networks", `${results.length} mandataire(s), ${failed} échec(s)`);
  return NextResponse.json({ success: true, results });
}
