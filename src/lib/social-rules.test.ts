import { describe, it, expect } from "vitest";
import { isDue, isFullyPublished, parisLocalToUtc, utcToParisLocal, validateCaptions } from "./social-rules";

describe("parisLocalToUtc / utcToParisLocal", () => {
  it("applique l'heure d'été (UTC+2) et l'heure d'hiver (UTC+1)", () => {
    expect(parisLocalToUtc("2026-10-12T18:30")!.toISOString()).toBe("2026-10-12T16:30:00.000Z");
    expect(parisLocalToUtc("2026-11-12T18:30")!.toISOString()).toBe("2026-11-12T17:30:00.000Z");
  });
  it("fait l'aller-retour", () => {
    expect(utcToParisLocal(parisLocalToUtc("2026-12-31T23:45")!)).toBe("2026-12-31T23:45");
    expect(utcToParisLocal(new Date("2026-10-12T16:30:00Z"))).toBe("2026-10-12T18:30");
  });
  it("refuse une saisie invalide", () => {
    expect(parisLocalToUtc("12/10/2026 18:30")).toBeNull();
  });
});

describe("validateCaptions", () => {
  it("accepte des textes normaux", () => {
    expect(validateCaptions("Texte FB", "Texte IG #Pévèle")).toBeNull();
  });
  it("refuse un texte vide ou trop de hashtags Instagram", () => {
    expect(validateCaptions("", "x")).toMatch(/Facebook/);
    const tags = Array.from({ length: 31 }, (_, i) => `#tag${i}`).join(" ");
    expect(validateCaptions("x", tags)).toMatch(/hashtags/);
  });
  it("refuse une légende Instagram de plus de 2 200 caractères", () => {
    expect(validateCaptions("x", "a".repeat(2201))).toMatch(/trop long/);
  });
});

describe("isDue", () => {
  const now = new Date("2026-10-12T16:30:00Z");
  it("ne publie que les publications validées dont l'heure est passée", () => {
    expect(isDue({ statut: "VALIDEE", scheduledAt: new Date("2026-10-12T16:00:00Z") }, now)).toBe(true);
    expect(isDue({ statut: "VALIDEE", scheduledAt: new Date("2026-10-12T17:00:00Z") }, now)).toBe(false);
    expect(isDue({ statut: "BROUILLON", scheduledAt: new Date("2026-10-12T16:00:00Z") }, now)).toBe(false);
    expect(isDue({ statut: "EN_COURS", scheduledAt: new Date("2026-10-12T16:00:00Z") }, now)).toBe(true);
  });
});

describe("isFullyPublished", () => {
  const d = new Date();
  it("attend chaque réseau demandé", () => {
    expect(isFullyPublished({ facebook: true, instagram: true, fbPublishedAt: d, igPublishedAt: null })).toBe(false);
    expect(isFullyPublished({ facebook: true, instagram: false, fbPublishedAt: d, igPublishedAt: null })).toBe(true);
  });
});
