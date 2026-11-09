/* Zeichenhilfen für die Comic-Blöcke: Easing, Zufall, Figuren, Fahrzeuge,
 * Zelt, Regen und Sprechblasen-Formen. Alles liefert SVG-Strings – der
 * Bildzustand wird je Frame komplett neu aufgebaut (deterministisch aus t). */

// ---------------------------------------------------------------- Zeit & Zahl
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, u) => a + (b - a) * u;
/** Fortschritt 0..1 zwischen t0 und t1, Ease-out (kubisch). */
export function easeOut(t, t0, t1) {
  const u = clamp((t - t0) / Math.max(1e-6, t1 - t0));
  return 1 - Math.pow(1 - u, 3);
}
export function easeInOut(t, t0, t1) {
  const u = clamp((t - t0) / Math.max(1e-6, t1 - t0));
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}
/** Pop mit leichtem Überschwingen (für Panels, Blasen, Stempel). */
export function pop(t, t0, dauer = 0.35) {
  const u = clamp((t - t0) / dauer);
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
}
/** Deterministischer Zufall (mulberry32). */
export function zufall(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export const f1 = (n) => Math.round(n * 10) / 10;
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------- Farben
export const F = {
  kontur: "#141414",
  thw: "#1b3fa6",
  thwDunkel: "#12275e",
  thwHell: "#2f5ad0",
  reflex: "#ffe100",
  silber: "#d9dee8",
  haut: "#f2c9a6",
  hautDunkel: "#d9a77f",
  nacht: "#0b1230",
  nachtHell: "#1a2a5a",
  boden: "#1c2238",
  bodenNass: "#2b3660",
  licht: "#fff2a8",
  papier: "#f4efe0",
  gelb: "#ffe76a",
};

// ---------------------------------------------------------------- Defs
export function defs() {
  return `
  <defs>
    <pattern id="halbton" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
      <circle cx="7" cy="7" r="3.2" fill="#141414"/>
    </pattern>
    <pattern id="halbtonFein" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
      <circle cx="5" cy="5" r="1.7" fill="#141414"/>
    </pattern>
    <pattern id="halbtonHell" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
      <circle cx="6" cy="6" r="2.4" fill="#ffffff"/>
    </pattern>
    <radialGradient id="lampe" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff6c4" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="#ffe88a" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffe88a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="kegel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff6c4" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#fff6c4" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#060a1c"/>
      <stop offset="1" stop-color="#1a2a5a"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#dfe6f7"/>
    </linearGradient>
  </defs>`;
}

// ---------------------------------------------------------------- Regen
/** Regenstriche im Rechteck w×h, Position aus t (deterministisch). */
export function regen(t, w, h, { n = 140, seed = 7, staerke = 1, wind = 160, tempo = 1500, laenge = 34, opacity = 0.55 } = {}) {
  const r = zufall(seed);
  let out = `<g stroke="#bcd0ff" stroke-width="3" stroke-linecap="round" opacity="${opacity}">`;
  for (let i = 0; i < n * staerke; i++) {
    const sx = r() * (w + 400) - 200;
    const sy = r() * h;
    const v = tempo * (0.75 + r() * 0.5);
    const y = (sy + t * v) % (h + 80) - 40;
    const x = sx + t * wind * 0.4 - (y - sy) * (wind / tempo);
    const xx = ((x % (w + 400)) + w + 400) % (w + 400) - 200;
    const L = laenge * (0.7 + r() * 0.6);
    out += `<line x1="${f1(xx)}" y1="${f1(y)}" x2="${f1(xx - L * (wind / tempo))}" y2="${f1(y - L)}"/>`;
  }
  return out + "</g>";
}

/** Spritzer am Boden (kleine Bögen), ebenfalls aus t. */
export function spritzer(t, w, y, { n = 30, seed = 3 } = {}) {
  const r = zufall(seed);
  let out = `<g fill="none" stroke="#bcd0ff" stroke-width="3" stroke-linecap="round" opacity="0.6">`;
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const ph = r();
    const u = (t * 2.2 + ph) % 1;
    const s = 6 + u * 16;
    const o = 1 - u;
    out += `<path d="M${f1(x - s)} ${f1(y)} q${f1(s)} ${f1(-s * 0.9)} ${f1(2 * s)} 0" opacity="${f1(o)}"/>`;
  }
  return out + "</g>";
}

// ---------------------------------------------------------------- Figuren
/**
 * Einfache Einsatzkraft. Füße bei (x,y), Höhe h. blick: 1 = nach rechts, -1 = nach links.
 * kopf: "helm" | "muetze" | "kapuze" | "frei"
 * armL/armR: Winkel in Grad (0 = hängt, 90 = waagerecht nach vorn, 150 = hoch)
 * prop: "zettel" | "handy" | "tablet" | "klemmbrett" | "funk" | "lageblatt" | "stift" | null (an der vorderen Hand)
 * mund: "neutral" | "offen" | "laecheln" | "schief"
 */
