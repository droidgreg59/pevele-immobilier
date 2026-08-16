"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { toggleFavoriteAction } from "@/lib/favorite-actions";

export default function FavoriteButton({
  listingId,
  initialFavorited = false,
  className,
  size = 34,
}: {
  listingId: string;
  initialFavorited?: boolean;
  className?: string;
  size?: number;
}) {
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setFavorited((f) => !f);
        startTransition(async () => {
          await toggleFavoriteAction(listingId, pathname);
        });
      }}
      aria-label="Ajouter aux favoris"
      className={
        className ??
        "flex items-center justify-center rounded-full border border-line bg-white text-[16px] leading-none text-blue shadow-sm"
      }
      style={{ width: size, height: size }}
    >
      {favorited ? "♥" : "♡"}
    </button>
  );
}
