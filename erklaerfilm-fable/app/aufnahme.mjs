/**
 * App-Aufnahme des Erklärfilms (Block „app“) – Stop-Motion mit Playwright.
 *
 * Jede sichtbare Veränderung wird als Einzelbild (PNG) festgehalten und mit einer
 * Haltedauer versehen; am Ende setzt ffmpeg die Bilder zu build/app.mp4 zusammen
 * (1920×1080, 25 fps, ohne Ton). Parallel entstehen Marken je Sprechzeile
 * (build/app-marken.json), damit mischen.mjs die Erzählerstimme passgenau legt.
 *
 * Regel (PIPELINE.md): Eine Sprechzeile beginnt, wenn ihr Bild steht, und das
 * Bild hält mindestens bis Zeilenende + 0,5 s.
 *
 *   node erklaerfilm-fable/app/aufnahme.mjs            # nimmt auf und rendert
 *   EEB_BASE_URL=http://127.0.0.1:5173 node …           # vorhandenen Dev-Server nutzen
 *   NUR_FRAMES=1 node …                                 # ohne ffmpeg-Schnitt
 */
import { chromium } from "playwright";
import { spawn, execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { APP, EINHEIT, FPS } from "../drehbuch.mjs";

const exec = promisify(execFile);
const HIER = fileURLToPath(new URL(".", import.meta.url));
const WURZEL = fileURLToPath(new URL("../..", import.meta.url));
const BUILD = fileURLToPath(new URL("../build/", import.meta.url));
const FRAMES = BUILD + "app-frames/";

const VIEW = { width: 1280, height: 720 };
const SCALE = 1.5; // → 1920×1080
const FRAME = 1 / FPS;

const zeitplan = JSON.parse(await readFile(BUILD + "zeitplan.json", "utf8"));
const zeilenDauer = Object.fromEntries(
  zeitplan.bloecke.app.szenen.flatMap((s) => s.zeilen.map((z) => [z.id, z.dauer])),
);
for (const s of APP.szenen) for (const z of s.zeilen) if (!(z.id in zeilenDauer)) throw new Error(`Zeile ${z.id} fehlt im Zeitplan`);

/* ------------------------------------------------------------------ Server */

async function erreichbar(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

let server = null;
let BASIS = process.env.EEB_BASE_URL ?? "http://127.0.0.1:5173";
if (!(await erreichbar(BASIS + "/"))) {
  const port = 5174;
  BASIS = `http://127.0.0.1:${port}`;
  console.log(`Starte Vite-Dev-Server auf ${BASIS} …`);
  server = spawn("npx", ["vite", "--port", String(port), "--host", "127.0.0.1", "--strictPort"], { cwd: WURZEL, stdio: "ignore" });
  for (let i = 0; i < 60 && !(await erreichbar(BASIS + "/")); i++) await new Promise((r) => setTimeout(r, 1000));
  if (!(await erreichbar(BASIS + "/"))) throw new Error("Dev-Server kam nicht hoch.");
}

/* ----------------------------------------------------------------- Browser */

await rm(FRAMES, { recursive: true, force: true });
await mkdir(FRAMES, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  env: { ...process.env, LANG: "de_DE.UTF-8", LC_ALL: "de_DE.UTF-8" },
});
const kontext = await browser.newContext({
  viewport: VIEW,
  deviceScaleFactor: SCALE,
  locale: "de-DE",
  timezoneId: "Europe/Berlin",
  colorScheme: "light",
});
// Debug-Leiste aus, Cursor-Overlay bei jedem Laden einhängen.
await kontext.addInitScript(() => {
  try {
    localStorage.setItem("eeb-debug", "0");
  } catch {
    /* egal */
  }
  const einhaengen = () => {
    if (document.getElementById("film-cursor")) return;
    const el = document.createElement("div");
    el.id = "film-cursor";
    el.setAttribute("aria-hidden", "true");
    el.style.cssText =
      "position:fixed;left:0;top:0;width:28px;height:36px;pointer-events:none;z-index:2147483647;transform:translate(640px,400px);filter:drop-shadow(0 2px 2px rgba(0,0,0,.45));transition:none;";
    el.innerHTML =
      '<svg viewBox="0 0 28 36" width="28" height="36" xmlns="http://www.w3.org/2000/svg"><path d="M3 2 L3 29 L10 22.5 L14.5 33 L19 31 L14.5 20.5 L24 20.5 Z" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>';
    const ring = document.createElement("div");
    ring.id = "film-cursor-ring";
    ring.style.cssText =
      "position:fixed;left:0;top:0;width:44px;height:44px;border-radius:50%;border:3px solid rgba(18,39,94,.85);pointer-events:none;z-index:2147483646;transform:translate(-9999px,-9999px);opacity:0;";
    (document.body ?? document.documentElement).append(el, ring);
    // Der Dev-Server hat keinen Service Worker: die Zeile „Wird für den Offline-Betrieb geladen“
    // stünde sonst dauerhaft im Bild (in der veröffentlichten App verschwindet sie nach Sekunden).
    const stil = document.createElement("style");
    stil.textContent = ".offline-badge, .offline-platz, .erklaerfilm { display: none !important; }";
    document.head.append(stil);
  };
  if (document.body) einhaengen();
  else document.addEventListener("DOMContentLoaded", einhaengen);
});
const page = await kontext.newPage();

/* --------------------------------------------------------------- Rekorder */

class Rekorder {
  frames = [];
  t = 0;
  n = 0;
  marken = { dauer: 0, zeilen: {}, sfx: [], kapitel: [] };
  cursor = { x: 640, y: 400 };

  async bild(dauer = FRAME) {
    const datei = `${FRAMES}f${String(this.n++).padStart(5, "0")}.png`;
    await page.screenshot({ path: datei, caret: "initial", animations: "disabled" });
    this.frames.push({ datei, dauer });
    this.t += dauer;
  }
  /** Stehendes Bild. */
  async halten(sek) {
    if (sek > 0) await this.bild(sek);
  }
  /** Bis zu einem Zeitpunkt halten (wenn er noch in der Zukunft liegt). */
  async warteBis(tZiel) {
    if (tZiel > this.t + 0.01) await this.bild(tZiel - this.t);
  }
  /** Sprechzeile beginnt jetzt; liefert den frühesten Zeitpunkt fürs nächste Bild. */
  sprich(id) {
    if (!(id in zeilenDauer)) throw new Error(`Unbekannte Zeile ${id}`);
    this.marken.zeilen[id] = Math.round(this.t * 1000) / 1000;
    console.log(`  ${id} @ ${this.t.toFixed(1)} s (${zeilenDauer[id].toFixed(1)} s)`);
    return this.t + zeilenDauer[id] + 0.5;
  }
  sfx(key, extra = {}) {
    this.marken.sfx.push({ key, at: Math.round(this.t * 1000) / 1000, ...extra });
  }
  kapitel(id) {
    this.marken.kapitel.push({ id, start: Math.round(this.t * 1000) / 1000 });
    console.log(`Kapitel ${id} @ ${this.t.toFixed(1)} s`);
  }

  async cursorSetzen(x, y) {
    this.cursor = { x, y };
    await page.evaluate(([x, y]) => {
      const c = document.getElementById("film-cursor");
      if (c) c.style.transform = `translate(${x}px,${y}px)`;
    }, [x, y]);
    await page.mouse.move(x, y);
  }
  /** Zeiger mit Easing zum Ziel bewegen. */
  async fahreZu(x, y, schritte) {
    const dx = x - this.cursor.x;
    const dy = y - this.cursor.y;
    const weg = Math.hypot(dx, dy);
    const n = schritte ?? Math.max(10, Math.min(18, Math.round(weg / 40)));
    const { x: x0, y: y0 } = this.cursor;
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; // easeInOutCubic
      await this.cursorSetzen(x0 + dx * e, y0 + dy * e);
      await this.bild(FRAME);
    }
  }
  async puls(x, y) {
    const frames = [
      [0.9, 34],
      [0.6, 44],
      [0.25, 56],
    ];
    for (const [op, gr] of frames) {
      await page.evaluate(([x, y, op, gr]) => {
        const r = document.getElementById("film-cursor-ring");
        if (!r) return;
        r.style.width = r.style.height = gr + "px";
        r.style.opacity = String(op);
        r.style.transform = `translate(${x + 3 - gr / 2}px,${y + 3 - gr / 2}px)`;
      }, [x, y, op, gr]);
      await this.bild(FRAME);
    }
    await page.evaluate(() => {
      const r = document.getElementById("film-cursor-ring");
      if (r) r.style.opacity = "0";
    });
  }

  /** Element weich in den sichtbaren Bereich scrollen (Zielzeile ~ 32 % von oben). */
  async scrolleZu(locator, anteil = 0.32, schritte = 12) {
    const box = await locator.boundingBox();
    if (!box) throw new Error("scrolleZu: Element ohne Box");
    const zielY = Math.max(0, (await page.evaluate(() => window.scrollY)) + box.y - VIEW.height * anteil);
    await this.scrolleNach(zielY, schritte);
  }
  async scrolleNach(zielY, schritte = 12) {
    const start = await page.evaluate(() => window.scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const ziel = Math.min(Math.max(0, zielY), Math.max(0, max));
    if (Math.abs(ziel - start) < 4) return;
    const n = Math.max(6, Math.min(schritte, Math.round(Math.abs(ziel - start) / 35)));
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      await page.evaluate((y) => window.scrollTo(0, y), start + (ziel - start) * e);
      await this.bild(FRAME);
    }
  }
  /** Langsame Fahrt über eine Strecke (für „zeigen“). */
  async scrolleLangsam(zielY, sek) {
    const start = await page.evaluate(() => window.scrollY);
    const n = Math.max(2, Math.round(sek * FPS));
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      await page.evaluate((y) => window.scrollTo(0, y), start + (zielY - start) * e);
      await this.bild(FRAME);
    }
  }

  /** Mitte eines Elements (nach Bedarf scrollen). */
  async ziel(locator, { dx = 0, dy = 0 } = {}) {
    let box = await locator.boundingBox();
    if (!box) {
      await locator.scrollIntoViewIfNeeded();
      box = await locator.boundingBox();
    }
    if (!box) throw new Error("ziel: Element ohne Box");
    if (box.y < 60 || box.y + box.height > VIEW.height - 90) {
      await this.scrolleZu(locator, 0.4);
      box = await locator.boundingBox();
    }
    return { x: box.x + Math.min(box.width / 2, 160) + dx, y: box.y + box.height / 2 + dy };
  }
  async klick(locator, { halten = 0.35, dx, dy, ohneSfx = false } = {}) {
    const { x, y } = await this.ziel(locator, { dx, dy });
    await this.fahreZu(x, y);
    await this.bild(0.12);
    if (!ohneSfx) this.sfx("klick");
    await page.mouse.click(x, y);
    await this.puls(x, y);
    await this.halten(halten);
  }
  /** Nur hinfahren (Zeigen), nicht klicken. */
  async zeige(locator, halten = 0.6) {
    const { x, y } = await this.ziel(locator);
    await this.fahreZu(x, y);
    await this.halten(halten);
  }
  /** Zeichenweise tippen; eine Aufnahme je Zeichen. */
  async tippe(text, { proZeichen = 0.08 } = {}) {
    const start = this.t;
    for (const zeichen of text) {
      await page.keyboard.type(zeichen);
      const jitter = 0.7 + Math.random() * 0.6;
      await this.bild(zeichen === "\n" ? proZeichen * 2 : proZeichen * jitter);
    }
    this.marken.sfx.push({ key: "tippen", at: Math.round(start * 1000) / 1000, dauer: Math.round((this.t - start) * 1000) / 1000 });
  }
  async klickUndTippe(locator, text, opt = {}) {
    await this.klick(locator, { halten: 0.25, ...opt });
    await this.tippe(text, opt);
  }
}

