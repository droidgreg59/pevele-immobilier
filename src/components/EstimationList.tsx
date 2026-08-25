import { respondToEstimationRequestAction } from "@/lib/estimation-actions";

export type EstimationItem = {
  id: string;
  adresse: string;
  nom: string;
  telephone: string;
  preferredDateLabel: string | null;
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  createdLabel: string;
  authorEmail: string;
};

const STATUS_LABEL: Record<EstimationItem["statut"], { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: "En attente de validation", bg: "#FBF3DC", color: "var(--pvl-gold)" },
  ACCEPTEE: { label: "Accepté", bg: "#EAF3E8", color: "var(--pvl-green)" },
  REFUSEE: { label: "Refusé", bg: "var(--pvl-surface)", color: "var(--pvl-muted)" },
};

export default function EstimationList({ items }: { items: EstimationItem[] }) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {items.map((e) => {
        const status = STATUS_LABEL[e.statut];
        return (
          <div
            key={e.id}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14px] font-semibold text-ink">{e.nom}</span>
              <span className="text-[12px] text-muted-2">{e.createdLabel}</span>
            </div>
            <span className="text-[14px] text-ink">{e.adresse}</span>
            {e.preferredDateLabel ? (
              <span className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-blue">
                Créneau souhaité : {e.preferredDateLabel}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </span>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 text-[12.5px] font-semibold text-blue">
              <a href={`tel:${e.telephone}`}>{e.telephone}</a>
              <a href={`mailto:${e.authorEmail}`}>{e.authorEmail}</a>
            </div>

            {e.statut === "EN_ATTENTE" ? (
              <form action={respondToEstimationRequestAction} className="flex items-center gap-4">
                <input type="hidden" name="estimationRequestId" value={e.id} />
                <button
                  type="submit"
                  name="decision"
                  value="accept"
                  className="rounded-full bg-yellow px-3.5 py-2 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
                >
                  Accepter
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="refuse"
                  className="text-[12.5px] font-semibold text-muted hover:text-ink"
                >
                  Refuser
                </button>
              </form>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
