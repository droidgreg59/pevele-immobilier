"use client";

import { useState } from "react";

export default function FavoriteButton({
  className,
  size = 34,
}: {
  className?: string;
  size?: number;
}) {
  const [fav, setFav] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFav((f) => !f)}
      aria-label="Ajouter aux favoris"
      className={
        className ??
        "flex items-center justify-center rounded-full border-2 border-ink bg-white text-[16px] leading-none text-blue"
      }
      style={{ width: size, height: size }}
    >
      {fav ? "♥" : "♡"}
    </button>
  );
}