const rec = new Rekorder();
const Z = (id) => rec.sprich(id);

/* ------------------------------------------------------------ Hilfsdaten */

const heute = new Date();
const morgen = new Date(heute.getTime() + 86_400_000);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const EPOCHE = Date.UTC(2020, 0, 1);
/** EebZeitpunkt = Minuten seit 2020-01-01 in lokaler Wandzeit (Berlin), wie jetztZeitpunkt() im Format. */
function wandzeitMinuten(ms) {
  const lokal = new Date(ms).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }); // „2026-11-09 14:48:00“
  const [d, t] = lokal.split(" ");
  const [j, m, tag] = d.split("-").map(Number);
  const [h, min] = t.split(":").map(Number);
  return Math.round((Date.UTC(j, m - 1, tag, h, min) - EPOCHE) / 60_000);
}
const heuteEebTag = Math.round((Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate()) - EPOCHE) / 86_400_000);

/** Beispielbogen aus examples/ in eine Einheit der Lage „Hochwasser Hunte“ verwandeln. */
async function fremderBogen(pfad, ov, kurz, regionalstelle, empfangenAm) {
  const b = JSON.parse(await readFile(WURZEL + "examples/" + pfad, "utf8"));
  b.uebung = false;
  b.stand = wandzeitMinuten(empfangenAm) - 8; // Stand kurz vor dem Eintreffen (kein Uhr-Hinweis, nicht „veraltet“)
  b.einsatz.zeitraumVon = heuteEebTag;
  b.einsatz.zeitraumBis = heuteEebTag + 1;
  delete b.einsatz.zeitraumVonIso;
  delete b.einsatz.zeitraumBisIso;
  b.einsatz.ortAuftrag = EINHEIT.einsatzOrt;
  b.einheit.hierarchie[0] = { ...b.einheit.hierarchie[0], name: ov, kurz, email: `OV-${ov}@thw.de` };
  if (b.einheit.hierarchie[1]) b.einheit.hierarchie[1] = { ...b.einheit.hierarchie[1], name: regionalstelle, email: `Poststelle.RSt_${regionalstelle}@thw.de` };
  if (b.einheit.hierarchie[2]) b.einheit.hierarchie[2] = { ...b.einheit.hierarchie[2], name: "Bremen, Niedersachsen", email: "Poststelle.LVHBNI@thw.de" };
  return b;
}

