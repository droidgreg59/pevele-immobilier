"use client";

import { useEffect, useState } from "react";
import { subscribePushAction, unsubscribePushAction } from "@/lib/push-actions";

/** Base64 URL-safe (format VAPID) -> Uint8Array attendu par pushManager.subscribe. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type Status = "loading" | "unsupported" | "subscribed" | "unsubscribed" | "denied";

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (!cancelled) setStatus(existing ? "subscribed" : "unsubscribed");
    }
    check().catch(() => setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("unsupported");
      return;
    }
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Souscription incomplète");
      }
      await subscribePushAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("subscribed");
    } catch {
      setStatus("unsubscribed");
    } finally {
      setPending(false);
    }
  }

  async function unsubscribe() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await unsubscribePushAction(endpoint);
      }
      setStatus("unsubscribed");
    } catch {
      // best-effort — l'état local repasse quand même à "unsubscribed"
      setStatus("unsubscribed");
    } finally {
      setPending(false);
    }
  }

  if (status === "unsupported") return null;

  const subscribed = status === "subscribed";
  const denied = status === "denied";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-6 py-4 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-ink">Notifications push</span>
        <span className="text-[12.5px] text-muted">
          {denied
            ? "Bloquées dans les réglages de votre navigateur — autorisez-les pour ce site pour les activer."
            : "Une alerte sur cet appareil dès qu'une visite, estimation, avis ou candidature vous concerne."}
        </span>
      </div>
      <button
        type="button"
        disabled={pending || denied || status === "loading"}
        onClick={subscribed ? unsubscribe : subscribe}
        className="rounded-full px-4 py-2 text-[12.5px] font-semibold transition disabled:opacity-60"
        style={{
          background: subscribed ? "var(--pvl-blue-soft)" : "#fff",
          color: subscribed ? "var(--pvl-blue)" : "var(--pvl-ink)",
          border: `1.5px solid ${subscribed ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
        }}
      >
        {pending ? "…" : subscribed ? "Activé — désactiver" : "Activer"}
      </button>
    </div>
  );
}
