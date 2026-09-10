import { describe, it, expect } from "vitest";
import { estimateAcquisitionCost, estimateLoan } from "./purchase-cost";

describe("estimateAcquisitionCost", () => {
  it("applique le barème dégressif des émoluments sur toutes les tranches (250 000 €)", () => {
    const c = estimateAcquisitionCost(250_000);
    // émoluments HT = 6500*.0387 + 10500*.01596 + 43000*.01064 + 190000*.00799
    //              = 251.55 + 167.58 + 457.52 + 1518.1 = 2394.75 → *1.2 = 2873.7 → 2874
    expect(c.emoluments).toBe(2874);
    expect(c.droits).toBe(Math.round(250_000 * 0.0581)); // 14 525
    expect(c.csi).toBe(250); // 0,1 %
    expect(c.debours).toBe(1_200);
    expect(c.total).toBe(c.emoluments + c.droits + c.csi + c.debours);
  });

  it("un bien plus cher coûte plus cher en frais, mais proportionnellement moins", () => {
    const petit = estimateAcquisitionCost(100_000);
    const gros = estimateAcquisitionCost(400_000);
    expect(gros.total).toBeGreaterThan(petit.total);
    expect(gros.total / 400_000).toBeLessThan(petit.total / 100_000);
  });

  it("reste cohérent pour un prix dans la première tranche uniquement", () => {
    const c = estimateAcquisitionCost(5_000);
    // 5000 * 0.0387 * 1.2 = 232.2 → 232
    expect(c.emoluments).toBe(232);
    expect(c.total).toBe(232 + Math.round(5_000 * 0.0581) + Math.round(5_000 * 0.001) + 1_200);
  });
});

describe("estimateLoan", () => {
  it("calcule une mensualité de prêt amortissable classique", () => {
    const l = estimateLoan({
      montant: 200_000,
      tauxAnnuelPct: 3.5,
      dureeAnnees: 25,
      assuranceAnnuellePct: 0.34,
    });
    // part capital ≈ 1001,25 €/mois ; assurance = 200000*0.0034/12 ≈ 56,67
    expect(l.mensualite).toBe(1058);
    expect(l.assuranceMensuelle).toBe(57);
    // coutTotal = mensualité NON arrondie * 300 échéances, puis arrondi.
    expect(l.coutTotal).toBeGreaterThan(316_000);
    expect(l.coutTotal).toBeLessThan(318_000);
    expect(l.interets).toBe(l.coutTotal - 200_000);
  });

  it("gère un taux nul (mensualité = capital / nombre d'échéances + assurance)", () => {
    const l = estimateLoan({
      montant: 120_000,
      tauxAnnuelPct: 0,
      dureeAnnees: 10,
      assuranceAnnuellePct: 0,
    });
    expect(l.mensualite).toBe(1_000);
    expect(l.interets).toBe(0);
  });

  it("une durée plus courte augmente la mensualité et réduit les intérêts", () => {
    const base = { montant: 200_000, tauxAnnuelPct: 3.5, assuranceAnnuellePct: 0.34 };
    const court = estimateLoan({ ...base, dureeAnnees: 15 });
    const long = estimateLoan({ ...base, dureeAnnees: 25 });
    expect(court.mensualite).toBeGreaterThan(long.mensualite);
    expect(court.interets).toBeLessThan(long.interets);
  });
});
