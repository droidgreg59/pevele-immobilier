// Montage « <Commune> de 1950 à aujourd'hui » — fondus rythmés, compteur d'années.
// sp = { bourg:{lat,lng}, spots:[s0, s1, s2] } — points vérifiés DANS la commune.
export const FPS = 30;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
// Année de début de chaque période IGN — le compteur est un effet visuel entre deux clichés.
const YEAR = { 1950: 1950, 1965: 1965, 2000: 2000, 2006: 2006, 2011: 2011, 2016: 2016, 2021: 2021 };
const label = (a, b, op) =>
  b === "today" ? (op > 0.5 ? "Aujourd'hui" : String(Math.round(lerp(YEAR[a], 2021, op * 2)))) : String(Math.round(lerp(YEAR[a], YEAR[b] ?? YEAR[a], op)));

function chain(epochs, dur, cam, fadeRatio = 0.62) {
  const n = epochs.length - 1, slot = dur / n, fade = slot * fadeRatio;
  return (t) => {
    const time = t * dur, i = Math.min(n - 1, Math.floor(time / slot)), local = time - i * slot;
    const op = local < fade ? smooth(local / fade) : 1;
    return { ...cam(t), a: epochs[i], b: epochs[i + 1], op, year: label(epochs[i], epochs[i + 1], op), yearOp: 1 };
  };
}

export function buildTimeline(sp, nom) {
  const [s0, , s2] = sp.spots; const c = sp.bourg;
  const segs = []; const seg = (dur, fn) => segs.push({ dur, fn });
  seg(3.0, (t) => ({ lat: c.lat, lng: c.lng, z: lerp(16.8, 17.05, t), a: "1950", nom,
    titleOp: t < 0.12 ? t / 0.12 : t > 0.82 ? Math.max(0, (1 - t) / 0.18) : 1, year: "1950", yearOp: t > 0.75 ? (t - 0.75) / 0.25 : 0 }));
  seg(7.0, chain(["1950", "1965", "2000", "2006", "2011", "2016", "2021", "today"], 7.0, (t) => ({ lat: c.lat, lng: c.lng, z: lerp(17.05, 15.5, ease(t)) })));
  seg(4.5, chain(["1950", "1965", "2000", "2011", "today"], 4.5, (t) => ({ lat: s0.lat, lng: s0.lng, z: lerp(16.2, 16.85, t) })));
  seg(4.5, chain(["1950", "1965", "2000", "2011", "today"], 4.5, (t) => ({ lat: s2.lat, lng: lerp(s2.lng - 0.0015, s2.lng + 0.0015, t), z: 16.5 })));
  seg(3.5, (t) => { const r = ease(Math.min(1, t * 1.2));
    return { lat: c.lat, lng: c.lng, z: lerp(15.0, 14.4, t), a: "1950", b: "today", circle: r, feather: 120,
      year: r > 0.55 ? "Aujourd'hui" : String(Math.round(lerp(1950, 2021, r / 0.55))), yearOp: 1 }; });
  const frames = [];
  for (const s of segs) { const k = Math.round(s.dur * FPS); for (let i = 0; i < k; i++) frames.push(s.fn(i / k)); }
  return frames;
}
