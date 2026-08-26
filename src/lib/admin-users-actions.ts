"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin";
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
