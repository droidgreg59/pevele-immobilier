"use client";

import { useActionState, useState } from "react";
import {
  updateListingAction,
  deleteListingAction,
  type ListingFormState,
} from "@/lib/listing-actions";
import { villages } from "@/data/villages";
import { MAX_PHOTOS } from "@/lib/photo-constants";
import type { ListingWithOwner } from "@/lib/listings";
import PhotoDropzone from "./PhotoDropzone";

const initialState: ListingFormState = {};
const DPE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];

export default function EditListingForm({ listing }: { listing: ListingWithOwner }) {
  const [state, formAction, pending] = useActionState(
    updateListingAction,
    initialState
  );
  const [transaction, setTransaction] = useState<"VENTE" | "LOCATION">(
    listing.transaction
  );
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const visiblePhotos = listing.photos.filter((p) => !removedIds.includes(p.id));

  return (
    <div className="flex flex-col gap-9">
      <form action={formAction} className="flex max-w-[720px] flex-col gap-5">
        <input type="hidden" name="listingId" value={listing.id} />
        <input type="hidden" name="transaction" value={transaction} />

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
            defaultValue={listing.titre}
            className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
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
              defaultValue={listing.villageSlug}
              className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
            >
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
              defaultValue={listing.typeBien}
              className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
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
              defaultValue={listing.prix}
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
              defaultValue={listing.surface}
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
              defaultValue={listing.pieces}
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
              defaultValue={listing.chambres}
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
              defaultValue={listing.exterieur === "—" ? "" : listing.exterieur}
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
              defaultValue={listing.dpe ?? ""}
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
            defaultValue={listing.description}
            className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>

        {visiblePhotos.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10.5px] font-medium text-muted">
              PHOTOS ACTUELLES
            </span>
            <div className="flex flex-wrap gap-2">
              {visiblePhotos.map((p) => (
                <div
                  key={p.id}
                  className="relative h-20 w-20 overflow-hidden border-2 border-ink"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setRemovedIds((prev) => [...prev, p.id])}
                    aria-label="Retirer cette photo"
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] leading-none text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {removedIds.map((id) => (
          <input key={id} type="hidden" name="removePhotoIds" value={id} />
        ))}

        <PhotoDropzone maxNewPhotos={MAX_PHOTOS - visiblePhotos.length} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] font-medium text-muted">
              LIEN VIDÉO (YOUTUBE/VIMEO, FACULTATIF)
            </span>
            <input
              name="videoUrl"
              type="url"
              defaultValue={listing.videoUrl ?? ""}
              placeholder="https://youtube.com/watch?v=…"
              className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] font-medium text-muted">
              LIEN VISITE VIRTUELLE 360° (FACULTATIF)
            </span>
            <input
              name="visiteVirtuelleUrl"
              type="url"
              defaultValue={listing.visiteVirtuelleUrl ?? ""}
              placeholder="https://…"
              className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
            />
          </label>
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
          {pending ? "ENREGISTREMENT…" : "ENREGISTRER LES MODIFICATIONS →"}
        </button>
      </form>

      <div className="max-w-[720px] border-2 border-dashed border-ink p-6">
        <span className="font-mono text-[10.5px] font-medium text-ink">
          ZONE SENSIBLE
        </span>
        <p className="m-0 mt-2 font-sans text-[13px] text-muted">
          Supprimer cette annonce est définitif : elle disparaît du plan et de
          votre compte.
        </p>
        <form
          action={deleteListingAction}
          className="mt-3"
          onSubmit={(e) => {
            if (!window.confirm("Supprimer définitivement cette annonce ?")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="listingId" value={listing.id} />
          <button
            type="submit"
            className="border-2 border-ink px-4 py-2.5 font-mono text-[11px] font-semibold text-ink hover:bg-[#FBEAEA]"
          >
            SUPPRIMER CETTE ANNONCE
          </button>
        </form>
      </div>
    </div>
  );
}
