/**
 * Importe les transactions DVF (Demandes de Valeurs Foncières, data.gouv.fr /
 * Etalab) des communes suivies, à partir des fichiers départementaux geo-dvf
 * (Nord, 59). Ne garde que les ventes de maisons/appartements en un seul
 * lot, avec un prix/m² dans une fourchette plausible (filtre les erreurs de
 * saisie et cas atypiques comme les ventes en nue-propriété). Logique
 * partagée avec la route cron `/api/cron/dvf-import` — voir src/lib/dvf-import.ts.
 *
 * Usage : npm run dvf:import
 */
import { runDvfImport } from "../src/lib/dvf-import";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Import DVF en cours...");
  const results = await runDvfImport();
  let total = 0;
  for (const { year, count } of results) {
    console.log(`  ${count} transactions retenues pour ${year}.`);
    total += count;
  }
  console.log(`Import DVF terminé — ${total} transactions au total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
