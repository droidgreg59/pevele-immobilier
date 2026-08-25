"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { updateAgencyProfileAction } from "@/lib/agency-actions";
import type { AgencyProfile } from "@/lib/agencies";

type Step = "agence" | "adresse" | "logo" | "recap";
const STEPS: Step[] = ["agence", "adresse", "logo", "recap"];

export default function AgencyOnboardingWizard({ agency }: { agency: AgencyProfile }) {
  const [step, setStep] = useState<Step>("agence");
  const [entreprise, setEntreprise] = useState(agency.entreprise ?? agency.nom);
  const [telephone, setTelephone] = useState(agency.telephone ?? "");
  const [adresse, setAdresse] = useState(agency.adresse ?? "");
  const [codePostal, setCodePostal] = useState(agency.codePostal ?? "");
  const [ville, setVille] = useState(agency.ville ?? "");
  const [siteWeb, setSiteWeb] = useState(agency.siteWeb ?? "");
  const [googleAvisUrl, setGoogleAvisUrl] = useState(agency.googleAvisUrl ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(agency.logoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  function goNext() {
    setError(null);
    if (step === "agence" && !entreprise.trim()) {
      setError("Merci d'indiquer le nom de votre agence.");
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
    formData.set("telephone", telephone);
    formData.set("adresse", adresse);
    formData.set("codePostal", codePostal);
    formData.set("ville", ville);
    formData.set("siteWeb", siteWeb);
    formData.set("googleAvisUrl", googleAvisUrl);
    const logoFile = fileInputRef.current?.files?.[0];
    if (logoFile) formData.set("logo", logoFile);

    startTransition(async () => {
      const result = await updateAgencyProfileAction({}, formData);
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

      {step === "agence" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
              Bienvenue
            </span>
            <h1 className="mt-3 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Créons votre page agence
            </h1>
            <p className="mt-2 text-[14.5px] leading-[1.6] text-muted">
              Quelques informations pour que les particuliers de la Pévèle puissent vous trouver et vous
              contacter.
            </p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Nom de l&apos;agence
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
        </div>
      ) : null}

      {step === "adresse" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[30px] leading-tight text-ink sm:text-[34px]">
              Où êtes-vous situés ?
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">Facultatif, mais rassure vos futurs clients.</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Adresse
            </span>
            <input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="ex. 12 place de la Mairie"
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
        </div>
      ) : null}

      {step === "logo" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[30px] leading-tight text-ink sm:text-[34px]">
              Logo et liens utiles
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">Facultatif — vous pourrez les ajouter plus tard.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Logo de l&apos;agence
            </span>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-xl text-muted-2">
                    {entreprise.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="cursor-pointer rounded-full border border-line bg-white px-4 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface">
                {logoPreview ? "Changer le logo" : "Ajouter un logo"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setLogoPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
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
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Lien vers votre fiche Google (avis)
            </span>
            <input
              value={googleAvisUrl}
              onChange={(e) => setGoogleAvisUrl(e.target.value)}
              type="url"
              placeholder="https://g.page/r/…"
              className="rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>
        </div>
      ) : null}

      {step === "recap" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[30px] leading-tight text-ink sm:text-[34px]">
              Votre page est prête
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">
              Voici ce que verront les particuliers sur votre fiche.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-lg text-muted-2">
                  {entreprise.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-xl text-ink">{entreprise}</span>
              <span className="text-[13px] text-muted">
                {[adresse, [codePostal, ville].filter(Boolean).join(" ")].filter(Boolean).join(", ") ||
                  "Adresse non renseignée"}
              </span>
              {telephone ? <span className="text-[13px] text-muted">{telephone}</span> : null}
            </div>
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
            {pending ? "Publication…" : "Terminer et voir ma page publique →"}
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
