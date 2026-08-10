"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createListingAction, type ListingFormState } from "@/lib/listing-actions";
import { villages } from "@/data/villages";

const initialState: ListingFormState = {};
const DPE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTOS = 8;

type PhotoPick = { file: File; url: string };

export default function PublishForm({
  accountLabel,
}: {
  accountLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    createListingAction,
    initialState
  );
  const [transaction, setTransaction] = useState<"VENTE" | "LOCATION">("VENTE");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoPick[]>([]);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncFileInput(files: File[]) {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  }

  function addFiles(incoming: FileList | File[]) {
    const accepted = Array.from(incoming).filter((f) =>
      ACCEPTED_TYPES.includes(f.type)
    );
    if (accepted.length === 0) return;
    setPhotos((prev) => {
      const next = [
        ...prev,
        ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ].slice(0, MAX_PHOTOS);
      syncFileInput(next.map((p) => p.file));
      return next;
    });
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      const next = prev.filter((_, i) => i !== index);
      syncFileInput(next.map((p) => p.file));
      return next;
    });
  }

  return (
    <form action={formAction} className="flex max-w-[720px] flex-col gap-5">
      <input type="hidden" name="transaction" value={transaction} />

      <p className="m-0 font-mono text-[11px] text-muted">
        Vous publiez en tant que <b className="text-ink">{accountLabel}</b>.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTransaction("VENTE")}
          className="border-2 border-ink px-4 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-[#FDEBC2]"
          style={{ background: transaction === "VENTE" ? "#FBF3DC" : "#fff" }}
        >
          JE VENDS
        </button>
        <button
          type="button"
          onClick={() => setTransaction("LOCATION")}
          className="border-2 border-ink px-4 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-[#FDEBC2]"
          style={{ background: transaction === "LOCATION" ? "#FBF3DC" : "#fff" }}
        >
          JE LOUE
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          TITRE DE L&apos;ANNONCE
        </span>
        <input
          name="titre"
          required
          placeholder="ex. Longère rénovée, jardin clos"
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          VILLAGE
        </span>
        <select
          name="villageSlug"
          required
          defaultValue=""
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        >
          <option value="" disabled>
            Choisir un village…
          </option>
          {villages.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.nom}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            {transaction === "VENTE" ? "PRIX (€)" : "LOYER (€/MOIS)"}
          </span>
          <input
            type="number"
            name="prix"
            min={1}
            required
            className="border-[2.5px] border-ink bg-white px-3 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            SURFACE (M²)
          </span>
          <input
            type="number"
            name="surface"
            min={1}
            required
            className="border-[2.5px] border-ink bg-white px-3 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            PIÈCES
          </span>
          <input
            type="number"
            name="pieces"
            min={1}
            required
            className="border-[2.5px] border-ink bg-white px-3 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            CHAMBRES
          </span>
          <input
            type="number"
            name="chambres"
            min={1}
            required
            className="border-[2.5px] border-ink bg-white px-3 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            EXTÉRIEUR
          </span>
          <input
            name="exterieur"
            placeholder="ex. 500 M² JARDIN, BALCON…"
            className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            DPE (SI CONNU)
          </span>
          <select
            name="dpe"
            defaultValue=""
            className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
          >
            <option value="">Non renseigné</option>
            {DPE_OPTIONS.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-muted">
          DESCRIPTION
        </span>
        <textarea
          name="description"
          required
          rows={4}
          placeholder="Quelques phrases sur le bien, son état, son environnement…"
          className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
        />
      </label>

      <div className="flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          name="photos"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="flex cursor-pointer items-center justify-center gap-3.5 border-2 border-dashed border-muted-2 bg-white p-7 hover:border-blue"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-blue font-sans text-xl font-semibold text-blue">
            ↑
          </span>
          <span className="font-sans text-[14px] leading-[1.5] text-muted">
            Glissez vos photos ici, ou cliquez pour les choisir.
            <br />
            <b className="text-ink">
              JPEG, PNG ou WebP, 5 Mo max chacune — {MAX_PHOTOS} photos maximum.
            </b>
          </span>
        </div>

        {photos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div
                key={p.url}
                className="relative h-20 w-20 overflow-hidden border-2 border-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label="Retirer cette photo"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] leading-none text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {state.error ? (
        <p className="m-0 border-2 border-ink bg-[#FBEAEA] px-4 py-3 font-mono text-[12px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px disabled:opacity-60"
      >
        {pending ? "PUBLICATION…" : "PUBLIER MON ANNONCE →"}
      </button>
    </form>
  );
}
