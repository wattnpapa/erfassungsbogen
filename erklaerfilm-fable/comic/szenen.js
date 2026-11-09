/* Die Szenen der Comic-Blöcke. Jede Funktion bekommt den Kontext
 * { t (Blockzeit), u (Szenenzeit), S (Szene), L(id) (Zeile), naechste(id) }
 * und liefert das komplette HTML der Bühne für diesen Moment. */
import { F, defs, regen, spritzer, figur, fahrzeug, zelt, tisch, papierstapel, taschenrechner, funkgeraetTisch, qrCode, easeOut, easeInOut, pop, clamp, lerp, f1, esc, zufall } from "./zeichnen.js";
import { blase, caption, laut, panel } from "./blasen.js";

const W = 1920, H = 1080;

/** Sprechblase für eine Zeile: erscheint zu ihrem Start, dimmt, sobald die nächste Zeile beginnt. */
function zeile(ctx, id, opt) {
  const z = ctx.L(id);
  const n = ctx.naechste(id);
  const alt = n ? ctx.t >= n.start - 0.1 : false;
  return blase({ ...opt, text: z.text, t: ctx.t, t0: z.start - 0.15, alt });
}
/** Erzähler-Caption für eine Zeile (bleibt bis Szenenende, blendet 0,4 s davor aus). */
function erz(ctx, id, opt) {
  const z = ctx.L(id);
  return caption({ ...opt, text: z.text, t: ctx.t, t0: z.start - 0.2, t1: opt.t1 ?? ctx.S.ende - 0.05 });
}

function boden(w, h, y, nass = true) {
  let s = `<rect x="0" y="${y}" width="${w}" height="${h - y}" fill="${F.boden}"/>`;
  s += `<rect x="0" y="${y}" width="${w}" height="${h - y}" fill="url(#halbton)" opacity="0.25"/>`;
  if (nass) s += `<rect x="0" y="${y}" width="${w}" height="18" fill="${F.bodenNass}"/>`;
  return s;
}
function himmel(w, h) {
  return `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#himmel)"/>`;
}
/** Stadtsilhouette Oldenburg (stilisiert: Lambertikirche, Giebel, Kräne) */
function silhouette(w, y, scale = 1) {
  const r = zufall(11);
  let s = `<g fill="#070b1a" stroke="#141414" stroke-width="3">`;
  let x = -20;
  while (x < w) {
    const bw = (60 + r() * 120) * scale, bh = (60 + r() * 160) * scale;
    s += `<rect x="${f1(x)}" y="${f1(y - bh)}" width="${f1(bw)}" height="${f1(bh)}"/>`;
    if (r() < 0.3) s += `<path d="M${f1(x)} ${f1(y - bh)} l${f1(bw / 2)} ${f1(-bw * 0.5)} l${f1(bw / 2)} ${f1(bw * 0.5)} z"/>`;
    x += bw + r() * 30 * scale;
  }
  // Kirchturm
  s += `<rect x="${f1(w * 0.62)}" y="${f1(y - 420 * scale)}" width="${f1(70 * scale)}" height="${f1(420 * scale)}"/><path d="M${f1(w * 0.62 - 10 * scale)} ${f1(y - 420 * scale)} l${f1(45 * scale)} ${f1(-170 * scale)} l${f1(45 * scale)} ${f1(170 * scale)} z"/>`;
  return s + "</g>";
}

const SZENEN = {};

/* ------------------------------------------------------------ Titel */
SZENEN.titel = (ctx) => {
  const { t, u, S } = ctx;
  const flash = u > 0.8 && u < 1.05 ? (u < 0.9 ? 0.85 : 0.85 * (1 - (u - 0.9) / 0.15)) : 0;
  const wasserY = 900 - easeInOut(u, 0, 12) * 70;
  let inhalt = defs() + himmel(W, H);
  inhalt += silhouette(W, 820, 1);
  inhalt += `<rect x="0" y="${f1(wasserY)}" width="${W}" height="${H}" fill="#152a66" stroke="#141414" stroke-width="4"/>`;
  inhalt += `<rect x="0" y="${f1(wasserY)}" width="${W}" height="${H}" fill="url(#halbton)" opacity="0.25"/>`;
  // Wellen
  for (let i = 0; i < 6; i++) inhalt += `<path d="M${f1(((i * 380 + u * 40) % (W + 400)) - 200)} ${f1(wasserY + 30 + i * 22)} q40 -14 80 0 t80 0" fill="none" stroke="#7fa0ff" stroke-width="4" opacity="0.6"/>`;
  inhalt += `<rect x="0" y="${f1(820)}" width="${W}" height="${f1(wasserY - 820)}" fill="#1c2238"/>`;
  inhalt += regen(t, W, H, { n: 260, seed: 5, opacity: 0.5 });
  if (flash) inhalt += `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff" opacity="${f1(flash)}"/>`;
  let html = `<svg class="lage" viewBox="0 0 ${W} ${H}">${inhalt}</svg>`;
  const s = pop(t, 0.3, 0.5);
  if (s > 0) html += `<div class="titel" style="top:210px;font-size:180px;transform:scale(${f1(s)}) rotate(-2deg)">MELDEKOPF OLDENBURG</div>`;
  const a = clamp((u - 1.0) / 0.5);
  if (a > 0) html += `<div class="untertitel" style="top:470px;opacity:${f1(a)}">Ein Erklärfilm zum digitalen Einheiten-Erfassungsbogen</div>`;
  html += caption({ x: 260, y: 800, w: 1400, text: S.caption, t, t0: 1.0, t1: S.ende - 0.05 });
  return html;
};

