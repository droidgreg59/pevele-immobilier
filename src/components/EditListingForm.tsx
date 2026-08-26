"use client";

import { useActionState, useState } from "react";
import {
  updateListingAction,
  deleteListingAction,
  type ListingFormState,
} from "@/lib/listing-actions";
import { villages } from "@/data/villages";
import { EQUIPEMENTS } from "@/data/equipements";
import { MAX_PHOTOS } from "@/lib/photo-constants";
import type { ListingWithOwner } from "@/lib/listings";
import PhotoDropzone from "./PhotoDropzone";

const initialState: ListingFormState = {};
const DPE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];

export default function EditListingForm({
  listing,
  updateAction = updateListingAction,
  deleteAction = deleteListingAction,
}: {
  listing: ListingWithOwner;
  /** Permet au back-office admin de réutiliser ce formulaire sur une annonce qui n'appartient pas à l'utilisateur connecté. */
  updateAction?: typeof updateListingAction;
  deleteAction?: typeof deleteListingAction;
}) {
  const [state, formAction, pending] = useActionState(
    updateAction,
    initialState
  );
  const [transaction, setTransaction] = useState<"VENTE" | "LOCATION">(
    listing.transaction
  );
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const visiblePhotos = listing.photos.filter((p) => !removedIds.includes(p.id));
  const existingEquipements = listing.equipements
    ? listing.equipements.split(",").filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-9">
      {listing.statut === "REFUSEE" ? (
        <div className="max-w-[720px] rounded-2xl bg-[#FBEAEA] px-5 py-4">
          <span className="text-[11px] font-semibold text-ink">
            Annonce refusée
          </span>
          <p className="m-0 mt-1.5 text-[13.5px] leading-[1.6] text-ink">
            {listing.statutRaison ||
              "Aucun motif communiqué."}{" "}
            Modifiez l&apos;annonce ci-dessous pour la soumettre à nouveau à
            vérification.
          </p>
        </div>
      ) : null}
      <form action={formAction} className="flex max-w-[720px] flex-col gap-5">
        <input type="hidden" name="listingId" value={listing.id} />
        <input type="hidden" name="transaction" value={transaction} />

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
            defaultValue={listing.titre}
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
              defaultValue={listing.villageSlug}
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            >
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
              defaultValue={listing.typeBien}
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            >
              <option value="MAISON">Maison</option>
              <option value="APPARTEMENT">Appartement</option>
              <option value="TERRAIN">Terrain</option>
            </select>
          </label>
        </div>

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
              defaultValue={listing.prix}
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
              defaultValue={listing.surface}
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
              defaultValue={listing.pieces}
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
              defaultValue={listing.chambres}
              className="rounded-xl border border-line bg-white px-3 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Extérieur
            </span>
            <input
              name="exterieur"
              defaultValue={listing.exterieur === "—" ? "" : listing.exterieur}
              placeholder="ex. 500 m² jardin, balcon…"
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              DPE (si connu)
            </span>
            <select
              name="dpe"
              defaultValue={listing.dpe ?? ""}
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
                  defaultChecked={existingEquipements.includes(eq)}
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
            defaultValue={listing.description}
            className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </label>

        {visiblePhotos.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Photos actuelles
            </span>
            <div className="flex flex-wrap gap-2">
              {visiblePhotos.map((p) => (
                <div
                  key={p.id}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-line"
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
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Lien vidéo (YouTube/Vimeo, facultatif)
            </span>
            <input
              name="videoUrl"
              type="url"
              defaultValue={listing.videoUrl ?? ""}
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
              defaultValue={listing.visiteVirtuelleUrl ?? ""}
              placeholder="https://…"
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
        </div>

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
          {pending ? "Enregistrement…" : "Enregistrer les modifications →"}
        </button>
      </form>

      <div className="max-w-[720px] rounded-2xl border border-dashed border-line bg-surface p-6">
        <span className="text-[11px] font-semibold text-ink">
          Zone sensible
        </span>
        <p className="m-0 mt-2 text-[13px] text-muted">
          Supprimer cette annonce est définitif : elle disparaît des annonces
          et de votre compte.
        </p>
        <form
          action={deleteAction}
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
            className="rounded-full border border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-[#FBEAEA]"
          >
            Supprimer cette annonce
          </button>
        </form>
      </div>
    </div>
  );
}
