// Enregistrement du vrai site (production) sur mobile : un doigt simulé fait
// glisser le curseur de « Vue du ciel » puis passe en « Côte à côte ».
// Usage : node scripts/reels/screenrec.mjs <dossier-sortie> "<url vue-du-ciel>"
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [, , out, url] = process.argv;
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { try { localStorage.setItem("pvl-prelaunch-modal-vu", "1"); } catch {} });
await p.goto(url, { waitUntil: "networkidle0" });
await p.evaluate(() => { const s = document.querySelectorAll("select")[1]; window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 70); });
await new Promise((r) => setTimeout(r, 2500));
await p.evaluate(() => {
  const d = document.createElement("div"); d.id = "finger";
  Object.assign(d.style, { position: "fixed", width: "46px", height: "46px", marginLeft: "-23px", marginTop: "-23px", borderRadius: "50%", background: "rgba(255,255,255,.55)", border: "2px solid rgba(255,255,255,.9)", boxShadow: "0 2px 10px rgba(0,0,0,.35)", zIndex: 99999, pointerEvents: "none", display: "none", transition: "transform .12s" });
  document.body.appendChild(d);
});
const finger = (x, y, show = true, press = false) => p.evaluate((x, y, show, press) => { const d = document.getElementById("finger"); d.style.left = x + "px"; d.style.top = y + "px"; d.style.display = show ? "block" : "none"; d.style.transform = press ? "scale(.85)" : "scale(1)"; }, x, y, show, press);
let n = 0;
const shot = async () => { await p.screenshot({ path: `${out}/f${String(n++).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 }); };
const hold = async (k) => { for (let i = 0; i < k; i++) await shot(); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const h = await (await p.$("[role=slider]")).boundingBox();
const map = await (await p.$(".leaflet-container")).boundingBox();
const cy = h.y + h.height / 2; let x = h.x + h.width / 2;
await hold(15);
await finger(x + 60, cy + 90); await hold(6);
for (let i = 1; i <= 8; i++) { await finger(x + 60 * (1 - i / 8), cy + 90 * (1 - i / 8)); await shot(); }
await finger(x, cy, true, true); await p.mouse.move(x, cy); await p.mouse.down(); await hold(4);
const drag = async (to, k) => { const from = x; for (let i = 1; i <= k; i++) { const nx = from + (to - from) * ease(i / k); await p.mouse.move(nx, cy); await finger(nx, cy, true, true); await new Promise((r) => setTimeout(r, 30)); await shot(); } x = to; };
await drag(map.x + map.width - 14, 36); await hold(10);
await drag(map.x + 14, 48); await hold(12);
await drag(map.x + map.width * 0.5, 30); await hold(6);
await p.mouse.up(); await finger(x, cy, true, false); await hold(6);
const btn = await (await p.$$("[role=radio]"))[2].boundingBox();
const bx = btn.x + btn.width / 2, by = btn.y + btn.height / 2;
for (let i = 1; i <= 10; i++) { await finger(x + (bx - x) * ease(i / 10), cy + (by - cy) * ease(i / 10)); await shot(); }
await finger(bx, by, true, true); await hold(3);
await p.evaluate(() => document.querySelectorAll("[role=radio]")[2].click());
await new Promise((r) => setTimeout(r, 2500));
await finger(bx, by, false); await hold(45);
await b.close();
console.log(`${n} images`);
