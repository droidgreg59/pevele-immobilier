import { describe, it, expect } from "vitest";
import {
  AERIAL_EPOCHS,
  DEFAULT_AFTER,
  DEFAULT_BEFORE,
  buildAerialParams,
  epochTileUrl,
  parseAerialParams,
} from "./aerial-epochs";

describe("AERIAL_EPOCHS", () => {
  it("a des identifiants uniques, du plus ancien au plus récent", () => {
    const ids = AERIAL_EPOCHS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(DEFAULT_BEFORE);
    expect(ids[ids.length - 1]).toBe(DEFAULT_AFTER);
  });

  it("n'inclut pas la couche 1980-1995, absente sur la Pévèle", () => {
    expect(AERIAL_EPOCHS.some((e) => e.layer.includes("1980-1995"))).toBe(false);
  });
});

describe("epochTileUrl", () => {
  it("produit un gabarit WMTS Géoplateforme avec les jetons Leaflet", () => {
    const url = epochTileUrl(AERIAL_EPOCHS[0]);
    expect(url.startsWith("https://data.geopf.fr/wmts?")).toBe(true);
    expect(url).toContain("LAYER=ORTHOIMAGERY.ORTHOPHOTOS.1950-1965");
    expect(url).toContain("TILEMATRIX={z}&TILEROW={y}&TILECOL={x}");
    expect(url).toContain("FORMAT=image%2Fpng");
  });
});

describe("parseAerialParams", () => {
  it("retombe sur 1950 / aujourd'hui sans paramètre", () => {
    expect(parseAerialParams(new URLSearchParams())).toEqual({
      before: "1950",
      after: "aujourdhui",
      lat: null,
      lng: null,
      zoom: null,
    });
  });

  it("lit une vue partagée", () => {
    const s = parseAerialParams(new URLSearchParams("avant=1965&apres=2011&lat=50.57&lng=3.21&z=16"));
    expect(s).toEqual({ before: "1965", after: "2011", lat: 50.57, lng: 3.21, zoom: 16 });
  });

  it("ignore les époques inconnues et les coordonnées hors bornes", () => {
    const s = parseAerialParams(new URLSearchParams("avant=1800&apres=foo&lat=200&z=42"));
    expect(s.before).toBe("1950");
    expect(s.after).toBe("aujourdhui");
    expect(s.lat).toBeNull();
    expect(s.zoom).toBeNull();
  });

  it("ne compare jamais une époque à elle-même", () => {
    const s = parseAerialParams(new URLSearchParams("avant=2006&apres=2006"));
    expect(s.before).toBe("2006");
    expect(s.after).toBe("aujourdhui");
  });
});

describe("buildAerialParams", () => {
  it("fait l'aller-retour avec parseAerialParams", () => {
    const qs = buildAerialParams({ before: "1950", after: "2021", lat: 50.570612, lng: 3.217812, zoom: 16.4 });
    expect(qs).toBe("avant=1950&apres=2021&lat=50.57061&lng=3.21781&z=16");
    expect(parseAerialParams(new URLSearchParams(qs))).toEqual({
      before: "1950",
      after: "2021",
      lat: 50.57061,
      lng: 3.21781,
      zoom: 16,
    });
  });
});
