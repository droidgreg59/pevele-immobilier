"use client";

import { useActionState } from "react";
import { deleteUserAction } from "@/lib/admin-users-actions";
import type { DeleteUserResult } from "@/lib/admin-users";

const initialState: DeleteUserResult = {};

export default function DeleteUserButton({ userId, label }: { userId: string; label: string }) {
  const [state, formAction, pending] = useActionState(deleteUserAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Supprimer définitivement le compte « ${label} » ? Ses annonces, avis et demandes seront aussi supprimés.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-[12px] font-semibold text-muted transition hover:text-ink disabled:opacity-60"
      >
        {pending ? "Suppression…" : "Supprimer"}
      </button>
      {state?.error ? <p className="m-0 mt-1 text-[11.5px] text-gold">{state.error}</p> : null}
    </form>
  );
}
