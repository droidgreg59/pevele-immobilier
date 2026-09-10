import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runWeeklyDigest } from "@/lib/digest";

export const maxDuration = 60;

/**
 * Digest hebdomadaire du marché de la Pévèle — envoyé aux comptes qui l'ont
 * activé dans /compte. À appeler une fois par semaine (voir `vercel.json` :
 * lundi 08:00 UTC) via l'ordonnanceur, avec `CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await runWeeklyDigest();
  return NextResponse.json({ success: true, ...result });
}
