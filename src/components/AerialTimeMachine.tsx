"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AERIAL_ATTRIBUTION,
  AERIAL_EPOCHS,
  buildAerialParams,
  epochTileUrl,
  getAerialEpoch,
  parseAerialParams,
} from "@/lib/aerial-epochs";

export type AerialVillage = { slug: string; nom: string; lat: number; lng: number };

type Props = {
  villages: AerialVillage[];
  /** Commune de départ (page /vue-du-ciel/[slug]) — sinon vue d'ensemble de la Pévèle. */
  initialVillageSlug?: string;
};

const VILLAGE_ZOOM = 15;
const OVERVIEW_ZOOM = 12;
const selectCls =
  "box-border w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

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
 * Comparateur « avant / après » de photographies aériennes IGN : deux couches
 * superposées dans deux panes Leaflet, la couche « avant » découpée
 * (clip-path) à gauche du curseur. Le découpage est recalculé en coordonnées
 * de calque à chaque déplacement, la pane suivant les translations de la carte.
 */
export default function AerialTimeMachine({ villages, initialVillageSlug }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const beforeLayerRef = useRef<L.TileLayer | null>(null);
  const afterLayerRef = useRef<L.TileLayer | null>(null);
  const ratioRef = useRef(0.5);

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
    const pane = map.getPane("avant");
    if (!pane) return;
    const size = map.getSize();
    const nw = map.containerPointToLayerPoint([0, 0]);
    const se = map.containerPointToLayerPoint(size);
    const x = nw.x + size.x * ratioRef.current;
    pane.style.clipPath = `polygon(${nw.x}px ${nw.y}px, ${x}px ${nw.y}px, ${x}px ${se.y}px, ${nw.x}px ${se.y}px)`;
  }, []);

  const syncUrl = useCallback(() => {
    const map = mapRef.current;
    if (!map || !before || !after) return;
    const c = map.getCenter();
    const qs = buildAerialParams({ before, after, lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    const path = villageSlug ? `/vue-du-ciel/${villageSlug}` : "/vue-du-ciel";
    window.history.replaceState(null, "", `${path}?${qs}`);
  }, [before, after, villageSlug]);

  // Création de la carte (une fois), état initial lu dans l'URL partagée.
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
      zoomControl: true,
    });
    map.createPane("apres").style.zIndex = "200";
    map.createPane("avant").style.zIndex = "250";
    map.attributionControl.setPrefix(false);
    mapRef.current = map;
    setBefore(state.before);
    setAfter(state.after);
    map.on("move zoom resize", updateClip);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- création unique
  }, []);

  // Couches des deux époques.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !before || !after) return;
    beforeLayerRef.current?.remove();
    afterLayerRef.current?.remove();
    beforeLayerRef.current = tileLayer(before, "avant").addTo(map);
    afterLayerRef.current = tileLayer(after, "apres").addTo(map);
    updateClip();
  }, [before, after, updateClip]);

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

  function setSplit(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const r = Math.min(0.98, Math.max(0.02, (clientX - rect.left) / rect.width));
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
    setSplit(e.clientX);
  }

  function onHandlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    mapRef.current?.dragging.enable();
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
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">À gauche</span>
          <select
            value={before ?? ""}
            onChange={(e) => setBefore(e.target.value)}
            className={selectCls}
          >
            {AERIAL_EPOCHS.filter((e) => e.id !== after).map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">À droite</span>
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

      <div className="relative overflow-hidden rounded-2xl border border-line shadow-sm">
        <div ref={containerRef} className="h-[68vh] min-h-[420px] w-full bg-surface" />

        {beforeEpoch ? (
          <span className="pointer-events-none absolute left-14 top-3 z-[1000] rounded-full bg-ink/80 px-3 py-1.5 text-[12.5px] font-semibold text-white">
            {beforeEpoch.label}
          </span>
        ) : null}
        {afterEpoch ? (
          <span className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-full bg-ink/80 px-3 py-1.5 text-[12.5px] font-semibold text-white">
            {afterEpoch.label}
          </span>
        ) : null}

        <div
          className="absolute inset-y-0 z-[1000] w-0"
          style={{ left: `${ratio * 100}%` }}
        >
          <div className="pointer-events-none absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,.5)]" />
          <div
            role="slider"
            aria-label="Déplacer la séparation entre les deux époques"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const step = e.key === "ArrowLeft" ? -0.05 : 0.05;
              setSplit(rect.left + rect.width * (ratioRef.current + step));
            }}
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none select-none items-center justify-center rounded-full bg-white text-[18px] font-bold text-blue shadow-md outline-none focus-visible:ring-4 focus-visible:ring-yellow/60"
          >
            ‹ ›
          </div>
        </div>
      </div>
    </div>
  );
}
