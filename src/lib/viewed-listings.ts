"use client";

import { useSyncExternalStore } from "react";

/**
 * Suivi côté client des annonces déjà consultées (localStorage, 30 jours) —
 * sert uniquement à atténuer visuellement une carte déjà vue, jamais envoyé
 * au serveur.
 */

const KEY = "pvl-vus";
const EVENT = "pvl-vus-updated";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function readAll(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    const pruned: Record<string, number> = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (now - ts < MAX_AGE_MS) pruned[id] = ts;
    }
    return pruned;
  } catch {
    return {};
  }
}

export function markListingViewed(id: string): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[id] = Date.now();
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // stockage indisponible — sans conséquence
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

let cachedRaw: string | null | undefined;
let cachedIds: Set<string> = new Set();

function getSnapshot(): Set<string> {
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  cachedIds = new Set(Object.keys(readAll()));
  return cachedIds;
}

const EMPTY_SET: Set<string> = new Set();

function getServerSnapshot(): Set<string> {
  return EMPTY_SET;
}

/** Ensemble réactif des ids d'annonces déjà consultées (vide côté serveur). */
export function useViewedListingIds(): Set<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