async function sammlungSeed() {
  const jetzt = Date.now();
  const defs = [
    ["thw/009-oberhausen-rheinhausen-b.json", "Delmenhorst", "ODEL", "Bremen", jetzt - 41 * 60_000],
    ["thw/040-cloppenburg-fgr-n.json", "Cloppenburg", "OCLO", "Lingen", jetzt - 27 * 60_000],
    ["thw/001-albstadt-ztr-tz.json", "Westerstede", "OWES", "Oldenburg", jetzt - 12 * 60_000],
  ];
  const eintraege = [];
  for (const [i, d] of defs.entries()) {
    eintraege.push({
      id: `film-${i}`,
      einheitSchluessel: `film-${i}`,
      empfangenAm: d[4],
      quelle: "scan",
      status: 0,
      bogen: await fremderBogen(d[0], d[1], d[2], d[3], d[4]),
    });
  }
  return [
    {
      id: "film-hochwasser-hunte",
      name: "Hochwasser Hunte",
      art: 0,
      ort: "Bereitstellungsraum Weser-Ems-Hallen",
      angelegt: jetzt - 95 * 60_000,
      geaendert: jetzt - 12 * 60_000,
      eintraege,
    },
  ];
}

const weiter = () => page.getByRole("button", { name: /^Weiter/ }).last();
const blaettern = async (knopf = weiter()) => {
  await rec.klick(knopf, { halten: 0.1 });
  rec.sfx("blaettern");
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, 0));
  await rec.halten(0.6);
};

