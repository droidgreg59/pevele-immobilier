"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-[440px] flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="m-0 font-display text-[24px] text-ink">Un souci de notre côté.</h1>
      <p className="m-0 text-[14px] text-muted">
        Impossible de charger les annonces pour le moment. Vos filtres sont conservés.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full bg-ink px-6 py-3 text-[13px] font-bold text-white transition hover:brightness-110"
      >
        Réessayer
      </button>
    </div>
  );
}
