"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createSavedSearchAction } from "@/lib/saved-search-actions";
import { villages } from "@/data/villages";

type Transaction = "VENTE" | "LOCATION";
type TypeBienChoice = "MAISON" | "APPARTEMENT" | "TERRAIN" | null;
type Step = "projet" | "type" | "budget" | "lieu" | "recap" | "success";

const STEPS: Step[] = ["projet", "type", "budget", "lieu", "recap"];

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

function formatEuros(n: number) {
  return n.toLocaleString("fr-FR") + " €";
}

function OptionCard({
  title,
  desc,
  active,
  onClick,
}: {
  title: string;
  desc?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1.5 border-[2.5px] border-ink px-5 py-5 text-left transition-colors hover:bg-[#FDEBC2]"
      style={{ background: active ? "#FBF3DC" : "#fff" }}
    >
      <span className="font-sans text-[17px] font-bold text-ink">{title}</span>
      {desc ? (
        <span className="font-sans text-[13px] leading-[1.45] text-muted">{desc}</span>
      ) : null}
    </button>
  );
}

function RecapTag({
  label,
  bg,
  color,
  rotate,
  onClick,
}: {
  label: string;
  bg: string;
  color: string;
  rotate: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-2 border-ink px-3.5 py-2 font-mono text-[11px] font-semibold hover:brightness-95"
      style={{ background: bg, color, transform: `rotate(${rotate})` }}
    >
      {label}
    </button>
  );
}

export default function ProjectWizard({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [step, setStep] = useState<Step>("projet");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [typeBien, setTypeBien] = useState<TypeBienChoice>(null);
  const [typeAnswered, setTypeAnswered] = useState(false);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [lieu, setLieu] = useState("");
  const [isPending, startTransition] = useTransition();

  const stepIndex = STEPS.indexOf(step);
  const progress = step === "success" ? 1 : (stepIndex + 1) / STEPS.length;

  function goBack() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  }

  function handleSave() {
    startTransition(async () => {
      await createSavedSearchAction({
        transaction: transaction ?? "VENTE",
        typeBien: typeBien ?? undefined,
        q: lieu || undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        next: "/mon-projet",
      });
      setStep("success");
    });
  }

  function budgetLabel() {
    if (!budgetMin && !budgetMax) return "Budget non précisé";
    if (budgetMin && budgetMax) {
      return `${formatEuros(Number(budgetMin))} – ${formatEuros(Number(budgetMax))}`;
    }
    if (budgetMax) return `Jusqu'à ${formatEuros(Number(budgetMax))}`;
    return `À partir de ${formatEuros(Number(budgetMin))}`;
  }

  function resultUrl() {
    const base = transaction === "LOCATION" ? "/louer" : "/acheter";
    const params = new URLSearchParams();
    if (lieu) params.set("q", lieu);
    if (typeBien) params.set("type", typeBien);
    if (budgetMin) params.set("budgetMin", budgetMin);
    if (budgetMax) params.set("budget", budgetMax);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-6 py-10 sm:py-16">
      {step !== "success" ? (
        <>
          <div className="h-1.5 w-full border border-ink bg-white">
            <div
              className="h-full bg-blue transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="font-mono text-[11px] font-medium text-blue"
              >
                ← RETOUR
              </button>
            ) : (
              <Link href="/" className="font-mono text-[11px] font-medium text-blue">
                ← ANNULER
              </Link>
            )}
            <span className="font-mono text-[10.5px] font-medium text-muted-2">
              ÉTAPE {stepIndex + 1}/{STEPS.length}
            </span>
          </div>
        </>
      ) : null}

      {step === "projet" ? (
        <div className="animate-view-in flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              QUEL EST VOTRE PROJET ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Choisissez ce qui correspond le mieux à votre recherche.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <OptionCard
              title="ACHETER"
              desc="Trouver le bien qui vous correspond, pour y vivre ou investir."
              active={transaction === "VENTE"}
              onClick={() => {
                setTransaction("VENTE");
                setStep("type");
              }}
            />
            <OptionCard
              title="LOUER"
              desc="Trouver une location adaptée à votre besoin."
              active={transaction === "LOCATION"}
              onClick={() => {
                setTransaction("LOCATION");
                setStep("type");
              }}
            />
          </div>
        </div>
      ) : null}

      {step === "type" ? (
        <div className="animate-view-in flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              QUEL TYPE DE BIEN ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Vous pourrez toujours affiner plus tard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {(["MAISON", "APPARTEMENT", "TERRAIN"] as const).map((t) => (
              <OptionCard
                key={t}
                title={TYPE_BIEN_LABEL[t]}
                active={typeAnswered && typeBien === t}
                onClick={() => {
                  setTypeBien(t);
                  setTypeAnswered(true);
                  setStep("budget");
                }}
              />
            ))}
            <OptionCard
              title="PEU IMPORTE"
              active={typeAnswered && typeBien === null}
              onClick={() => {
                setTypeBien(null);
                setTypeAnswered(true);
                setStep("budget");
              }}
            />
          </div>
        </div>
      ) : null}

      {step === "budget" ? (
        <div className="animate-view-in flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              QUEL EST VOTRE BUDGET ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Facultatif — laissez vide si vous ne savez pas encore.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] font-medium text-muted">
                MINIMUM (€)
              </span>
              <input
                type="number"
                min={0}
                step={5000}
                placeholder="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10.5px] font-medium text-muted">
                MAXIMUM (€)
              </span>
              <input
                type="number"
                min={0}
                step={5000}
                placeholder="ex. 350000"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setStep("lieu")}
            className="self-start bg-yellow px-6 py-3.5 font-mono text-[12px] font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px"
          >
            SUIVANT →
          </button>
        </div>
      ) : null}

      {step === "lieu" ? (
        <div className="animate-view-in flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              OÙ CHERCHEZ-VOUS ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Un village en particulier, ou toute la Pévèle.
            </p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] font-medium text-muted">
              VILLAGE (FACULTATIF)
            </span>
            <input
              list="pw-villages"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder="ex. Cysoing"
              className="border-[2.5px] border-ink bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none focus:border-blue"
            />
            <datalist id="pw-villages">
              {villages.map((v) => (
                <option key={v.slug} value={v.nom} />
              ))}
            </datalist>
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setStep("recap")}
              className="bg-yellow px-6 py-3.5 font-mono text-[12px] font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px"
            >
              SUIVANT →
            </button>
            <button
              type="button"
              onClick={() => {
                setLieu("");
                setStep("recap");
              }}
              className="font-mono text-[11px] font-medium text-blue"
            >
              TOUTE LA PÉVÈLE →
            </button>
          </div>
        </div>
      ) : null}

      {step === "recap" ? (
        <div className="animate-view-in flex flex-col gap-6">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              VOTRE PROJET
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Vérifiez, puis enregistrez pour retrouver votre recherche dans
              votre compte.
            </p>
          </div>

          <div className="relative flex flex-wrap gap-3.5 border-[2.5px] border-ink bg-white p-7">
            <RecapTag
              label={transaction === "LOCATION" ? "Location" : "Achat"}
              bg="var(--pvl-yellow)"
              color="var(--pvl-ink)"
              rotate="-1.5deg"
              onClick={() => setStep("projet")}
            />
            <RecapTag
              label={typeBien ? TYPE_BIEN_LABEL[typeBien] : "Tous types"}
              bg="var(--pvl-gold)"
              color="#fff"
              rotate="1deg"
              onClick={() => setStep("type")}
            />
            <RecapTag
              label={budgetLabel()}
              bg="var(--pvl-blue)"
              color="#fff"
              rotate="-1deg"
              onClick={() => setStep("budget")}
            />
            <RecapTag
              label={lieu || "Toute la Pévèle"}
              bg="var(--pvl-green)"
              color="#fff"
              rotate="1.5deg"
              onClick={() => setStep("lieu")}
            />
          </div>
          <span className="-mt-3 font-mono text-[9.5px] text-muted-2">
            ✎ cliquez sur une étiquette pour modifier
          </span>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="self-start bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-[4px_4px_0_var(--pvl-blue)] hover:translate-x-px hover:translate-y-px disabled:opacity-60"
            >
              {isPending ? "ENREGISTREMENT…" : "ENREGISTRER MA RECHERCHE →"}
            </button>
            {!isLoggedIn ? (
              <span className="font-mono text-[10.5px] text-muted-2">
                Vous devrez vous connecter pour enregistrer votre recherche.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "success" ? (
        <div className="animate-view-in flex flex-col gap-5">
          <div className="border-[2.5px] border-ink bg-[#EAF3E8] p-6">
            <span className="font-mono text-[10.5px] font-semibold text-green">
              ✓ RECHERCHE ENREGISTRÉE
            </span>
            <p className="m-0 mt-2 font-sans text-[14.5px] leading-[1.6] text-ink">
              Nous avons bien noté votre projet. Retrouvez-le à tout moment
              dans votre compte, avec les nouvelles annonces qui y
              correspondent.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href={resultUrl()}
              className="border-2 border-ink px-5 py-3.5 font-mono text-[11.5px] font-semibold text-ink hover:bg-[#FDEBC2]"
            >
              VOIR LES ANNONCES CORRESPONDANTES →
            </Link>
            <Link
              href="/compte"
              className="font-mono text-[11.5px] font-medium text-blue"
            >
              RETOUR À MON COMPTE →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
