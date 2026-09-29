"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Columns2, SquareSplitHorizontal, SquareSplitVertical } from "lucide-react";
import {
  AERIAL_ATTRIBUTION,
  AERIAL_EPOCHS,
  AERIAL_MODES,
  DEFAULT_MODE,
  buildAerialParams,
  epochTileUrl,
  getAerialEpoch,
  parseAerialParams,
  type AerialMode,
} from "@/lib/aerial-epochs";

export type AerialVillage = { slug: string; nom: string; lat: number; lng: number };

type Props = {
  villages: AerialVillage[];
  /** Commune de départ (page /vue-du-ciel/[slug]) — sinon vue d'ensemble de la Pévèle. */
  initialVillageSlug?: string;
};

const VILLAGE_ZOOM = 15;
const OVERVIEW_ZOOM = 12;
const MODE_ICONS: Record<AerialMode, typeof Columns2> = {
  vertical: SquareSplitHorizontal,
  horizontal: SquareSplitVertical,
  cote: Columns2,
};
const selectCls =
  "box-border w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";
const badgeCls =
  "pointer-events-none absolute z-[1000] rounded-full bg-ink/80 px-3 py-1.5 text-[12.5px] font-semibold text-white";

function tileLayer(epochId: string, pane: string): L.TileLayer {
  const epoch = getAerialEpoch(epochId)!;
  return L.tileLayer(epochTileUrl(epoch), {
    pane,
    maxNativeZoom: epoch.maxNativeZoom,
    maxZoom: 19,
    attribution: AERIAL_ATTRIBUTION,
  });
}

/**
 * Comparateur de photographies aériennes IGN, trois modes :
 * - séparation verticale / horizontale : une carte, deux couches superposées
 *   dans deux panes, la couche « avant » découpée (clip-path) par le curseur ;
 *   le découpage est recalculé en coordonnées de calque à chaque déplacement ;
 * - côte à côte : deux cartes synchronisées (centre et zoom), une époque
 *   chacune — l'une au-dessus de l'autre sur mobile.
 */
