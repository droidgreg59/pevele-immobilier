"use client";

import { useActionState, useState } from "react";
import { createListingAction, type ListingFormState } from "@/lib/listing-actions";
import { villages } from "@/data/villages";
import { EQUIPEMENTS } from "@/data/equipements";
import { MODE_CHAUFFAGE_OPTIONS } from "@/data/mode-chauffage";
import PhotoDropzone from "./PhotoDropzone";
import DpeFields from "./DpeFields";

const initialState: ListingFormState = {};

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
  const [typeBien, setTypeBien] = useState<"MAISON" | "APPARTEMENT" | "TERRAIN">("MAISON");

  return (
    <form action={formAction} className="flex max-w-[720px] flex-col gap-5">
      <input type="hidden" name="transaction" value={transaction} />

      <p className="m-0 text-[12.5px] text-muted">
        Vous publiez en tant que <b className="text-ink">{accountLabel}</b>.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTransaction("VENTE")}
          className="rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: transaction === "VENTE" ? "var(--pvl-blue-soft)" : "#fff",
            border: `1px solid ${transaction === "VENTE" ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
          }}
        >
          Je vends
        </button>
        <button
          type="button"
          onClick={() => setTransaction("LOCATION")}
          className="rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface"
          style={{
            background: transaction === "LOCATION" ? "var(--pvl-blue-soft)" : "#fff",
            border: `1px solid ${transaction === "LOCATION" ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
          }}
        >
          Je loue
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Titre de l&apos;annonce
        </span>
        <input
          name="titre"
          required
          placeholder="ex. Longère rénovée, jardin clos"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Village
          </span>
          <select
            name="villageSlug"
            required
            defaultValue=""
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Type de bien
          </span>
          <select
            name="typeBien"
            required
            value={typeBien}
            onChange={(e) => setTypeBien(e.target.value as typeof typeBien)}
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          >
            <option value="MAISON">Maison</option>
            <option value="APPARTEMENT">Appartement</option>
            <option value="TERRAIN">Terrain</option>
          </select>
        </label>
      </div>

      {typeBien === "MAISON" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Type de maison
          </span>
          <select
            name="typeMaison"
            defaultValue=""
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          >
            <option value="">Non précisé</option>
            <option value="INDIVIDUELLE">Individuelle</option>
            <option value="SEMI_INDIVIDUELLE">Semi-individuelle (mitoyenne d&apos;un côté)</option>
            <option value="MITOYENNE">Mitoyenne (des deux côtés)</option>
          </select>
        </label>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {transaction === "VENTE" ? "Prix (€)" : "Loyer (€/mois)"}
          </span>
          <input
            type="number"
            name="prix"
            min={1}
            required
            className="rounded-xl border border-line bg-white px-3 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Surface (m²)
          </span>
          <input
            type="number"
            name="surface"
            min={1}
            required
            className="rounded-xl border border-line bg-white px-3 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Pièces
          </span>
          <input
            type="number"
            name="pieces"
            min={1}
            required
            className="rounded-xl border border-line bg-white px-3 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Chambres
          </span>
          <input
            type="number"
            name="chambres"
            min={1}
            required
            className="rounded-xl border border-line bg-white px-3 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Extérieur
        </span>
        <input
          name="exterieur"
          placeholder="ex. 500 m² jardin, balcon…"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <DpeFields />


      {typeBien !== "TERRAIN" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Mode de chauffage
          </span>
          <select
            name="modeChauffage"
            defaultValue=""
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          >
            <option value="">Non précisé</option>
            {MODE_CHAUFFAGE_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Équipements
        </span>
        <div className="flex flex-wrap gap-3">
          {EQUIPEMENTS.map((eq) => (
            <label
              key={eq}
              className="flex items-center gap-1.5 text-[13.5px] text-ink"
            >
              <input
                type="checkbox"
                name="equipements"
                value={eq}
                className="h-4 w-4 accent-[var(--pvl-blue)]"
              />
              {eq}
            </label>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Description
        </span>
        <textarea
          name="description"
          required
          rows={4}
          placeholder="Quelques phrases sur le bien, son état, son environnement…"
          className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </label>

      <PhotoDropzone />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Lien vidéo (YouTube/Vimeo, facultatif)
          </span>
          <input
            name="videoUrl"
            type="url"
            placeholder="https://youtube.com/watch?v=…"
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Lien visite virtuelle 360° (facultatif)
          </span>
          <input
            name="visiteVirtuelleUrl"
            type="url"
            placeholder="https://…"
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>
      </div>

      <fieldset className="m-0 flex flex-col gap-2.5 rounded-2xl border border-line bg-white p-4">
        <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Comment recevoir les visites ?
        </legend>
        <label className="flex items-start gap-2.5 text-[13.5px] text-ink">
          <input
            type="checkbox"
            name="visitesIndividuelles"
            value="true"
            defaultChecked
            className="mt-0.5 h-4 w-4 accent-[var(--pvl-blue)]"
          />
          <span>
            <b>Demandes de visite individuelles</b> — les visiteurs vous contactent pour
            convenir d&apos;un créneau.
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-[13.5px] text-ink">
          <input
            type="checkbox"
            name="visitesGroupees"
            value="true"
            className="mt-0.5 h-4 w-4 accent-[var(--pvl-blue)]"
          />
          <span>
            <b>Visites groupées (portes ouvertes)</b> — vous fixez une ou plusieurs dates,
            les visiteurs s&apos;inscrivent et vous validez chaque inscription. Les dates se
            programment après la publication, depuis la modification de l&apos;annonce.
          </span>
        </label>
      </fieldset>

      {state.error ? (
        <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-yellow px-6.5 py-4 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Publication…" : "Publier mon annonce →"}
      </button>
    </form>
  );
}