/* ------------------------------------------------------------ Zelt */
function zeltInnen(pw, ph, t, { sina = true, stapel = 1, rechner = false, zacken = false } = {}) {
  const tischY = 720;
  let s = "";
  if (sina) s += figur({ x: 900, y: 905, h: 360, blick: -1, kopf: "muetze", armR: 75, armL: 20, prop: "klemmbrett", propHand: "R", mund: "neutral" });
  s += tisch({ x: 900, y: tischY, b: 520, h: 185 });
  s += papierstapel(760, tischY + 2, stapel);
  if (rechner) s += taschenrechner(1080, tischY + 2);
  s += funkgeraetTisch(1120, tischY + 2, zacken, t);
  return s;
}
SZENEN.zelt = (ctx) => {
  const { t, u, S } = ctx;
  const pw = 1800, ph = 960;
  let inhalt = defs() + himmel(pw, ph) + silhouette(pw, 640, 0.6) + boden(pw, ph, 820);
  // Pfützen-Spiegelung
  inhalt += `<ellipse cx="900" cy="880" rx="520" ry="22" fill="#fff6c4" opacity="0.12"/>`;
  inhalt += regen(t, pw, ph, { n: 220, seed: 9, opacity: 0.45 });
  inhalt += zelt({ x: 900, y: 830, b: 920, hoehe: 600, innen: zeltInnen(pw, ph, t) });
  inhalt += spritzer(t, pw, 830, { n: 40, seed: 4 });
  let html = panel({ x: 60, y: 56, w: pw, h: ph, rot: -0.4, t, t0: S.start, inhalt });
  html += laut({ x: 1480, y: 150, text: "PRASSEL", t, t0: S.start + 0.4, groesse: 110, rot: -10, farbe: "#9fd3ff" });
  html += erz(ctx, "i02", { x: 90, y: 860, w: 1150 });
  return html;
};

/* ------------------------------------------------------------ GKW fährt ein */
SZENEN.gkw = (ctx) => {
  const { t, u, S } = ctx;
  const pw = 1840, ph = 640;
  const fahrt = easeOut(u, 0, 2.4);
  const fx = lerp(-520, 1180, fahrt);
  const wackel = fahrt < 1 ? Math.sin(u * 30) * 3 : 0;
  let inhalt = defs() + himmel(pw, ph) + silhouette(pw, 420, 0.5) + boden(pw, ph, 560);
  // Zelt klein im Hintergrund rechts
  inhalt += zelt({ x: 1620, y: 562, b: 380, hoehe: 230, schild: "MELDEKOPF", innen: figur({ x: 1540, y: 575, h: 150, blick: 1, kopf: "muetze", armR: 70, prop: "klemmbrett", propHand: "R" }) });
  // Lichtreflex auf nasser Straße
  inhalt += `<ellipse cx="${f1(fx + 250)}" cy="585" rx="300" ry="16" fill="#fff6c4" opacity="0.2"/>`;
  inhalt += fahrzeug({ x: fx, y: 560 + wackel, art: "gkw", scale: 1.15, blick: 1, licht: true, blaulicht: false, t, kennung: "22/51" });
  inhalt += regen(t, pw, ph, { n: 200, seed: 13, opacity: 0.45 });
  inhalt += spritzer(t, pw, 562, { n: 50, seed: 8 });
  // Gischt hinter den Rädern während der Fahrt
  if (fahrt < 0.98) for (let i = 0; i < 6; i++) inhalt += `<circle cx="${f1(fx - 560 + i * 30 - u * 20)}" cy="${f1(560 - 10 - (i % 3) * 18)}" r="${f1(10 + (i % 2) * 8)}" fill="#bcd0ff" opacity="${f1(0.5 * (1 - fahrt))}"/>`;
  let html = panel({ x: 40, y: 40, w: pw, h: ph, rot: 0.3, t, t0: S.start, inhalt });
  html += laut({ x: 1000, y: 560, text: "BRUMMM", t, t0: S.start + 0.2, t1: S.start + 2.6, groesse: 120, rot: -6, farbe: "#ffe100" });
  // Funk-Blase aus dem Fahrerhaus
  html += zeile(ctx, "i03", { x: 1200, y: 90, w: 600, ziel: [fx - 120 + 40, 300], funk: true });
  // Inset: Sina am Funk
  const z4 = ctx.L("i04");
  const insetT0 = z4.start - 0.35;
  const iw = 600, ih = 360;
  let inset = defs() + `<rect x="0" y="0" width="${iw}" height="${ih}" fill="#0f1a3a"/><ellipse cx="300" cy="120" rx="320" ry="220" fill="url(#lampe)"/>`;
  inset += figur({ x: 330, y: 560, h: 620, blick: 1, kopf: "muetze", armR: 128, armL: 15, prop: "funk", propHand: "R", mund: "offen" });
  inset += `<rect x="0" y="0" width="${iw}" height="${ih}" fill="url(#halbton)" opacity="0.08"/>`;
  html += panel({ x: 1270, y: 700, w: iw, h: ih, rot: -1.2, t, t0: insetT0, inhalt: inset, hintergrund: "#0f1a3a" });
  html += zeile(ctx, "i04", { x: 560, y: 760, w: 560, ziel: [1270 + 330 + 70, 860], funk: true });
  return html;
};

