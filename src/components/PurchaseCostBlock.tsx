"use client";

import { useMemo, useState } from "react";
import { estimateAcquisitionCost, estimateLoan } from "@/lib/purchase-cost";

const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

export default function PurchaseCostBlock({ prix }: { prix: number }) {
  const frais = useMemo(() => estimateAcquisitionCost(prix), [prix]);
  const fraisPct = Math.round((frais.total / prix) * 100);

  const [apport, setApport] = useState(() => Math.round((prix * 0.1) / 1000) * 1000);
  const [duree, setDuree] = useState(25);
  const [taux, setTaux] = useState(3.5);
  const [assurance, setAssurance] = useState(0.34);

  const montantEmprunte = Math.max(prix + frais.total - apport, 0);
  const loan = useMemo(
    () =>
      estimateLoan({
        montant: montantEmprunte,
        tauxAnnuelPct: taux,
        dureeAnnees: duree,
        assuranceAnnuellePct: assurance,
      }),
    [montantEmprunte, taux, duree, assurance]
  );

  return (
    <section className="mt-8">
      <h2 className="m-0 font-display text-2xl text-ink">Coût de l&apos;achat</h2>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Frais d&apos;acquisition
          </span>
          <div className="mt-1 font-display text-[30px] text-ink">{eur(frais.total)}</div>
          <span className="text-[12px] text-muted-2">≈ {fraisPct}&nbsp;% du prix (logement ancien)</span>
          <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[12.5px]">
            {[
              ["Émoluments du notaire (TTC)", frais.emoluments],
              ["Droits de mutation", frais.droits],
              ["Contribution de sécurité immobilière", frais.csi],
              ["Débours (forfait)", frais.debours],
            ].map(([label, value]) => (
              <li key={label as string} className="flex justify-between gap-3 text-muted">
                <span>{label}</span>
                <span className="text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {eur(value as number)}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-[11px] leading-[1.5] text-muted-2">
            Estimation d&apos;après les barèmes publics (émoluments réglementés, droits de
            mutation ~5,8&nbsp;%). Les débours varient selon le dossier.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Mensualité estimée
          </span>
          <div className="mt-1 font-display text-[30px] text-ink">
            {eur(loan.mensualite)}
            <span className="ml-1.5 text-[13px] font-medium text-muted">/ mois</span>
          </div>
          <span className="text-[12px] text-muted-2">
            dont {eur(loan.assuranceMensuelle)} d&apos;assurance · emprunt de {eur(montantEmprunte)}
          </span>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">Apport (€)</span>
              <input
                type="number"
                min={0}
                step={5000}
                value={apport}
                onChange={(e) => setApport(Math.max(0, Number(e.target.value) || 0))}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">Durée</span>
              <select
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
                className={inputCls}
              >
                {[15, 20, 25].map((d) => (
                  <option key={d} value={d}>
                    {d} ans
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">Taux (%)</span>
              <input
                type="number"
                min={0}
                step={0.05}
                value={taux}
                onChange={(e) => setTaux(Math.max(0, Number(e.target.value) || 0))}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">Assurance (%/an)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={assurance}
                onChange={(e) => setAssurance(Math.max(0, Number(e.target.value) || 0))}
                className={inputCls}
              />
            </label>
          </div>

          <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[12.5px] text-muted">
            <li className="flex justify-between gap-3">
              <span>Coût total du crédit</span>
              <span className="text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                {eur(loan.coutTotal)}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span>dont intérêts + assurance</span>
              <span className="text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                {eur(loan.interets)}
              </span>
            </li>
          </ul>
          <p className="m-0 mt-3 text-[11px] leading-[1.5] text-muted-2">
            Simulation indicative, prêt amortissable à taux fixe (frais d&apos;acquisition
            inclus dans l&apos;emprunt). Hors frais de dossier et de garantie.
          </p>
        </div>
      </div>
    </section>
  );
}
