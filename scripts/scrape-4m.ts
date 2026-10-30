/**
 * Reprise des annonces du site de l'agence 4M (www.4mlagence.fr) — avec son
 * autorisation écrite, faute de flux XML exploitable (voir src/lib/site-4m.ts).
 *
 *   npm run scrape:4m             # simulation : rien n'est écrit
 *   npm run scrape:4m -- --write  # import réel
 *
 * Première fois sur une machine : `npx playwright install chromium`.
 *
 * À lancer en local (Playwright + Chromium), pas sur Vercel. Le site est
 * derrière un pare-feu applicatif qui exige un vrai navigateur : un Chromium
 * headless ordinaire passe son défi JavaScript. Garde-fous :
 *  - uniquement le site de 4M, pages d'annonces seulement ;
 *  - une page à la fois, pause de 4 à 8 s entre deux pages ;
 *  - si un CAPTCHA apparaît, arrêt immédiat — jamais de tentative de résolution ;
 *  - retrait des annonces disparues seulement si la collecte est complète.
 */
import "dotenv/config";
import { chromium, type BrowserContext, type Page } from "playwright";
import { prisma } from "../src/lib/prisma";
import { upsertImportedListing, retireStaleImportedListings } from "../src/lib/listings";
import {
  SITE_4M_AGENCY_ID,
  SITE_4M_IMPORT_SOURCE,
  SITE_4M_INDEXES,
  SITE_4M_ORIGIN,
  affIdFromFicheUrl,
  parse4mFiche,
  type Parsed4mListing,
  type Raw4mFiche,
} from "../src/lib/site-4m";

const WRITE = process.argv.includes("--write");
const MAX_INDEX_PAGES = 20;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pause = () => sleep(4000 + Math.random() * 4000);

class Blocked extends Error {}

/**
 * Attend le contenu attendu (le défi du pare-feu recharge la page une fois
 * résolu) ; sinon distingue un CAPTCHA (arrêt) d'une page inattendue.
 */
