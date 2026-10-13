// Planche de contrôle : 1950 | aujourd'hui pour le bourg et chaque candidat
// de find-spots.py, pour choisir à l'œil les zones d'habitation.
// Usage : node scripts/reels/preview-spots.mjs <candidats.json> <planche.png>
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [, , file, out] = process.argv;
const d = JSON.parse(fs.readFileSync(file, "utf8"));
const pts = [["bourg", d.bourg], ...d.candidats.map((c, i) => [`c${i}`, c])];
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
const p = await b.newPage();
await p.setViewport({ width: 270, height: 480, deviceScaleFactor: 1 });
await p.goto("file://" + path.join(here, "harness.html"));
await p.addStyleTag({ content: "#vig,#brand{display:none}" });
const shots = [];
for (const [n, s] of pts) for (const ep of ["1950", "today"]) {
  await p.evaluate((st) => window.frame(st), { lat: s.lat, lng: s.lng, z: 16.4, a: ep });
  shots.push({ n, ep, data: (await p.screenshot({ encoding: "base64" })) });
}
await p.setViewport({ width: 270 * pts.length, height: 510 });
await p.setContent(`<body style="margin:0;display:flex;font:12px sans-serif">${pts.map(([n]) => `<div><div style="padding:4px">${n}</div><div style="display:flex">${shots.filter((s) => s.n === n).map((s) => `<img src="data:image/png;base64,${s.data}" style="width:135px;height:240px">`).join("")}</div></div>`).join("")}</body>`);
await p.screenshot({ path: out });
await b.close();