/* ================================================================= Regie */

console.log("Aufnahme läuft …");
await page.goto(BASIS + "/");
await page.waitForTimeout(1200);
// Offline-Hinweis nicht im Bild: Seite kurz ruhen lassen, dann losgehen.
await page.evaluate(() => window.scrollTo(0, 0));
await rec.cursorSetzen(900, 520);

/* --- Start ------------------------------------------------------------- */
rec.kapitel("start");
await rec.halten(0.8);
let bis = Z("a01");
await rec.halten(3.0);
await rec.zeige(page.getByRole("heading", { name: "Meinen Bogen ausfüllen" }), 1.6);
await rec.zeige(page.getByRole("heading", { name: "Bögen sammeln (Meldekopf)" }), 1.6);
await rec.warteBis(bis);
bis = Z("a02");
const neu = page.getByRole("button", { name: "Neuen Bogen erstellen" });
await rec.zeige(neu, 0.9);
await rec.warteBis(bis - 0.6);
await rec.klick(neu, { halten: 0.2 });
await page.waitForTimeout(300);
await rec.halten(0.8);

/* --- 1. Einheit --------------------------------------------------------- */
rec.kapitel("einheit");
bis = Z("a03");
await rec.halten(2.8);
await rec.zeige(page.getByLabel("Organisation", { exact: true }), 1.2);
const ort = page.getByLabel("Ort der Einheit (Pflicht)");
await rec.klickUndTippe(ort, EINHEIT.ortSuche, { proZeichen: 0.12 });
await rec.halten(1.2);
const ortOption = page.getByRole("option", { name: /^Oldenburg \(NI\)/ });
await rec.klick(ortOption, { halten: 0.4 });
await rec.warteBis(bis);