export default function AerialTimeMachine({ villages, initialVillageSlug }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const secondContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const secondMapRef = useRef<L.Map | null>(null);
  const beforeLayerRef = useRef<L.TileLayer | null>(null);
  const afterLayerRef = useRef<L.TileLayer | null>(null);
  const secondLayerRef = useRef<L.TileLayer | null>(null);
  const ratioRef = useRef(0.5);
  const modeRef = useRef<AerialMode>(DEFAULT_MODE);
  const syncingRef = useRef(false);

  const [mode, setMode] = useState<AerialMode>(DEFAULT_MODE);
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [villageSlug, setVillageSlug] = useState(initialVillageSlug ?? "");
  const [ratio, setRatio] = useState(0.5);
  const [shareLabel, setShareLabel] = useState("Partager cette vue");

  const center = useCallback((): [number, number] => {
    const v = villages.find((x) => x.slug === villageSlug);
    if (v) return [v.lat, v.lng];
    const lat = villages.reduce((s, x) => s + x.lat, 0) / villages.length;
    const lng = villages.reduce((s, x) => s + x.lng, 0) / villages.length;
    return [lat, lng];
  }, [villages, villageSlug]);

  const updateClip = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const beforePane = map.getPane("avant");
    const afterPane = map.getPane("apres");
    if (!beforePane || !afterPane) return;
    if (modeRef.current === "cote") {
      // Carte de gauche : seulement l'époque « avant », non découpée.
      beforePane.style.clipPath = "";
      afterPane.style.display = "none";
      return;
    }
    afterPane.style.display = "";
    const size = map.getSize();
    const nw = map.containerPointToLayerPoint([0, 0]);
    const se = map.containerPointToLayerPoint(size);
    if (modeRef.current === "vertical") {
      const x = nw.x + size.x * ratioRef.current;
      beforePane.style.clipPath = `polygon(${nw.x}px ${nw.y}px, ${x}px ${nw.y}px, ${x}px ${se.y}px, ${nw.x}px ${se.y}px)`;
    } else {
      const y = nw.y + size.y * ratioRef.current;
      beforePane.style.clipPath = `polygon(${nw.x}px ${nw.y}px, ${se.x}px ${nw.y}px, ${se.x}px ${y}px, ${nw.x}px ${y}px)`;
    }
  }, []);

  const syncUrl = useCallback(() => {
    const map = mapRef.current;
    if (!map || !before || !after) return;
    const c = map.getCenter();
    const qs = buildAerialParams({ mode, before, after, lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    const path = villageSlug ? `/vue-du-ciel/${villageSlug}` : "/vue-du-ciel";
    window.history.replaceState(null, "", `${path}?${qs}`);
  }, [mode, before, after, villageSlug]);

  // Création de la carte principale (une fois), état initial lu dans l'URL partagée.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const state = parseAerialParams(new URLSearchParams(window.location.search));
    const lats = villages.map((v) => v.lat);
    const lngs = villages.map((v) => v.lng);
    const bounds = L.latLngBounds(
      [Math.min(...lats) - 0.08, Math.min(...lngs) - 0.12],
      [Math.max(...lats) + 0.08, Math.max(...lngs) + 0.12]
    );
    const start: [number, number] =
      state.lat !== null && state.lng !== null ? [state.lat, state.lng] : center();
    const map = L.map(containerRef.current, {
      center: start,
      zoom: state.zoom ?? (initialVillageSlug ? VILLAGE_ZOOM : OVERVIEW_ZOOM),
      minZoom: 11,
      maxZoom: 19,
      maxBounds: bounds,
      maxBoundsViscosity: 0.8,
    });
    map.createPane("apres").style.zIndex = "200";
    map.createPane("avant").style.zIndex = "250";
    map.attributionControl.setPrefix(false);
    mapRef.current = map;
    modeRef.current = state.mode;
    setMode(state.mode);
    setBefore(state.before);
    setAfter(state.after);
    map.on("move zoom resize", updateClip);
    map.on("move zoomend", () => {
      const second = secondMapRef.current;
      if (!second || syncingRef.current) return;
      syncingRef.current = true;
      second.setView(map.getCenter(), map.getZoom(), { animate: false });
      syncingRef.current = false;
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- création unique
  }, []);

  // Seconde carte, uniquement en mode côte à côte, synchronisée dans les deux sens.
  useEffect(() => {
    const map = mapRef.current;
    modeRef.current = mode;
    if (!map) return;
    map.invalidateSize();
    if (mode !== "cote" || !secondContainerRef.current) {
      updateClip();
      return;
    }
    const second = L.map(secondContainerRef.current, {
      center: map.getCenter(),
      zoom: map.getZoom(),
      minZoom: map.getMinZoom(),
      maxZoom: 19,
      maxBounds: map.options.maxBounds,
      maxBoundsViscosity: 0.8,
    });
    second.attributionControl.setPrefix(false);
    second.on("move zoomend", () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      map.setView(second.getCenter(), second.getZoom(), { animate: false });
      syncingRef.current = false;
    });
    secondMapRef.current = second;
    updateClip();
    return () => {
      second.remove();
      secondMapRef.current = null;
      secondLayerRef.current = null;
    };
  }, [mode, updateClip]);

  // Couches des deux époques.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !before || !after) return;
    beforeLayerRef.current?.remove();
    afterLayerRef.current?.remove();
    beforeLayerRef.current = tileLayer(before, "avant").addTo(map);
    afterLayerRef.current = tileLayer(after, "apres").addTo(map);
    const second = secondMapRef.current;
    if (second) {
      secondLayerRef.current?.remove();
      secondLayerRef.current = tileLayer(after, "tilePane").addTo(second);
    }
    updateClip();
  }, [before, after, mode, updateClip]);

  // URL partageable, tenue à jour sans recharger la page.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncUrl();
    map.on("moveend", syncUrl);
    return () => {
      map.off("moveend", syncUrl);
    };
  }, [syncUrl]);

  function setSplitFromPointer(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const raw =
      modeRef.current === "vertical" ? (clientX - rect.left) / rect.width : (clientY - rect.top) / rect.height;
    const r = Math.min(0.98, Math.max(0.02, raw));
    ratioRef.current = r;
    setRatio(r);
    updateClip();
  }

  function onHandlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    mapRef.current?.dragging.disable();
  }

  function onHandlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setSplitFromPointer(e.clientX, e.clientY);
  }

  function onHandlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    mapRef.current?.dragging.enable();
  }

  function onHandleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const keys = mode === "vertical" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ratioRef.current + (e.key === keys[0] ? -0.05 : 0.05);
    setSplitFromPointer(rect.left + rect.width * next, rect.top + rect.height * next);
  }

  function onVillageChange(slug: string) {
    setVillageSlug(slug);
    const v = villages.find((x) => x.slug === slug);
    if (v) mapRef.current?.flyTo([v.lat, v.lng], VILLAGE_ZOOM, { duration: 1.2 });
  }

  async function share() {
    const url = window.location.href;
    const v = villages.find((x) => x.slug === villageSlug);
    const title = `${v ? v.nom : "La Pévèle"} vue du ciel : ${getAerialEpoch(before)?.label} / ${getAerialEpoch(after)?.label}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareLabel("Lien copié ✓");
      setTimeout(() => setShareLabel("Partager cette vue"), 2500);
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
  }

  const beforeEpoch = getAerialEpoch(before);
  const afterEpoch = getAerialEpoch(after);
  const isSwipe = mode !== "cote";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Commune</span>
          <select value={villageSlug} onChange={(e) => onVillageChange(e.target.value)} className={selectCls}>
            <option value="">Toute la Pévèle</option>
            {villages.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {mode === "horizontal" ? "En haut" : "À gauche"}
          </span>
          <select value={before ?? ""} onChange={(e) => setBefore(e.target.value)} className={selectCls}>
            {AERIAL_EPOCHS.filter((e) => e.id !== after).map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {mode === "horizontal" ? "En bas" : "À droite"}
          </span>
          <select value={after ?? ""} onChange={(e) => setAfter(e.target.value)} className={selectCls}>
            {AERIAL_EPOCHS.filter((e) => e.id !== before).map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={share}
          className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          {shareLabel}
        </button>
      </div>

      <div role="radiogroup" aria-label="Mode d'affichage" className="flex flex-wrap gap-2">
        {AERIAL_MODES.map((m) => {
          const Icon = MODE_ICONS[m.id];
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(m.id)}
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition"
              style={{
                background: active ? "var(--pvl-blue)" : "#fff",
                color: active ? "#fff" : "var(--pvl-ink)",
                borderColor: active ? "var(--pvl-blue)" : "var(--pvl-line)",
              }}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div
        className={
          mode === "cote"
            ? "grid h-[68vh] min-h-[420px] grid-cols-1 grid-rows-2 gap-1.5 sm:grid-cols-2 sm:grid-rows-1"
            : "h-[68vh] min-h-[420px]"
        }
      >
        <div className="relative h-full overflow-hidden rounded-2xl border border-line shadow-sm">
          <div ref={containerRef} className="h-full w-full bg-surface" />

          {beforeEpoch ? <span className={`${badgeCls} left-14 top-3`}>{beforeEpoch.label}</span> : null}
          {afterEpoch && isSwipe ? (
            <span className={`${badgeCls} ${mode === "vertical" ? "right-3 top-3" : "bottom-8 left-3"}`}>
              {afterEpoch.label}
            </span>
          ) : null}

          {isSwipe ? (
            <div
              className={mode === "vertical" ? "absolute inset-y-0 z-[1000] w-0" : "absolute inset-x-0 z-[1000] h-0"}
              style={mode === "vertical" ? { left: `${ratio * 100}%` } : { top: `${ratio * 100}%` }}
            >
              <div
                className={
                  mode === "vertical"
                    ? "pointer-events-none absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,.5)]"
                    : "pointer-events-none absolute inset-x-0 -top-px h-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,.5)]"
                }
              />
              <div
                role="slider"
                aria-label="Déplacer la séparation entre les deux époques"
                aria-orientation={mode === "vertical" ? "horizontal" : "vertical"}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ratio * 100)}
                tabIndex={0}
                onKeyDown={onHandleKeyDown}
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
                className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 touch-none select-none items-center justify-center rounded-full bg-white text-[18px] font-bold text-blue shadow-md outline-none focus-visible:ring-4 focus-visible:ring-yellow/60 ${
                  mode === "vertical" ? "top-1/2 cursor-ew-resize" : "left-1/2 cursor-ns-resize"
                }`}
              >
                <span className={mode === "vertical" ? "" : "rotate-90"}>‹ ›</span>
              </div>
            </div>
          ) : null}
        </div>

        {mode === "cote" ? (
          <div className="relative h-full overflow-hidden rounded-2xl border border-line shadow-sm">
            <div ref={secondContainerRef} className="h-full w-full bg-surface" />
            {afterEpoch ? <span className={`${badgeCls} left-14 top-3`}>{afterEpoch.label}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