/* ------------------------------------------------------------ Papier */
SZENEN.papier = (ctx) => {
  const { t, u, S } = ctx;
  const pw = 1240, ph = 1000;
  const z6 = ctx.L("i06"), z7 = ctx.L("i07");
  const schweiss = t >= z6.start;
  const uebergabe = easeInOut(u, 0.3, 1.6); // Zettel wandert von Hauke zu Sina
  let inhalt = defs() + `<rect x="0" y="0" width="${pw}" height="${ph}" fill="#0f1a3a"/>`;
  inhalt += `<ellipse cx="620" cy="120" rx="700" ry="420" fill="url(#lampe)"/>`;
  // Lampe oben
  inhalt += `<line x1="620" y1="0" x2="620" y2="70" stroke="#141414" stroke-width="6"/><path d="M560 120 l20 -50 h80 l20 50 z" fill="#dfe3ea" stroke="#141414" stroke-width="6" stroke-linejoin="round"/><ellipse cx="620" cy="124" rx="60" ry="14" fill="#fff6c4" stroke="#141414" stroke-width="4"/>`;
  // Zeltwand-Streifen hinten
  inhalt += `<rect x="0" y="0" width="${pw}" height="${ph}" fill="url(#halbton)" opacity="0.1"/>`;
  // Figuren
  inhalt += figur({ x: 330, y: 1190, h: 740, blick: 1, kopf: "helm", armR: uebergabe > 0.5 ? 70 : 85, armL: 10, prop: uebergabe < 0.5 ? "zettel" : null, propHand: "R", mund: t >= ctx.L("i05").start && t < z6.start || (t >= z7.start && t < z7.ende) ? "offen" : "neutral", nass: true });
  inhalt += figur({ x: 950, y: 1190, h: 720, blick: -1, kopf: "muetze", armR: uebergabe > 0.5 ? 118 : 95, armL: 20, prop: uebergabe >= 0.5 ? "zettel" : null, propHand: "R", mund: t >= z6.start && t < z6.ende ? "offen" : "schief", schweiss, augen: schweiss ? "skeptisch" : "offen" });
  inhalt += tisch({ x: 640, y: 860, b: 900, h: 200 });
  inhalt += papierstapel(430, 862, 2);
  inhalt += funkgeraetTisch(880, 862, false, t);
  // Tropfen vom Zettel
  if (uebergabe > 0.5) {
    for (let i = 0; i < 3; i++) {
      const ph2 = (u * 1.3 + i * 0.33) % 1;
      inhalt += `<path d="M${f1(700 + i * 40)} ${f1(700 + ph2 * 150)} q8 10 0 18 q-8 -8 0 -18 z" fill="#9fd3ff" stroke="#141414" stroke-width="2" opacity="${f1(1 - ph2)}"/>`;
    }
    inhalt += `<text x="640" y="780" font-family="Bangers" font-size="54" fill="#9fd3ff" stroke="#141414" stroke-width="2" text-anchor="middle" transform="rotate(-6 640 780)">TROPF</text>`;
  }
  let html = panel({ x: 40, y: 40, w: pw, h: ph, rot: -0.5, t, t0: S.start, inhalt });
  // Inset: der nasse Bogen
  const iw = 560, ih = 400;
  let inset = defs() + `<rect x="0" y="0" width="${iw}" height="${ih}" fill="#2a3358"/>`;
  inset += `<g transform="rotate(-4 280 200)"><path d="M70 40 q120 -14 420 0 l12 320 q-200 18 -440 0 z" fill="${F.papier}" stroke="#141414" stroke-width="6" stroke-linejoin="round"/>`;
  inset += `<ellipse cx="330" cy="230" rx="130" ry="80" fill="#8fb3ff" opacity="0.35"/><ellipse cx="150" cy="300" rx="80" ry="50" fill="#8fb3ff" opacity="0.3"/>`;
  inset += `<g font-family="Patrick Hand" font-size="34" fill="#2c3a7a">`;
  inset += `<text x="100" y="92" font-weight="700" font-size="30" fill="#141414">Einheiten-Erfassungsbogen</text>`;
  inset += `<text x="100" y="140">Einheit: <tspan fill="#3b4a8a">Bergungsgr. Delmenh…</tspan></text>`;
  inset += `<text x="96" y="196" font-size="40" fill="#3b4a8a" transform="rotate(-2 96 196)">Stärke: 0 / 2 / 7(1?) // 9</text>`;
  inset += `<text x="100" y="250" fill="#3b4a8a" opacity="0.75">Fahrzeuge: s. Rücks… ~~~</text>`;
  inset += `<text x="100" y="304" font-size="30" fill="#3b4a8a" opacity="0.5">Sofortbedarf: ▒▒▒ ▒▒ Diesel?</text></g></g>`;
  // Fragezeichen
  inset += `<text x="470" y="120" font-family="Bangers" font-size="120" fill="#ffe100" stroke="#141414" stroke-width="5" paint-order="stroke" transform="rotate(12 470 120)">?</text>`;
  html += panel({ x: 1330, y: 60, w: iw, h: ih, rot: 1.4, t, t0: z6.start - 0.3, inhalt: inset, hintergrund: "#2a3358" });
  // Blasen
  html += zeile(ctx, "i05", { x: 70, y: 70, w: 520, ziel: [340, 520] });
  html += zeile(ctx, "i06", { x: 660, y: 70, w: 560, ziel: [930, 530] });
  html += zeile(ctx, "i07", { x: 70, y: 260, w: 540, ziel: [340, 560] });
  html += erz(ctx, "i08", { x: 1330, y: 540, w: 560, klein: true });
  return html;
};