bis = Z("a04");
const typ = page.getByRole("combobox", { name: "Einheitstyp" });
await rec.klickUndTippe(typ, EINHEIT.einheitstypSuche, { proZeichen: 0.09 });
await rec.halten(1.0);
await rec.klick(page.getByRole("option", { name: /^FGr WP \(B\)/ }), { halten: 0.5 });
const vorbelegt = page.getByText(/^Vorbelegt nach StAN/);
await rec.zeige(vorbelegt, 1.0);
await rec.warteBis(bis);

bis = Z("a05");
const anlegen = page.getByRole("button", { name: "Regionalbereich und Landesverband anlegen" });
if (await anlegen.count()) {
  await rec.klick(anlegen, { halten: 0.6 });
}
// Übergeordnete Ebenen zeigen (Regionalstelle Oldenburg, LV Bremen, Niedersachsen)
const ebenen = page.getByLabel("Ebene (übergeordnet)");
if (await ebenen.count()) {
  await rec.scrolleZu(ebenen.first(), 0.25);
  await rec.zeige(ebenen.last(), 0.8);
}
await rec.warteBis(bis - 1.6);
await blaettern();

/* --- 2. Einsatz --------------------------------------------------------- */
rec.kapitel("einsatz");
bis = Z("a06");
await rec.halten(1.5);
const von = page.getByLabel("Zeitraum von");
const bisFeld = page.getByLabel(/^Zeitraum bis/);
await rec.zeige(von, 0.6);
await rec.klick(bisFeld, { halten: 0.3 });
await bisFeld.fill(iso(morgen));
await rec.halten(0.8);
const auftrag = page.locator("#feld-ort-auftrag");
await rec.klickUndTippe(auftrag, EINHEIT.einsatzOrt, { proZeichen: 0.055 });
await rec.halten(0.6);
await rec.warteBis(bis);

bis = Z("a07");
const beginn = page.getByText("Einsatzbeginn eintragen", { exact: true });
await rec.klick(beginn, { halten: 1.0 });
const uebung = page.getByText("Dies ist eine Übung", { exact: true });
await rec.klick(uebung, { halten: 1.3 });
await rec.klick(uebung, { halten: 0.8 });
await rec.warteBis(bis - 1.6);
await blaettern();

/* --- 3. Personal -------------------------------------------------------- */
rec.kapitel("personal");
bis = Z("a08");
await rec.halten(1.5);
// Kurz-Liste ist bei zwölf Personen die Vorgabe – sicherstellen.
const tabelleRadio = page.getByLabel("Kurz-Liste (Tabelle)");
if (!(await tabelleRadio.isChecked())) await rec.klick(page.getByText("Kurz-Liste (Tabelle)", { exact: true }), { halten: 0.5 });
const tabelle = page.locator("main table").first();
await rec.scrolleZu(tabelle, 0.18);
await rec.halten(1.2);
await rec.scrolleLangsam((await page.evaluate(() => window.scrollY)) + 260, 2.0);
await rec.halten(0.6);
await rec.warteBis(bis);