export function figur({ x, y, h = 320, blick = 1, kopf = "helm", armL = 10, armR = 10, prop = null, propHand = "R", mund = "neutral", farbe = F.thw, jacke = null, schweiss = false, augen = "offen", nass = false }) {
  const k = F.kontur;
  const sw = Math.max(3, h * 0.016);
  const kopfR = h * 0.095;
  const torsoH = h * 0.34;
  const beinH = h * 0.4;
  const schulterY = y - beinH - torsoH;
  const kopfY = schulterY - kopfR * 1.15;
  const halbB = h * 0.11;
  const armL_ = h * 0.3;
  const armW = h * 0.075;
  const jackeFarbe = jacke ?? farbe;

  function arm(seite, winkel, mitProp) {
    // Schulterpunkt: Seite -1 links (hinten bei blick=1), +1 rechts (vorne)
    const sx = x + seite * halbB * 0.9 * blick;
    const sy = schulterY + h * 0.02;
    // Vorwärtsrichtung ist blick; Winkel öffnet nach vorn
    const ex = sx + Math.sin((winkel * Math.PI) / 180) * armL_ * blick;
    const ey = sy + Math.cos((winkel * Math.PI) / 180) * armL_;
    let s = `<line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(ex)}" y2="${f1(ey)}" stroke="${k}" stroke-width="${f1(armW + sw * 2)}" stroke-linecap="round"/>`;
    s += `<line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(ex)}" y2="${f1(ey)}" stroke="${jackeFarbe}" stroke-width="${f1(armW)}" stroke-linecap="round"/>`;
    // Reflexstreifen am Unterarm
    const rx = lerp(sx, ex, 0.72), ry = lerp(sy, ey, 0.72);
    const nx = -(ey - sy), ny = ex - sx; const nl = Math.hypot(nx, ny) || 1;
    s += `<line x1="${f1(rx + (nx / nl) * armW * 0.5)}" y1="${f1(ry + (ny / nl) * armW * 0.5)}" x2="${f1(rx - (nx / nl) * armW * 0.5)}" y2="${f1(ry - (ny / nl) * armW * 0.5)}" stroke="${F.reflex}" stroke-width="${f1(h * 0.022)}"/>`;
    // Hand
    s += `<circle cx="${f1(ex)}" cy="${f1(ey)}" r="${f1(armW * 0.62)}" fill="${F.haut}" stroke="${k}" stroke-width="${f1(sw)}"/>`;
    if (mitProp && prop) s += requisite(prop, ex, ey, h, blick);
    return s;
  }

  let s = `<g class="figur">`;
  // Beine
  const beinW = h * 0.085;
  for (const seite of [-1, 1]) {
    const bx = x + seite * halbB * 0.45;
    s += `<line x1="${f1(bx)}" y1="${f1(y - beinH)}" x2="${f1(bx)}" y2="${f1(y - h * 0.03)}" stroke="${k}" stroke-width="${f1(beinW + sw * 2)}" stroke-linecap="round"/>`;
    s += `<line x1="${f1(bx)}" y1="${f1(y - beinH)}" x2="${f1(bx)}" y2="${f1(y - h * 0.03)}" stroke="${farbe}" stroke-width="${f1(beinW)}" stroke-linecap="round"/>`;
    s += `<line x1="${f1(bx - beinW / 2)}" y1="${f1(y - h * 0.14)}" x2="${f1(bx + beinW / 2)}" y2="${f1(y - h * 0.14)}" stroke="${F.reflex}" stroke-width="${f1(h * 0.022)}"/>`;
    // Stiefel
    s += `<rect x="${f1(bx - beinW * 0.7 + (seite === blick ? beinW * 0.25 : -beinW * 0.1))}" y="${f1(y - h * 0.05)}" width="${f1(beinW * 1.4)}" height="${f1(h * 0.05)}" rx="${f1(h * 0.012)}" fill="#111" stroke="${k}" stroke-width="${f1(sw)}"/>`;
  }
  // hinterer Arm
  s += arm(-1, armL, propHand === "L");
  // Torso
  const tx = x - halbB, tw = halbB * 2;
  s += `<path d="M${f1(tx)} ${f1(schulterY)} h${f1(tw)} q${f1(h * 0.02)} 0 ${f1(h * 0.02)} ${f1(h * 0.02)} l${f1(-h * 0.01)} ${f1(torsoH - h * 0.02)} h${f1(-(tw + h * 0.02))} l${f1(-h * 0.01)} ${f1(-(torsoH - h * 0.02))} q0 ${f1(-h * 0.02)} ${f1(h * 0.02)} ${f1(-h * 0.02)} z" fill="${jackeFarbe}" stroke="${k}" stroke-width="${f1(sw)}" stroke-linejoin="round"/>`;
  // Reflexstreifen Brust & Bauch
  s += `<rect x="${f1(tx + h * 0.012)}" y="${f1(schulterY + torsoH * 0.55)}" width="${f1(tw - h * 0.02)}" height="${f1(h * 0.028)}" fill="${F.reflex}" stroke="${k}" stroke-width="${f1(sw * 0.6)}"/>`;
  s += `<rect x="${f1(tx + h * 0.012)}" y="${f1(schulterY + torsoH * 0.55 + h * 0.034)}" width="${f1(tw - h * 0.02)}" height="${f1(h * 0.014)}" fill="${F.silber}"/>`;
  // Reißverschluss / Kragen
  s += `<line x1="${f1(x)}" y1="${f1(schulterY + h * 0.02)}" x2="${f1(x)}" y2="${f1(schulterY + torsoH * 0.5)}" stroke="${k}" stroke-width="${f1(sw * 0.7)}" stroke-dasharray="${f1(h * 0.012)} ${f1(h * 0.012)}"/>`;
  s += `<path d="M${f1(x - halbB * 0.45)} ${f1(schulterY)} l${f1(halbB * 0.45)} ${f1(h * 0.05)} l${f1(halbB * 0.45)} ${f1(-h * 0.05)}" fill="none" stroke="${k}" stroke-width="${f1(sw)}"/>`;
  // Schatten unter Kinn (Halbton)
  s += `<rect x="${f1(tx)}" y="${f1(schulterY)}" width="${f1(tw)}" height="${f1(h * 0.05)}" fill="url(#halbtonFein)" opacity="0.5"/>`;
  // Kopf
  const kx = x + blick * kopfR * 0.1;
  s += `<circle cx="${f1(kx)}" cy="${f1(kopfY)}" r="${f1(kopfR)}" fill="${F.haut}" stroke="${k}" stroke-width="${f1(sw)}"/>`;
  // Ohr
  s += `<circle cx="${f1(kx - blick * kopfR * 0.95)}" cy="${f1(kopfY + kopfR * 0.1)}" r="${f1(kopfR * 0.22)}" fill="${F.haut}" stroke="${k}" stroke-width="${f1(sw * 0.8)}"/>`;
  // Augen
  const ax = kx + blick * kopfR * 0.35, ay = kopfY - kopfR * 0.08;
  if (augen === "zu") {
    s += `<path d="M${f1(ax - kopfR * 0.12)} ${f1(ay)} q${f1(kopfR * 0.12)} ${f1(kopfR * 0.14)} ${f1(kopfR * 0.24)} 0" fill="none" stroke="${k}" stroke-width="${f1(sw)}"/>`;
    s += `<path d="M${f1(ax + blick * kopfR * 0.42 - kopfR * 0.1)} ${f1(ay)} q${f1(kopfR * 0.1)} ${f1(kopfR * 0.12)} ${f1(kopfR * 0.2)} 0" fill="none" stroke="${k}" stroke-width="${f1(sw)}"/>`;
  } else {
    s += `<ellipse cx="${f1(ax)}" cy="${f1(ay)}" rx="${f1(kopfR * 0.14)}" ry="${f1(kopfR * (augen === "gross" ? 0.24 : 0.17))}" fill="${k}"/>`;
    s += `<ellipse cx="${f1(ax + blick * kopfR * 0.45)}" cy="${f1(ay)}" rx="${f1(kopfR * 0.12)}" ry="${f1(kopfR * (augen === "gross" ? 0.22 : 0.15))}" fill="${k}"/>`;
    // Augenbraue
    const by = ay - kopfR * (augen === "gross" ? 0.42 : 0.32);
    s += `<path d="M${f1(ax - kopfR * 0.18)} ${f1(by + (augen === "skeptisch" ? kopfR * 0.1 : 0))} l${f1(kopfR * 0.3)} ${f1(augen === "skeptisch" ? -kopfR * 0.1 : -kopfR * 0.04)}" stroke="${k}" stroke-width="${f1(sw * 1.1)}" stroke-linecap="round"/>`;
  }
  // Nase
  s += `<path d="M${f1(kx + blick * kopfR * 0.78)} ${f1(kopfY)} l${f1(blick * kopfR * 0.18)} ${f1(kopfR * 0.22)} l${f1(-blick * kopfR * 0.2)} ${f1(kopfR * 0.05)}" fill="none" stroke="${k}" stroke-width="${f1(sw)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Mund
  const mx = kx + blick * kopfR * 0.45, my = kopfY + kopfR * 0.52;
  if (mund === "offen") s += `<ellipse cx="${f1(mx)}" cy="${f1(my)}" rx="${f1(kopfR * 0.16)}" ry="${f1(kopfR * 0.2)}" fill="#3a0f14" stroke="${k}" stroke-width="${f1(sw * 0.8)}"/>`;
  else if (mund === "laecheln") s += `<path d="M${f1(mx - kopfR * 0.25)} ${f1(my - kopfR * 0.05)} q${f1(kopfR * 0.25)} ${f1(kopfR * 0.3)} ${f1(kopfR * 0.5)} 0" fill="none" stroke="${k}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
  else if (mund === "schief") s += `<path d="M${f1(mx - kopfR * 0.22)} ${f1(my)} q${f1(kopfR * 0.2)} ${f1(-kopfR * 0.12)} ${f1(kopfR * 0.42)} ${f1(kopfR * 0.04)}" fill="none" stroke="${k}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
  else s += `<line x1="${f1(mx - kopfR * 0.2)}" y1="${f1(my)}" x2="${f1(mx + kopfR * 0.2)}" y2="${f1(my)}" stroke="${k}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
  // Kopfbedeckung
  if (kopf === "helm") {
    s += `<path d="M${f1(kx - kopfR * 1.12)} ${f1(kopfY - kopfR * 0.05)} a${f1(kopfR * 1.12)} ${f1(kopfR * 1.05)} 0 0 1 ${f1(kopfR * 2.24)} 0 z" fill="#f5f5f5" stroke="${k}" stroke-width="${f1(sw)}"/>`;
    s += `<path d="M${f1(kx - kopfR * 1.2)} ${f1(kopfY - kopfR * 0.02)} h${f1(kopfR * 2.4)}" stroke="${k}" stroke-width="${f1(sw * 1.4)}" stroke-linecap="round"/>`;
    s += `<rect x="${f1(kx - kopfR * 0.95)}" y="${f1(kopfY - kopfR * 0.6)}" width="${f1(kopfR * 1.9)}" height="${f1(kopfR * 0.18)}" fill="${F.thw}"/>`;
    s += `<path d="M${f1(kx - kopfR * 1.12)} ${f1(kopfY - kopfR * 0.05)} a${f1(kopfR * 1.12)} ${f1(kopfR * 1.05)} 0 0 1 ${f1(kopfR * 0.9)} ${f1(-kopfR * 0.98)} l${f1(kopfR * 0.2)} 0 a${f1(kopfR * 1.0)} ${f1(kopfR * 0.95)} 0 0 0 ${f1(-kopfR * 1.0)} ${f1(kopfR * 0.98)} z" fill="url(#halbtonFein)" opacity="0.35"/>`;
    // Kinnriemen
    s += `<path d="M${f1(kx - kopfR * 0.9)} ${f1(kopfY + kopfR * 0.1)} q${f1(kopfR * 0.9)} ${f1(kopfR * 1.1)} ${f1(kopfR * 1.8)} 0" fill="none" stroke="${k}" stroke-width="${f1(sw * 0.8)}"/>`;
  } else if (kopf === "muetze") {
    s += `<path d="M${f1(kx - kopfR * 1.05)} ${f1(kopfY - kopfR * 0.15)} a${f1(kopfR * 1.05)} ${f1(kopfR * 1.05)} 0 0 1 ${f1(kopfR * 2.1)} 0 z" fill="${F.thwDunkel}" stroke="${k}" stroke-width="${f1(sw)}"/>`;
    s += `<rect x="${f1(kx - kopfR * 1.08)}" y="${f1(kopfY - kopfR * 0.38)}" width="${f1(kopfR * 2.16)}" height="${f1(kopfR * 0.32)}" rx="${f1(kopfR * 0.1)}" fill="${F.thwDunkel}" stroke="${k}" stroke-width="${f1(sw)}"/>`;
    // Headset-Bügel + Mikro
    s += `<path d="M${f1(kx - kopfR * 1.1)} ${f1(kopfY - kopfR * 0.1)} a${f1(kopfR * 1.15)} ${f1(kopfR * 1.15)} 0 0 1 ${f1(kopfR * 2.2)} 0" fill="none" stroke="${k}" stroke-width="${f1(sw * 1.2)}"/>`;
    s += `<rect x="${f1(kx - blick * kopfR * 1.15 - kopfR * 0.18)}" y="${f1(kopfY - kopfR * 0.1)}" width="${f1(kopfR * 0.36)}" height="${f1(kopfR * 0.5)}" rx="${f1(kopfR * 0.08)}" fill="#222" stroke="${k}" stroke-width="${f1(sw * 0.8)}"/>`;
    s += `<path d="M${f1(kx - blick * kopfR * 1.1)} ${f1(kopfY + kopfR * 0.35)} q${f1(blick * kopfR * 0.6)} ${f1(kopfR * 0.6)} ${f1(blick * kopfR * 1.5)} ${f1(kopfR * 0.3)}" fill="none" stroke="${k}" stroke-width="${f1(sw * 0.9)}"/>`;
    s += `<circle cx="${f1(kx + blick * kopfR * 0.45)}" cy="${f1(kopfY + kopfR * 0.66)}" r="${f1(kopfR * 0.1)}" fill="#222"/>`;
    // Haar
    s += `<path d="M${f1(kx - blick * kopfR * 0.98)} ${f1(kopfY + kopfR * 0.0)} q${f1(-blick * kopfR * 0.2)} ${f1(kopfR * 0.9)} ${f1(blick * kopfR * 0.1)} ${f1(kopfR * 1.5)}" fill="none" stroke="#7a4a1e" stroke-width="${f1(kopfR * 0.25)}" stroke-linecap="round"/>`;
  } else if (kopf === "kapuze") {
    s += `<path d="M${f1(kx - kopfR * 1.3)} ${f1(kopfY + kopfR * 1.0)} a${f1(kopfR * 1.3)} ${f1(kopfR * 2.4)} 0 1 1 ${f1(kopfR * 2.6)} 0 l${f1(kopfR * 0.15)} ${f1(kopfR * 0.5)} h${f1(-kopfR * 2.9)} z" fill="${jackeFarbe}" stroke="${k}" stroke-width="${f1(sw)}" stroke-linejoin="round"/>`;
    s += `<path d="M${f1(kx - kopfR * 1.3)} ${f1(kopfY + kopfR * 1.0)} a${f1(kopfR * 1.3)} ${f1(kopfR * 2.4)} 0 0 1 ${f1(kopfR * 0.6)} ${f1(-kopfR * 2.1)} l${f1(kopfR * 0.3)} ${f1(kopfR * 0.2)} a${f1(kopfR * 1.0)} ${f1(kopfR * 1.9)} 0 0 0 ${f1(-kopfR * 0.6)} ${f1(kopfR * 1.9)} z" fill="url(#halbtonFein)" opacity="0.4"/>`;
    s += `<ellipse cx="${f1(kx)}" cy="${f1(kopfY + kopfR * 0.05)}" rx="${f1(kopfR * 0.98)}" ry="${f1(kopfR * 1.05)}" fill="${F.haut}" stroke="${k}" stroke-width="${f1(sw)}"/>`;
    // Gesicht erneut (Augen/Nase/Mund über der Haut)
    s += `<ellipse cx="${f1(ax)}" cy="${f1(ay)}" rx="${f1(kopfR * 0.14)}" ry="${f1(kopfR * 0.17)}" fill="${k}"/><ellipse cx="${f1(ax + blick * kopfR * 0.45)}" cy="${f1(ay)}" rx="${f1(kopfR * 0.12)}" ry="${f1(kopfR * 0.15)}" fill="${k}"/>`;
    s += `<path d="M${f1(ax - kopfR * 0.18)} ${f1(ay - kopfR * 0.32)} l${f1(kopfR * 0.3)} ${f1(-kopfR * 0.04)}" stroke="${k}" stroke-width="${f1(sw * 1.1)}" stroke-linecap="round"/>`;
    s += `<path d="M${f1(kx + blick * kopfR * 0.78)} ${f1(kopfY)} l${f1(blick * kopfR * 0.18)} ${f1(kopfR * 0.22)} l${f1(-blick * kopfR * 0.2)} ${f1(kopfR * 0.05)}" fill="none" stroke="${k}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
    if (mund === "laecheln") s += `<path d="M${f1(mx - kopfR * 0.25)} ${f1(my - kopfR * 0.05)} q${f1(kopfR * 0.25)} ${f1(kopfR * 0.3)} ${f1(kopfR * 0.5)} 0" fill="none" stroke="${k}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
    else if (mund === "offen") s += `<ellipse cx="${f1(mx)}" cy="${f1(my)}" rx="${f1(kopfR * 0.16)}" ry="${f1(kopfR * 0.2)}" fill="#3a0f14" stroke="${k}" stroke-width="${f1(sw * 0.8)}"/>`;
    else s += `<line x1="${f1(mx - kopfR * 0.2)}" y1="${f1(my)}" x2="${f1(mx + kopfR * 0.2)}" y2="${f1(my)}" stroke="${k}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
    // blonde Strähne
    s += `<path d="M${f1(kx - blick * kopfR * 0.3)} ${f1(kopfY - kopfR * 0.95)} q${f1(blick * kopfR * 0.5)} ${f1(-kopfR * 0.1)} ${f1(blick * kopfR * 0.9)} ${f1(kopfR * 0.25)}" fill="none" stroke="#e2b24a" stroke-width="${f1(kopfR * 0.18)}" stroke-linecap="round"/>`;
  } else {
    // kurze Haare
    s += `<path d="M${f1(kx - kopfR * 1.02)} ${f1(kopfY - kopfR * 0.1)} a${f1(kopfR * 1.02)} ${f1(kopfR * 1.0)} 0 0 1 ${f1(kopfR * 2.04)} 0 l${f1(-kopfR * 0.3)} ${f1(kopfR * 0.1)} q${f1(-kopfR * 0.7)} ${f1(-kopfR * 0.5)} ${f1(-kopfR * 1.5)} ${f1(kopfR * 0.1)} z" fill="#4a2e14" stroke="${k}" stroke-width="${f1(sw)}"/>`;
  }
  // Schweißtropfen
  if (schweiss) {
    const sx2 = kx - blick * kopfR * 1.15, sy2 = kopfY - kopfR * 0.55;
    s += `<path d="M${f1(sx2)} ${f1(sy2 - kopfR * 0.3)} q${f1(kopfR * 0.22)} ${f1(kopfR * 0.3)} 0 ${f1(kopfR * 0.45)} q${f1(-kopfR * 0.22)} ${f1(-kopfR * 0.15)} 0 ${f1(-kopfR * 0.45)} z" fill="#9fd3ff" stroke="${k}" stroke-width="${f1(sw * 0.8)}"/>`;
  }
  if (nass) {
    // Tropfen von Helm/Schultern
    for (const dx of [-0.9, 0.2, 1.0]) {
      s += `<path d="M${f1(kx + dx * kopfR)} ${f1(schulterY - kopfR * 0.1)} q${f1(kopfR * 0.12)} ${f1(kopfR * 0.25)} 0 ${f1(kopfR * 0.4)} q${f1(-kopfR * 0.12)} ${f1(-kopfR * 0.15)} 0 ${f1(-kopfR * 0.4)} z" fill="#9fd3ff" stroke="${k}" stroke-width="${f1(sw * 0.6)}"/>`;
    }
  }
  // vorderer Arm
  s += arm(1, armR, propHand === "R");
  return s + "</g>";
}

/** Requisiten an der Hand (ex,ey), Größe relativ zur Figurhöhe. */
export function requisite(art, ex, ey, h, blick) {
  const k = F.kontur, sw = Math.max(3, h * 0.014);
  if (art === "zettel") {
    const w = h * 0.2, hh = h * 0.26;
    return `<g transform="translate(${f1(ex)} ${f1(ey)}) rotate(${blick * 8})"><path d="M${f1(-w / 2)} ${f1(-hh * 0.15)} q${f1(w * 0.2)} ${f1(-hh * 0.08)} ${f1(w)} 0 l${f1(w * 0.03)} ${f1(hh)} q${f1(-w * 0.4)} ${f1(hh * 0.1)} ${f1(-w)} 0 z" fill="${F.papier}" stroke="${k}" stroke-width="${f1(sw)}" stroke-linejoin="round"/>
      <g stroke="#3b4a8a" stroke-width="${f1(sw * 0.7)}" opacity="0.85" fill="none">
        <path d="M${f1(-w * 0.38)} ${f1(hh * 0.08)} q${f1(w * 0.2)} ${f1(-h * 0.01)} ${f1(w * 0.7)} ${f1(h * 0.004)}"/>
        <path d="M${f1(-w * 0.38)} ${f1(hh * 0.25)} q${f1(w * 0.3)} ${f1(h * 0.012)} ${f1(w * 0.6)} 0"/>
        <path d="M${f1(-w * 0.38)} ${f1(hh * 0.42)} q${f1(w * 0.15)} ${f1(-h * 0.008)} ${f1(w * 0.5)} ${f1(h * 0.006)}"/>
        <path d="M${f1(-w * 0.38)} ${f1(hh * 0.6)} h${f1(w * 0.45)}"/>
      </g>
      <ellipse cx="${f1(w * 0.15)}" cy="${f1(hh * 0.5)}" rx="${f1(w * 0.3)}" ry="${f1(hh * 0.22)}" fill="#8fb3ff" opacity="0.35"/>
      <path d="M${f1(w * 0.3)} ${f1(hh * 0.85)} q${f1(w * 0.08)} ${f1(hh * 0.15)} 0 ${f1(hh * 0.25)} q${f1(-w * 0.08)} ${f1(-hh * 0.1)} 0 ${f1(-hh * 0.25)} z" fill="#9fd3ff" stroke="${k}" stroke-width="${f1(sw * 0.6)}"/></g>`;
  }
  if (art === "handy") {
    const w = h * 0.1, hh = h * 0.2;
    return `<g transform="translate(${f1(ex)} ${f1(ey)}) rotate(${-blick * 6})"><rect x="${f1(-w / 2)}" y="${f1(-hh * 0.75)}" width="${f1(w)}" height="${f1(hh)}" rx="${f1(w * 0.15)}" fill="#1d1d1d" stroke="${k}" stroke-width="${f1(sw)}"/><rect x="${f1(-w * 0.42)}" y="${f1(-hh * 0.69)}" width="${f1(w * 0.84)}" height="${f1(hh * 0.88)}" rx="${f1(w * 0.08)}" fill="#fff"/>${qrCode(-w * 0.34, -hh * 0.5, w * 0.68, 7, 11)}</g>`;
  }
  if (art === "tablet") {
    const w = h * 0.26, hh = h * 0.19;
    return `<g transform="translate(${f1(ex)} ${f1(ey)}) rotate(${blick * -12})"><rect x="${f1(-w * 0.5)}" y="${f1(-hh * 0.8)}" width="${f1(w)}" height="${f1(hh)}" rx="${f1(w * 0.05)}" fill="#1d1d1d" stroke="${k}" stroke-width="${f1(sw)}"/><rect x="${f1(-w * 0.46)}" y="${f1(-hh * 0.74)}" width="${f1(w * 0.92)}" height="${f1(hh * 0.88)}" rx="${f1(w * 0.02)}" fill="url(#screen)"/><rect x="${f1(-w * 0.46)}" y="${f1(-hh * 0.74)}" width="${f1(w * 0.92)}" height="${f1(hh * 0.2)}" fill="${F.thwDunkel}"/>
      <g fill="#3b4a8a"><rect x="${f1(-w * 0.4)}" y="${f1(-hh * 0.42)}" width="${f1(w * 0.5)}" height="${f1(hh * 0.07)}"/><rect x="${f1(-w * 0.4)}" y="${f1(-hh * 0.28)}" width="${f1(w * 0.7)}" height="${f1(hh * 0.07)}"/><rect x="${f1(-w * 0.4)}" y="${f1(-hh * 0.14)}" width="${f1(w * 0.35)}" height="${f1(hh * 0.07)}"/></g></g>`;
  }
  if (art === "klemmbrett" || art === "lageblatt") {
    const w = h * 0.2, hh = h * 0.27;
    return `<g transform="translate(${f1(ex)} ${f1(ey)}) rotate(${blick * 10})"><rect x="${f1(-w / 2)}" y="${f1(-hh * 0.2)}" width="${f1(w)}" height="${f1(hh)}" rx="${f1(w * 0.05)}" fill="#8a5a2b" stroke="${k}" stroke-width="${f1(sw)}"/><rect x="${f1(-w * 0.42)}" y="${f1(-hh * 0.12)}" width="${f1(w * 0.84)}" height="${f1(hh * 0.86)}" fill="${F.papier}" stroke="${k}" stroke-width="${f1(sw * 0.6)}"/><rect x="${f1(-w * 0.2)}" y="${f1(-hh * 0.26)}" width="${f1(w * 0.4)}" height="${f1(hh * 0.12)}" rx="${f1(w * 0.04)}" fill="#999" stroke="${k}" stroke-width="${f1(sw * 0.8)}"/>
      <g stroke="#3b4a8a" stroke-width="${f1(sw * 0.6)}" fill="none"><path d="M${f1(-w * 0.32)} ${f1(hh * 0.1)} h${f1(w * 0.6)}"/><path d="M${f1(-w * 0.32)} ${f1(hh * 0.25)} h${f1(w * 0.5)}"/><path d="M${f1(-w * 0.32)} ${f1(hh * 0.4)} h${f1(w * 0.62)}"/><path d="M${f1(-w * 0.32)} ${f1(hh * 0.55)} h${f1(w * 0.4)}"/></g></g>`;
  }
  if (art === "funk") {
    const w = h * 0.07, hh = h * 0.16;
    return `<g transform="translate(${f1(ex)} ${f1(ey)}) rotate(${-blick * 10})"><rect x="${f1(-w / 2)}" y="${f1(-hh * 0.5)}" width="${f1(w)}" height="${f1(hh)}" rx="${f1(w * 0.15)}" fill="#222" stroke="${k}" stroke-width="${f1(sw)}"/><line x1="${f1(-w * 0.2)}" y1="${f1(-hh * 0.5)}" x2="${f1(-w * 0.3)}" y2="${f1(-hh * 1.1)}" stroke="${k}" stroke-width="${f1(sw * 1.3)}" stroke-linecap="round"/><rect x="${f1(-w * 0.3)}" y="${f1(-hh * 0.35)}" width="${f1(w * 0.6)}" height="${f1(hh * 0.22)}" fill="#7fd0ff"/></g>`;
  }
  if (art === "stift") {
    return `<g transform="translate(${f1(ex)} ${f1(ey)}) rotate(${blick * -40})"><rect x="${f1(-h * 0.012)}" y="${f1(-h * 0.1)}" width="${f1(h * 0.024)}" height="${f1(h * 0.14)}" fill="#ffe100" stroke="${k}" stroke-width="${f1(sw * 0.7)}"/><path d="M${f1(-h * 0.012)} ${f1(h * 0.04)} l${f1(h * 0.012)} ${f1(h * 0.03)} l${f1(h * 0.012)} ${f1(-h * 0.03)} z" fill="#222"/></g>`;
  }
  return "";
}

/** Stilisierter QR-Code (deterministisch), Kantenlänge s, n×n Module. */
export function qrCode(x, y, s, seedN, n = 13) {
  const r = zufall(seedN * 97 + n);
  const m = s / n;
  let out = `<g fill="#111">`;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const inFinder = (i < 3 && j < 3) || (i < 3 && j >= n - 3) || (i >= n - 3 && j < 3);
    if (inFinder) continue;
    if (r() < 0.45) out += `<rect x="${f1(x + j * m)}" y="${f1(y + i * m)}" width="${f1(m + 0.3)}" height="${f1(m + 0.3)}"/>`;
  }
  for (const [fi, fj] of [[0, 0], [0, n - 3], [n - 3, 0]]) {
    out += `<rect x="${f1(x + fj * m)}" y="${f1(y + fi * m)}" width="${f1(3 * m)}" height="${f1(3 * m)}"/><rect x="${f1(x + fj * m + m * 0.75)}" y="${f1(y + fi * m + m * 0.75)}" width="${f1(1.5 * m)}" height="${f1(1.5 * m)}" fill="#fff"/><rect x="${f1(x + fj * m + m * 1.1)}" y="${f1(y + fi * m + m * 1.1)}" width="${f1(0.8 * m)}" height="${f1(0.8 * m)}" fill="#111"/>`;
  }
  return out + "</g>";
}

// ---------------------------------------------------------------- Fahrzeuge
/**
 * THW-Fahrzeug. Boden bei y, vordere Stoßstange bei x (bei blick=1 zeigt die Front nach rechts).
 * art: "gkw" (Koffer-LKW), "mtw" (Kleinbus), "lkw" (Pritsche/Plane), "anh" (Anhänger)
 */
export function fahrzeug({ x, y, art = "gkw", scale = 1, blick = 1, licht = true, blaulicht = false, t = 0, beschriftung = "THW", kennung = "" }) {
  const k = F.kontur, sw = 5;
  let body = "";
  const L = art === "gkw" ? 560 : art === "lkw" ? 620 : art === "mtw" ? 420 : 300;
  const H = art === "gkw" ? 250 : art === "lkw" ? 270 : art === "mtw" ? 190 : 170;
  // Koordinaten: lokal, Front bei x=0, Heck bei x=-L (blick=1); gespiegelt über scale(-1) bei blick=-1
  if (art === "gkw" || art === "lkw") {
    const kabL = 180;
    body += `<rect x="${-L}" y="${-H}" width="${L - kabL + 10}" height="${H - 60}" fill="${F.thw}" stroke="${k}" stroke-width="${sw}" rx="8"/>`;
    if (art === "lkw") body += `<rect x="${-L + 8}" y="${-H + 8}" width="${L - kabL - 6}" height="${(H - 60) * 0.72}" fill="#e9eef7" stroke="${k}" stroke-width="${sw}" rx="6"/><rect x="${-L + 8}" y="${-H + 8 + (H - 60) * 0.72}" width="${L - kabL - 6}" height="${(H - 60) * 0.28 - 8}" fill="${F.thw}"/>`;
    // Reflexstreifen am Koffer
    body += `<rect x="${-L + 10}" y="${-H + (H - 60) * 0.58}" width="${L - kabL - 10}" height="14" fill="${F.reflex}"/><rect x="${-L + 10}" y="${-H + (H - 60) * 0.58 + 16}" width="${L - kabL - 10}" height="7" fill="${F.silber}"/>`;
    // Beschriftung
    body += fzText(-L + (L - kabL) / 2, -H + (H - 60) * 0.42, beschriftung, blick, `font-family="Bangers" font-size="${art === "lkw" ? 58 : 72}" fill="#fff" stroke="${k}" stroke-width="2" text-anchor="middle" letter-spacing="4"`);
    // Fahrerhaus
    body += `<path d="M${-kabL} ${-H + 20} h${kabL - 70} q40 0 52 28 l18 ${H - 120} q0 12 -12 12 h${-(kabL - 12)} z" fill="${F.thw}" stroke="${k}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    body += `<path d="M${-kabL + 16} ${-H + 34} h${kabL - 100} q26 0 36 22 l10 40 h${-(kabL - 50)} z" fill="#bfe3ff" stroke="${k}" stroke-width="${sw * 0.8}"/>`;
    body += `<rect x="${-kabL + 16}" y="${-H + 34}" width="${kabL - 100}" height="62" fill="url(#halbtonHell)" opacity="0.35"/>`;
    // Blaulicht
    body += `<rect x="${-kabL + 30}" y="${-H + 4}" width="60" height="18" rx="6" fill="${blaulicht && Math.floor(t * 4) % 2 === 0 ? "#6fb6ff" : "#2a4ea8"}" stroke="${k}" stroke-width="3"/>`;
    // Reflex am Fahrerhaus
    body += `<rect x="${-kabL + 4}" y="${-H + 108}" width="${kabL - 20}" height="12" fill="${F.reflex}"/>`;
    // Stoßstange + Scheinwerfer
    body += `<rect x="-10" y="-66" width="18" height="46" fill="#d7dce7" stroke="${k}" stroke-width="3"/>`;
    body += `<rect x="-14" y="-90" width="22" height="20" fill="${licht ? "#fff6c4" : "#777"}" stroke="${k}" stroke-width="3"/>`;
    // Räder
    for (const wx of [-kabL + 60, -L + 110, -L + 190]) body += rad(wx, -40, 52);
  } else if (art === "mtw") {
    body += `<path d="M${-L} ${-H} h${L - 150} q50 0 70 30 l60 ${H - 110} q0 14 -14 14 h${-(L - 14)} z" fill="${F.thw}" stroke="${k}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    body += `<path d="M${-L + 20} ${-H + 16} h${L - 170} q34 0 48 24 l22 46 h${-(L - 90)} z" fill="#bfe3ff" stroke="${k}" stroke-width="${sw * 0.8}"/>`;
    body += `<rect x="${-L + 20}" y="${-H + 16}" width="${L - 170}" height="70" fill="url(#halbtonHell)" opacity="0.35"/>`;
    body += `<rect x="${-L + 12}" y="${-H + 110}" width="${L - 40}" height="12" fill="${F.reflex}"/>`;
    body += fzText(-L + (L - 100) / 2, -H + 150, beschriftung, blick, `font-family="Bangers" font-size="44" fill="#fff" stroke="${k}" stroke-width="2" text-anchor="middle" letter-spacing="3"`);
    body += `<rect x="-14" y="-80" width="20" height="20" fill="${licht ? "#fff6c4" : "#777"}" stroke="${k}" stroke-width="3"/>`;
    body += `<rect x="${-L / 2 - 30}" y="${-H - 14}" width="60" height="16" rx="6" fill="${blaulicht && Math.floor(t * 4) % 2 === 0 ? "#6fb6ff" : "#2a4ea8"}" stroke="${k}" stroke-width="3"/>`;
    for (const wx of [-90, -L + 90]) body += rad(wx, -36, 40);
  } else {
    // Anhänger
    body += `<rect x="${-L}" y="${-H}" width="${L - 40}" height="${H - 60}" fill="${F.thw}" stroke="${k}" stroke-width="${sw}" rx="6"/>`;
    body += `<rect x="${-L + 8}" y="${-H + (H - 60) * 0.6}" width="${L - 56}" height="12" fill="${F.reflex}"/>`;
    body += `<line x1="-40" y1="-70" x2="20" y2="-60" stroke="${k}" stroke-width="10" stroke-linecap="round"/>`;
    body += rad(-L / 2 - 20, -36, 40);
  }
  // Scheinwerferkegel
  let kegel = "";
  if (licht && art !== "anh") kegel = `<path d="M-6 -82 L420 -190 L520 -40 L-6 -62 z" fill="url(#kegel)" opacity="0.9"/>`;
  if (kennung) {
    const kx = art === "mtw" ? -L + 90 : -L + 90, ky = art === "mtw" ? -H + 150 : -H + (H - 60) * 0.92;
    body += `<rect x="${kx - 52}" y="${ky - 26}" width="104" height="34" rx="4" fill="#fff" stroke="${k}" stroke-width="3"/>` + fzText(kx, ky, kennung, blick, `font-family="Comic Neue" font-weight="700" font-size="26" fill="#141414" text-anchor="middle"`);
  }
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(scale * blick)} ${f1(scale)})">${kegel}${body}</g>`;
}

