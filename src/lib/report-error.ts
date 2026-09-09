/**
 * Remontée d'exceptions vers Sentry — **sans le SDK** : on poste directement
 * une enveloppe sur l'endpoint d'ingestion, à partir du DSN. Choix assumé de
 * rester au niveau de dépendances du projet (aucune) ; en contrepartie, pas
 * de symbolication des stacks minifiées ni de tracing. Passer à
 * `@sentry/nextjs` plus tard si besoin (chantier à part).
 *
 * - Serveur : appelé depuis `src/instrumentation.ts` (`onRequestError`), DSN = `SENTRY_DSN`.
 * - Client : appelé depuis `src/instrumentation-client.ts` + `global-error.tsx`, DSN = `NEXT_PUBLIC_SENTRY_DSN`.
 *
 * Sans DSN configuré → no-op silencieux. Une panne d'envoi n'est jamais
 * propagée (l'observabilité ne casse rien).
 */

const ENV = process.env.NODE_ENV ?? "development";

type ParsedDsn = { envelopeUrl: string; dsn: string };

function parseDsn(dsn: string | undefined): ParsedDsn | null {
  if (!dsn) return null;
  try {
    // Forme : {protocol}://{publicKey}@{host}{path}/{projectId}
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\/+/, "").split("/").pop();
    if (!u.username || !projectId) return null;
    const basePath = u.pathname.slice(0, u.pathname.lastIndexOf("/"));
    const envelopeUrl =
      `${u.protocol}//${u.host}${basePath}/api/${projectId}/envelope/` +
      `?sentry_key=${u.username}&sentry_version=7`;
    return { envelopeUrl, dsn };
  } catch {
    return null;
  }
}

/** Erreurs de contrôle de flux Next — pas de vraies exceptions à remonter. */
function isControlFlow(err: unknown): boolean {
  const digest =
    typeof err === "object" && err !== null && "digest" in err
      ? String((err as { digest?: unknown }).digest ?? "")
      : "";
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest === "NEXT_NOT_FOUND" ||
    digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")
  );
}

type ReportContext = {
  platform: "node" | "javascript";
  transaction?: string;
  tags?: Record<string, string | undefined>;
  extra?: Record<string, unknown>;
};

async function send(dsn: ParsedDsn, err: unknown, ctx: ReportContext): Promise<void> {
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const now = new Date();

  const error = err instanceof Error ? err : null;
  const value = error?.message || (typeof err === "string" ? err : "Erreur inconnue");
  const type = error?.name || "Error";

  const event = {
    event_id: eventId,
    timestamp: now.getTime() / 1000,
    platform: ctx.platform,
    level: "error",
    environment: ENV,
    logger: "report-error",
    transaction: ctx.transaction,
    tags: Object.fromEntries(
      Object.entries(ctx.tags ?? {}).filter(([, v]) => v != null)
    ),
    extra: { ...ctx.extra, stack: error?.stack ?? undefined },
    exception: { values: [{ type, value }] },
  };

  const body =
    JSON.stringify({ event_id: eventId, sent_at: now.toISOString(), dsn: dsn.dsn }) +
    "\n" +
    JSON.stringify({ type: "event" }) +
    "\n" +
    JSON.stringify(event);

  try {
    await fetch(dsn.envelopeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body,
      signal: AbortSignal.timeout(3000),
      keepalive: ctx.platform === "javascript",
    });
  } catch {
    // silencieux
  }
}

export async function reportServerError(
  err: unknown,
  meta: { path?: string; method?: string; routePath?: string; routeType?: string } = {}
): Promise<void> {
  if (isControlFlow(err)) return;
  const dsn = parseDsn(process.env.SENTRY_DSN);
  if (!dsn) return;
  await send(dsn, err, {
    platform: "node",
    transaction: meta.routePath || meta.path,
    tags: { runtime: process.env.NEXT_RUNTIME, route_type: meta.routeType, method: meta.method },
    extra: { path: meta.path },
  });
}

export async function reportClientError(
  err: unknown,
  meta: { kind?: string } = {}
): Promise<void> {
  if (isControlFlow(err)) return;
  const dsn = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!dsn) return;
  await send(dsn, err, {
    platform: "javascript",
    transaction: typeof location !== "undefined" ? location.pathname : undefined,
    tags: { kind: meta.kind },
    extra: { url: typeof location !== "undefined" ? location.href : undefined },
  });
}
