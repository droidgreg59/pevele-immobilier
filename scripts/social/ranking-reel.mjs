// Classement animé en Reel 9:16 (barres qui se remplissent une à une), avec
// la musique des reels et un écran de fin. Les images de classement fixes ne
// sont presque pas diffusées sur Instagram (compte sans abonnés) ; les Reels si.
// Usage : node scripts/social/ranking-reel.mjs <spec.json> <sortie.mp4>
//   spec = { kick, title, sub, unit, source, items:[{nom, value, label?}] }
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [, , specFile, outFile] = process.argv;
const S = JSON.parse(fs.readFileSync(specFile, "utf8"));
const work = path.join(path.dirname(outFile), `.work-${path.basename(outFile, ".mp4")}`);
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
const logo = "data:image/png;base64," + fs.readFileSync(path.join(here, "../../public/icon-master.png")).toString("base64");
const FPS = 30, INTRO = 1.0, STEP = 0.45, HOLD = 3.5;
const n = S.items.length, max = Math.max(...S.items.map((i) => i.value));
const total = INTRO + n * STEP + 0.6 + HOLD;
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const fr = (v) => v.toLocaleString("fr-FR");

const html = `<html><head><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#2c439c;color:#fff;font-family:'Plus Jakarta Sans';padding:200px 70px 0;overflow:hidden;position:relative}
.kick{display:inline-block;background:#f0b429;color:#20242e;font-weight:800;font-size:34px;padding:10px 24px;border-radius:999px}
h1{font-weight:800;font-size:80px;line-height:1.05;letter-spacing:-2px;margin-top:28px}
.sub{font-weight:600;font-size:34px;color:#dfe5f7;margin-top:16px}
.rows{margin-top:60px;display:flex;flex-direction:column;gap:${n > 8 ? 20 : 28}px}
.row{display:grid;grid-template-columns:64px 400px 1fr;align-items:center;gap:18px;opacity:0;transform:translateX(-40px)}
.rk{font-weight:800;font-size:40px;color:#f0b429;text-align:right}
.nm{font-weight:700;font-size:36px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{position:relative;height:${n > 8 ? 70 : 84}px;background:rgba(255,255,255,.10);border-radius:14px;overflow:hidden}
.fill{position:absolute;inset:0 auto 0 0;background:#f0b429;border-radius:14px;width:0}
.val{position:absolute;right:18px;top:0;line-height:${n > 8 ? 70 : 84}px;font-weight:800;font-size:36px;text-shadow:0 1px 4px rgba(0,0,0,.35)}
.foot{position:absolute;left:70px;right:70px;bottom:120px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.src{font-size:24px;color:#c9d1ee;line-height:1.35;max-width:620px}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:30px;white-space:nowrap}.brand img{width:78px;height:78px;border-radius:18px}
</style></head><body>
<span class="kick">${S.kick}</span><h1>${S.title}</h1><div class="sub">${S.sub}</div>
<div class="rows">${S.items.map((it, i) => `<div class="row" id="r${i}"><div class="rk">${it.rank ?? i + 1}</div><div class="nm">${it.nom}</div><div class="bar"><div class="fill" id="f${i}"></div><div class="val" id="v${i}"></div></div></div>`).join("")}</div>
<div class="foot"><div class="src">${S.source}</div><div class="brand"><img src="${logo}"><span>pevele-immobilier.fr</span></div></div>
</body></html>`;

const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
await p.setContent(html, { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
const frames = Math.round(total * FPS);
for (let f = 0; f < frames; f++) {
  const t = f / FPS;
  const state = S.items.map((it, i) => {
    const k = ease((t - INTRO - i * STEP) / 0.6);
    return { op: k, w: (it.value / max) * 100 * k, v: it.label ?? `${fr(Math.round(it.value * k))}${S.unit}`, done: k >= 1 };
  });
  await p.evaluate((st, unit, items) => {
    st.forEach((s, i) => {
      const r = document.getElementById("r" + i);
      r.style.opacity = s.op; r.style.transform = `translateX(${(1 - s.op) * -40}px)`;
      document.getElementById("f" + i).style.width = Math.max(s.op > 0 ? 6 : 0, s.w) + "%";
      document.getElementById("v" + i).textContent = s.done ? (items[i].label ?? items[i].value.toLocaleString("fr-FR") + unit) : s.v;
    });
  }, state, S.unit, S.items);
  await p.screenshot({ path: `${work}/f${String(f).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
}
await b.close();

// Fin commune aux reels (assets.mjs) + musique des reels, fondu de sortie.
const W = path.join(here, "../../media/reels/work");
if (!fs.existsSync(path.join(W, "end-b.png"))) execFileSync("node", [path.join(here, "../reels/assets.mjs"), W], { stdio: "inherit" });
const ff = (args) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const V = ["-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30"];
ff(["-framerate", "30", "-i", `${work}/f%05d.jpg`, ...V, "-an", `${work}/main.mp4`]);
ff(["-loop", "1", "-framerate", "30", "-t", "3", "-i", path.join(W, "end-b.png"), "-vf", "scale=1080:1920", ...V, "-an", `${work}/end.mp4`]);
ff(["-i", `${work}/main.mp4`, "-i", `${work}/end.mp4`, "-filter_complex", `[0][1]xfade=transition=fade:duration=0.5:offset=${(total - 0.5).toFixed(2)}`, ...V, "-an", `${work}/video.mp4`]);
const D = total + 2.5;
ff(["-i", `${work}/video.mp4`, "-i", path.join(W, "music-a.mp4"), "-filter_complex", `[1:a]atrim=0:${D},afade=t=out:st=${(D - 1.2).toFixed(2)}:d=1.2,loudnorm=I=-14:TP=-1.5[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-shortest", "-movflags", "+faststart", outFile]);
fs.rmSync(work, { recursive: true, force: true });
console.log(outFile, `${D.toFixed(1)} s`);
