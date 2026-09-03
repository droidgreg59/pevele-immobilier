/**
 * Estimations de coût d'un achat immobilier — barèmes publics uniquement,
 * aucune API tierce. Toutes les valeurs sont indicatives et arrondies.
 */

/**
 * Émoluments du notaire (barème réglementé, décret n° 2016-230 / arrêté
 * tarifaire) : taux dégressif par tranche de prix, + TVA 20 %.
 */
const EMOLUMENT_TRANCHES: { jusqua: number; taux: number }[] = [
  { jusqua: 6_500, taux: 0.0387 },
  { jusqua: 17_000, taux: 0.01596 },
  { jusqua: 60_000, taux: 0.01064 },
  { jusqua: Infinity, taux: 0.00799 },
];

/**
 * Droits de mutation à titre onéreux pour un logement ancien : ~5,81 %
 * (4,50 % département + 1,20 % commune + frais d'assiette). Depuis avril 2025
 * certains départements peuvent le porter à ~6,3 % — ajuster ici si besoin.
 */
const DROITS_MUTATION_RATE = 0.0581;
/** Contribution de sécurité immobilière. */
const CSI_RATE = 0.001;
/** Débours (forfait indicatif : documents, cadastre, publication…). */
const DEBOURS_FORFAIT = 1_200;

export type AcquisitionCost = {
  emoluments: number;
  droits: number;
  csi: number;
  debours: number;
  total: number;
};

export function estimateAcquisitionCost(prix: number): AcquisitionCost {
  let reste = prix;
  let bas = 0;
  let emolumentsHT = 0;
  for (const t of EMOLUMENT_TRANCHES) {
    const largeur = Math.min(reste, t.jusqua - bas);
    if (largeur <= 0) break;
    emolumentsHT += largeur * t.taux;
    reste -= largeur;
    bas = t.jusqua;
  }
  const emoluments = Math.round(emolumentsHT * 1.2);
  const droits = Math.round(prix * DROITS_MUTATION_RATE);
  const csi = Math.round(prix * CSI_RATE);
  const debours = DEBOURS_FORFAIT;
  return { emoluments, droits, csi, debours, total: emoluments + droits + csi + debours };
}

export type LoanEstimate = {
  mensualite: number;
  assuranceMensuelle: number;
  coutTotal: number;
  interets: number;
};

/** Mensualité d'un prêt amortissable à taux fixe + assurance sur capital initial. */
export function estimateLoan(opts: {
  montant: number;
  tauxAnnuelPct: number;
  dureeAnnees: number;
  assuranceAnnuellePct: number;
}): LoanEstimate {
  const n = Math.max(1, Math.round(opts.dureeAnnees * 12));
  const r = opts.tauxAnnuelPct / 100 / 12;
  const capitalPart =
    r === 0 ? opts.montant / n : (opts.montant * r) / (1 - Math.pow(1 + r, -n));
  const assuranceMensuelle = (opts.montant * (opts.assuranceAnnuellePct / 100)) / 12;
  const mensualite = capitalPart + assuranceMensuelle;
  const coutTotal = mensualite * n;
  return {
    mensualite: Math.round(mensualite),
    assuranceMensuelle: Math.round(assuranceMensuelle),
    coutTotal: Math.round(coutTotal),
    interets: Math.round(coutTotal - opts.montant),
  };
}
