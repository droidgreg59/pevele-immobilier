import type { Metadata } from "next";
import Link from "next/link";
import { getAllReviews } from "@/lib/reviews";
import { getAgencies } from "@/lib/agencies";
import { adminDeleteReviewAction } from "@/lib/admin-reviews-actions";
import OfficialReviewForm from "@/components/OfficialReviewForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Avis Pévèle — Super admin",
};

function Stars({ note }: { note: number }) {
  return (
    <span className="text-[14px] leading-none" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= note ? "var(--pvl-yellow)" : "var(--pvl-line)" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default async function AdminAvisPage() {
  const [reviews, agencies] = await Promise.all([getAllReviews(), getAgencies()]);

  return (
    <div className="animate-fade-up mx-auto max-w-[1000px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Administration
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">Avis Pévèle</h1>
      <Link href="/admin" className="text-[13px] font-semibold text-blue">
        ← Vue d&apos;ensemble
      </Link>

      <div className="mt-7 max-w-[560px] rounded-2xl border border-line bg-white p-5 shadow-sm">
        <span className="text-[11px] font-semibold text-ink">Publier un avis officiel</span>
        <p className="m-0 mt-1.5 text-[13px] text-muted">
          Affiché sur la fiche de l&apos;agence au nom de « Pévèle Immobilier », avec un badge
          « avis officiel ».
        </p>
        <div className="mt-3">
          <OfficialReviewForm agencies={agencies} />
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/professionnels/${r.agencyId}`}
                  className="text-[14px] font-semibold text-ink hover:text-blue"
                >
                  {r.agencyNom}
                </Link>
                <Stars note={r.note} />
                {r.isOfficial ? (
                  <span className="rounded-full bg-blue-soft px-2 py-0.5 text-[10.5px] font-semibold text-blue">
                    ✓ Officiel
                  </span>
                ) : null}
              </div>
              <p className="m-0 max-w-[56ch] text-[13.5px] leading-[1.55] text-muted">
                {r.commentaire}
              </p>
              <span className="text-[11.5px] text-muted-2">
                {r.isOfficial ? "Pévèle Immobilier" : r.authorNom} ·{" "}
                {r.createdAt.toLocaleDateString("fr-FR")}
              </span>
            </div>
            <form action={adminDeleteReviewAction}>
              <input type="hidden" name="reviewId" value={r.id} />
              <button
                type="submit"
                className="text-[12px] font-semibold text-muted hover:text-ink"
              >
                Supprimer
              </button>
            </form>
          </div>
        ))}
        {reviews.length === 0 ? (
          <p className="text-[13.5px] text-muted">Aucun avis pour le moment.</p>
        ) : null}
      </div>
    </div>
  );
}
