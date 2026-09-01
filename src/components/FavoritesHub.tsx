"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TransactionType } from "@prisma/client";
import { formatPrix } from "@/lib/format";
import { toggleFavoriteAction, updateFavoriteTagAction } from "@/lib/favorite-actions";
import type { FavoriteTag } from "@/lib/favorite-actions";

export type FavoriteHubItem = {
  id: string;
  listingId: string;
  visite: boolean;
  surveillePrix: boolean;
  contacte: boolean;
  favoritedLabel: string;
  detailHref: string;
  villageSlug: string;
  commune: string;
  titre: string;
  prix: number;
  transaction: TransactionType;
  coverUrl?: string;
  ownerType: "PARTICULIER" | "AGENCE" | "ARTISAN";
  pieces: number;
  surface: number;
  exterieur: string;
  enBaisse: boolean;
  enVerification: boolean;
};

type Filtre = "tout" | "a_visiter" | "visite" | "surveillance";

const FILTRE_LABEL: Record<Filtre, string> = {
  tout: "Tous",
  a_visiter: "À visiter",
  visite: "Visités",
  surveillance: "Surveillance prix",
};

function matchesFiltre(item: FavoriteHubItem, filtre: Filtre): boolean {
  if (filtre === "tout") return true;
  if (filtre === "a_visiter") return !item.visite;
  if (filtre === "visite") return item.visite;
  return item.surveillePrix;
}

const TAGS: { key: FavoriteTag; label: string }[] = [
  { key: "visite", label: "Visité" },
  { key: "surveillePrix", label: "Surveiller la baisse de prix" },
  { key: "contacte", label: "Contacté" },
];

function FavoriteHubCard({
  item,
  onToggleTag,
  onRemove,
}: {
  item: FavoriteHubItem;
  onToggleTag: (tag: FavoriteTag, value: boolean) => void;
  onRemove: () => void;
}) {
  const [, startTransition] = useTransition();
  const particulier = item.ownerType === "PARTICULIER";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row">
      <Link
        href={item.detailHref}
        className="relative h-[140px] w-full shrink-0 overflow-hidden rounded-xl sm:h-[120px] sm:w-[160px]"
      >
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={item.titre}
            fill
            sizes="(max-width: 640px) 100vw, 160px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface px-3 text-center text-[12px] text-muted-2">
            Aucune photo
          </div>
        )}
        <span
          className="absolute left-2 top-2 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold shadow-sm"
          style={{
            background: particulier ? "#FBF3DC" : "var(--pvl-blue-soft)",
            color: particulier ? "var(--pvl-gold)" : "var(--pvl-blue)",
          }}
        >
          {particulier ? "Entre voisins" : item.ownerType === "AGENCE" ? "Agence" : "Artisan"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <Link href={item.detailHref} className="text-[16.5px] font-bold text-ink">
              {item.titre}
            </Link>
            <Link
              href={`/villages/${item.villageSlug}`}
              className="text-[12.5px] font-semibold text-blue"
            >
              {item.commune}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-ink px-3 py-1.5 font-display text-[19px] tracking-[.02em] text-yellow">
              {formatPrix(item.prix, item.transaction)}
            </span>
            {item.enVerification ? (
              <span className="rounded-full bg-blue px-2 py-1 text-[11px] font-semibold text-white">
                En vérification
              </span>
            ) : null}
          </div>
        </div>

        <span className="text-[12.5px] text-muted-2">
          {item.pieces} p. · {item.surface} m² · {item.exterieur} · favori depuis le{" "}
          {item.favoritedLabel}
        </span>

        {item.surveillePrix && item.enBaisse ? (
          <span className="w-fit rounded-full bg-[#EAF3E8] px-3 py-1.5 text-[12.5px] font-semibold text-green">
            ↓ Baisse de prix détectée
          </span>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center gap-4">
          {TAGS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-1.5 text-[13px] font-medium text-ink"
            >
              <input
                type="checkbox"
                checked={item[key]}
                onChange={(e) => {
                  const value = e.target.checked;
                  onToggleTag(key, value);
                  startTransition(async () => {
                    await updateFavoriteTagAction(item.listingId, key, value);
                  });
                }}
                className="h-4 w-4 accent-[var(--pvl-blue)]"
              />
              {label}
            </label>
          ))}
          <button
            type="button"
            onClick={() => {
              onRemove();
              startTransition(async () => {
                await toggleFavoriteAction(item.listingId, "/compte/favoris");
              });
            }}
            className="ml-auto text-[12.5px] font-semibold text-muted hover:text-ink"
          >
            Retirer des favoris
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FavoritesHub({ items: initialItems }: { items: FavoriteHubItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const list = items.filter((item) => matchesFiltre(item, filtre));

  function handleToggleTag(id: string, tag: FavoriteTag, value: boolean) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [tag]: value } : it)));
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FILTRE_LABEL) as Filtre[]).map((key) => {
          const count = items.filter((item) => matchesFiltre(item, key)).length;
          const active = filtre === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFiltre(key)}
              className="cursor-pointer rounded-full px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-surface"
              style={{
                background: active ? "var(--pvl-blue-soft)" : "transparent",
                color: active ? "var(--pvl-blue)" : "var(--pvl-ink)",
                border: active ? "1px solid var(--pvl-blue)" : "1px solid var(--pvl-line)",
              }}
            >
              {FILTRE_LABEL[key]} ({count})
            </button>
          );
        })}
      </div>

      {list.length > 0 ? (
        <div className="mt-5 flex flex-col gap-4">
          {list.map((item) => (
            <FavoriteHubCard
              key={item.id}
              item={item}
              onToggleTag={(tag, value) => handleToggleTag(item.id, tag, value)}
              onRemove={() => handleRemove(item.id)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-[15px] text-muted">
          {items.length === 0
            ? "Aucun favori pour le moment — cliquez sur ♡ sur une annonce pour l'ajouter ici."
            : "Aucun favori ne correspond à ce filtre."}
        </p>
      )}
    </div>
  );
}
