import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runDueSocialPosts } from "@/lib/social";

export const maxDuration = 60;

/**
 * Publication réseaux (Vercel Cron toutes les 15 minutes, offre Pro) : publie
 * les SocialPost VALIDEE dont l'heure est passée, et termine celles restées
 * EN_COURS (vidéo Instagram encore en traitement).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const results = await runDueSocialPosts();
  return NextResponse.json({ success: true, results });
}