/* ------------------------------------------------------------ Stau */
SZENEN.stau = (ctx) => {
  const { t, u, S } = ctx;
  const pw = 1840, ph = 620;
  const z9 = ctx.L("i09"), z10 = ctx.L("i10"), z11 = ctx.L("i11"), z12 = ctx.L("i12");
  const janKommt = easeOut(t, z11.start - 0.9, z11.start - 0.1);
  const janX = lerp(1000, 760, janKommt);
  let inhalt = defs() + himmel(pw, ph) + silhouette(pw, 380, 0.45) + boden(pw, ph, 540);
  // Fahrzeugschlange (Front nach links), hinten klein
  const schlange = [
    { art: "lkw", x: 1760, scale: 0.78, kennung: "" },
    { art: "mtw", x: 1300, scale: 0.78, kennung: "21/10" },
    { art: "gkw", x: 980, scale: 0.78, kennung: "24/55" },
  ];
  // Lichtkegel der Schlange auf dem Boden
  for (const f of schlange) inhalt += `<ellipse cx="${f1(f.x - 180)}" cy="560" rx="200" ry="12" fill="#fff6c4" opacity="0.15"/>`;
  for (const f of [...schlange].reverse()) inhalt += fahrzeug({ x: f.x, y: 542, art: f.art, scale: f.scale, blick: -1, licht: true, blaulicht: f.art === "mtw", t, kennung: f.kennung });
  // Zelt links (Regen dahinter)
  inhalt += regen(t, pw, ph, { n: 220, seed: 21, opacity: 0.45 });
  const innen = figur({ x: 230, y: 560, h: 260, blick: 1, kopf: "muetze", armR: 70, armL: 60, prop: t >= z12.start ? "stift" : "klemmbrett", propHand: "R", mund: t >= z12.start && t < z12.ende ? "offen" : "schief", schweiss: t >= z11.start }) + tisch({ x: 360, y: 450, b: 420, h: 110 }) + papierstapel(400, 452, 3) + taschenrechner(495, 452) + funkgeraetTisch(560, 452, t >= z9.start - 0.3 && t < z10.ende, t);
  inhalt += zelt({ x: 330, y: 545, b: 620, hoehe: 400, innen });
  // Jan
  inhalt += figur({ x: janX, y: 560, h: 330, blick: -1, kopf: "helm", armL: 60, armR: 40, prop: "lageblatt", propHand: "L", mund: t >= z11.start && t < z11.ende ? "offen" : "neutral" });
  inhalt += spritzer(t, pw, 545, { n: 50, seed: 12 });
  if (t >= z12.start) inhalt += `<text x="430" y="320" font-family="Bangers" font-size="52" fill="#ffe100" stroke="#141414" stroke-width="3" paint-order="stroke" transform="rotate(-10 430 320)">KRITZEL</text>`;
  let html = panel({ x: 40, y: 40, w: pw, h: ph, rot: 0.2, t, t0: S.start, inhalt });
  html += laut({ x: 980, y: 20, text: "KRRZT", t, t0: z9.start - 0.1, t1: z10.ende, groesse: 110, rot: -8, farbe: "#9fd3ff" });
  // Funkblasen aus den Fahrzeugen (unter dem Panel)
  html += zeile(ctx, "i09", { x: 1290, y: 690, w: 540, ziel: [40 + 980 - 110, 40 + 400], funk: true });
  html += zeile(ctx, "i10", { x: 1120, y: 890, w: 600, ziel: [40 + 1300 - 90, 40 + 420], funk: true });
  // Jan & Sina
  html += zeile(ctx, "i11", { x: 740, y: 700, w: 480, ziel: [40 + janX, 40 + 330] });
  html += zeile(ctx, "i12", { x: 60, y: 700, w: 560, ziel: [40 + 230, 40 + 360] });
  return html;
};

