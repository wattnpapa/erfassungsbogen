/* Sprechblasen, Captions und Laute als HTML – mit Textmessung über #messen. */
import { blasenPfad, funkPfad, clamp, esc, f1, pop } from "./zeichnen.js";

const messen = () => document.getElementById("messen");

/** Höhe eines Textblocks gegebener Breite messen (gleiche Schriftklassen wie die Blase). */
export function textHoehe(text, breite, klasse) {
  const m = messen();
  m.innerHTML = `<div class="blase ${klasse}" style="position:static"><div class="text" style="position:static;width:${breite}px">${esc(text)}</div></div>`;
  return m.firstChild.firstChild.offsetHeight;
}

/**
 * Sprechblase. x,y: linke obere Ecke des Textkastens (ohne Polster), w: Textbreite.
 * ziel: [px,py] absoluter Punkt, auf den der Schwanz zeigt. t0: Erscheinen (Pop).
 * alt: zurückgetreten (gedimmt). funk: gezackte Funkblase.
 */
export function blase({ x, y, w, text, ziel, t, t0, alt = false, funk = false, pad = 22 }) {
  if (t < t0) return "";
  const th = textHoehe(text, w, funk ? "funk" : "");
  const W = w + pad * 2, H = th + pad * 2;
  let tail = null;
  if (ziel) {
    const [px, py] = ziel;
    if (py > y + H) tail = { seite: "unten", x: clamp(px - x, 40, W - 40), dx: 0, dy: 0 };
    else tail = { seite: "oben", x: clamp(px - x, 40, W - 40), dx: 0, dy: 0 };
    tail.dx = px - (x + tail.x);
    tail.dy = tail.seite === "unten" ? py - (y + H) : y - py;
    tail.dy = Math.max(30, tail.dy);
  }
  const d = funk ? funkPfad(W, H, tail) : blasenPfad(W, H, 26, tail);
  const s = pop(t, t0, 0.3);
  const ox = tail ? (tail.seite === "unten" ? tail.x : tail.x) : W / 2;
  const oy = tail ? (tail.seite === "unten" ? H : 0) : H;
  return `<div class="blase ${funk ? "funk" : ""} ${alt ? "alt" : ""}" style="left:${f1(x)}px;top:${f1(y)}px;width:${W}px;height:${H}px;transform-origin:${f1(ox)}px ${f1(oy)}px;transform:scale(${f1(Math.max(0.01, s))})">
    <svg width="${W}" height="${H}" style="left:0;top:0"><path d="${d}" fill="#ffffff" stroke="#141414" stroke-width="6" stroke-linejoin="round"/></svg>
    <div class="text" style="left:${pad}px;top:${pad}px;width:${w}px">${esc(text)}</div></div>`;
}

/** Erzähler-Caption (gelb). */
export function caption({ x, y, w, text, t, t0, t1 = Infinity, klein = false }) {
  if (t < t0 || t > t1) return "";
  const s = pop(t, t0, 0.3);
  const a = t1 < Infinity ? clamp((t1 - t) / 0.4) : 1;
  return `<div class="caption ${klein ? "klein" : ""}" style="left:${f1(x)}px;top:${f1(y)}px;width:${w}px;transform:scale(${f1(Math.max(0.01, s))});opacity:${f1(a)}">${esc(text)}</div>`;
}

/** Onomatopoesie (Bangers), poppt bei t0 auf, optional bis t1 sichtbar. */
export function laut({ x, y, text, t, t0, t1 = Infinity, groesse = 150, rot = -8, farbe = "#ffe100" }) {
  if (t < t0 || t > t1) return "";
  const s = pop(t, t0, 0.28);
  const a = t1 < Infinity ? clamp((t1 - t) / 0.3) : 1;
  return `<div class="laut" style="left:${f1(x)}px;top:${f1(y)}px;font-size:${groesse}px;color:${farbe};transform:rotate(${rot}deg) scale(${f1(Math.max(0.01, s))});opacity:${f1(a)}">${esc(text)}</div>`;
}

/** Panel-Rahmen mit SVG-Inhalt. w,h = Innenmaß (Zeichenfläche in px); der Rahmen (8 px) kommt außen dazu. */
export function panel({ x, y, w, h, rot = 0, t, t0 = -1, inhalt, hintergrund = "#0b1230", stil = "" }) {
  if (t < t0) return "";
  const s = t0 >= 0 ? 0.92 + 0.08 * pop(t, t0, 0.4) : 1;
  const a = t0 >= 0 ? clamp((t - t0) / 0.2) : 1;
  return `<div class="panel" style="left:${x - 8}px;top:${y - 8}px;width:${w + 16}px;height:${h + 16}px;background:${hintergrund};transform:rotate(${rot}deg) scale(${f1(s)});opacity:${f1(a)};${stil}"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inhalt}</svg></div>`;
}
