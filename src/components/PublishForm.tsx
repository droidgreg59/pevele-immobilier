"use client";

import { useActionState, useState } from "react";
import { createListingAction, type ListingFormState } from "@/lib/listing-actions";
import { villages } from "@/data/villages";
import PhotoDropzone from "./PhotoDropzone";

const initialState: ListingFormState = {};
const DPE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];

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
          className="rounded-xl px-4 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: transaction === "VENTE" ? "#FBF3DC" : "#fff",
            border: `1px solid ${transaction === "VENTE" ? "transparent" : "var(--pvl-line)"}`,
          }}
        >
          JE VENDS
        </button>
        <button
          type="button"
          onClick={() => setTransaction("LOCATION")}
          className="rounded-xl px-4 py-3.5 text-left font-sans text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: transaction === "LOCATION" ? "#FBF3DC" : "#fff",
            border: `1px solid ${transaction === "LOCATION" ? "transparent" : "var(--pvl-line)"}`,
          }}
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
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            VILLAGE
          </span>
          <select
            name="villageSlug"
            required
            defaultValue=""
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            TYPE DE BIEN
          </span>
          <select
            name="typeBien"
            required
            defaultValue="MAISON"
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          >
            <option value="MAISON">Maison</option>
            <option value="APPARTEMENT">Appartement</option>
            <option value="TERRAIN">Terrain</option>
          </select>
        </label>
      </div>

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
            className="rounded-xl border border-line bg-white px-3 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
            className="rounded-xl border border-line bg-white px-3 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
            className="rounded-xl border border-line bg-white px-3 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
            className="rounded-xl border border-line bg-white px-3 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            DPE (SI CONNU)
          </span>
          <select
            name="dpe"
            defaultValue=""
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
          className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <PhotoDropzone />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            LIEN VIDÉO (YOUTUBE/VIMEO, FACULTATIF)
          </span>
          <input
            name="videoUrl"
            type="url"
            placeholder="https://youtube.com/watch?v=…"
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            LIEN VISITE VIRTUELLE 360° (FACULTATIF)
          </span>
          <input
            name="visiteVirtuelleUrl"
            type="url"
            placeholder="https://…"
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      </div>

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 font-mono text-[12px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "PUBLICATION…" : "PUBLIER MON ANNONCE →"}
      </button>
    </form>
  );
}
