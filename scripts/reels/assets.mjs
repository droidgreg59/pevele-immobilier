// Visuels fixes communs à tous les reels : fond « Et votre village ? » avec
// cadre de téléphone, masque d'écran arrondi, écrans de fin.
// Usage : node scripts/reels/assets.mjs <dossier-sortie>
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const logo = "data:image/png;base64," + fs.readFileSync(path.join(here, "../../public/icon-master.png")).toString("base64");

const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
const head = `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&display=swap" rel="stylesheet"><style>*{margin:0;box-sizing:border-box}html,body{width:1080px;height:1920px;font-family:'Plus Jakarta Sans';overflow:hidden}</style>`;
const shot = async (html, file) => {
  await p.setContent(`<html><head>${head}</head><body style="background:#2c439c">${html}</body></html>`, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: path.join(out, file) });
};
await shot(`<div style="position:absolute;top:95px;left:0;right:0;text-align:center;color:#fff">
 <div style="font-weight:800;font-size:66px;letter-spacing:-1px">Et votre village&nbsp;?</div>
 <div style="display:inline-block;margin-top:18px;background:#f0b429;color:#20242e;font-weight:800;font-size:36px;padding:12px 28px;border-radius:999px">Comparez sur pevele-immobilier.fr</div></div>
 <div style="position:absolute;left:178px;top:348px;width:724px;height:1539px;border-radius:64px;background:#10131f;box-shadow:0 40px 90px rgba(0,0,0,.45)"></div>`, "phone-bg.png");
const card = (withTag) => `<div style="height:1920px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center">
 <img src="${logo}" style="width:300px;height:300px;border-radius:66px;box-shadow:0 24px 70px rgba(0,0,0,.3)">
 <div style="margin-top:64px;background:#f0b429;color:#20242e;font-weight:800;font-size:54px;padding:24px 54px;border-radius:999px">pevele-immobilier.fr</div>
 <div style="margin-top:70px;font-weight:800;font-size:76px;line-height:1.1;letter-spacing:-1.5px;opacity:${withTag ? 1 : 0}">Tout l'immobilier<br>de la Pévèle</div></div>`;
await shot(card(false), "end-a.png");
await shot(card(true), "end-b.png");
await p.setViewport({ width: 700, height: 1515 });
await p.setContent(`<html><body style="margin:0;background:#000"><div style="width:700px;height:1515px;border-radius:54px;background:#fff"></div></body></html>`);
await p.screenshot({ path: path.join(out, "phone-mask.png") });
await b.close();
