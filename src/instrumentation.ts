import type { Instrumentation } from "next";
import { reportServerError } from "./lib/report-error";

/**
 * Hook serveur de Next : appelé quand le serveur capture une erreur (rendu
 * Server Component, Route Handler, Server Action). On la relaie à Sentry via
 * `src/lib/report-error.ts` — no-op si `SENTRY_DSN` n'est pas défini.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  await reportServerError(err, {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
