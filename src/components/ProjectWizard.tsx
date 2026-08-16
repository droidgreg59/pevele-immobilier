"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createSavedSearchAction } from "@/lib/saved-search-actions";
import { villages } from "@/data/villages";
import { EQUIPEMENTS } from "@/data/equipements";
import VillageMultiSelect from "./VillageMultiSelect";

type Transaction = "VENTE" | "LOCATION";
type TypeBienChoice = "MAISON" | "APPARTEMENT" | "TERRAIN" | null;
type Step =
  | "projet"
  | "type"
  | "chambres"
  | "criteres"
  | "budget"
  | "lieu"
  | "recap"
  | "success";

const STEPS: Step[] = [
  "projet",
  "type",
  "chambres",
  "criteres",
  "budget",
  "lieu",
  "recap",
];

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

const CHAMBRES_OPTIONS = [1, 2, 3, 4] as const;

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
      className="flex flex-col gap-1.5 rounded-2xl px-5 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: active ? "#FBF3DC" : "#fff",
        border: `1px solid ${active ? "transparent" : "var(--pvl-line)"}`,
      }}
    >
      <span className="font-sans text-[17px] font-bold text-ink">{title}</span>
      {desc ? (
        <span className="font-sans text-[13px] leading-[1.45] text-muted">{desc}</span>
      ) : null}
    </button>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2.5 font-sans text-[14px] font-medium transition-colors hover:bg-surface"
      style={{
        background: active ? "#FBF3DC" : "#fff",
        color: "var(--pvl-ink)",
        border: `1px solid ${active ? "transparent" : "var(--pvl-line)"}`,
      }}
    >
      {label}
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
      className="rounded-xl px-3.5 py-2 font-mono text-[11px] font-semibold shadow-sm transition hover:brightness-95"
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
  const [chambresMin, setChambresMin] = useState<number | null>(null);
  const [chambresAnswered, setChambresAnswered] = useState(false);
  const [equipements, setEquipements] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [villageSlugs, setVillageSlugs] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const stepIndex = STEPS.indexOf(step);
  const progress = step === "success" ? 1 : (stepIndex + 1) / STEPS.length;

  function goBack() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  }

  function toggleEquipement(tag: string) {
    setEquipements((prev) =>
      prev.includes(tag) ? prev.filter((e) => e !== tag) : [...prev, tag]
    );
  }

  function handleSave() {
    startTransition(async () => {
      await createSavedSearchAction({
        transaction: transaction ?? "VENTE",
        typeBien: typeBien ?? undefined,
        villageSlugs: villageSlugs.length > 0 ? villageSlugs : undefined,
        chambresMin: chambresMin ?? undefined,
        equipements: equipements.length > 0 ? equipements : undefined,
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

  function villagesLabel() {
    if (villageSlugs.length === 0) return "Toute la Pévèle";
    const noms = villageSlugs
      .map((slug) => villages.find((v) => v.slug === slug)?.nom)
      .filter((n): n is string => Boolean(n));
    if (noms.length <= 2) return noms.join(", ");
    return `${noms.length} villages`;
  }

  function resultUrl() {
    const base = transaction === "LOCATION" ? "/louer" : "/acheter";
    const params = new URLSearchParams();
    if (villageSlugs.length > 0) params.set("villages", villageSlugs.join(","));
    if (typeBien) params.set("type", typeBien);
    if (chambresMin) params.set("chambresMin", String(chambresMin));
    if (equipements.length > 0) params.set("equip", equipements.join(","));
    if (budgetMin) params.set("budgetMin", budgetMin);
    if (budgetMax) params.set("budget", budgetMax);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-6 py-10 sm:py-16">
      {step !== "success" ? (
        <>
          <div className="h-1.5 w-full rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-blue transition-all"
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
                  setStep("chambres");
                }}
              />
            ))}
            <OptionCard
              title="PEU IMPORTE"
              active={typeAnswered && typeBien === null}
              onClick={() => {
                setTypeBien(null);
                setTypeAnswered(true);
                setStep("chambres");
              }}
            />
          </div>
        </div>
      ) : null}

      {step === "chambres" ? (
        <div className="animate-view-in flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              COMBIEN DE CHAMBRES ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Le nombre minimum de chambres souhaité.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-5">
            <OptionCard
              title="Peu importe"
              active={chambresAnswered && chambresMin === null}
              onClick={() => {
                setChambresMin(null);
                setChambresAnswered(true);
                setStep("criteres");
              }}
            />
            {CHAMBRES_OPTIONS.map((n) => (
              <OptionCard
                key={n}
                title={`${n}+`}
                active={chambresAnswered && chambresMin === n}
                onClick={() => {
                  setChambresMin(n);
                  setChambresAnswered(true);
                  setStep("criteres");
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {step === "criteres" ? (
        <div className="animate-view-in flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              DES CRITÈRES EN PARTICULIER ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Facultatif — sélectionnez tout ce qui compte pour vous.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {EQUIPEMENTS.map((eq) => (
              <ToggleChip
                key={eq}
                label={eq}
                active={equipements.includes(eq)}
                onClick={() => toggleEquipement(eq)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep("budget")}
            className="self-start rounded-full bg-yellow px-6 py-3 font-mono text-[12px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
          >
            SUIVANT →
          </button>
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
                className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
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
                className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setStep("lieu")}
            className="self-start rounded-full bg-yellow px-6 py-3 font-mono text-[12px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
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
              Un ou plusieurs villages, ou toute la Pévèle.
            </p>
          </div>
          <VillageMultiSelect value={villageSlugs} onChange={setVillageSlugs} />
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setStep("recap")}
              className="rounded-full bg-yellow px-6 py-3 font-mono text-[12px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
            >
              SUIVANT →
            </button>
            {villageSlugs.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setVillageSlugs([]);
                  setStep("recap");
                }}
                className="font-mono text-[11px] font-medium text-blue"
              >
                TOUTE LA PÉVÈLE →
              </button>
            ) : null}
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

          <div className="relative flex flex-wrap gap-3.5 rounded-2xl border border-line bg-white p-7 shadow-sm">
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
            {chambresMin ? (
              <RecapTag
                label={`${chambresMin}+ chambres`}
                bg="var(--pvl-ink)"
                color="#fff"
                rotate="-1deg"
                onClick={() => setStep("chambres")}
              />
            ) : null}
            {equipements.length > 0 ? (
              <RecapTag
                label={
                  equipements.length <= 2
                    ? equipements.join(", ")
                    : `${equipements.length} critères`
                }
                bg="#FBF3DC"
                color="var(--pvl-gold)"
                rotate="1.5deg"
                onClick={() => setStep("criteres")}
              />
            ) : null}
            <RecapTag
              label={budgetLabel()}
              bg="var(--pvl-blue)"
              color="#fff"
              rotate="-1deg"
              onClick={() => setStep("budget")}
            />
            <RecapTag
              label={villagesLabel()}
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
              className="self-start rounded-full bg-yellow px-6.5 py-4 font-mono text-xs font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
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
          <div className="rounded-2xl bg-[#EAF3E8] p-6">
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
              className="rounded-full border border-line px-5 py-3 font-mono text-[11.5px] font-semibold text-ink transition hover:bg-surface"
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
