import { describe, it, expect } from "vitest";
import { parseDsn, isControlFlow } from "./report-error";

describe("parseDsn", () => {
  it("construit l'URL d'enveloppe à partir d'un DSN Sentry standard", () => {
    const p = parseDsn("https://abc123def@o4509999.ingest.de.sentry.io/4510000");
    expect(p).not.toBeNull();
    expect(p!.envelopeUrl).toBe(
      "https://o4509999.ingest.de.sentry.io/api/4510000/envelope/?sentry_key=abc123def&sentry_version=7"
    );
    expect(p!.dsn).toBe("https://abc123def@o4509999.ingest.de.sentry.io/4510000");
  });

  it("gère un DSN avec chemin (self-hosted Sentry)", () => {
    const p = parseDsn("https://key@sentry.example.com/some/path/42");
    expect(p!.envelopeUrl).toBe(
      "https://sentry.example.com/some/path/api/42/envelope/?sentry_key=key&sentry_version=7"
    );
  });

  it("renvoie null si le DSN est absent, vide ou malformé", () => {
    expect(parseDsn(undefined)).toBeNull();
    expect(parseDsn("")).toBeNull();
    expect(parseDsn("pas-une-url")).toBeNull();
    expect(parseDsn("https://sentry.io/123")).toBeNull(); // pas de clé publique
    expect(parseDsn("https://key@sentry.io/")).toBeNull(); // pas de project id
  });
});

describe("isControlFlow", () => {
  it("reconnaît les redirections et 404 de Next", () => {
    expect(isControlFlow(Object.assign(new Error(), { digest: "NEXT_REDIRECT;replace;/;307;" }))).toBe(true);
    expect(isControlFlow(Object.assign(new Error(), { digest: "NEXT_NOT_FOUND" }))).toBe(true);
    expect(
      isControlFlow(Object.assign(new Error(), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }))
    ).toBe(true);
  });

  it("laisse passer les vraies erreurs", () => {
    expect(isControlFlow(new Error("boom"))).toBe(false);
    expect(isControlFlow("chaîne")).toBe(false);
    expect(isControlFlow(null)).toBe(false);
    expect(isControlFlow(Object.assign(new Error(), { digest: "12345" }))).toBe(false);
  });
});
