// Visuels 1080×1350 (4:5) des classements de communes + visuel d'ouverture.
// Usage : node scripts/social/rankings-render.mjs media/social/rankings.json media/social
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [, , dataFile, out] = process.argv;
const D = JSON.parse(fs.readFileSync(dataFile, "utf8"));
const logo = "data:image/png;base64," + fs.readFileSync(path.join(here, "../../public/icon-master.png")).toString("base64");
const fr = (n) => n.toLocaleString("fr-FR");

const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;font-family:'Plus Jakarta Sans',sans-serif;background:#2c439c;color:#fff;padding:70px 70px 0;position:relative;overflow:hidden}
.kick{display:inline-block;background:#f0b429;color:#20242e;font-weight:800;font-size:26px;padding:8px 18px;border-radius:999px}
h1{font-weight:800;font-size:60px;line-height:1.08;letter-spacing:-1.5px;margin-top:22px}
.sub{font-weight:600;font-size:27px;color:#dfe5f7;margin-top:12px}
.rows{margin-top:40px;display:flex;flex-direction:column;gap:17px}
.row{display:grid;grid-template-columns:58px 360px 1fr;align-items:center;gap:16px}
.rk{font-weight:800;font-size:34px;color:#f0b429;text-align:right}
.nm{font-weight:700;font-size:31px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{position:relative;height:60px;background:rgba(255,255,255,.10);border-radius:12px;overflow:hidden}
.fill{position:absolute;inset:0 auto 0 0;background:#f0b429;border-radius:12px}
.val{position:absolute;right:16px;top:0;line-height:60px;font-weight:800;font-size:30px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.35)}
.sep{margin:22px 0 4px;font-weight:800;font-size:24px;color:#dfe5f7;text-transform:uppercase;letter-spacing:1px}
.foot{position:absolute;left:70px;right:70px;bottom:44px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.src{font-size:19px;color:#c9d1ee;line-height:1.35;max-width:600px}
.brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:24px;white-space:nowrap}
.brand img{width:62px;height:62px;border-radius:14px}`;

function rows(list, key, unit, max) {
  return list.map((c) => `<div class="row"><div class="rk">${c.rank}</div><div class="nm">${c.nom}</div>
    <div class="bar"><div class="fill" style="width:${Math.max(8, (c[key] / max) * 100)}%"></div><div class="val">${fr(c[key])}${unit}</div></div></div>`).join("");
}
function ranked(key, desc = true) {
  const l = D.communes.filter((c) => c[key] != null).sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]));
  // rang ex æquo : même valeur, même rang
  let prev = null, rank = 0;
  return l.map((c, i) => { if (c[key] !== prev) rank = i + 1; prev = c[key]; return { ...c, rank }; });
}
const foot = (src) => `<div class="foot"><div class="src">${src}</div><div class="brand"><img src="${logo}"><span>pevele-immobilier.fr</span></div></div>`;

const pages = {};
{
  const all = ranked("prixMaison"); const top = all.slice(0, 7); const bottom = all.slice(-3);
  pages["classement-prix-m2"] = `<span class="kick">💶 Prix réels</span><h1>Les communes les plus chères<br>… et les plus abordables</h1>
  <div class="sub">Prix médian au m² des maisons vendues, ${D.periode}</div>
  <div class="rows">${rows(top, "prixMaison", " €", top[0].prixMaison)}<div class="sep">Les plus abordables</div>${rows(bottom, "prixMaison", " €", top[0].prixMaison)}</div>
  ${foot(`Source : DVF (ventes réellement enregistrées), ${D.periode}. Médiane des maisons, communes avec au moins 10 ventes. 44 communes de la Pévèle.`)}`;
}
{
  const top = ranked("terrain").slice(0, 10);
  pages["classement-terrains"] = `<span class="kick">🌳 Terrains</span><h1>Où sont les plus<br>grands terrains ?</h1>
  <div class="sub">Terrain médian des maisons vendues, ${D.periode}</div>
  <div class="rows">${rows(top, "terrain", " m²", top[0].terrain)}</div>
  ${foot(`Source : DVF (surface de terrain des ventes de maisons), ${D.periode}. Médiane, communes avec au moins 10 ventes.`)}`;
}
{
  const top = ranked("ventes").slice(0, 10);
  pages["classement-ventes"] = `<span class="kick">🔥 Marché</span><h1>Les communes<br>où l'on vend le plus</h1>
  <div class="sub">Nombre de ventes immobilières, ${D.periode}</div>
  <div class="rows">${rows(top, "ventes", "", top[0].ventes)}</div>
  ${foot(`Source : DVF (ventes de maisons et d'appartements réellement enregistrées), ${D.periode}. ${fr(D.ventesTotal)} ventes au total en Pévèle.`)}`;
}
{
  // Coupé avant un ex æquo qui déborderait du top 10 (plusieurs communes à 5).
  const top = ranked("commerces").filter((c) => c.commerces >= 6);
  pages["classement-commerces"] = `<span class="kick">🛒 Vie locale</span><h1>Les communes avec<br>le plus de commerces</h1>
  <div class="sub">Commerces de proximité recensés (alimentation, pharmacie, marché)</div>
  <div class="rows">${rows(top, "commerces", "", top[0].commerces)}</div>
  ${foot(`Source : OpenStreetMap (supermarchés, épiceries, boulangeries, boucheries, primeurs, pharmacies, marchés). Recensement collaboratif : un commerce peut manquer.`)}`;
}
pages["ouverture"] = `<div style="height:100%;display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:40px">
  <img src="${logo}" style="width:230px;height:230px;border-radius:52px;box-shadow:0 20px 60px rgba(0,0,0,.3)">
  <span class="kick" style="margin-top:44px">🎉 Samedi 17 octobre</span>
  <h1 style="font-size:74px">Pévèle Immobilier<br>ouvre ses portes</h1>
  <div class="sub" style="font-size:31px;margin-top:20px">Tout l'immobilier de la Pévèle, enfin au même endroit.</div>
  <div style="margin-top:46px;display:flex;flex-direction:column;gap:16px;font-weight:700;font-size:30px;text-align:left">
   <div>🏡 Les annonces des agences et des particuliers</div>
   <div>💶 Une estimation fondée sur les ventes réelles</div>
   <div>🛩️ Votre village vu du ciel, de 1950 à aujourd'hui</div>
   <div>📍 44 communes, prix et guides</div></div>
  <div style="margin-top:54px;background:#f0b429;color:#20242e;font-weight:800;font-size:44px;padding:20px 46px;border-radius:999px">pevele-immobilier.fr</div></div>`;

const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1350 });
for (const [name, html] of Object.entries(pages)) {
  await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>${html}</body></html>`, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));
  await p.screenshot({ path: path.join(out, `${name}.jpg`), type: "jpeg", quality: 92 });
  console.log(name);
}
await b.close();
