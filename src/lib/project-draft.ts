"use client";

import { useSyncExternalStore } from "react";

/**
 * Brouillon du tunnel "Mon projet", persisté côté client uniquement
 * (localStorage). Écrit par ProjectWizard, lu par ProjectPill et
 * ResumeBanner — jamais de contrepartie serveur, jamais bloquant.
 */

export type ProjectDraft = {
  step: string;
  transaction: "VENTE" | "LOCATION" | null;
  typeBien: "MAISON" | "APPARTEMENT" | "TERRAIN" | null;
  typeAnswered: boolean;
  chambresMin: number | null;
  chambresAnswered: boolean;
  equipements: string[];
  budgetMin: string;
  budgetMax: string;
  villageSlugs: string[];
  priorites: string[];
};

const DRAFT_KEY = "pvl-projet-draft";
const DRAFT_EVENT = "pvl-draft-updated";
const TOTAL_QUESTIONS = 7;

export function readProjectDraft(): ProjectDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectDraft;
  } catch {
    return null;
  }
}

export function writeProjectDraft(draft: ProjectDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    window.dispatchEvent(new Event(DRAFT_EVENT));
  } catch {
    // stockage indisponible (mode privé...) — le tunnel reste utilisable, juste non persisté
  }
}

export function clearProjectDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
    window.dispatchEvent(new Event(DRAFT_EVENT));
  } catch {
    // ignoré
  }
}

function subscribeToDraft(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(DRAFT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DRAFT_EVENT, callback);
  };
}

let cachedRaw: string | null | undefined;
let cachedDraft: ProjectDraft | null = null;

function getDraftSnapshot(): ProjectDraft | null {
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (raw === cachedRaw) return cachedDraft;
  cachedRaw = raw;
  try {
    cachedDraft = raw ? (JSON.parse(raw) as ProjectDraft) : null;
  } catch {
    cachedDraft = null;
  }
  return cachedDraft;
}

function getDraftServerSnapshot(): ProjectDraft | null {
  return null;
}

/** Hook réactif : se met à jour dès que le brouillon change (même onglet ou un autre). */
export function useProjectDraft(): ProjectDraft | null {
  return useSyncExternalStore(subscribeToDraft, getDraftSnapshot, getDraftServerSnapshot);
}

/** Nombre de questions renseignées / 7 (transaction, lieu, budget, type, chambres, équipements, priorités). */
export function projectDraftProgress(draft: ProjectDraft): number {
  let answered = 0;
  if (draft.transaction) answered++;
  if (draft.villageSlugs.length > 0) answered++;
  if (draft.budgetMin || draft.budgetMax) answered++;
  if (draft.typeAnswered) answered++;
  if (draft.chambresAnswered) answered++;
  if (draft.equipements.length > 0) answered++;
  // 7e question (priorités) : étape pas encore livrée, jamais comptée pour l'instant.
  return answered / TOTAL_QUESTIONS;
}