/* ------------------------------------------------------------ QR */
function tabletInhalt(x, y, w, h, u) {
  // Zusammenfassung auf dem Tablet
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#screen)" stroke="#141414" stroke-width="4"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.16}" fill="${F.thwDunkel}"/>`;
  s += `<text x="${x + 24}" y="${y + h * 0.11}" font-family="Comic Neue" font-weight="700" font-size="${h * 0.075}" fill="#fff">Einsatz-Sammlung · Hochwasser Hunte</text>`;
  const zeilen = [
    ["THW Oldenburg (NI) · FGr WP (B)", "#141414", true],
    ["Stärke  0 / 3 / 9 // 12", "#12275e", true],
    ["4 Fahrzeuge · Heros Oldenburg 48/43", "#2c3a7a", false],
    ["Sofortbedarf: 300 l Diesel", "#2c3a7a", false],
    ["✓ vollständig und plausibel", "#146b3a", true],
  ];
  zeilen.forEach((z, i) => {
    const a = clamp((u - 0.1 - i * 0.18) / 0.2);
    if (a <= 0) return;
    s += `<text x="${x + 28}" y="${y + h * 0.3 + i * h * 0.15}" font-family="Comic Neue" font-weight="${z[2] ? 700 : 400}" font-size="${h * 0.082}" fill="${z[1]}" opacity="${f1(a)}">${esc(z[0])}</text>`;
  });
  return s;
}
SZENEN.qr = (ctx) => {
  const { t, u, S } = ctx;
  const pw = 1200, ph = 1000;
  const z13 = ctx.L("i13"), z14 = ctx.L("i14"), z15 = ctx.L("i15"), z16 = ctx.L("i16"), z17 = ctx.L("i17");
  const piep = z13.ende; // Scan-Piep
  const gescannt = t >= piep;
  let inhalt = defs() + `<rect x="0" y="0" width="${pw}" height="${ph}" fill="#0f1a3a"/><ellipse cx="600" cy="120" rx="700" ry="420" fill="url(#lampe)"/>`;
  inhalt += `<rect x="0" y="0" width="${pw}" height="${ph}" fill="url(#halbton)" opacity="0.1"/>`;
  // Jan im Hintergrund
  inhalt += figur({ x: 700, y: 930, h: 470, blick: -1, kopf: "helm", armL: 60, armR: 20, prop: "lageblatt", propHand: "L", mund: t >= z16.start && t < z16.ende ? "offen" : "neutral" });
  // Merle mit Handy hoch
  const merleMund = (t >= z13.start && t < z13.ende) || (t >= z15.start && t < z15.ende) ? "offen" : "laecheln";
  inhalt += figur({ x: 300, y: 1200, h: 760, blick: 1, kopf: "kapuze", armR: 125, armL: 15, prop: "handy", propHand: "R", mund: merleMund, jacke: "#2457c5" });
  // Sina mit Tablet
  const sinaMund = (t >= z14.start && t < z14.ende) || (t >= z17.start && t < z17.ende) ? "offen" : gescannt ? "laecheln" : "neutral";
  inhalt += figur({ x: 920, y: 1220, h: 700, blick: -1, kopf: "muetze", armR: 100, armL: 15, prop: "tablet", propHand: "R", mund: sinaMund, augen: gescannt && t < z15.start ? "gross" : "offen" });
  // Scan-Strahl kurz vor dem Piep
  if (t > piep - 1.2 && t < piep) {
    const a = 0.5 + 0.4 * Math.sin(u * 20);
    inhalt += `<path d="M${f1(920 - 190)} ${f1(1220 - 0.73 * 700 + 40)} L${f1(300 + 215)} ${f1(1200 - 0.73 * 760 - 150)} L${f1(300 + 215)} ${f1(1200 - 0.73 * 760 + 40)} z" fill="#7fd0ff" opacity="${f1(a * 0.35)}"/>`;
  }
  if (gescannt && t < piep + 0.9) {
    const r = (t - piep) * 260;
    inhalt += `<circle cx="${f1(300 + 215)}" cy="${f1(1200 - 0.73 * 760 - 60)}" r="${f1(r)}" fill="none" stroke="#7fd0ff" stroke-width="8" opacity="${f1(1 - (t - piep) / 0.9)}"/>`;
  }
  inhalt += tisch({ x: 600, y: 900, b: 700, h: 160 });
  inhalt += papierstapel(430, 902, 3) + taschenrechner(760, 902);
  let html = panel({ x: 40, y: 40, w: pw, h: ph, rot: 0.4, t, t0: S.start, inhalt });
  html += laut({ x: 560, y: 300, text: "PIEP!", t, t0: piep, t1: piep + 2.2, groesse: 150, rot: -10, farbe: "#7fd0ff" });
  // Inset Tablet
  const iw = 590, ih = 400;
  let inset = defs() + `<rect x="0" y="0" width="${iw}" height="${ih}" fill="#1d1d1d"/>` + tabletInhalt(22, 22, iw - 44, ih - 44, t - (piep + 0.2));
  html += panel({ x: 1290, y: 60, w: iw, h: ih, rot: -1.2, t, t0: piep + 0.2, inhalt: inset, hintergrund: "#1d1d1d" });
  // Blasen
  html += zeile(ctx, "i13", { x: 60, y: 60, w: 620, ziel: [40 + 300 + 20, 40 + 1200 - 0.74 * 760 - 60] });
  html += zeile(ctx, "i14", { x: 800, y: 60, w: 380, ziel: [40 + 920 - 20, 40 + 1220 - 0.74 * 700 - 70] });
  html += zeile(ctx, "i15", { x: 60, y: 290, w: 620, ziel: [40 + 300 + 20, 40 + 1200 - 0.74 * 760 - 60] });
  html += zeile(ctx, "i16", { x: 800, y: 210, w: 400, ziel: [40 + 700 - 10, 40 + 930 - 0.74 * 470 - 40] });
  html += zeile(ctx, "i17", { x: 790, y: 350, w: 440, ziel: [40 + 920 - 20, 40 + 1220 - 0.74 * 700 - 70] });
  html += caption({ x: 1290, y: 540, w: 590, text: "Ein Scan – die ganze Einheit ist erfasst. Stärke und Sofortbedarf zählt die App über alle Einheiten zusammen.", t, t0: z15.start, t1: S.ende - 0.05, klein: true });
  return html;
};