bis = Z("a09");
const namenKnopf = page.getByRole("button", { name: "Namen einfügen…" });
await rec.klick(namenKnopf, { halten: 0.7 });
const namenDialog = page.locator("dialog[aria-label='Namen einfügen']");
const namenFeld = namenDialog.locator("textarea");
await rec.klick(namenFeld, { halten: 0.2 });
await rec.tippe(EINHEIT.namen.join("\n"), { proZeichen: 0.035 });
await rec.halten(0.5);
const lesart = namenDialog.getByText("Vorname Nachname", { exact: true });
if (await lesart.count()) await rec.klick(lesart.first(), { halten: 0.6 });
const vorschauDialog = namenDialog;
await rec.scrolleLangsam(0, 0.1);
await rec.halten(0.8);
await rec.klick(vorschauDialog.getByRole("button", { name: "Übernehmen" }), { halten: 0.3 });
rec.sfx("bestaetigt");
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 0));
await rec.halten(1.0);
await rec.warteBis(bis);

bis = Z("a10");
const staerke = page.getByText(/^Stärke \(abgeleitet\)/);
await rec.scrolleZu(staerke, 0.2);
await rec.zeige(staerke, 1.4);
// Geschlecht „W“ in den genannten Zeilen (Kurz-Liste)
for (const i of EINHEIT.weiblich) {
  const sel = page.getByLabel(`Person ${i + 1}: Geschlecht`);
  await rec.klick(sel, { halten: 0.15, ohneSfx: true });
  await sel.selectOption({ label: "W" });
  await rec.halten(0.3);
}
await rec.halten(0.5);
// Telefon der Gruppenführerin: Kartenansicht, „+ Erreichbarkeit“
await rec.klick(page.getByText("Alle Angaben (Karten)", { exact: true }), { halten: 0.6 });
const kontaktKnopf = page.getByRole("button", { name: /^\+ (Erreichbarkeit|Kontakt)$/ }).first();
await rec.klick(kontaktKnopf, { halten: 0.5 });
const telFeld = page.locator("main input[type=tel]").first();
await rec.klickUndTippe(telFeld, EINHEIT.telefonGrFue, { proZeichen: 0.09 });
await rec.halten(0.8);
// Fahrerlaubnis bei den Kraftfahrern (Truppführer), damit die Übersicht keinen offenen Punkt meldet.
for (const i of EINHEIT.kraftfahrer ?? [1, 3]) {
  const sel = page.getByLabel("Fahrerlaubnis", { exact: true }).nth(i);
  await rec.klick(sel, { halten: 0.15, ohneSfx: true });
  await sel.selectOption({ label: "CE" });
  await rec.halten(0.35);
}
await rec.warteBis(bis - 1.6);
await blaettern();

/* --- 4. Fahrzeuge ------------------------------------------------------- */
rec.kapitel("fahrzeuge");
bis = Z("a11");
await rec.halten(2.0);
const kennzahlen = page.getByLabel(/^Kennzahlen/);
await rec.zeige(kennzahlen.first(), 1.0);
await rec.scrolleLangsam((await page.evaluate(() => window.scrollY)) + 330, 2.4);
await rec.zeige(kennzahlen.nth(1), 1.0);
await rec.scrolleLangsam((await page.evaluate(() => window.scrollY)) + 420, 2.4);
await rec.halten(0.4);
await rec.warteBis(bis);

bis = Z("a12");
const kennzeichenFelder = page.getByLabel("Kennzeichen");
for (const [i, kz] of EINHEIT.kennzeichen.entries()) {
  await rec.klickUndTippe(kennzeichenFelder.nth(i), kz, { proZeichen: 0.07 });
  await rec.halten(0.25);
}
// Sitzplätze des Mannschaftslastwagens eintragen (Richtwert 7 → tatsächlich 9), damit alle zwölf mitfahren.
const sitzplaetze = page.getByLabel("Sitzplätze");
await rec.klickUndTippe(sitzplaetze.nth(1), EINHEIT.sitzplaetzeMlw ?? "9", { proZeichen: 0.12 });
await page.keyboard.press("Tab");
await rec.halten(0.4);
const hinweise = page.locator("main").getByText(/Sitzplätze:/).first();
if (await hinweise.count()) await rec.zeige(hinweise, 1.2);
await rec.warteBis(bis - 1.6);
await blaettern();

