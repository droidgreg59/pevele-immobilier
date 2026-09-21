import { describe, it, expect } from "vitest";
import { buildSnapshotSources } from "./listing-snapshot";

describe("buildSnapshotSources", () => {
  it("renvoie un tableau vide pour aucune annonce", () => {
    expect(buildSnapshotSources([])).toEqual([]);
  });

  it("regroupe les annonces d'une agence sous son sourceId, avec sa fraîcheur", () => {
    const freshAt = new Date("2026-09-20T00:00:00Z");
    const sources = buildSnapshotSources([
      { ownerId: "agence-1", owner: { type: "AGENCE", xmlLastSuccessAt: freshAt } },
      { ownerId: "agence-1", owner: { type: "AGENCE", xmlLastSuccessAt: freshAt } },
    ]);
    expect(sources).toEqual([
      { sourceType: "AGENCY", sourceId: "agence-1", count: 2, sourceFreshAt: freshAt },
    ]);
  });

  it("agrège les dépôts non-agence sous un sourceId constant \"direct\", jamais par personne", () => {
    const sources = buildSnapshotSources([
      { ownerId: "particulier-1", owner: { type: "PARTICULIER", xmlLastSuccessAt: null } },
      { ownerId: "particulier-2", owner: { type: "PARTICULIER", xmlLastSuccessAt: null } },
    ]);
    expect(sources).toEqual([
      { sourceType: "DIRECT", sourceId: "direct", count: 2, sourceFreshAt: null },
    ]);
  });

  it("distingue deux agences et regroupe les particuliers séparément", () => {
    const freshA = new Date("2026-09-21T00:00:00Z");
    const freshB = new Date("2026-09-19T00:00:00Z");
    const sources = buildSnapshotSources([
      { ownerId: "agence-a", owner: { type: "AGENCE", xmlLastSuccessAt: freshA } },
      { ownerId: "agence-b", owner: { type: "AGENCE", xmlLastSuccessAt: freshB } },
      { ownerId: "particulier-1", owner: { type: "PARTICULIER", xmlLastSuccessAt: null } },
    ]);
    expect(sources).toEqual([
      { sourceType: "AGENCY", sourceId: "agence-a", count: 1, sourceFreshAt: freshA },
      { sourceType: "AGENCY", sourceId: "agence-b", count: 1, sourceFreshAt: freshB },
      { sourceType: "DIRECT", sourceId: "direct", count: 1, sourceFreshAt: null },
    ]);
  });

  it("n'inclut pas de ligne DIRECT quand il n'y a aucun dépôt non-agence", () => {
    const sources = buildSnapshotSources([
      { ownerId: "agence-1", owner: { type: "AGENCE", xmlLastSuccessAt: null } },
    ]);
    expect(sources).toEqual([
      { sourceType: "AGENCY", sourceId: "agence-1", count: 1, sourceFreshAt: null },
    ]);
  });
});
