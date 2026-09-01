"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { updateXmlImportUrl, getAgencyById } from "./agencies";
import { syncAgencyFeed } from "./ac3-sync";

export type XmlImportUrlFormState = { error?: string; success?: boolean };

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateXmlImportUrlAction(
  _prevState: XmlImportUrlFormState,
  formData: FormData
): Promise<XmlImportUrlFormState> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") {
    return { error: "Réservé aux comptes agence." };
  }

  const raw = String(formData.get("xmlImportUrl") ?? "").trim();
  if (raw && !isValidHttpUrl(raw)) {
    return { error: "L'adresse du flux doit être une URL valide (https://...)." };
  }

  await updateXmlImportUrl(session.userId, raw || null);
  return { success: true };
}

export type XmlSyncFormState = {
  error?: string;
  success?: boolean;
  imported?: number;
  updated?: number;
  skipped?: number;
};

/* eslint-disable @typescript-eslint/no-unused-vars -- signature required by useActionState */
export async function syncAgencyXmlAction(
  _prevState: XmlSyncFormState,
  _formData: FormData
): Promise<XmlSyncFormState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence");
  if (session.type !== "AGENCE") {
    return { error: "Réservé aux comptes agence." };
  }

  const agency = await getAgencyById(session.userId);
  if (!agency?.xmlImportUrl) {
    return { error: "Aucune adresse de flux configurée." };
  }

  const result = await syncAgencyFeed(session.userId, agency.xmlImportUrl);
  if ("error" in result) return { error: result.error };
  return {
    success: true,
    imported: result.created,
    updated: result.updated,
    skipped: result.skipped,
  };
}
