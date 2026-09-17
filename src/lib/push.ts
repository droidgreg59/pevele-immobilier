import "server-only";
import webpush from "web-push";
import { prisma } from "./prisma";

/**
 * Notifications push (Web Push / VAPID) — même discipline que sendEmail
 * (src/lib/email.ts) : ne lève jamais d'exception, un échec d'envoi ne doit
 * jamais casser l'action métier qui l'a déclenché. Silencieux (avertissement
 * console) tant que les clés VAPID ne sont pas configurées.
 */

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:contact@pevele-immobilier.fr";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export type PushSubscriptionKeys = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscription(
  userId: string,
  sub: PushSubscriptionKeys
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function hasPushSubscription(userId: string): Promise<boolean> {
  const count = await prisma.pushSubscription.count({ where: { userId } });
  return count > 0;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Chemin (ex. "/compte/annonces/xyz") ouvert au clic sur la notification. */
  url?: string;
};

/** Envoie à tous les appareils abonnés de l'utilisateur ; purge les abonnements expirés/révoqués. */
export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  if (!publicKey || !privateKey) {
    console.warn(`[push] VAPID_PRIVATE_KEY manquant — notification non envoyée (${payload.title})`);
    return;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (e) {
        const statusCode = (e as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Abonnement expiré ou révoqué côté navigateur — nettoyage silencieux.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`[push] Échec d'envoi (${payload.title} → ${userId}) :`, e);
        }
      }
    })
  );
}
