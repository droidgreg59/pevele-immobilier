import "server-only";
import { prisma } from "./prisma";

/**
 * Journalisation légère des évènements d'entonnoir produit — appelée depuis
 * les Server Actions aux étapes clés du parcours (inscription, dépôt
 * d'annonce, demande de visite, inscription portes ouvertes…). Lue par
 * `/admin/stats`.
 *
 * Règle : l'observabilité ne casse jamais un parcours. Toute erreur d'écriture
 * est avalée. Pas de donnée personnelle dans `meta` (identifiants et libellés
 * courts uniquement).
 *
 * Ceci mesure le produit ; l'audience (pages vues, référents, Web Vitals) est
 * couverte par Cloudflare Web Analytics (voir `src/app/layout.tsx`), et les
 * exceptions par `src/lib/report-error.ts`.
 */
export type EventName =
  | "signup_completed"
  | "listing_submitted"
  | "listing_published"
  | "visit_requested"
  | "estimation_requested"
  | "devis_requested"
  | "open_house_registered"
  | "saved_search_created"
  | "estimate_lead"
  | "favorite_added"
  | "review_submitted"
  | "mandate_created"
  | "agency_verification_submitted";

type LogEventData = {
  userId?: string | null;
  path?: string | null;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

export async function logEvent(name: EventName, data: LogEventData = {}): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        name,
        userId: data.userId ?? null,
        path: data.path ?? null,
        meta: data.meta ? JSON.stringify(data.meta).slice(0, 2000) : null,
      },
    });
  } catch {
    // silencieux — un incident d'observabilité ne doit jamais interrompre l'utilisateur.
  }
}
