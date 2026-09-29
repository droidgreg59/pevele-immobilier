/**
 * Époques de photographies aériennes IGN pour la rubrique « Vue du ciel »
 * (/vue-du-ciel). Couches WMTS de la Géoplateforme (data.geopf.fr), sans clé,
 * Licence Ouverte Etalab 2.0 (BD ORTHO® et BD ORTHO® Historique) — identifiants,
 * styles et TileMatrixSet relevés dans le GetCapabilities réel, et couverture
 * de la Pévèle vérifiée tuile par tuile le 2026-09-29. La couche historique
 * 1980-1995 existe au catalogue mais ne couvre pas la Pévèle (404 à toutes
 * les échelles) : volontairement absente.
 */

export type AerialEpoch = {
  id: string;
  label: string;
  layer: string;
  style: string;
  tileMatrixSet: string;
  format: "image/png" | "image/jpeg";
  /** Zoom maximal servi par l'IGN — Leaflet agrandit au-delà. */
  maxNativeZoom: number;
};

export const AERIAL_EPOCHS: AerialEpoch[] = [
  { id: "1950", label: "1950–1965", layer: "ORTHOIMAGERY.ORTHOPHOTOS.1950-1965", style: "BDORTHOHISTORIQUE", tileMatrixSet: "PM_0_18", format: "image/png", maxNativeZoom: 18 },
  { id: "1965", label: "1965–1980", layer: "ORTHOIMAGERY.ORTHOPHOTOS.1965-1980", style: "BDORTHOHISTORIQUE", tileMatrixSet: "PM_3_18", format: "image/png", maxNativeZoom: 18 },
  { id: "2000", label: "2000–2005", layer: "ORTHOIMAGERY.ORTHOPHOTOS2000-2005", style: "normal", tileMatrixSet: "PM_6_18", format: "image/jpeg", maxNativeZoom: 18 },
  { id: "2006", label: "2006–2010", layer: "ORTHOIMAGERY.ORTHOPHOTOS2006-2010", style: "normal", tileMatrixSet: "PM_6_18", format: "image/jpeg", maxNativeZoom: 18 },
  { id: "2011", label: "2011–2015", layer: "ORTHOIMAGERY.ORTHOPHOTOS2011-2015", style: "normal", tileMatrixSet: "PM_6_18", format: "image/jpeg", maxNativeZoom: 18 },
  { id: "2016", label: "2016–2020", layer: "ORTHOIMAGERY.ORTHOPHOTOS2016-2020", style: "normal", tileMatrixSet: "PM_6_19", format: "image/jpeg", maxNativeZoom: 19 },
  { id: "2021", label: "2021–2023", layer: "ORTHOIMAGERY.ORTHOPHOTOS2021-2023", style: "normal", tileMatrixSet: "PM_6_19", format: "image/jpeg", maxNativeZoom: 19 },
  { id: "aujourdhui", label: "Aujourd'hui", layer: "ORTHOIMAGERY.ORTHOPHOTOS", style: "normal", tileMatrixSet: "PM_0_19", format: "image/jpeg", maxNativeZoom: 19 },
];

export const DEFAULT_BEFORE = "1950";
export const DEFAULT_AFTER = "aujourdhui";

/** Mention courte sur la carte ; la mention complète (BD ORTHO®…) est sous la carte. */
export const AERIAL_ATTRIBUTION = "© IGN — Licence Ouverte Etalab 2.0";

export function getAerialEpoch(id: string | null | undefined): AerialEpoch | undefined {
  return AERIAL_EPOCHS.find((e) => e.id === id);
}

/** Gabarit d'URL de tuile au format attendu par Leaflet ({z}/{x}/{y}). */
export function epochTileUrl(epoch: AerialEpoch): string {
  return (
    "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0" +
    `&LAYER=${epoch.layer}&STYLE=${epoch.style}&TILEMATRIXSET=${epoch.tileMatrixSet}` +
    `&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=${encodeURIComponent(epoch.format)}`
  );
}

/** Modes d'affichage, comme sur « Remonter le temps » de l'IGN. */
export const AERIAL_MODES = [
  { id: "vertical", label: "Séparation verticale" },
  { id: "horizontal", label: "Séparation horizontale" },
  { id: "cote", label: "Côte à côte" },
] as const;
export type AerialMode = (typeof AERIAL_MODES)[number]["id"];
export const DEFAULT_MODE: AerialMode = "vertical";

function parseMode(raw: string | null): AerialMode {
  return AERIAL_MODES.find((m) => m.id === raw)?.id ?? DEFAULT_MODE;
}

export type AerialViewState = {
  mode: AerialMode;
  before: string;
  after: string;
  lat: number | null;
  lng: number | null;
  zoom: number | null;
};

/**
 * Lit l'état partageable depuis les paramètres d'URL (`avant`, `apres`, `lat`,
 * `lng`, `z`). Toute valeur inconnue ou hors bornes retombe sur le défaut —
 * un lien bricolé ne casse jamais la page.
 */
export function parseAerialParams(params: URLSearchParams): AerialViewState {
  const before = getAerialEpoch(params.get("avant"))?.id ?? DEFAULT_BEFORE;
  const afterRaw = getAerialEpoch(params.get("apres"))?.id ?? DEFAULT_AFTER;
  const after = afterRaw === before ? (before === DEFAULT_AFTER ? DEFAULT_BEFORE : DEFAULT_AFTER) : afterRaw;
  const num = (key: string, min: number, max: number) => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };
  return {
    mode: parseMode(params.get("mode")),
    before,
    after,
    lat: num("lat", -90, 90),
    lng: num("lng", -180, 180),
    zoom: num("z", 0, 19),
  };
}

export function buildAerialParams(state: {
  mode: AerialMode;
  before: string;
  after: string;
  lat: number;
  lng: number;
  zoom: number;
}): string {
  const p = new URLSearchParams({
    mode: state.mode,
    avant: state.before,
    apres: state.after,
    lat: state.lat.toFixed(5),
    lng: state.lng.toFixed(5),
    z: String(Math.round(state.zoom)),
  });
  return p.toString();
}
