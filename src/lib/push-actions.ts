"use server";

import { getSession } from "./session";
import { savePushSubscription, deletePushSubscription, hasPushSubscription } from "./push";
import type { PushSubscriptionKeys } from "./push";

export async function subscribePushAction(
  subscription: PushSubscriptionKeys
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Non connecté." };
  await savePushSubscription(session.userId, subscription);
  return { success: true };
}

export async function unsubscribePushAction(
  endpoint: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Non connecté." };
  await deletePushSubscription(endpoint);
  return { success: true };
}

/** Utilisé au chargement du bouton pour refléter l'état réel (un autre appareil a pu se désabonner). */
export async function getPushOptInStatusAction(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return hasPushSubscription(session.userId);
}
