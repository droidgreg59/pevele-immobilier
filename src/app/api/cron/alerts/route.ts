import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runSavedSearchAlerts, runPriceDropAlerts } from "@/lib/alerts";

export const maxDuration = 60;

/**
 * Envoie les alertes email aux particuliers :
 *  - nouveaux biens correspondant à une recherche sauvegardée ;
 *  - baisse de prix sur un favori marqué « surveiller le prix ».
 * À appeler périodiquement (ex. quotidien) par un ordonnanceur externe — voir
 * CRON_SECRET dans .env.example et la section « Tâches planifiées » du README.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const [savedSearches, priceDrops] = await Promise.all([
    runSavedSearchAlerts(),
    runPriceDropAlerts(),
  ]);

  return NextResponse.json({
    success: true,
    savedSearches: {
      total: savedSearches.length,
      withMatches: savedSearches.filter((r) => r.matched > 0).length,
      emailsSent: savedSearches.filter((r) => r.emailSent).length,
    },
    priceDrops: {
      watched: priceDrops.length,
      notified: priceDrops.filter((r) => r.action === "notified").length,
      emailsSent: priceDrops.filter((r) => r.emailSent).length,
    },
  });
}
