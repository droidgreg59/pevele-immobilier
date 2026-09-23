"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { agencyVerificationReviewedEmail } from "./email-templates";
import { deleteUserAccount, type DeleteUserResult } from "./admin-users";
import { deleteListingUploadDir } from "./photo-upload";

export async function deleteUserAction(
  _prevState: DeleteUserResult,
  formData: FormData
): Promise<DeleteUserResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Compte introuvable." };

  const result = await deleteUserAccount(userId, session.userId);
  if (result.error) return { error: result.error };

  if (result.deletedListingIds) {
    await Promise.all(result.deletedListingIds.map((id) => deleteListingUploadDir(id)));
  }

  revalidatePath("/admin/comptes");
  return {};
}

/**
 * L'admin valide ou refuse une agence — que ce soit une demande de
 * vérification soumise (SIRET/carte T, `EN_ATTENTE`) ou une agence
 * fraîchement inscrite qui n'a pas encore fait cette démarche
 * (`NON_SOUMISE`, voir getUnsubmittedAgencies) : la vérification reste une
 * décision manuelle de l'admin dans les deux cas, pas un contrôle
 * automatisé conditionné à la soumission de justificatifs.
 */
export async function reviewAgencyVerificationAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const raison = String(formData.get("raison") ?? "").trim();
  if (decision !== "verifier" && decision !== "refuser") redirect("/admin/verifications");

  const agency = await prisma.user.findFirst({
    where: { id: userId, type: "AGENCE", verifStatut: { in: ["EN_ATTENTE", "NON_SOUMISE"] } },
    select: { email: true, nom: true, entreprise: true },
  });

  await prisma.user.updateMany({
    where: { id: userId, type: "AGENCE", verifStatut: { in: ["EN_ATTENTE", "NON_SOUMISE"] } },
    data: {
      verifStatut: decision === "verifier" ? "VERIFIEE" : "REFUSEE",
      verifTraiteeLe: new Date(),
      verifRaison: decision === "refuser" ? raison || "Justificatifs non conformes." : null,
    },
  });

  if (agency) {
    const { subject, html } = agencyVerificationReviewedEmail({
      agencyNom: agency.entreprise ?? agency.nom,
      verified: decision === "verifier",
      raison: decision === "refuser" ? raison : undefined,
    });
    await sendEmail({ to: agency.email, subject, html });
  }

  revalidatePath("/admin/verifications");
  redirect("/admin/verifications");
}