/* ------------------------------------------------------------ Übergang */
function appStartBild(x, y, w, h) {
  // stilisierte Startseite der App (dunkler Kopf, Karten, Knöpfe)
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f3f5f9"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.14}" fill="${F.thwDunkel}"/>`;
  s += `<rect x="${x + w * 0.04}" y="${y + h * 0.035}" width="${h * 0.07}" height="${h * 0.07}" fill="#2f5ad0" stroke="#fff" stroke-width="2"/>`;
  s += `<text x="${x + w * 0.04 + h * 0.1}" y="${y + h * 0.09}" font-family="Comic Neue" font-weight="700" font-size="${h * 0.055}" fill="#fff">Einheiten-Erfassungsbogen</text>`;
  s += `<rect x="${x + w * 0.04}" y="${y + h * 0.2}" width="${w * 0.44}" height="${h * 0.6}" fill="#fff" stroke="#bcc3d3" stroke-width="2"/>`;
  s += `<text x="${x + w * 0.06}" y="${y + h * 0.29}" font-family="Comic Neue" font-weight="700" font-size="${h * 0.05}" fill="#141414">Meinen Bogen ausfüllen</text>`;
  s += `<rect x="${x + w * 0.06}" y="${y + h * 0.36}" width="${w * 0.4}" height="${h * 0.1}" fill="${F.thwDunkel}"/><text x="${x + w * 0.26}" y="${y + h * 0.425}" font-family="Comic Neue" font-weight="700" font-size="${h * 0.042}" fill="#fff" text-anchor="middle">Neuen Bogen erstellen</text>`;
  s += `<rect x="${x + w * 0.06}" y="${y + h * 0.5}" width="${w * 0.4}" height="${h * 0.1}" fill="#fff" stroke="#141414" stroke-width="2"/><text x="${x + w * 0.26}" y="${y + h * 0.565}" font-family="Comic Neue" font-weight="700" font-size="${h * 0.042}" fill="#141414" text-anchor="middle">QR-Code scannen…</text>`;
  s += `<rect x="${x + w * 0.52}" y="${y + h * 0.2}" width="${w * 0.44}" height="${h * 0.6}" fill="#fff" stroke="#bcc3d3" stroke-width="2"/>`;
  s += `<text x="${x + w * 0.54}" y="${y + h * 0.29}" font-family="Comic Neue" font-weight="700" font-size="${h * 0.05}" fill="#141414">Bögen sammeln (Meldekopf)</text>`;
  s += `<rect x="${x + w * 0.54}" y="${y + h * 0.36}" width="${w * 0.4}" height="${h * 0.1}" fill="${F.thwDunkel}"/><text x="${x + w * 0.74}" y="${y + h * 0.425}" font-family="Comic Neue" font-weight="700" font-size="${h * 0.042}" fill="#fff" text-anchor="middle">Neue Einsatz-Sammlung…</text>`;
  return s;
}
SZENEN.uebergang = (ctx) => {
  const { t, u, S } = ctx;
  const dauer = S.ende - S.start;
  const zoom = easeInOut(u, 0.2, dauer - 1.4);
  const scale = lerp(1, 3.4, zoom);
  const weiss = clamp((u - (dauer - 1.3)) / 1.0);
  const pw = 1840, ph = 1000;
  // Tablet mittig
  const tw = 760, th = 520, tx = (pw - tw) / 2, ty = (ph - th) / 2 + 20;
  let inhalt = defs() + `<rect x="0" y="0" width="${pw}" height="${ph}" fill="#0f1a3a"/><ellipse cx="${pw / 2}" cy="${ph / 2}" rx="900" ry="500" fill="url(#lampe)" opacity="0.6"/>`;
  inhalt += `<rect x="0" y="0" width="${pw}" height="${ph}" fill="url(#halbton)" opacity="0.1"/>`;
  // Hände, die das Tablet halten (stilisiert)
  inhalt += `<circle cx="${tx - 20}" cy="${ty + th * 0.6}" r="60" fill="${F.haut}" stroke="#141414" stroke-width="5"/><circle cx="${tx + tw + 20}" cy="${ty + th * 0.6}" r="60" fill="${F.haut}" stroke="#141414" stroke-width="5"/>`;
  inhalt += `<g transform="translate(${pw / 2} ${ty + th / 2}) scale(${f1(scale)}) translate(${-pw / 2} ${-(ty + th / 2)})">`;
  inhalt += `<rect x="${tx - 26}" y="${ty - 26}" width="${tw + 52}" height="${th + 52}" rx="22" fill="#1d1d1d" stroke="#141414" stroke-width="6"/>`;
  inhalt += appStartBild(tx, ty, tw, th);
  inhalt += `</g>`;
  let html = panel({ x: 40, y: 40, w: pw, h: ph, rot: 0, t, t0: -1, inhalt });
  html += erz(ctx, "i18", { x: 260, y: 880, w: 1400, t1: S.ende - 1.0 });
  if (weiss > 0) html += `<div class="lage" style="background:#f3f5f9;opacity:${f1(weiss)}"></div>`;
  return html;
};

/* ------------------------------------------------------------ Abspann: Schluss */
SZENEN.schluss = (ctx) => {
  const { t, u, S } = ctx;
  const pw = 1840, ph = 1000;
  const z19 = ctx.L("i19"), z20 = ctx.L("i20"), z21 = ctx.L("i21");
  let inhalt = defs() + himmel(pw, ph) + silhouette(pw, 600, 0.6) + boden(pw, ph, 860);
  // Fahrzeugreihe hinten (geparkt, Licht aus)
  for (const [i, art] of ["gkw", "mtw", "lkw", "gkw"].entries()) inhalt += fahrzeug({ x: 1900 - i * 420, y: 700, art, scale: 0.5, blick: -1, licht: false, t });
  // Zelt
  const innen = tisch({ x: 380, y: 740, b: 420, h: 150 }) + papierstapel(300, 742, 2);
  inhalt += zelt({ x: 380, y: 870, b: 700, hoehe: 520, innen });
  // Figuren vorn
  inhalt += figur({ x: 640, y: 1000, h: 560, blick: 1, kopf: "muetze", armR: 95, armL: 15, prop: "tablet", propHand: "R", mund: t >= z21.start && t < z21.ende ? "offen" : "laecheln" });
  inhalt += figur({ x: 1000, y: 1010, h: 580, blick: 1, kopf: "kapuze", armR: 70, armL: 15, prop: "handy", propHand: "R", mund: t >= z20.start && t < z20.ende ? "offen" : "laecheln", jacke: "#2457c5" });
  inhalt += figur({ x: 1460, y: 1010, h: 580, blick: -1, kopf: "helm", armR: 80, armL: 40, prop: "zettel", propHand: "L", mund: t >= z19.start && t < z19.ende ? "offen" : "schief", nass: true, augen: "skeptisch" });
  inhalt += regen(t, pw, ph, { n: 90, seed: 31, opacity: 0.35, tempo: 1100 });
  let html = panel({ x: 40, y: 40, w: pw, h: ph, rot: -0.3, t, t0: S.start, inhalt });
  html += zeile(ctx, "i19", { x: 1300, y: 70, w: 520, ziel: [40 + 1460 - 20, 40 + 1010 - 0.74 * 580 - 60] });
  html += zeile(ctx, "i20", { x: 560, y: 60, w: 620, ziel: [40 + 1000 + 20, 40 + 1010 - 0.74 * 580 - 60] });
  html += zeile(ctx, "i21", { x: 60, y: 300, w: 480, ziel: [40 + 640 + 20, 40 + 1000 - 0.74 * 560 - 60] });
  return html;
};

/* ------------------------------------------------------------ Abspann: Endkarte */
SZENEN.endkarte = (ctx) => {
  const { t, u, S } = ctx;
  const z22 = ctx.L("i22");
  let html = `<div class="lage" style="background:#f3f5f9"></div>`;
  // feines Raster
  html += `<svg class="lage" viewBox="0 0 ${W} ${H}">${defs()}<rect x="0" y="0" width="${W}" height="${H}" fill="url(#halbtonFein)" opacity="0.06"/></svg>`;
  const s = pop(t, S.start + 0.2, 0.5);
  if (s > 0) {
    // Logo-Kachel (App-Icon: dunkelblaue Kachel mit hellem Balken)
    html += `<div style="position:absolute;left:760px;top:170px;width:400px;height:240px;transform:scale(${f1(s)});transform-origin:center">
      <svg viewBox="0 0 400 240" width="400" height="240"><rect x="100" y="0" width="200" height="200" rx="28" fill="${F.thwDunkel}" stroke="#141414" stroke-width="8"/><rect x="128" y="40" width="144" height="40" rx="6" fill="#ffffff"/><rect x="128" y="96" width="144" height="18" rx="4" fill="#9fb3e8"/><rect x="128" y="124" width="100" height="18" rx="4" fill="#9fb3e8"/></svg></div>`;
    html += `<div style="position:absolute;left:0;right:0;top:420px;text-align:center;font-family:'Comic Neue';font-weight:700;font-size:132px;color:#12275e;letter-spacing:-0.02em;transform:scale(${f1(s)})">erfassungsbogen.app</div>`;
  }
  // Stempel
  const stempel = [
    { text: "KOSTENLOS", x: 240, w: 400, rot: -7, farbe: "#a4231c" },
    { text: "OFFLINE", x: 740, w: 340, rot: 4, farbe: "#12275e" },
    { text: "OHNE ANMELDUNG", x: 1170, w: 600, rot: -3, farbe: "#146b3a" },
  ];
  stempel.forEach((st, i) => {
    const t0 = z22.start + 0.2 + i * 0.9;
    if (t < t0) return;
    const uu = clamp((t - t0) / 0.22);
    const sc = lerp(2.2, 1, uu * uu);
    const a = lerp(0.2, 1, uu);
    html += `<div style="position:absolute;left:${st.x}px;top:650px;width:${st.w}px;height:120px;white-space:nowrap;border:10px solid ${st.farbe};border-radius:18px;color:${st.farbe};font-family:Bangers;font-size:64px;letter-spacing:0.06em;text-align:center;line-height:100px;transform:rotate(${st.rot}deg) scale(${f1(sc)});opacity:${f1(a)}">${st.text}</div>`;
  });
  const klein = clamp((u - 4.0) / 0.6);
  if (klein > 0) html += `<div style="position:absolute;left:0;right:0;top:900px;text-align:center;font-family:'Comic Neue';font-size:34px;color:#5c6478;opacity:${f1(klein)}">Freie Software (EUPL-1.2) · Fiktive Lage, fiktive Personen · Stimmen, Geräusche und Musik: ElevenLabs</div>`;
  return html;
};

export { SZENEN };