/** Text, der bei gespiegelten Fahrzeugen (blick=-1) lesbar bleibt. */
function fzText(x, y, inhalt, blick, attrs) {
  return `<text transform="translate(${f1(x)} ${f1(y)}) scale(${blick} 1)" ${attrs}>${esc(inhalt)}</text>`;
}
function rad(x, y, r) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#1a1a1a" stroke="${F.kontur}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="#b8bec9" stroke="${F.kontur}" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${r * 0.18}" fill="#333"/>`;
}

// ---------------------------------------------------------------- Zelt
/** Faltpavillon mit Tisch und Lampe; Boden bei y, Mitte bei x, Breite b. */
export function zelt({ x, y, b = 700, hoehe = 420, schild = "MELDEKOPF", lampe = true, innen = "" }) {
  const k = F.kontur, sw = 6;
  const dachH = hoehe * 0.32, wandH = hoehe - dachH;
  const l = x - b / 2, r = x + b / 2, top = y - hoehe;
  let s = `<g>`;
  // Rückwand (dunkles Zeltinnere)
  s += `<rect x="${f1(l + 14)}" y="${f1(top + dachH)}" width="${f1(b - 28)}" height="${f1(wandH)}" fill="#0f1a3a" stroke="${k}" stroke-width="${sw}"/>`;
  s += `<rect x="${f1(l + 14)}" y="${f1(top + dachH)}" width="${f1(b - 28)}" height="${f1(wandH)}" fill="url(#halbton)" opacity="0.18"/>`;
  // Lampenschein
  if (lampe) s += `<ellipse cx="${f1(x)}" cy="${f1(top + dachH + 30)}" rx="${f1(b * 0.55)}" ry="${f1(wandH * 0.9)}" fill="url(#lampe)"/>`;
  s += innen;
  // Pfosten
  for (const px of [l + 20, r - 20]) s += `<line x1="${f1(px)}" y1="${f1(top + dachH)}" x2="${f1(px)}" y2="${f1(y)}" stroke="${k}" stroke-width="${sw * 2.2}" stroke-linecap="round"/><line x1="${f1(px)}" y1="${f1(top + dachH)}" x2="${f1(px)}" y2="${f1(y)}" stroke="#c9ced8" stroke-width="${sw * 1.2}" stroke-linecap="round"/>`;
  // Dach
  s += `<path d="M${f1(l - 10)} ${f1(top + dachH)} L${f1(x)} ${f1(top)} L${f1(r + 10)} ${f1(top + dachH)} z" fill="${F.thw}" stroke="${k}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  s += `<path d="M${f1(l - 10)} ${f1(top + dachH)} L${f1(x)} ${f1(top)} L${f1(x)} ${f1(top + dachH)} z" fill="url(#halbtonFein)" opacity="0.45"/>`;
  s += `<rect x="${f1(l - 10)}" y="${f1(top + dachH - 2)}" width="${f1(b + 20)}" height="26" fill="${F.thw}" stroke="${k}" stroke-width="${sw}"/>`;
  s += `<rect x="${f1(l - 10)}" y="${f1(top + dachH + 8)}" width="${f1(b + 20)}" height="7" fill="${F.reflex}"/>`;
  // Lampe (skaliert mit der Zelthöhe)
  const kf = hoehe / 540;
  if (lampe) s += `<line x1="${f1(x)}" y1="${f1(top + dachH + 20)}" x2="${f1(x)}" y2="${f1(top + dachH + 20 + 70 * kf)}" stroke="${k}" stroke-width="${f1(5 * kf)}"/><path d="M${f1(x - 44 * kf)} ${f1(top + dachH + 20 + 100 * kf)} l${f1(16 * kf)} ${f1(-32 * kf)} h${f1(56 * kf)} l${f1(16 * kf)} ${f1(32 * kf)} z" fill="#dfe3ea" stroke="${k}" stroke-width="${f1(5 * kf)}" stroke-linejoin="round"/><ellipse cx="${f1(x)}" cy="${f1(top + dachH + 20 + 104 * kf)}" rx="${f1(46 * kf)}" ry="${f1(12 * kf)}" fill="#fff6c4" stroke="${k}" stroke-width="${f1(4 * kf)}"/>`;
  // Schild am Dachrand
  if (schild) {
    const sb = b * 0.56, sh = 64 * kf;
    s += `<rect x="${f1(x - sb / 2)}" y="${f1(top + dachH - sh * 0.35)}" width="${f1(sb)}" height="${f1(sh)}" fill="${F.gelb}" stroke="${k}" stroke-width="${sw}"/>`;
    s += `<text x="${f1(x)}" y="${f1(top + dachH - sh * 0.35 + sh * 0.78)}" font-family="Bangers" font-size="${f1(52 * kf)}" letter-spacing="4" text-anchor="middle" fill="${k}">${esc(schild)}</text>`;
  }
  return s + "</g>";
}

/** Tisch (Klapptisch), Platte bei y, Mitte x, Breite b. */
export function tisch({ x, y, b = 420, h = 120 }) {
  const k = F.kontur;
  return `<g><rect x="${f1(x - b / 2)}" y="${f1(y)}" width="${f1(b)}" height="22" fill="#d9dee8" stroke="${k}" stroke-width="5"/><rect x="${f1(x - b / 2)}" y="${f1(y + 10)}" width="${f1(b)}" height="12" fill="url(#halbtonFein)" opacity="0.4"/><line x1="${f1(x - b / 2 + 30)}" y1="${f1(y + 22)}" x2="${f1(x - b / 2 + 10)}" y2="${f1(y + h)}" stroke="${k}" stroke-width="9"/><line x1="${f1(x + b / 2 - 30)}" y1="${f1(y + 22)}" x2="${f1(x + b / 2 - 10)}" y2="${f1(y + h)}" stroke="${k}" stroke-width="9"/></g>`;
}

/** Papierstapel + Taschenrechner auf dem Tisch. */
export function papierstapel(x, y, n = 3) {
  const k = F.kontur;
  let s = "<g>";
  for (let i = 0; i < n; i++) {
    const rot = (i - 1) * 6;
    s += `<g transform="translate(${f1(x)} ${f1(y - i * 5)}) rotate(${rot})"><rect x="-70" y="-90" width="140" height="90" fill="${F.papier}" stroke="${k}" stroke-width="4"/><g stroke="#3b4a8a" stroke-width="3" fill="none"><path d="M-50 -70 q20 -6 90 2"/><path d="M-50 -52 q30 8 80 -2"/><path d="M-50 -34 h60"/><path d="M-50 -16 q10 -4 70 2"/></g></g>`;
  }
  return s + "</g>";
}
export function taschenrechner(x, y) {
  const k = F.kontur;
  let s = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(-8)"><rect x="-45" y="-120" width="90" height="120" rx="8" fill="#2b2b2b" stroke="${k}" stroke-width="4"/><rect x="-34" y="-108" width="68" height="26" fill="#bfe3c0" stroke="${k}" stroke-width="3"/>`;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += `<rect x="${-34 + j * 24}" y="${-70 + i * 22}" width="18" height="14" rx="3" fill="#d7dce7"/>`;
  return s + "</g>";
}
export function funkgeraetTisch(x, y, zacken = false, t = 0) {
  const k = F.kontur;
  let s = `<g transform="translate(${f1(x)} ${f1(y)})"><rect x="-26" y="-110" width="52" height="110" rx="8" fill="#222" stroke="${k}" stroke-width="4"/><line x1="-10" y1="-110" x2="-14" y2="-175" stroke="${k}" stroke-width="7" stroke-linecap="round"/><rect x="-18" y="-96" width="36" height="22" fill="#7fd0ff"/><rect x="-16" y="-62" width="12" height="12" fill="#999"/><rect x="4" y="-62" width="12" height="12" fill="#999"/>`;
  if (zacken) {
    const ph = Math.floor(t * 6) % 3;
    for (let i = 0; i < 3; i++) {
      const o = i === ph ? 1 : 0.35;
      s += `<path d="M${18 + i * 16} ${-140 - i * 8} q${12 + i * 6} 12 0 ${28 + i * 16}" fill="none" stroke="#fff" stroke-width="5" opacity="${o}"/>`;
    }
  }
  return s + "</g>";
}

