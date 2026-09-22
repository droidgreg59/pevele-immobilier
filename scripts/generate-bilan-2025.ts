/**
 * Génère le snapshot figé du Bilan immobilier de la Pévèle 2025 —
 * content/bilan/bilan-2025-data.ts. Ce n'est PAS un script qui tourne à
 * chaque import DVF : une régénération est un choix éditorial délibéré (ex.
 * correction avérée d'une erreur dans la source), jamais automatique. Le
 * Bilan 2025 lit exclusivement ce fichier figé, jamais la base en direct
 * (contrairement aux guides evergreen du Sprint 4).
 *
 * Méthode d'exclusion des valeurs atypiques strictement identique à
 * src/lib/dvf.ts (1er/99e centile du prix/m², Pévèle entière, par
 * typologie) — dupliquée ici en fonctions pures plutôt qu'importée, pour que
 * ce script reste exécutable seul (`npx tsx scripts/generate-bilan-2025.ts`)
 * sans le garde-fou `import "server-only"` de dvf.ts.
 *
 * Usage : npm run bilan:generate
 */
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OUTLIER_LOWER_PERCENTILE = 0.01;
const OUTLIER_UPPER_PERCENTILE = 0.99;
const MIN_RETAINED_SAMPLE = 5;
const HIGHLIGHT_MIN_SAMPLE = 15; // mises en avant éditoriales — voir analyse de sensibilité (Sprint 6)
const VARIATION_MIN_SAMPLE = 30; // évolution par commune, dans CHAQUE année comparée

function computePercentileBounds(sortedValues: number[], lower: number, upper: number) {
  if (sortedValues.length === 0) return { min: 0, max: 0 };
  const lowerIndex = Math.floor(sortedValues.length * lower);
  const upperIndex = Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * upper));
  return { min: sortedValues[lowerIndex], max: sortedValues[upperIndex] };
}

function median(sortedValues: number[]): number {
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? Math.round((sortedValues[mid - 1] + sortedValues[mid]) / 2)
    : sortedValues[mid];
}

