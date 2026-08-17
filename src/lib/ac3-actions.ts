"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { updateXmlImportUrl, recordXmlSyncResult, getAgencyById } from "./agencies";
import { fetchAc3Feed, parseAc3Feed } from "./ac3-import";
import { upsertImportedListing } from "./listings";

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

  try {
    const xml = await fetchAc3Feed(agency.xmlImportUrl);
    const { imported, skipped } = parseAc3Feed(xml);

    let created = 0;
    let updated = 0;
    for (const bien of imported) {
      const { created: wasCreated } = await upsertImportedListing(session.userId, {
        ...bien,
        importSource: "AC3",
      });
      if (wasCreated) created += 1;
      else updated += 1;
    }

    await recordXmlSyncResult(session.userId, { count: imported.length });
    return { success: true, imported: created, updated, skipped: skipped.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de la synchronisation.";
    await recordXmlSyncResult(session.userId, { error: message });
    return { error: message };
  }
}
