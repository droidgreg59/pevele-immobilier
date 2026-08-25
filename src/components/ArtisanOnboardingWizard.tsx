"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateArtisanProfileAction } from "@/lib/artisan-actions";
import { artisanCategories } from "@/data/artisanCategories";
import { villages } from "@/data/villages";
import type { ArtisanProfile } from "@/lib/artisans";

type Step = "entreprise" | "specialites" | "zone" | "coordonnees" | "recap";
const STEPS: Step[] = ["entreprise", "specialites", "zone", "coordonnees", "recap"];

export default function ArtisanOnboardingWizard({ artisan }: { artisan: ArtisanProfile }) {
  const [step, setStep] = useState<Step>("entreprise");
  const [entreprise, setEntreprise] = useState(artisan.entreprise ?? artisan.nom);
  const [description, setDescription] = useState(artisan.description ?? "");
  const [categories, setCategories] = useState<string[]>(artisan.categories);
  const [communes, setCommunes] = useState<string[]>(artisan.communesDesservies);
  const [telephone, setTelephone] = useState(artisan.telephone ?? "");
  const [adresse, setAdresse] = useState(artisan.adresse ?? "");
  const [codePostal, setCodePostal] = useState(artisan.codePostal ?? "");
  const [ville, setVille] = useState(artisan.ville ?? "");
  const [siteWeb, setSiteWeb] = useState(artisan.siteWeb ?? "");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function goNext() {
    setError(null);
    if (step === "entreprise" && !entreprise.trim()) {
      setError("Merci d'indiquer le nom de votre entreprise.");
      return;
    }
    if (step === "specialites" && categories.length === 0) {
      setError("Choisissez au moins une spécialité.");
      return;
    }
    setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  }

  function goBack() {
    setError(null);
    setStep(STEPS[Math.max(stepIndex - 1, 0)]);
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("entreprise", entreprise);
    formData.set("description", description);
    formData.set("telephone", telephone);
    formData.set("adresse", adresse);
    formData.set("codePostal", codePostal);
    formData.set("ville", ville);
    formData.set("siteWeb", siteWeb);
    for (const c of categories) formData.append("categories", c);
    for (const slug of communes) formData.append("communesDesservies", slug);

    startTransition(async () => {
      const result = await updateArtisanProfileAction({}, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-6 py-10 sm:py-16">
      <div className="h-1.5 w-full rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-blue transition-all duration-[240ms]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        {stepIndex > 0 ? (
          <button type="button" onClick={goBack} className="text-[13px] font-semibold text-blue">
            ← Retour
          </button>
        ) : (
          <Link href="/compte" className="text-[13px] font-semibold text-blue">
            Passer pour l&apos;instant →
          </Link>
        )}
        <span className="text-[12px] font-medium text-muted-2">
          Étape {stepIndex + 1}/{STEPS.length}
        </span>
      </div>

      {step === "entreprise" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-gold">
              Bienvenue
            </span>
            <h1 className="mt-3 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Créons votre fiche artisan
            </h1>
            <p className="mt-2 text-[14.5px] leading-[1.6] text-muted">
              Quelques informations pour que les habitants de la Pévèle puissent vous trouver et
              demander un devis.
            </p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Nom de l&apos;entreprise
            </span>
            <input
              value={entreprise}
              onChange={(e) => setEntreprise(e.target.value)}
              required
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Présentation
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Votre activité, votre expérience, vos réalisations…"
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
        </div>
      ) : null}

      {step === "specialites" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[30px] leading-tight text-ink sm:text-[34px]">
              Quelles sont vos spécialités ?
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">Choisissez-en au moins une.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {artisanCategories.map((cat) => {
              const active = categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle(categories, setCategories, cat)}
                  className="rounded-full px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-surface"
                  style={{
                    background: active ? "var(--pvl-ink)" : "#fff",
                    color: active ? "#fff" : "var(--pvl-ink)",
                    border: `1px solid ${active ? "transparent" : "var(--pvl-line)"}`,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === "zone" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[30px] leading-tight text-ink sm:text-[34px]">
              Où intervenez-vous ?
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">
              Facultatif — laissez vide pour intervenir partout en Pévèle.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {villages.map((v) => {
              const active = communes.includes(v.slug);
              return (
                <button
                  key={v.slug}
                  type="button"
                  onClick={() => toggle(communes, setCommunes, v.slug)}
                  className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--pvl-blue-soft)" : "#fff",
                    color: active ? "var(--pvl-blue)" : "var(--pvl-ink)",
                    border: `1px solid ${active ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
                  }}
                >
                  {v.nom}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === "coordonnees" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[30px] leading-tight text-ink sm:text-[34px]">
              Vos coordonnées
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">Facultatif, mais rassure vos futurs clients.</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Téléphone
            </span>
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              type="tel"
              placeholder="ex. 03 20 00 00 00"
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Adresse
            </span>
            <input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="ex. 5 rue des Artisans"
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Code postal
              </span>
              <input
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="ex. 59830"
                className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Ville
              </span>
              <input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="ex. Cysoing"
                className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Site web
            </span>
            <input
              value={siteWeb}
              onChange={(e) => setSiteWeb(e.target.value)}
              type="url"
              placeholder="https://…"
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
        </div>
      ) : null}

      {step === "recap" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[30px] leading-tight text-ink sm:text-[34px]">
              Votre fiche est prête
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">
              Voici ce que verront les habitants de la Pévèle.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
            <span className="font-display text-xl text-ink">{entreprise}</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-[#FBF3DC] px-3 py-1.5 text-[12px] font-semibold text-gold"
                >
                  {c}
                </span>
              ))}
            </div>
            <span className="text-[13px] text-muted">
              {communes.length > 0
                ? `Intervient à : ${communes
                    .map((slug) => villages.find((v) => v.slug === slug)?.nom)
                    .filter(Boolean)
                    .join(", ")}`
                : "Intervient dans toute la Pévèle"}
            </span>
            {telephone ? <span className="text-[13px] text-muted">{telephone}</span> : null}
          </div>

          {error ? (
            <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="self-start rounded-full bg-yellow px-6.5 py-4 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Publication…" : "Terminer et voir ma fiche publique →"}
          </button>
        </div>
      ) : null}

      {step !== "recap" ? (
        <>
          {error ? (
            <p className="m-0 rounded-xl bg-[#FBEAEA] px-4 py-3 text-[13px] text-ink">{error}</p>
          ) : null}
          <button
            type="button"
            onClick={goNext}
            className="self-start rounded-full bg-blue px-6 py-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            Continuer →
          </button>
        </>
      ) : null}
    </div>
  );
}
