"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createSavedSearchAction } from "@/lib/saved-search-actions";
import { villages } from "@/data/villages";
import { EQUIPEMENTS } from "@/data/equipements";
import type { ListingWithOwner } from "@/lib/listings";
import { filterListings } from "@/lib/listing-filters";
import {
  readProjectDraft,
  writeProjectDraft,
  clearProjectDraft,
  type ProjectDraft,
} from "@/lib/project-draft";
import VillageMultiSelect from "./VillageMultiSelect";
import VillageTapMap from "./VillageTapMap";

type Transaction = "VENTE" | "LOCATION";
type TypeBienChoice = "MAISON" | "APPARTEMENT" | "TERRAIN" | null;
type TypeMaisonChoice = "INDIVIDUELLE" | "SEMI_INDIVIDUELLE" | "MITOYENNE" | null;
type Step =
  | "projet"
  | "lieu"
  | "budget"
  | "type"
  | "chambres"
  | "criteres"
  | "priorites"
  | "recap"
  | "success";

const STEPS: Step[] = ["projet", "lieu", "budget", "type", "chambres", "criteres", "priorites", "recap"];

const TYPE_BIEN_LABEL: Record<string, string> = {
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
  TERRAIN: "Terrain",
};

const TYPE_MAISON_LABEL: Record<string, string> = {
  INDIVIDUELLE: "Individuelle",
  SEMI_INDIVIDUELLE: "Semi-individuelle",
  MITOYENNE: "Mitoyenne",
};

const CHAMBRES_OPTIONS = [1, 2, 3, 4] as const;
const PRIORITES_OPTIONS = [
  "Le calme",
  "Un grand extérieur",
  "Beaucoup d'espace",
  "Être proche de Lille",
  "Un bien sans travaux",
  "Le charme de l'ancien",
  "Le prix avant tout",
];
const MAX_PRIORITES = 3;
const AUTO_ADVANCE_MS = 350;

function formatEuros(n: number) {
  return n.toLocaleString("fr-FR") + " €";
}

function isValidStep(value: unknown): value is Step {
  return typeof value === "string" && STEPS.includes(value as Step);
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
      className="flex items-center gap-3 rounded-2xl px-5 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: active ? "var(--pvl-blue-soft)" : "#fff",
        border: `1.5px solid ${active ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
      }}
    >
      <span className="flex-1">
        <span
          className="block font-sans text-[17px] font-bold"
          style={{ color: active ? "var(--pvl-blue)" : "var(--pvl-ink)" }}
        >
          {title}
        </span>
        {desc ? (
          <span className="mt-0.5 block font-sans text-[13px] leading-[1.45] text-muted">{desc}</span>
        ) : null}
      </span>
      {active ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue text-[12px] font-bold text-white">
          ✓
        </span>
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
      className="rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors"
      style={{
        background: active ? "var(--pvl-blue-soft)" : "#fff",
        color: active ? "var(--pvl-blue)" : "var(--pvl-ink)",
        border: `1.5px solid ${active ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
      }}
    >
      {label}
      {active ? " ✓" : ""}
    </button>
  );
}

function RecapTag({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-surface px-3.5 py-2 text-[12px] font-semibold text-ink transition hover:bg-line/60"
    >
      {label}
    </button>
  );
}

function MatchCounter({ count }: { count: number }) {
  return (
    <span className="text-center text-[12px] font-bold text-green">
      {count} bien{count > 1 ? "s" : ""} correspondant{count > 1 ? "s" : ""}
    </span>
  );
}

