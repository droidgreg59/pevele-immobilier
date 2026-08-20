"use client";

import { useSyncExternalStore } from "react";

/** Préférence de vue (liste/carte) sur /acheter et /louer, persistée localement. */
export type BrowseView = "liste" | "liste_carte" | "carte";

const VIEW_KEY = "pvl-browse-view";
const VIEW_EVENT = "pvl-browse-view-updated";

function isBrowseView(v: string | null): v is BrowseView {
  return v === "liste" || v === "liste_carte" || v === "carte";
}

export function setBrowseView(view: BrowseView): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VIEW_KEY, view);
  window.dispatchEvent(new Event(VIEW_EVENT));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(VIEW_EVENT, callback);
  return () => window.removeEventListener(VIEW_EVENT, callback);
}

function getSnapshot(): BrowseView {
  const raw = window.localStorage.getItem(VIEW_KEY);
  return isBrowseView(raw) ? raw : "liste_carte";
}

function getServerSnapshot(): BrowseView {
  return "liste_carte";
}

export function useBrowseView(): BrowseView {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