async function open(page: Page, url: string, expected: string): Promise<void> {
  if (!url.startsWith(`${SITE_4M_ORIGIN}/`)) throw new Error(`URL hors du site 4M : ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  try {
    await page.waitForSelector(expected, { timeout: 25_000 });
  } catch {
    const html = await page.content();
    if (/captcha/i.test(html)) {
      throw new Blocked("CAPTCHA affiché par le site — arrêt, aucune tentative de résolution.");
    }
    throw new Blocked(`Contenu attendu absent sur ${url} (page bloquée ou modifiée).`);
  }
}

/** `open`, avec une seconde tentative (le défi du pare-feu repasse parfois). */
async function openWithRetry(page: Page, url: string, expected: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await open(page, url, expected);
      return true;
    } catch (e) {
      if (e instanceof Blocked && /CAPTCHA/.test(e.message)) throw e;
      console.warn(`  ! ${url} (essai ${attempt}) : ${(e as Error).message}`);
      if (attempt === 1) await pause();
    }
  }
  return false;
}

/** Liens des fiches d'un index, pages suivantes comprises. */
async function crawlIndex(
  page: Page,
  indexUrl: string
): Promise<{ urls: string[]; total: number; ok: boolean }> {
  const urls = new Set<string>();
  let total = 0;
  let ok = true;
  for (let n = 1; n <= MAX_INDEX_PAGES; n++) {
    const url = n === 1 ? indexUrl : `${indexUrl}?manufacturers_id=transaction&page=${n}`;
    if (n > 1) await pause();
    // Le compteur d'annonces n'existe que sur un vrai index (pas sur la page du défi).
    if (!(await openWithRetry(page, url, "text=/annonce\\(s\\) trouvée/i"))) {
      ok = false;
      break;
    }
    const text = await page.innerText("body");
    if (n === 1) total = Number(/(\d+)\s*annonce\(s\) trouvée\(s\)/i.exec(text)?.[1] ?? 0);
    const links = await page.$$eval('a[href*="/fiches/"]', (as) => as.map((a) => (a as HTMLAnchorElement).href));
    const before = urls.size;
    for (const l of links) if (affIdFromFicheUrl(l)) urls.add(l.split("#")[0]);
    if (urls.size === before || urls.size >= total) break;
  }
  return { urls: [...urls], total, ok: ok && urls.size >= total };
}

// Exécuté dans la page. Passé en texte : le code compilé par tsx injecte des
// helpers (__name) qui n'existent pas dans le navigateur.
const EXTRACT_FICHE = `(() => {
  const h1 = document.querySelector("h1.product-title");
  let titre = "";
  if (h1) for (const n of h1.childNodes) if (n.nodeType === 3) titre += n.textContent;
  const criteres = {};
  document.querySelectorAll(".product-criteres li .row").forEach((row) => {
    const cols = row.querySelectorAll(":scope > div");
    if (cols.length < 2) return;
    const k = cols[0].textContent.replace(/\\s+/g, " ").trim();
    if (k && !(k in criteres)) criteres[k] = cols[1].textContent.replace(/\\s+/g, " ").trim();
  });
  let description = "";
  let honorairesTexte = "";
  const descEl = document.querySelector(".box-description .products-description");
  if (descEl) {
    const clone = descEl.cloneNode(true);
    const fee = clone.querySelector(".price_alur_description");
    if (fee) {
      honorairesTexte = fee.textContent.replace(/\\*+/g, "").replace(/\\s+/g, " ").trim();
      fee.remove();
    }
    clone.querySelectorAll(".mentions_bareme_product, script, style").forEach((e) => e.remove());
    clone.querySelectorAll("br").forEach((br) => br.replaceWith("\\n"));
    description = clone.textContent.split("\\n").map((l) => l.trim()).join("\\n").replace(/\\n{3,}/g, "\\n\\n").trim();
  }
  const html = document.documentElement.outerHTML;
  const re = /[^"'()\\s]*catalog\\/images\\/pr_p\\/[\\d/]+\\/\\d+[a-z]+\\.(?:jpe?g|png|webp)/gi;
  // Chemins relatifs (« ../office5/… ») résolus contre le <base href> de la page.
  const imageUrls = [...html.matchAll(re)].map((m) => new URL(m[0], document.baseURI).href);
  return { titre, criteres, description, honorairesTexte, imageUrls };
})()`;

/** Les photos passent par la session du navigateur (le pare-feu bloque un fetch nu). */
function browserPhotoFetcher(ctx: BrowserContext) {
  return async (url: string): Promise<Response> => {
    if (!url.startsWith(`${SITE_4M_ORIGIN}/`)) return new Response(null, { status: 400 });
    await sleep(300);
    const res = await ctx.request.get(url, { timeout: 30_000 });
    const type = res.headers()["content-type"] ?? "";
    // Le défi du pare-feu répond 202 en HTML : ce n'est pas une image.
    if (!res.ok() || !type.startsWith("image/")) {
      console.warn(`  ! photo ${url} : ${res.status()} ${type}`);
      return new Response(null, { status: 502 });
    }
    return new Response(new Uint8Array(await res.body()), {
      status: 200,
      headers: { "content-type": type },
    });
  };
}

async function main() {
  const agency = await prisma.user.findUnique({
    where: { id: SITE_4M_AGENCY_ID },
    select: { entreprise: true, verifStatut: true },
  });
  if (agency?.verifStatut !== "VERIFIEE") throw new Error("Compte 4M introuvable ou non vérifié.");
  console.log(`${agency.entreprise} — ${WRITE ? "IMPORT RÉEL" : "simulation (--write pour importer)"}`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  });
  const page = await ctx.newPage();
  let complete = true;
  const listings: Parsed4mListing[] = [];
  const skipped: { externalRef: string; reason: string }[] = [];
  const labels = new Map<string, Set<string>>();

  try {
    await open(page, `${SITE_4M_ORIGIN}/`, "body");
    await sleep(6000);

    const ficheUrls = new Set<string>();
    for (const index of SITE_4M_INDEXES) {
      await pause();
      const { urls, total, ok } = await crawlIndex(page, index.url);
      console.log(`${index.transaction} : ${urls.length} fiche(s) trouvée(s) / ${total} annoncée(s)`);
      if (!ok) complete = false;
      urls.forEach((u) => ficheUrls.add(u));
    }

    // Annonces supprimées à la main (ex. bien sous compromis, signalé seulement
    // par un bandeau sur les photos) : masquées, jamais reprises — inutile
    // même d'ouvrir leur fiche.
    const hidden = new Set(
      (
        await prisma.listing.findMany({
          where: {
            ownerId: SITE_4M_AGENCY_ID,
            importSource: SITE_4M_IMPORT_SOURCE,
            hiddenByAdminAt: { not: null },
          },
          select: { externalRef: true },
        })
      ).map((l) => l.externalRef)
    );

    for (const url of ficheUrls) {
      const ref = affIdFromFicheUrl(url);
      if (ref && hidden.has(ref)) {
        console.log(`  × ${ref} supprimée à la main — ignorée`);
        continue;
      }
      await pause();
      if (!(await openWithRetry(page, url, ".product-criteres"))) {
        complete = false;
        continue;
      }
      const extracted = (await page.evaluate(EXTRACT_FICHE)) as Omit<Raw4mFiche, "url">;
      for (const [k, v] of Object.entries(extracted.criteres)) {
        if (!labels.has(k)) labels.set(k, new Set());
        labels.get(k)!.add(v);
      }
      const res = parse4mFiche({ url, ...extracted });
      if ("listing" in res) {
        listings.push(res.listing);
        const l = res.listing;
        console.log(
          `  ✓ ${l.externalRef} ${l.transaction} ${l.commune} — ${l.titre} — ${l.prix} € — ${l.photoUrls.length} photo(s)`
        );
      } else {
        skipped.push(res);
        console.log(`  – ${res.externalRef} écartée : ${res.reason}`);
      }
    }

    if (!WRITE) {
      console.log("\nLibellés rencontrés (valeurs observées) :");
      for (const [k, vs] of labels) console.log(`  ${k} : ${[...vs].slice(0, 8).join(" | ")}`);
      const first = listings.find((l) => l.photoUrls.length > 0);
      if (first) {
        const res = await browserPhotoFetcher(ctx)(first.photoUrls[0]);
        const bytes = res.ok ? (await res.arrayBuffer()).byteLength : 0;
        console.log(`Test photo (${first.externalRef}) : ${res.ok ? `${bytes} octets` : "ÉCHEC"}`);
      }
      console.log(`\nSimulation : ${listings.length} annonce(s) importable(s), ${skipped.length} écartée(s).`);
      return;
    }

    let created = 0;
    let updated = 0;
    const fetchPhoto = browserPhotoFetcher(ctx);
    for (const bien of listings) {
      const r = await upsertImportedListing(
        SITE_4M_AGENCY_ID,
        { ...bien, importSource: SITE_4M_IMPORT_SOURCE },
        { fetchPhoto }
      );
      if (r.created) created += 1;
      else updated += 1;
    }

    // Une collecte partielle (page en échec, pagination incomplète) ne doit
    // jamais retirer des annonces qui sont peut-être toujours en ligne.
    const retired = complete
      ? await retireStaleImportedListings(
          SITE_4M_AGENCY_ID,
          SITE_4M_IMPORT_SOURCE,
          listings.map((l) => l.externalRef)
        )
      : [];
    console.log(
      `\nImport : ${created} créée(s), ${updated} mise(s) à jour, ${retired.length} retirée(s), ${skipped.length} écartée(s)` +
        (complete ? "" : " — collecte incomplète, aucun retrait effectué")
    );
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