export default function ProjectWizard({
  isLoggedIn,
  listings,
}: {
  isLoggedIn: boolean;
  listings: ListingWithOwner[];
}) {
  const [hasStarted, setHasStarted] = useState(false);
  const [step, setStep] = useState<Step>("projet");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [typeBien, setTypeBien] = useState<TypeBienChoice>(null);
  const [typeAnswered, setTypeAnswered] = useState(false);
  const [typeMaison, setTypeMaison] = useState<TypeMaisonChoice>(null);
  const [typeMaisonAnswered, setTypeMaisonAnswered] = useState(false);
  const [chambresMin, setChambresMin] = useState<number | null>(null);
  const [chambresAnswered, setChambresAnswered] = useState(false);
  const [equipements, setEquipements] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [villageSlugs, setVillageSlugs] = useState<string[]>([]);
  const [priorites, setPriorites] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Reprend un brouillon existant après le montage (jamais pendant le rendu
  // initial : localStorage n'existe pas côté serveur, le lire plus tôt
  // provoquerait une erreur d'hydratation entre le HTML serveur et le client).
  useEffect(() => {
    const draft = readProjectDraft();
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reprise ponctuelle au montage, pas de re-render en boucle
    setHasStarted(true);
    setStep(isValidStep(draft.step) ? draft.step : "projet");
    setTransaction(draft.transaction);
    setTypeBien(draft.typeBien);
    setTypeAnswered(draft.typeAnswered);
    setTypeMaison(draft.typeMaison);
    setTypeMaisonAnswered(draft.typeMaisonAnswered);
    setChambresMin(draft.chambresMin);
    setChambresAnswered(draft.chambresAnswered);
    setEquipements(draft.equipements);
    setBudgetMin(draft.budgetMin);
    setBudgetMax(draft.budgetMax);
    setVillageSlugs(draft.villageSlugs);
    setPriorites(draft.priorites);
  }, []);

  const stepIndex = STEPS.indexOf(step);
  const progress = step === "success" ? 1 : (stepIndex + 1) / STEPS.length;

  function currentDraft(overrides: Partial<ProjectDraft> = {}): ProjectDraft {
    return {
      step,
      transaction,
      typeBien,
      typeAnswered,
      typeMaison,
      typeMaisonAnswered,
      chambresMin,
      chambresAnswered,
      equipements,
      budgetMin,
      budgetMax,
      villageSlugs,
      priorites,
      ...overrides,
    };
  }

  function persist(overrides: Partial<ProjectDraft> = {}) {
    writeProjectDraft(currentDraft(overrides));
  }

  /** Applique les valeurs d'overrides au state React (persist() ne fait que l'écrire en local storage). */
  function applyOverrides(overrides: Partial<ProjectDraft>) {
    if (overrides.transaction !== undefined) setTransaction(overrides.transaction);
    if (overrides.typeBien !== undefined) setTypeBien(overrides.typeBien);
    if (overrides.typeAnswered !== undefined) setTypeAnswered(overrides.typeAnswered);
    if (overrides.typeMaison !== undefined) setTypeMaison(overrides.typeMaison);
    if (overrides.typeMaisonAnswered !== undefined) setTypeMaisonAnswered(overrides.typeMaisonAnswered);
    if (overrides.chambresMin !== undefined) setChambresMin(overrides.chambresMin);
    if (overrides.chambresAnswered !== undefined) setChambresAnswered(overrides.chambresAnswered);
    if (overrides.equipements !== undefined) setEquipements(overrides.equipements);
    if (overrides.budgetMin !== undefined) setBudgetMin(overrides.budgetMin);
    if (overrides.budgetMax !== undefined) setBudgetMax(overrides.budgetMax);
    if (overrides.villageSlugs !== undefined) setVillageSlugs(overrides.villageSlugs);
    if (overrides.priorites !== undefined) setPriorites(overrides.priorites);
  }

  function goTo(next: Step, overrides: Partial<ProjectDraft> = {}) {
    applyOverrides(overrides);
    persist({ step: next, ...overrides });
    setStep(next);
  }

  function goToDelayed(next: Step, overrides: Partial<ProjectDraft> = {}) {
    applyOverrides(overrides);
    persist(overrides);
    window.setTimeout(() => goTo(next, overrides), AUTO_ADVANCE_MS);
  }

  function goBack() {
    if (stepIndex > 0) goTo(STEPS[stepIndex - 1]);
  }

  function handleVillageSlugsChange(slugs: string[]) {
    setVillageSlugs(slugs);
    persist({ villageSlugs: slugs });
  }

  function toggleEquipement(tag: string) {
    setEquipements((prev) => {
      const next = prev.includes(tag) ? prev.filter((e) => e !== tag) : [...prev, tag];
      persist({ equipements: next });
      return next;
    });
  }

  function togglePriorite(tag: string) {
    setPriorites((prev) => {
      if (prev.includes(tag)) {
        const next = prev.filter((p) => p !== tag);
        persist({ priorites: next });
        return next;
      }
      if (prev.length >= MAX_PRIORITES) return prev;
      const next = [...prev, tag];
      persist({ priorites: next });
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await createSavedSearchAction({
        transaction: transaction ?? "VENTE",
        typeBien: typeBien ?? undefined,
        typeMaison: typeBien === "MAISON" ? (typeMaison ?? undefined) : undefined,
        villageSlugs: villageSlugs.length > 0 ? villageSlugs : undefined,
        chambresMin: chambresMin ?? undefined,
        equipements: equipements.length > 0 ? equipements : undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        next: "/mon-projet",
      });
      clearProjectDraft();
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
    if (typeBien === "MAISON" && typeMaison) params.set("typeMaison", typeMaison);
    if (chambresMin) params.set("chambresMin", String(chambresMin));
    if (equipements.length > 0) params.set("equip", equipements.join(","));
    if (budgetMin) params.set("budgetMin", budgetMin);
    if (budgetMax) params.set("budget", budgetMax);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  const scopedListings = transaction
    ? listings.filter((l) => l.transaction === transaction)
    : listings;
  const matchCount = filterListings(scopedListings, {
    typeBien: typeAnswered && typeBien ? typeBien : "TOUS",
    typeMaison: typeMaisonAnswered && typeMaison ? typeMaison : "TOUS",
    villageSlugs,
    budgetMin: budgetMin ? Number(budgetMin) : undefined,
    budgetMax: budgetMax ? Number(budgetMax) : undefined,
    chambresMin: chambresAnswered && chambresMin ? chambresMin : undefined,
    equipements,
  }).length;

  if (!hasStarted) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-6 py-10 sm:py-16">
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              On définit votre projet ?
            </h1>
            <p className="mt-2 max-w-[46ch] font-sans text-[14.5px] text-muted">
              7 questions, 2 minutes. Modifiable à tout moment — et vous pouvez passer ce que vous
              voulez.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              "Ce que vous cherchez",
              "Où, et pour quel budget",
              "Ce qui compte vraiment",
            ].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-soft text-[12px] font-bold text-blue">
                  {i + 1}
                </span>
                <span className="text-[14px] font-semibold text-ink">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setHasStarted(true)}
              className="rounded-full bg-yellow px-6 py-3.5 text-[14px] font-bold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
            >
              Commencer
            </button>
            <Link href="/acheter" className="text-[13px] font-semibold text-blue">
              Voir toutes les annonces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-6 py-10 sm:py-16">
      {step !== "success" ? (
        <>
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
              <Link href="/" className="text-[13px] font-semibold text-blue">
                ← Annuler
              </Link>
            )}
            <span className="text-[12px] font-medium text-muted-2">
              Étape {stepIndex + 1}/{STEPS.length}
            </span>
          </div>
        </>
      ) : null}

      {step === "projet" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Qu&apos;est-ce qu&apos;on cherche ?
            </h1>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <OptionCard
              title="Acheter"
              desc="Maison, appartement ou terrain"
              active={transaction === "VENTE"}
              onClick={() => goToDelayed("lieu", { transaction: "VENTE" })}
            />
            <OptionCard
              title="Louer"
              desc="Location en Pévèle"
              active={transaction === "LOCATION"}
              onClick={() => goToDelayed("lieu", { transaction: "LOCATION" })}
            />
          </div>
        </div>
      ) : null}

      {step === "lieu" ? (
        <div className="animate-fade-up flex flex-col gap-4">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Où aimeriez-vous vivre ?
            </h1>
          </div>
          <VillageTapMap value={villageSlugs} onChange={handleVillageSlugsChange} />
          <VillageMultiSelect value={villageSlugs} onChange={handleVillageSlugsChange} />
          <MatchCounter count={matchCount} />
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => goTo("budget")}
              className="rounded-full bg-ink px-6 py-3 text-[13px] font-bold text-white shadow-sm transition hover:brightness-110"
            >
              Continuer
            </button>
            {villageSlugs.length > 0 ? (
              <button
                type="button"
                onClick={() => goTo("budget", { villageSlugs: [] })}
                className="text-[12.5px] font-semibold text-blue"
              >
                Toute la Pévèle →
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "budget" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Quel est votre budget ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Facultatif — laissez vide si vous ne savez pas encore.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Minimum (€)
              </span>
              <input
                type="number"
                min={0}
                step={5000}
                placeholder="0"
                value={budgetMin}
                onChange={(e) => {
                  setBudgetMin(e.target.value);
                  persist({ budgetMin: e.target.value });
                }}
                className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Maximum (€)
              </span>
              <input
                type="number"
                min={0}
                step={5000}
                placeholder="ex. 350000"
                value={budgetMax}
                onChange={(e) => {
                  setBudgetMax(e.target.value);
                  persist({ budgetMax: e.target.value });
                }}
                className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>
          </div>
          <MatchCounter count={matchCount} />
          <button
            type="button"
            onClick={() => goTo("type")}
            className="self-start rounded-full bg-ink px-6 py-3 text-[13px] font-bold text-white shadow-sm transition hover:brightness-110"
          >
            Continuer
          </button>
        </div>
      ) : null}

      {step === "type" && !(typeAnswered && typeBien === "MAISON" && !typeMaisonAnswered) ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Dans quoi vous voyez-vous ?
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {(["MAISON", "APPARTEMENT", "TERRAIN"] as const).map((t) => (
              <OptionCard
                key={t}
                title={TYPE_BIEN_LABEL[t]}
                active={typeAnswered && typeBien === t}
                onClick={() => {
                  if (t === "MAISON") {
                    // Étape intermédiaire : on affiche (ou réaffiche, si déjà
                    // répondu) la sous-question individuelle/semi-individuelle/
                    // mitoyenne avant d'avancer.
                    const overrides = { typeBien: t, typeAnswered: true, typeMaisonAnswered: false };
                    applyOverrides(overrides);
                    persist(overrides);
                  } else {
                    goToDelayed("chambres", {
                      typeBien: t,
                      typeAnswered: true,
                      typeMaison: null,
                      typeMaisonAnswered: false,
                    });
                  }
                }}
              />
            ))}
            <OptionCard
              title="Peu importe"
              active={typeAnswered && typeBien === null}
              onClick={() =>
                goToDelayed("chambres", {
                  typeBien: null,
                  typeAnswered: true,
                  typeMaison: null,
                  typeMaisonAnswered: false,
                })
              }
            />
          </div>
        </div>
      ) : null}

      {step === "type" && typeAnswered && typeBien === "MAISON" && !typeMaisonAnswered ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <button
              type="button"
              onClick={() => setTypeAnswered(false)}
              className="text-[13px] font-semibold text-blue"
            >
              ← Un autre type de bien
            </button>
            <h1 className="mt-2 m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Une maison plutôt…
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {(["INDIVIDUELLE", "SEMI_INDIVIDUELLE", "MITOYENNE"] as const).map((tm) => (
              <OptionCard
                key={tm}
                title={TYPE_MAISON_LABEL[tm]}
                active={typeMaisonAnswered && typeMaison === tm}
                onClick={() =>
                  goToDelayed("chambres", { typeMaison: tm, typeMaisonAnswered: true })
                }
              />
            ))}
            <OptionCard
              title="Peu importe"
              active={typeMaisonAnswered && typeMaison === null}
              onClick={() =>
                goToDelayed("chambres", { typeMaison: null, typeMaisonAnswered: true })
              }
            />
          </div>
        </div>
      ) : null}

      {step === "chambres" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Et côté chambres ?
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-5">
            <OptionCard
              title="Peu importe"
              active={chambresAnswered && chambresMin === null}
              onClick={() =>
                goToDelayed("criteres", { chambresMin: null, chambresAnswered: true })
              }
            />
            {CHAMBRES_OPTIONS.map((n) => (
              <OptionCard
                key={n}
                title={`${n}+`}
                active={chambresAnswered && chambresMin === n}
                onClick={() =>
                  goToDelayed("criteres", { chambresMin: n, chambresAnswered: true })
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      {step === "criteres" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Vos indispensables ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Uniquement ce dont vous ne pouvez pas vous passer.
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
          <MatchCounter count={matchCount} />
          <button
            type="button"
            onClick={() => goTo("priorites")}
            className="self-start rounded-full bg-ink px-6 py-3 text-[13px] font-bold text-white shadow-sm transition hover:brightness-110"
          >
            Continuer
          </button>
        </div>
      ) : null}

      {step === "priorites" ? (
        <div className="animate-fade-up flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Qu&apos;est-ce qui compte vraiment ?
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              3 choix maximum — pour vous montrer d&apos;abord ce qui vous ressemble.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {PRIORITES_OPTIONS.map((label) => {
              const active = priorites.includes(label);
              const disabled = !active && priorites.length >= MAX_PRIORITES;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={() => togglePriorite(label)}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: active ? "var(--pvl-blue-soft)" : "#fff",
                    color: active ? "var(--pvl-blue)" : "var(--pvl-ink)",
                    border: `1.5px solid ${active ? "var(--pvl-blue)" : "var(--pvl-line)"}`,
                  }}
                >
                  {label}
                  {active ? <span>✓</span> : null}
                </button>
              );
            })}
          </div>
          <p className="m-0 text-[11.5px] text-muted-2">
            Évolution future : pas encore utilisé pour trier les annonces — le tri retombe sur la
            date ou le prix.
          </p>
          <button
            type="button"
            onClick={() => goTo("recap")}
            className="self-start rounded-full bg-ink px-6 py-3 text-[13px] font-bold text-white shadow-sm transition hover:brightness-110"
          >
            Continuer
          </button>
        </div>
      ) : null}

      {step === "recap" ? (
        <div className="animate-fade-up flex flex-col gap-6">
          <div>
            <h1 className="m-0 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
              Votre projet
            </h1>
            <p className="mt-2 font-sans text-[14.5px] text-muted">
              Vérifiez, puis enregistrez pour retrouver votre recherche dans votre compte.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <RecapTag
              label={transaction === "LOCATION" ? "Location" : "Achat"}
              onClick={() => goTo("projet")}
            />
            <RecapTag label={villagesLabel()} onClick={() => goTo("lieu")} />
            <RecapTag label={budgetLabel()} onClick={() => goTo("budget")} />
            <RecapTag
              label={
                typeBien
                  ? typeBien === "MAISON" && typeMaison
                    ? `${TYPE_BIEN_LABEL[typeBien]} (${TYPE_MAISON_LABEL[typeMaison].toLowerCase()})`
                    : TYPE_BIEN_LABEL[typeBien]
                  : "Tous types"
              }
              onClick={() => goTo("type")}
            />
            {chambresMin ? (
              <RecapTag label={`${chambresMin}+ chambres`} onClick={() => goTo("chambres")} />
            ) : null}
            {equipements.length > 0 ? (
              <RecapTag
                label={equipements.length <= 2 ? equipements.join(", ") : `${equipements.length} critères`}
                onClick={() => goTo("criteres")}
              />
            ) : null}
            {priorites.length > 0 ? (
              <RecapTag
                label={priorites.length <= 2 ? priorites.join(", ") : `${priorites.length} priorités`}
                onClick={() => goTo("priorites")}
              />
            ) : null}
          </div>
          <MatchCounter count={matchCount} />

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="self-start rounded-full bg-yellow px-6.5 py-4 text-[14px] font-bold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
            >
              {isPending ? "Enregistrement…" : "Enregistrer ma recherche →"}
            </button>
            {!isLoggedIn ? (
              <span className="text-[12px] text-muted-2">
                Vous devrez vous connecter pour enregistrer votre recherche.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "success" ? (
        <div className="animate-fade-up flex flex-col gap-5 rounded-3xl bg-blue px-7 py-9 text-white">
          <span className="flex h-13 w-13 items-center justify-center rounded-full bg-yellow text-[22px] font-black text-ink">
            ✓
          </span>
          <div>
            <h1 className="m-0 font-display text-[30px] leading-tight text-white">
              Votre projet est prêt
            </h1>
            <p className="m-0 mt-2 font-sans text-[15px] leading-[1.6] text-white/85">
              <b>{matchCount} bien{matchCount > 1 ? "s" : ""}</b> correspond
              {matchCount > 1 ? "ent" : ""} actuellement à votre projet en Pévèle.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={resultUrl()}
              className="rounded-full bg-yellow px-6 py-3.5 text-center text-[14px] font-bold text-ink shadow-sm transition hover:brightness-95"
            >
              Découvrir mes {matchCount} bien{matchCount > 1 ? "s" : ""} →
            </Link>
            <Link href="/compte" className="text-center text-[13px] font-semibold text-white">
              Retour à mon compte →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