/* --- 5. Sofortbedarf ---------------------------------------------------- */
rec.kapitel("sofortbedarf");
bis = Z("a13");
await rec.halten(1.4);
await rec.klick(page.getByText("Sofortbedarf erfassen", { exact: true }), { halten: 0.9 });
await rec.zeige(page.getByLabel("Verpflegung (Personen)"), 1.0);
const diesel = page.getByLabel("Diesel (l)");
await rec.klick(diesel, { halten: 0.2 });
await page.keyboard.press("Control+A");
await rec.tippe(EINHEIT.dieselLiter, { proZeichen: 0.12 });
await rec.halten(0.8);
await rec.warteBis(bis - 1.6);
await blaettern(page.getByRole("button", { name: /^Zur Übersicht/ }).last());

/* --- 6. Übersicht ------------------------------------------------------- */
rec.kapitel("uebersicht");
await page.waitForTimeout(400);
rec.sfx("bestaetigt");
bis = Z("a14");
await rec.halten(2.6);
const pruef = page.getByText(/Alle Angaben vollständig und plausibel/);
if (await pruef.count()) await rec.zeige(pruef, 1.2);
const personalAbschnitt = page.getByRole("heading", { name: /^Personal \(/ });
await rec.scrolleZu(personalAbschnitt, 0.15, 16);
await rec.halten(0.8);
const fahrzeugeAbschnitt = page.getByRole("heading", { name: /^Fahrzeuge \(/ });
await rec.scrolleZu(fahrzeugeAbschnitt, 0.15, 16);
await rec.zeige(page.getByRole("button", { name: "Bearbeiten" }).nth(3), 0.9);
await rec.warteBis(bis);

bis = Z("a15");
const vorschau = page.getByRole("button", { name: "Vorschau anzeigen" });
await rec.klick(vorschau, { halten: 0.3 });
await page.waitForTimeout(3500);
await rec.halten(0.5);
const pdfRahmen = page.locator("main iframe, main canvas, main embed, main object").first();
if (await pdfRahmen.count()) {
  await rec.scrolleZu(pdfRahmen, 0.12, 16);
  await rec.halten(1.8);
  const box = await pdfRahmen.boundingBox();
  if (box && box.height > 500) await rec.scrolleLangsam((await page.evaluate(() => window.scrollY)) + Math.min(box.height - 400, 600), 2.4);
}
const qrUeberschrift = page.getByRole("heading", { name: /^QR-Code/ });
await rec.scrolleZu(qrUeberschrift, 0.1, 18);
await rec.halten(1.0);
await rec.warteBis(bis);

/* --- Übergabe ----------------------------------------------------------- */
rec.kapitel("uebergabe");
bis = Z("a16");
await rec.scrolleNach(0, 14);
await rec.klick(page.getByRole("button", { name: "Bogen übergeben…" }), { halten: 0.9 });
await rec.klick(page.getByRole("button", { name: "QR-Code im Vollbild zeigen" }), { halten: 0.3 });
await page.waitForTimeout(600);
await rec.cursorSetzen(1180, 690);
await rec.halten(1.0);
await rec.warteBis(bis + 0.8);
const qrDialog = page.locator("dialog.qr-vollbild");
await rec.klick(qrDialog.getByRole("button", { name: "Schließen" }), { halten: 0.3 });
if (await page.locator("dialog[open]").count()) {
  const schliessen = page.locator("dialog[open]").getByRole("button", { name: "Schließen" }).first();
  if (await schliessen.count()) await rec.klick(schliessen, { halten: 0.2 });
}

/* --- Meldekopf ---------------------------------------------------------- */
// Eigenen Bogen als Datei sichern (so kommt er beim Meldekopf an) und das Gerät
// „wechseln“: Entwurf raus, Einsatz-Sammlung mit drei Einheiten rein.
const entwurf = await page.evaluate(() => localStorage.getItem("eeb.entwurf.v1"));
const eigenerBogen = JSON.parse(entwurf).bogen;
const bogenDatei = BUILD + "app-oldenburg-fgr-wp-b.json";
await writeFile(bogenDatei, JSON.stringify(eigenerBogen));
const seed = await sammlungSeed();
await page.evaluate((s) => {
  localStorage.removeItem("eeb.entwurf.v1");
  localStorage.setItem("eeb.einsaetze.v1", JSON.stringify(s));
}, seed);

rec.kapitel("meldekopf");
await page.goto(BASIS + "/");
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo(0, 0));
await rec.cursorSetzen(900, 560);
bis = Z("a17");
await rec.halten(1.6);
const karte = page.getByText("Hochwasser Hunte", { exact: true }).first();
await rec.zeige(karte, 1.2);
await rec.warteBis(bis - 1.2);
await rec.klick(page.getByRole("button", { name: "Öffnen" }).first(), { halten: 0.2 });
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo(0, 0));
await rec.halten(1.2);

