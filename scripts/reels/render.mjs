// Rendu image par image d'un reel commune.
// Usage : node scripts/reels/render.mjs <spots.json> <dossier-sortie> "<Nom affiché>"
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildTimeline } from "./timeline.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [, , spFile, out, nom] = process.argv;
const sp = JSON.parse(fs.readFileSync(spFile, "utf8"));
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const frames = buildTimeline(sp, nom);

const b = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 900_000, args: ["--allow-file-access-from-files"] }); // tuiles IGN parfois très lentes
const p = await b.newPage();
await p.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 });
await p.goto("file://" + path.join(here, "harness.html"));
await p.evaluate(() => document.fonts.ready);
for (const f of frames.filter((_, i) => i % 10 === 0)) await p.evaluate((st) => window.frame(st), f); // préchauffe les tuiles
for (let i = 0; i < frames.length; i++) {
  await p.evaluate((st) => window.frame(st), frames[i]);
  await p.screenshot({ path: `${out}/f${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
}
const failed = await p.evaluate(() => window.__failed);
await b.close();
console.log(`${frames.length} images, tuiles définitivement en échec : ${failed}`);
if (failed > 0) process.exit(2);
