"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireAdmin } from "./admin";
import { getVillageBySlug } from "@/data/villages";
import { isValidPhoneNumber } from "./validation";
import { verifyTurnstile } from "./turnstile";
import { sendEmail } from "./email";
import { estimateLeadEmail } from "./email-templates";
import { logEvent } from "./events";

export type EstimateLeadState = { error?: string; success?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Capte un lead sur l'estimation en ligne : le visiteur (non connecté) veut
 * recevoir sa fourchette et un suivi du marché. La fourchette affichée est
 * transmise en champs cachés et stockée telle quelle.
 */
export async function saveEstimateLeadAction(
  _prev: EstimateLeadState,
  formData: FormData
): Promise<EstimateLeadState> {
  const villageSlug = String(formData.get("villageSlug") ?? "");
  const village = getVillageBySlug(villageSlug);
  if (!village) return { error: "Commune inconnue." };

  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telephone = String(formData.get("telephone") ?? "").trim();

  if (!nom) return { error: "Merci d'indiquer votre nom." };
  if (!EMAIL_RE.test(email)) return { error: "Merci d'indiquer une adresse email valide." };
  if (telephone && !isValidPhoneNumber(telephone)) {
    return { error: "Le numéro de téléphone n'est pas valide." };
  }
  if (!(await verifyTurnstile(formData, "estimate_lead"))) {
    return { error: "Vérification anti-robot échouée. Merci de réessayer." };
  }

  const surface = Math.round(Number(formData.get("surface")));
  const low = Math.round(Number(formData.get("low")));
  const high = Math.round(Number(formData.get("high")));
  if (!Number.isFinite(surface) || surface <= 0 || !Number.isFinite(low) || !Number.isFinite(high)) {
    return { error: "Estimation invalide, relancez le calcul." };
  }
  const typeRaw = String(formData.get("type") ?? "");
  const type = ["Maison", "Appartement", "Peu importe"].includes(typeRaw) ? typeRaw : "Peu importe";
  const dpeRaw = String(formData.get("dpe") ?? "").toUpperCase();
  const dpe = /^[A-G]$/.test(dpeRaw) ? dpeRaw : null;

  await prisma.estimationLead.create({
    data: {
      villageSlug: village.slug,
      commune: village.nom,
      surface,
      typeBien: type,
      dpe,
      estimLow: low,
      estimHigh: high,
      nom,
      email,
      telephone: telephone || null,
    },
  });

  const mail = estimateLeadEmail({
    nom,
    commune: village.nom,
    surface,
    type,
    dpe,
    low,
    high,
  });
  await sendEmail({ to: email, subject: mail.subject, html: mail.html });
  await logEvent("estimate_lead", {
    path: "/estimer",
    meta: { commune: village.slug, type, surface },
  });

  return { success: true };
}

/** Back-office : marque un lead d'estimation comme traité (ou non). */
export async function markEstimationLeadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const traite = formData.get("traite") === "true";
  if (!id) return;
  await prisma.estimationLead.update({ where: { id }, data: { traite } });
  revalidatePath("/admin/leads-estimation");
}
