/**
 * Service worker minimal — juste ce qu'il faut pour l'installation (« ajouter
 * à l'écran d'accueil ») et une page de repli hors ligne pour les
 * navigations. AUCUNE mise en cache d'assets ni de pages : pas de risque de
 * contenu périmé ni de déploiement cassé. On pourra enrichir plus tard.
 */
const OFFLINE_HTML = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hors ligne — Pévèle Immobilier</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font-family:system-ui,sans-serif;background:#fbfaf8;color:#20242e;text-align:center}
div{max-width:340px;padding:0 24px}h1{font-size:20px;margin:0 0 8px}p{font-size:14px;color:#676b78}</style>
</head><body><div><h1>Vous êtes hors ligne</h1>
<p>Pévèle Immobilier a besoin d'une connexion. Réessayez une fois le réseau revenu.</p></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })
    )
  );
});

/**
 * Notifications push (Web Push / VAPID, voir src/lib/push.ts) — payload JSON
 * {title, body, url?}. Best-effort sur le parsing : un payload inattendu ne
 * doit pas faire échouer l'affichage.
 */
self.addEventListener("push", (event) => {
  let data = { title: "Pévèle Immobilier", body: "Nouvelle notification." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload non-JSON — on garde le texte par défaut
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