// ---------------------------------------------------------------- Sprechblasen-Formen
/** Pfad einer Sprechblase (abgerundetes Rechteck) mit Schwanz. tail: {x, dx, dy, seite:"unten"|"oben"} */
export function blasenPfad(w, h, r, tail) {
  if (!tail) return `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`;
  const tx = clamp(tail.x, r + 24, w - r - 24), b = 20;
  if (tail.seite === "oben") {
    return `M${r} 0 H${tx - b} L${tx + tail.dx} ${-tail.dy} L${tx + b} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`;
  }
  return `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${tx + b} L${tx + tail.dx} ${h + tail.dy} L${tx - b} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`;
}
/** Gezackte Funk-Blase (Polygon) mit Blitz-Schwanz. */
export function funkPfad(w, h, tail) {
  const z = 14, schritt = 30;
  const pts = [];
  for (let x = 0; x <= w; x += schritt) pts.push([x, (Math.round(x / schritt) % 2 ? -z : 0)]);
  for (let y = schritt; y <= h; y += schritt) pts.push([w + (Math.round(y / schritt) % 2 ? z : 0), y]);
  const unten = [];
  for (let x = w - schritt; x >= 0; x -= schritt) unten.push([x, h + (Math.round(x / schritt) % 2 ? z : 0)]);
  if (tail && tail.seite !== "oben") {
    // Schwanz einfügen bei tail.x
    const idx = unten.findIndex((p) => p[0] <= tail.x);
    const i = Math.max(1, idx);
    unten.splice(i, 0, [tail.x + 16, h], [tail.x + tail.dx * 0.5 + 10, h + tail.dy * 0.55], [tail.x + tail.dx, h + tail.dy], [tail.x + tail.dx * 0.45 - 12, h + tail.dy * 0.5], [tail.x - 16, h]);
  }
  pts.push(...unten);
  for (let y = h - schritt; y >= 0; y -= schritt) pts.push([-(Math.round(y / schritt) % 2 ? z : 0), y]);
  if (tail && tail.seite === "oben") {
    const i = Math.max(1, pts.findIndex((p) => p[1] === 0 && p[0] >= tail.x) );
    pts.splice(i, 0, [tail.x - 16, 0], [tail.x + tail.dx * 0.45 - 12, -tail.dy * 0.5], [tail.x + tail.dx, -tail.dy], [tail.x + tail.dx * 0.5 + 10, -tail.dy * 0.55], [tail.x + 16, 0]);
  }
  return "M" + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(" L") + " Z";
}
