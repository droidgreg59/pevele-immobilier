"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { agencyVerificationReviewedEmail, courtierVerificationReviewedEmail } from "./email-templates";
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

/**
 * Même logique que reviewAgencyVerificationAction, pour les courtiers
 * bancaires (vérification ORIAS au lieu de SIRET/carte T) — action distincte
 * plutôt qu'un paramètre partagé, pour ne pas toucher au flux agence déjà en
 * production.
 */
export async function reviewCourtierVerificationAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const raison = String(formData.get("raison") ?? "").trim();
  if (decision !== "verifier" && decision !== "refuser") redirect("/admin/verifications");

  const courtier = await prisma.user.findFirst({
    where: { id: userId, type: "COURTIER", verifStatut: { in: ["EN_ATTENTE", "NON_SOUMISE"] } },
    select: { email: true, nom: true, entreprise: true },
  });

  await prisma.user.updateMany({
    where: { id: userId, type: "COURTIER", verifStatut: { in: ["EN_ATTENTE", "NON_SOUMISE"] } },
    data: {
      verifStatut: decision === "verifier" ? "VERIFIEE" : "REFUSEE",
      verifTraiteeLe: new Date(),
      verifRaison: decision === "refuser" ? raison || "Justificatifs non conformes." : null,
    },
  });

  if (courtier) {
    const { subject, html } = courtierVerificationReviewedEmail({
      courtierNom: courtier.entreprise ?? courtier.nom,
      verified: decision === "verifier",
      raison: decision === "refuser" ? raison : undefined,
    });
    await sendEmail({ to: courtier.email, subject, html });
  }

  revalidatePath("/admin/verifications");
  redirect("/admin/verifications");
}

/**
 * Repasse une agence ou un courtier déjà VERIFIEE en EN_ATTENTE — retire
 * immédiatement le compte de l'annuaire public (getAgencies()/
 * getVerifiedCourtiers() ne montrent que verifStatut: "VERIFIEE") sans le
 * refuser ni le supprimer : utile quand la fiche a besoin d'une correction
 * (ex. logo manquant) avant de redevenir visible. Contrairement à un refus,
 * n'envoie aucun email — ce n'est pas une décision négative, juste une pause
 * de publication le temps d'un ajustement. Le compte réapparaît dans la
 * liste « en attente » de /admin/verifications, prêt à être revalidé.
 */
export async function revertToVerificationPendingAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const accountType = String(formData.get("accountType") ?? "");
  if (accountType !== "AGENCE" && accountType !== "COURTIER") redirect("/admin/comptes");

  await prisma.user.updateMany({
    where: { id: userId, type: accountType, verifStatut: "VERIFIEE" },
    data: { verifStatut: "EN_ATTENTE", verifTraiteeLe: null, verifRaison: null },
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/admin/verifications");
  redirect(`/admin/comptes?type=${accountType}`);
}
