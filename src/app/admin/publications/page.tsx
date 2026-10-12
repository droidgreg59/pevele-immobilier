import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { utcToParisLocal } from "@/lib/social-rules";
import {
  approveSocialPostAction,
  deleteSocialPostAction,
  publishNowSocialPostAction,
  unapproveSocialPostAction,
} from "@/lib/social-actions";
import SocialPostEditor from "@/components/SocialPostEditor";

export const dynamic = "force-dynamic";
// « Publier maintenant » attend Meta (téléchargement + traitement de la vidéo).
export const maxDuration = 60;

export const metadata: Metadata = { title: "Publications réseaux" };

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  BROUILLON: { label: "Brouillon — à valider", bg: "#FBF3DC", color: "var(--pvl-gold)" },
  VALIDEE: { label: "Validée — partira au créneau", bg: "var(--pvl-blue-soft)", color: "var(--pvl-blue)" },
  EN_COURS: { label: "En cours de publication", bg: "var(--pvl-blue-soft)", color: "var(--pvl-blue)" },
  PUBLIEE: { label: "Publiée", bg: "#EAF3E8", color: "var(--pvl-green)" },
  ECHEC: { label: "Échec", bg: "#FBEAEA", color: "#c0392b" },
};

const fmt = (d: Date) =>
  d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const btn = "rounded-full px-4 py-2 text-[12.5px] font-semibold transition";

export default async function PublicationsPage() {
  const posts = await prisma.socialPost.findMany({ orderBy: [{ scheduledAt: "desc" }], take: 50 });
  const upcoming = posts.filter((p) => p.statut !== "PUBLIEE").sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const published = posts.filter((p) => p.statut === "PUBLIEE");

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-9">
      <h1 className="m-0 font-display text-[28px] text-ink">Publications réseaux</h1>
      <p className="m-0 mt-1 max-w-[70ch] text-[13.5px] leading-[1.6] text-muted">
        Page Facebook et Instagram « Pévèle Immobilier ». Rien ne part sans validation. Les publications
        validées partent au premier créneau après leur heure (12 h 30 et 18 h 30, heure de Paris en été ;
        une heure plus tard en hiver), ou tout de suite avec « Publier maintenant ».
      </p>

      <h2 className="m-0 mt-8 text-[13px] font-semibold uppercase tracking-wide text-muted">À venir ({upcoming.length})</h2>
      <div className="mt-3 flex flex-col gap-5">
        {upcoming.length === 0 ? <p className="m-0 text-[14px] text-muted">Aucune publication en attente.</p> : null}
        {upcoming.map((p) => {
          const s = STATUS[p.statut];
          const locked = p.statut === "EN_COURS" || Boolean(p.fbPublishedAt || p.igPublishedAt);
          return (
            <div key={p.id} className="grid grid-cols-1 gap-5 rounded-2xl border border-line bg-white p-5 shadow-sm md:grid-cols-[200px_1fr]">
              <div>
                {p.mediaType === "VIDEO" ? (
                  <video src={p.mediaUrl} controls preload="metadata" playsInline className="aspect-[9/16] w-full rounded-xl bg-ink" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.mediaUrl} alt="" className="w-full rounded-xl" />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold text-ink">{p.titre}</span>
                  <span className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                  <span className="text-[12.5px] text-muted">prévue {fmt(p.scheduledAt)}</span>
                </div>
                {p.error ? <p className="m-0 rounded-xl bg-[#FBEAEA] px-3 py-2 text-[12.5px] text-ink">{p.error}</p> : null}
                {p.fbPublishedAt || p.igPublishedAt ? (
                  <p className="m-0 text-[12.5px] text-muted">
                    {p.fbPublishedAt ? <>Facebook ✓ {p.fbPermalink ? <a className="text-blue" href={p.fbPermalink} target="_blank">voir</a> : null} · </> : null}
                    {p.igPublishedAt ? <>Instagram ✓ {p.igPermalink ? <a className="text-blue" href={p.igPermalink} target="_blank">voir</a> : null}</> : null}
                  </p>
                ) : null}

                <SocialPostEditor
                  id={p.id}
                  captionFacebook={p.captionFacebook}
                  captionInstagram={p.captionInstagram}
                  scheduledAt={utcToParisLocal(p.scheduledAt)}
                  facebook={p.facebook}
                  instagram={p.instagram}
                  locked={locked}
                />

                <div className="flex flex-wrap gap-2">
                  {p.statut === "BROUILLON" || p.statut === "ECHEC" ? (
                    <form action={approveSocialPostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`${btn} bg-yellow text-ink shadow-sm hover:brightness-95`}>
                        {p.statut === "ECHEC" ? "Réessayer (revalider)" : "Valider"}
                      </button>
                    </form>
                  ) : null}
                  {p.statut === "VALIDEE" || p.statut === "EN_COURS" ? (
                    <form action={publishNowSocialPostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`${btn} bg-blue text-white hover:brightness-110`}>
                        {p.statut === "EN_COURS" ? "Actualiser / terminer" : "Publier maintenant"}
                      </button>
                    </form>
                  ) : null}
                  {p.statut === "VALIDEE" ? (
                    <form action={unapproveSocialPostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`${btn} border border-line text-ink hover:bg-surface`}>Repasser en brouillon</button>
                    </form>
                  ) : null}
                  {!locked ? (
                    <form action={deleteSocialPostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`${btn} text-muted hover:text-ink`}>Supprimer</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="m-0 mt-10 text-[13px] font-semibold uppercase tracking-wide text-muted">Publiées ({published.length})</h2>
      <div className="mt-3 flex flex-col gap-2">
        {published.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3">
            <span className="text-[13.5px] font-semibold text-ink">{p.titre}</span>
            <span className="text-[12.5px] text-muted">
              {fmt(p.fbPublishedAt ?? p.igPublishedAt ?? p.scheduledAt)} ·{" "}
              {p.fbPermalink ? <a className="text-blue" href={p.fbPermalink} target="_blank">Facebook</a> : p.facebook ? "Facebook" : null}
              {p.facebook && p.instagram ? " · " : null}
              {p.igPermalink ? <a className="text-blue" href={p.igPermalink} target="_blank">Instagram</a> : p.instagram ? "Instagram" : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