type Row = { villageSlug: string; prixM2: number; valeurFonciere: number; surfaceBati: number; surfaceTerrain: number | null };

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  const lastDvfImport = await prisma.cronRun.findUnique({ where: { job: "dvf-import" }, select: { ranAt: true } });
  const sourceDatasetDate = lastDvfImport?.ranAt.toISOString().slice(0, 10) ?? today;

  let generatorCommit: string | null = null;
  try {
    generatorCommit = execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    generatorCommit = null;
  }

  // Bornes d'exclusion des valeurs atypiques, par typologie, Pévèle entière —
  // identiques à getDvfOutlierBounds() dans dvf.ts.
  async function outlierBounds(typeLocal: "Maison" | "Appartement") {
    const rows = await prisma.dvfTransaction.findMany({
      where: { typeLocal },
      select: { prixM2: true },
      orderBy: { prixM2: "asc" },
    });
    return computePercentileBounds(rows.map((r) => r.prixM2), OUTLIER_LOWER_PERCENTILE, OUTLIER_UPPER_PERCENTILE);
  }
  const maisonBounds = await outlierBounds("Maison");
  const appartementBounds = await outlierBounds("Appartement");

  async function rowsFor(typeLocal: "Maison" | "Appartement", year?: number): Promise<Row[]> {
    return prisma.dvfTransaction.findMany({
      where: { typeLocal, ...(year ? { sourceAnnee: year } : {}) },
      select: { villageSlug: true, prixM2: true, valeurFonciere: true, surfaceBati: true, surfaceTerrain: true },
    });
  }
  function retain(rows: Row[], bounds: { min: number; max: number }): Row[] {
    return rows.filter((r) => r.prixM2 >= bounds.min && r.prixM2 <= bounds.max);
  }

  // --- Maisons 2025 ---
  const maisonRows2025All = await rowsFor("Maison", 2025);
  const maisonRetained2025 = retain(maisonRows2025All, maisonBounds);
  const medianPrixM2_2025 = median(maisonRetained2025.map((r) => r.prixM2).sort((a, b) => a - b));
  const medianPrixTotal_2025 = median(maisonRetained2025.map((r) => r.valeurFonciere).sort((a, b) => a - b));
  const medianSurfaceBati_2025 = median(maisonRetained2025.map((r) => r.surfaceBati).sort((a, b) => a - b));
  const withTerrain2025 = maisonRetained2025.filter((r) => r.surfaceTerrain !== null);
  const medianSurfaceTerrain_2025 = median(
    withTerrain2025.map((r) => r.surfaceTerrain as number).sort((a, b) => a - b)
  );

  // --- Appartements 2025 ---
  const apptRows2025All = await rowsFor("Appartement", 2025);
  const apptRetained2025 = retain(apptRows2025All, appartementBounds);
  const apptMedianPrixM2_2025 = median(apptRetained2025.map((r) => r.prixM2).sort((a, b) => a - b));
  const apptMedianPrixTotal_2025 = median(apptRetained2025.map((r) => r.valeurFonciere).sort((a, b) => a - b));

  // --- Comparaison annuelle (maisons) 2023/2024/2025 ---
  const comparaisonAnnuelle: Record<string, { medianPrixM2: number; medianPrixTotal: number; retainedCount: number }> = {};
  for (const year of [2023, 2024, 2025]) {
    const rows = retain(await rowsFor("Maison", year), maisonBounds);
    comparaisonAnnuelle[String(year)] = {
      medianPrixM2: median(rows.map((r) => r.prixM2).sort((a, b) => a - b)),
      medianPrixTotal: median(rows.map((r) => r.valeurFonciere).sort((a, b) => a - b)),
      retainedCount: rows.length,
    };
  }
  const pct = (a: number, b: number) => Math.round(((a - b) / b) * 1000) / 10;
  const variationPctM2 = {
    y2024to2025: pct(comparaisonAnnuelle["2025"].medianPrixM2, comparaisonAnnuelle["2024"].medianPrixM2),
    y2023to2025: pct(comparaisonAnnuelle["2025"].medianPrixM2, comparaisonAnnuelle["2023"].medianPrixM2),
  };

  // --- Budgets (maisons, 2025) ---
  const budgets = [250000, 300000, 350000, 400000, 500000];
  const budgetPaliers = budgets.map((budget) => {
    const under = maisonRetained2025.filter((r) => r.valeurFonciere <= budget);
    const medianSurface =
      under.length >= MIN_RETAINED_SAMPLE ? median(under.map((r) => r.surfaceBati).sort((a, b) => a - b)) : null;
    return {
      budget,
      count: under.length,
      pct: Math.round((under.length / maisonRetained2025.length) * 1000) / 10,
      medianSurface,
    };
  });

  // --- Communes 2025 (N>=5) ---
  const byVillage2025 = new Map<string, number[]>();
  for (const r of maisonRetained2025) {
    byVillage2025.set(r.villageSlug, [...(byVillage2025.get(r.villageSlug) ?? []), r.prixM2]);
  }
  const communes2025 = [...byVillage2025.entries()]
    .filter(([, v]) => v.length >= MIN_RETAINED_SAMPLE)
    .map(([slug, v]) => ({ slug, medianPrixM2: median([...v].sort((a, b) => a - b)), retainedCount: v.length }))
    .sort((a, b) => b.medianPrixM2 - a.medianPrixM2);

  // --- Mises en avant éditoriales (N>=15) ---
  const highlightPool = communes2025.filter((c) => c.retainedCount >= HIGHLIGHT_MIN_SAMPLE);
  const communesMiseEnAvant = {
    seuilMinimum: HIGHLIGHT_MIN_SAMPLE,
    plusEleve: highlightPool.slice(0, 3),
    plusBas: [...highlightPool].reverse().slice(0, 3),
  };

  // --- Variation par commune 2023->2025 (N>=30 les deux années) ---
  const byVillage2023 = new Map<string, number[]>();
  for (const r of retain(await rowsFor("Maison", 2023), maisonBounds)) {
    byVillage2023.set(r.villageSlug, [...(byVillage2023.get(r.villageSlug) ?? []), r.prixM2]);
  }
  const communesVariationPaires = [...byVillage2025.entries()]
    .filter(([slug, v2025]) => v2025.length >= VARIATION_MIN_SAMPLE && (byVillage2023.get(slug)?.length ?? 0) >= VARIATION_MIN_SAMPLE)
    .map(([slug, v2025]) => {
      const v2023 = byVillage2023.get(slug)!;
      const m2025 = median([...v2025].sort((a, b) => a - b));
      const m2023 = median([...v2023].sort((a, b) => a - b));
      return { slug, pct2023to2025: pct(m2025, m2023), n2023: v2023.length, n2025: v2025.length };
    })
    .sort((a, b) => b.pct2023to2025 - a.pct2023to2025);

  const bilan2025 = {
    dataPeriod: "2025",
    dataComputedAt: today,
    source: "DVF",
    sourceDatasetDate,
    methodologyVersion: "sprint2-outlier-v1",
    generatorCommit,

    maison: {
      totalCount: maisonRows2025All.length,
      retainedCount: maisonRetained2025.length,
      medianPrixM2: medianPrixM2_2025,
      medianPrixTotal: medianPrixTotal_2025,
      medianSurfaceBati: medianSurfaceBati_2025,
      medianSurfaceTerrain: medianSurfaceTerrain_2025,
      terrainSampleCount: withTerrain2025.length,
    },
    appartement:
      apptRetained2025.length >= MIN_RETAINED_SAMPLE
        ? {
            totalCount: apptRows2025All.length,
            retainedCount: apptRetained2025.length,
            medianPrixM2: apptMedianPrixM2_2025,
            medianPrixTotal: apptMedianPrixTotal_2025,
          }
        : null,

    comparaisonAnnuelle,
    variationPctM2,
    budgetPaliers,
    communes2025,
    communesMiseEnAvant,
    communesVariation: { seuilMinimum: VARIATION_MIN_SAMPLE, paires2023to2025: communesVariationPaires },
  };

  console.log("Maisons 2025 : ", maisonRows2025All.length, "brutes,", maisonRetained2025.length, "retenues");
  console.log("Médiane 2025 :", medianPrixM2_2025, "€/m² /", medianPrixTotal_2025, "€");
  console.log("Variation 2024->2025 :", variationPctM2.y2024to2025, "% · 2023->2025 :", variationPctM2.y2023to2025, "%");
  console.log("Communes N>=5 :", communes2025.length, "· N>=15 (mise en avant) :", highlightPool.length, "· N>=30 les deux années :", communesVariationPaires.length);

  const fileContent = `// Généré par scripts/generate-bilan-2025.ts le ${today}.
// Snapshot éditorial FIGÉ — ne JAMAIS régénérer automatiquement (import DVF,
// build, cron...). Une régénération est un choix délibéré (ex. correction
// avérée d'une erreur dans la source), documentée dans l'historique git.
// Méthodologie : identique à src/lib/dvf.ts (exclusion 1er/99e centile du
// prix/m², Pévèle entière, par typologie — voir /methodologie). Ce fichier
// répond à « avec quelles données et quelle méthode ce Bilan a-t-il été
// produit ? » via dataComputedAt / sourceDatasetDate / methodologyVersion /
// generatorCommit ci-dessous.

export const bilan2025 = ${JSON.stringify(bilan2025, null, 2)} as const;
`;
  writeFileSync("content/bilan/bilan-2025-data.ts", fileContent, "utf-8");
  console.log("\nÉcrit dans content/bilan/bilan-2025-data.ts");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
