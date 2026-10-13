// Classements des 44 communes, calculés sur les données réelles du site :
// DVF (ventes 2023-2025) et équipements (OpenStreetMap / Éducation nationale).
// Usage : npx tsx --env-file=.env scripts/social/rankings-data.ts > media/social/rankings.json
import { PrismaClient } from "@prisma/client";
import { villages } from "../../src/data/villages";
import { villageAmenities } from "../../src/data/village-amenities";

const p = new PrismaClient();
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
const MIN = 10; // ventes minimum pour une médiane publiée

async function main() {
  const rows = await p.dvfTransaction.findMany({ select: { villageSlug: true, typeLocal: true, prixM2: true, surfaceTerrain: true, sourceAnnee: true } });
  const years = [...new Set(rows.map((r) => r.sourceAnnee))].sort();
  const data = villages.map((v) => {
    const r = rows.filter((x) => x.villageSlug === v.slug), m = r.filter((x) => x.typeLocal === "Maison");
    const t = m.map((x) => x.surfaceTerrain).filter((x): x is number => x != null);
    const a = villageAmenities[v.insee];
    return {
      nom: v.nom, slug: v.slug, ventes: r.length,
      prixMaison: m.length >= MIN ? median(m.map((x) => x.prixM2)) : null,
      terrain: t.length >= MIN ? median(t) : null,
      commerces: a?.commerces.length ?? 0,
      gare: (a?.transports.gares ?? []).length > 0,
    };
  });
  console.log(JSON.stringify({ periode: `${years[0]}–${years[years.length - 1]}`, ventesTotal: rows.length, communes: data }, null, 1));
  await p.$disconnect();
}
main();