bis = Z("a18");
await rec.halten(1.2);
const einlesen = page.getByRole("button", { name: /^Bögen einlesen/ });
await rec.klick(einlesen, { halten: 0.6 });
const dateienWaehlen = page.getByText("Dateien wählen…").first();
await rec.zeige(dateienWaehlen, 0.4);
rec.sfx("klick");
await rec.puls(rec.cursor.x, rec.cursor.y);
await page.locator("main input[type=file][aria-label='Dateien wählen…']").setInputFiles(bogenDatei);
await page.waitForTimeout(1200);
rec.sfx("bestaetigt");
await rec.halten(1.4);
const aufgenommen = page.getByText(/Bogen aufgenommen/).first();
if (await aufgenommen.count()) await rec.zeige(aufgenommen, 0.8);
await rec.scrolleNach(0, 10);
await rec.zeige(page.getByText(/^Gesamt$/i).first(), 1.2);
const neueEinheit = page.getByText(/THW Oldenburg \(NI\)/).first();
if (await neueEinheit.count()) {
  await rec.scrolleZu(neueEinheit, 0.3, 16);
  await rec.halten(1.0);
}
await rec.warteBis(bis);

bis = Z("a19");
const sammelPdf = page.getByRole("button", { name: /Einsatz weitergeben \/ sichern/ });
await rec.scrolleZu(sammelPdf, 0.3, 18);
await rec.zeige(sammelPdf, 1.3);
await rec.zeige(page.getByRole("button", { name: "Übersicht als CSV" }), 1.2);
await rec.scrolleNach(0, 16);
const schnell = page.getByRole("button", { name: /Einheit schnell erfassen/ });
await rec.zeige(schnell, 1.4);
await rec.warteBis(bis + 1.5);
await rec.halten(0.2);

/* ============================================================== Schnitt */

rec.marken.dauer = Math.round(rec.t * 1000) / 1000;
await writeFile(BUILD + "app-marken.json", JSON.stringify(rec.marken, null, 2));
console.log(`${rec.frames.length} Bilder, ${rec.t.toFixed(1)} s`);

const liste = rec.frames.map((f) => `file '${f.datei}'\nduration ${f.dauer.toFixed(4)}`).join("\n") + `\nfile '${rec.frames.at(-1).datei}'\n`;
await writeFile(BUILD + "app-frames.txt", liste);

await browser.close();
if (server) server.kill();

if (!process.env.NUR_FRAMES) {
  console.log("ffmpeg …");
  await exec("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", BUILD + "app-frames.txt",
    "-vf", `fps=${FPS},scale=1920:1080:flags=lanczos,format=yuv420p`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-movflags", "+faststart",
    BUILD + "app.mp4",
  ], { maxBuffer: 1 << 24 });
  const { stdout } = await exec("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", BUILD + "app.mp4"]);
  console.log(`build/app.mp4: ${Number.parseFloat(stdout).toFixed(2)} s (Marken: ${rec.marken.dauer} s)`);
}
