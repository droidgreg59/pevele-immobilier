"use client";

import { useState } from "react";
import Link from "next/link";

type Profil = "particulier" | "agence";

const ETAPE_LABELS = ["QUI ÊTES-VOUS ?", "VOTRE BIEN", "PUBLICATION"];

export default function PublishWizard() {
  const [etape, setEtape] = useState(1);
  const [profil, setProfil] = useState<Profil>("particulier");
  const [titre, setTitre] = useState("");
  const [village, setVillage] = useState("");
  const [prix, setPrix] = useState("");

  const numAnnonce = "2607-" + String(112 + (titre.length % 9));
  const titreShown = titre || "Votre annonce";
  const villageShown = (village || "VOTRE VILLAGE").toUpperCase();
  const villageShown2 = village || "votre village";

  return (
    <div className="animate-view-in max-w-[1100px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="border-2 border-gold px-3 py-1.5 font-mono text-sm text-gold">
          PIÈCE 03
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          L&apos;ATELIER — VOTRE ANNONCE
        </h2>
      </div>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <div className="mt-6 flex border-[2.5px] border-ink bg-white">
        {ETAPE_LABELS.map((label, i) => {
          const n = i + 1;
          const active = etape === n;
          const done = etape > n;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (n < etape) setEtape(n);
              }}
              className="flex-1 border-r-2 border-ink px-3.5 py-3.5 text-center font-mono text-[11px] font-medium last:border-r-0"
              style={{
                background: active ? "var(--pvl-blue)" : done ? "#EDF1FB" : "#fff",
                color: active ? "#fff" : "var(--pvl-ink)",
                cursor: n < etape ? "pointer" : "default",
              }}
            >
              {n} — {label}
            </button>
          );
        })}
      </div>

      {etape === 1 && (
        <div className="animate-draw-in mt-6.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setProfil("particulier")}
            className="flex flex-col gap-2.5 border-[2.5px] border-ink p-6.5 text-left transition-colors hover:bg-[#FDEBC2]"
            style={{ background: profil === "particulier" ? "#FBF3DC" : "#fff" }}
          >
            <span className="font-display text-2xl text-ink">
              JE SUIS UN PARTICULIER
            </span>
            <span className="font-sans text-[14px] leading-[1.55] text-muted">
              Vous vendez ou louez votre propre bien. Annonce vérifiée, badge
              « Entre voisins », aucune commission.
            </span>
            <span className="font-mono text-[10.5px] font-medium text-green">
              {profil === "particulier" ? "✓ SÉLECTIONNÉ" : ""}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setProfil("agence")}
            className="flex flex-col gap-2.5 border-[2.5px] border-ink p-6.5 text-left transition-colors hover:bg-[#FDEBC2]"
            style={{ background: profil === "agence" ? "#FBF3DC" : "#fff" }}
          >
            <span className="font-display text-2xl text-ink">
              JE SUIS UNE AGENCE
            </span>
            <span className="font-sans text-[14px] leading-[1.55] text-muted">
              Compte pro : diffusion illimitée, badge agence, statistiques et
              mise en avant sur le plan des villages.
            </span>
            <span className="font-mono text-[10.5px] font-medium text-green">
              {profil === "agence" ? "✓ SÉLECTIONNÉ" : ""}
            </span>
          </button>
          <div className="flex justify-end sm:col-span-2">
            <button
              type="button"
              onClick={() => setEtape(2)}
              className="bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px"
            >
              CONTINUER →
            </button>
          </div>
        </div>
      )}

      {etape === 2 && (
        <div className="animate-draw-in mt-6.5 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] font-medium text-muted">
                TITRE DE L&apos;ANNONCE
              </span>
              <input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="ex. Longère rénovée, jardin clos"
                className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] font-medium text-muted">
                VILLAGE
              </span>
              <input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="ex. Cysoing"
                className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] font-medium text-muted">
                PRIX DEMANDÉ
              </span>
              <input
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="ex. 365 000 €"
                className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] font-medium text-muted">
                SURFACE
              </span>
              <input
                placeholder="ex. 142 m²"
                className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
              />
            </label>
          </div>
          <div className="flex items-center justify-center gap-3.5 border-2 border-dashed border-muted-2 bg-white p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-blue font-sans text-xl font-semibold text-blue">
              ↑
            </span>
            <span className="font-sans text-[14px] leading-[1.5] text-muted">
              Glissez vos photos ici — et votre plan 2D si vous en avez un.
              <br />
              <b className="text-ink">
                Les annonces avec plan reçoivent nettement plus de contacts.
              </b>
            </span>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setEtape(1)}
              className="py-3.5 font-mono text-[11.5px] font-medium text-muted"
            >
              ← RETOUR
            </button>
            <button
              type="button"
              onClick={() => setEtape(3)}
              className="bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px"
            >
              PUBLIER MON ANNONCE →
            </button>
          </div>
        </div>
      )}

      {etape === 3 && (
        <div className="animate-draw-in relative mt-6.5 flex max-w-[760px] flex-col gap-3.5 border-[2.5px] border-ink bg-white p-9 shadow-[6px_6px_0_rgba(39,67,166,.22)]">
          <span className="font-mono text-[10.5px] font-medium text-muted">
            ANNONCE N°{numAnnonce} — {villageShown}
          </span>
          <span className="font-display text-[36px] text-ink">
            VOTRE PLACE EST RÉSERVÉE
            <br />
            SUR LE PLAN.
          </span>
          <p className="m-0 max-w-[52ch] font-sans text-[14.5px] leading-[1.6] text-muted">
            « {titreShown} » est en cours de vérification (moins de 24 h, par
            un humain). Dès validation, elle apparaît dans le Séjour et sur le
            plan de {villageShown2}.
          </p>
          <Link
            href="/acheter"
            className="self-start border-b-2 border-yellow pb-0.5 font-mono text-[11.5px] font-medium text-blue"
          >
            VOIR LES ANNONCES EN LIGNE →
          </Link>
          <span className="animate-stamp-in pointer-events-none absolute right-6.5 top-5.5 flex h-32 w-32 items-center justify-center rounded-full border-[3px] border-blue text-center font-mono text-[11.5px] font-medium text-blue">
            VÉRIFIÉ
            <br />
            SOUS 24 H
            <br />· PÉVÈLE ·
          </span>
        </div>
      )}
    </div>
  );
}
