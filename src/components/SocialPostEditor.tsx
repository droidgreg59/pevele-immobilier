"use client";

import { useActionState } from "react";
import { saveSocialPostAction, type SocialActionState } from "@/lib/social-actions";
import { IG_CAPTION_MAX } from "@/lib/social-rules";

const field =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13.5px] leading-[1.5] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15 disabled:bg-surface";

export default function SocialPostEditor(props: {
  id: string;
  captionFacebook: string;
  captionInstagram: string;
  scheduledAt: string;
  facebook: boolean;
  instagram: boolean;
  locked: boolean;
}) {
  const [state, action, pending] = useActionState<SocialActionState, FormData>(saveSocialPostAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={props.id} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Texte Facebook</span>
          <textarea name="captionFacebook" rows={9} defaultValue={props.captionFacebook} disabled={props.locked} className={field} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Texte Instagram (max {IG_CAPTION_MAX} car.)
          </span>
          <textarea name="captionInstagram" rows={9} defaultValue={props.captionInstagram} disabled={props.locked} className={field} />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Date (heure de Paris)</span>
          <input type="datetime-local" name="scheduledAt" defaultValue={props.scheduledAt} disabled={props.locked} className={field} />
        </label>
        <label className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
          <input type="checkbox" name="facebook" defaultChecked={props.facebook} disabled={props.locked} className="h-4 w-4 accent-[var(--pvl-blue)]" />
          Facebook
        </label>
        <label className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
          <input type="checkbox" name="instagram" defaultChecked={props.instagram} disabled={props.locked} className="h-4 w-4 accent-[var(--pvl-blue)]" />
          Instagram
        </label>
        {!props.locked ? (
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-line px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-surface disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        ) : null}
      </div>
      {state.error ? <p className="m-0 text-[12.5px] text-[#c0392b]">{state.error}</p> : null}
      {state.ok ? <p className="m-0 text-[12.5px] text-green">{state.ok}</p> : null}
    </form>
  );
}
