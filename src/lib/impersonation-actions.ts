"use server";

import { redirect } from "next/navigation";
import { requireAdmin, isUserAdmin } from "./admin";
import { prisma } from "./prisma";
import { logEvent } from "./events";
import { getSession, setSessionCookie } from "./session";

/**
 * Prise de contrôle support : l'admin ouvre une session au nom d'un compte.
 * Garde-fous — jamais un autre admin ni soi-même, session courte (2 h, voir
 * session.ts), bandeau permanent (ImpersonationBanner), début et fin
 * journalisés dans `Event` avec l'id de l'admin et du compte (pas d'email).
 * L'admin reste identifiable via `impersonatedBy` ; `requireAdmin()` lit
 * `session.userId` (le compte ciblé), donc l'espace admin est inaccessible
 * tant qu'on est « dans » un compte — il faut d'abord quitter.
 */
export async function startImpersonationAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === admin.userId) redirect("/admin/comptes");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nom: true, type: true, isAdmin: true },
  });
  if (!target || target.isAdmin) redirect("/admin/comptes");

  await logEvent("admin_impersonation_started", {
    userId: admin.userId,
    meta: { targetId: target.id, targetType: target.type },
  });
  await setSessionCookie({
    userId: target.id,
    email: target.email,
    nom: target.nom,
    type: target.type,
    impersonatedBy: admin.userId,
  });

  redirect("/compte");
}

export async function stopImpersonationAction() {
  const session = await getSession();
  if (!session?.impersonatedBy) redirect("/");

  const adminId = session.impersonatedBy;
  const admin = (await isUserAdmin(adminId))
    ? await prisma.user.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, nom: true, type: true },
      })
    : null;

  await logEvent("admin_impersonation_ended", {
    userId: adminId,
    meta: { targetId: session.userId },
  });

  // Admin supprimé ou rétrogradé entre-temps : on ne le reconnecte pas.
  if (!admin) redirect("/connexion");

  await setSessionCookie({
    userId: admin.id,
    email: admin.email,
    nom: admin.nom,
    type: admin.type,
  });
  redirect("/admin/comptes");
}
