/**
 * App-Aufnahmen für den Erklärfilm (erklaerfilm/).
 *
 * Füllt in der echten App einen Bogen Schritt für Schritt aus — so, wie ihn
 * der Gruppenführer im Film ausfüllt — und speichert nach jeder Eingabe ein
 * Bild samt Position des Zielfelds. Der Film (film.html) setzt daraus Zoom,
 * Mauszeiger und Hervorhebung zusammen; nichts davon ist nachgestellt.
 *
 * Ausgabe: erklaerfilm/aufnahmen/*.png und erklaerfilm/aufnahmen/index.json
 *
 * Startet selbst einen Vite-Dev-Server, sofern nicht EEB_BASE_URL auf einen
 * laufenden zeigt (gleiche Regel wie scripts/screenshots.mjs).
 * CHROMIUM_PFAD setzt einen anderen Browser als den von Playwright.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PORT = 5374;
const BASIS_URL = process.env.EEB_BASE_URL ?? `http://localhost:${PORT}`;
const ZIEL = fileURLToPath(new URL("./aufnahmen/", import.meta.url));
const BREITE = 1280;
const HOEHE = 800;
const SKALA = 1.5; // 1920×1200 Bildpunkte: scharf genug für Zoom im 1080p-Film

/** Namen der Bergungsgruppe — erfunden, wie in den Beispielbögen. */
const NAMEN = [
  "Lehmann, Karsten 0731 5550123",
  "Herrmann, Moritz",
  "Hartmann, Kai",
  "Brandt, Uwe",
  "Kern, Thomas",
  "Schneider, Martin",
  "Weiß, Verena",
  "Vogel, Michael",
  "Özdemir, Can",
];

const index = {}; // szene → [{ bild, ziel, notiz }]
let laufnummer = 0;

/**
 * Minuten seit 2020-01-01 in Berliner Wandzeit (EebZeitpunkt, model.ts).
 * Die App rechnet mit Ortszeit; mit UTC wirkte jede Meldung eine Stunde alt.
 */
function jetztEeb() {
  const teile = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })
      .formatToParts(new Date())
      .map((t) => [t.type, Number(t.value)]),
  );
  return Math.round((Date.UTC(teile.year, teile.month - 1, teile.day, teile.hour, teile.minute) - Date.UTC(2020, 0, 1)) / 60_000);
}

/** Beispielbogen aus examples/, auf heute gestellt (wie scripts/screenshots.mjs). */
async function beispielBogen(pfad) {
  const bogen = JSON.parse(await readFile(new URL(`../examples/${pfad}`, import.meta.url), "utf8"));
  bogen.uebung = false;
  bogen.stand = jetztEeb() - 20; // sonst greift die 90-Tage-Datenschutzfrist
  if (bogen.einsatz && typeof bogen.einsatz.zeitraumVon === "number") {
    const d = new Date();
    const heute = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2020, 0, 1)) / 86_400_000);
    const dauer = Math.max(0, (bogen.einsatz.zeitraumBis ?? bogen.einsatz.zeitraumVon) - bogen.einsatz.zeitraumVon);
    bogen.einsatz.zeitraumVon = heute;
    bogen.einsatz.zeitraumBis = heute + dauer;
  }
  return bogen;
}

/** localStorage-Seed einer Einsatz-Sammlung (wie scripts/screenshots.mjs). */
function einsatzSeed(name, ort, boegen) {
  const jetzt = Date.now();
  const sammlung = {
    id: "film-einsatz",
    name,
    art: 0,
    ort,
    angelegt: jetzt - 45 * 60_000,
    geaendert: jetzt,
    eintraege: boegen.map((bogen, i) => ({
      id: `film-${i}`,
      einheitSchluessel: `film-${i}`,
      empfangenAm: jetzt - (boegen.length - 1 - i) * 6 * 60_000 - 60_000,
      quelle: "scan",
      status: 0,
      bogen,
    })),
  };
  return { "eeb.einsaetze.v1": JSON.stringify([sammlung]) };
}

async function warteAufServer(url, versuche = 60) {
  for (let i = 0; i < versuche; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev-Server unter ${url} nicht erreichbar geworden`);
}

/** Rechteck eines Locators in Viewport-Koordinaten (CSS-Pixel). */
async function rechteck(locator) {
  const b = await locator.boundingBox();
  return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null;
}

/**
 * Sichtbares Rechteck eines Elements im aktuellen Zustand — oder null, wenn
 * es fehlt, unsichtbar ist oder von etwas anderem verdeckt wird (Dialog,
 * Vollbild, neue Seite). Geprüft wird am Mittelpunkt mit elementFromPoint.
 */
async function sichtbaresRechteck(locator) {
  if (!locator || !(await locator.count()) || !(await locator.isVisible().catch(() => false))) return null;
  const frei = await locator
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) return false;
      const x = r.left + r.width / 2;
      const y = Math.min(r.top + r.height / 2, innerHeight - 1);
      const oben = document.elementFromPoint(x, y);
      // Ein Label oder Eingabefeld desselben Feldes zählt nicht als Verdeckung.
      return !!oben && (el === oben || el.contains(oben) || oben.contains(el) || (oben.control && oben.control === el));
    })
    .catch(() => false);
  return frei ? rechteck(locator) : null;
}

/**
 * Ein Bild aufnehmen. `ziel` ist das Element, auf das Mauszeiger und gelbe
 * Markierung im Film zeigen. Es wird im selben Moment gemessen wie das Bild
 * entsteht — vorher gemessen lag die Markierung daneben, sobald sich die
 * Seite durch die Eingabe verschob (Vorschlagsliste, Dialog, neue Seite).
 */
async function aufnehmen(seite, szene, ziel, notiz) {
  await seite.waitForTimeout(450); // Einblendungen (~200 ms) abwarten
  const r = ziel ? await sichtbaresRechteck(ziel) : null;
  const bild = `${String(++laufnummer).padStart(3, "0")}-${szene}.png`;
  await seite.screenshot({ path: ZIEL + bild });
  (index[szene] ??= []).push({ bild, ziel: r, notiz });
  console.log(`${bild}  ${notiz}${ziel && !r ? "  (Ziel nicht sichtbar, ohne Markierung)" : ""}`);
}

/**
 * Feld in den sichtbaren Bereich holen, Aktion ausführen, aufnehmen.
 * `ohneZiel`: bei Klicks, die auf eine andere Seite führen — das Bild zeigt
 * dann die neue Seite, eine Markierung auf dem alten Knopf wäre irreführend.
 * `ziel`: anderes Element markieren, etwa das Feld, in das ein angeklickter
 * Listenvorschlag übernommen wurde (der Vorschlag selbst ist dann weg).
 */
async function schritt(seite, szene, locator, notiz, aktion, { ohneZiel = false, ziel = locator } = {}) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await seite.waitForTimeout(150);
  await aktion(locator);
  await aufnehmen(seite, szene, ohneZiel ? null : ziel, notiz);
}

async function tippen(locator, text) {
  await locator.click();
  await locator.pressSequentially(text, { delay: 40 });
}

const server = process.env.EEB_BASE_URL
  ? undefined
  : spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: "ignore", env: process.env });

try {
  await warteAufServer(BASIS_URL);
  await rm(ZIEL, { recursive: true, force: true });
  await mkdir(ZIEL, { recursive: true });
  // LANG: Datums- und Zeitfelder deutsch (TT.MM.JJJJ, 24 h) statt mm/dd/yyyy —
  // die Eingabefelder richten sich nach der Sprache des Browsers, nicht nach `locale`.
  const browser = await chromium.launch({
    args: ["--lang=de-DE"],
    env: { ...process.env, LANG: "de_DE.UTF-8", LANGUAGE: "de" },
    ...(process.env.CHROMIUM_PFAD ? { executablePath: process.env.CHROMIUM_PFAD } : {}) });
  const kontext = await browser.newContext({
    viewport: { width: BREITE, height: HOEHE },
    deviceScaleFactor: SKALA,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  // Debug-Leiste des Dev-Servers aus (siehe scripts/screenshots.mjs).
  await kontext.addInitScript(() => localStorage.setItem("eeb-debug", "0"));
  const s = await kontext.newPage();
  await s.goto(`${BASIS_URL}/`, { waitUntil: "networkidle" });

  // ── Start ─────────────────────────────────────────────────────────────
  await aufnehmen(s, "start", null, "Startseite");
  const neu = s.getByRole("button", { name: "Neuen Bogen erstellen" });
  await aufnehmen(s, "start", neu, "Neuen Bogen erstellen");
  await neu.click();

  // ── 1. Einheit ────────────────────────────────────────────────────────
  const ort = s.getByLabel("Ort der Einheit (Pflicht)").first(); // .first(): die Vorschlagsliste trägt dasselbe Label
  await schritt(s, "einheit", ort, "Ort tippen: Ulm", (l) => tippen(l, "Ulm"));
  await schritt(s, "einheit", s.getByRole("option", { name: /^Ulm\s+OULM/ }), "OV Ulm aus dem Verzeichnis", (l) => l.click(), { ziel: ort });
  const typ = s.getByRole("combobox", { name: "Einheitstyp" });
  await schritt(s, "einheit", typ, "Einheitstyp: Bergungsgruppe", (l) => tippen(l, "Bergung"));
  await schritt(s, "einheit", s.getByRole("option", { name: /Bergungsgruppe/ }).first(), "Bergungsgruppe wählen", (l) => l.click(), { ziel: typ });
  const rbLv = s.getByRole("button", { name: "Regionalbereich und Landesverband anlegen" });
  if (await rbLv.count()) await schritt(s, "einheit", rbLv, "Regionalbereich und Landesverband", (l) => l.click());

  const weiter = () => s.getByRole("button", { name: /^(Weiter|Zur\s+Übersicht)/ });
  await schritt(s, "einheit", weiter(), "Weiter", (l) => l.click(), { ohneZiel: true });

  // ── 2. Einsatz ────────────────────────────────────────────────────────
  await aufnehmen(s, "einsatz", null, "Zeitraum ist vorbelegt");
  await schritt(s, "einsatz", s.getByLabel("Einsatzort / Auftrag"), "Ort/Auftrag", (l) =>
    tippen(l, "Sturmtief: Gebäudesicherung Albstadt"),
  );
  await schritt(s, "einsatz", weiter(), "Weiter", (l) => l.click(), { ohneZiel: true });

  // ── 3. Personal ───────────────────────────────────────────────────────
  await aufnehmen(s, "personal", null, "StAN-Sollplätze stehen schon da");
  await schritt(s, "personal", s.getByRole("button", { name: "Namen einfügen…" }), "Namen einfügen", (l) => l.click());
  const dialog = s.getByRole("dialog");
  await schritt(s, "personal", dialog.locator("textarea"), "Namensliste einfügen", (l) => l.fill(NAMEN.join("\n")));
  await schritt(s, "personal", dialog.getByRole("button", { name: /Personen übernehmen/ }), "Übernehmen", (l) => l.click());
  // Person 7 ist Verena Weiß (Reihenfolge der Namensliste).
  await schritt(s, "personal", s.getByLabel("Person 7: Geschlecht"), "Geschlecht W", (l) => l.selectOption({ label: "W" }));
  await schritt(s, "personal", s.getByText(/^Stärke \(abgeleitet\)/), "Stärke rechnet mit", async () => {});
  await schritt(s, "personal", weiter(), "Weiter", (l) => l.click(), { ohneZiel: true });

  // ── 4. Fahrzeuge ──────────────────────────────────────────────────────
  await aufnehmen(s, "fahrzeuge", null, "StAN-Fahrzeuge stehen schon da");
  const kennzeichen = s.getByLabel("Kennzeichen");
  await schritt(s, "fahrzeuge", kennzeichen.nth(0), "Kennzeichen GKW", (l) => tippen(l, "THW-80125"));
  await schritt(s, "fahrzeuge", s.getByLabel("Kennwort").first(), "Kennwort Heros", (l) => l.selectOption({ label: "Heros – Heros (THW)" }));
  await schritt(s, "fahrzeuge", s.getByLabel(/^Kennzahlen/).first(), "Kennzahlen 22/51", (l) => l.fill("22/51"));
  await schritt(s, "fahrzeuge", kennzeichen.nth(1), "Kennzeichen Anhänger", (l) => tippen(l, "THW-80126"));
  await schritt(s, "fahrzeuge", weiter(), "Weiter", (l) => l.click(), { ohneZiel: true });

  // ── 5. Sofortbedarf ───────────────────────────────────────────────────
  await schritt(s, "sofortbedarf", s.getByLabel("Sofortbedarf erfassen"), "Sofortbedarf anhaken", (l) => l.check());
  await schritt(s, "sofortbedarf", s.getByLabel("Verpflegung (Personen)"), "Verpflegung aus der Stärke", async () => {});
  await schritt(s, "sofortbedarf", s.getByLabel("Diesel (l)"), "Diesel 60 l", (l) => l.fill("60"));
  await schritt(s, "sofortbedarf", s.getByLabel("Ruhezeit erforderlich"), "Ruhezeit", (l) => l.check());
  await schritt(s, "sofortbedarf", weiter(), "Zur Übersicht", (l) => l.click(), { ohneZiel: true });

  // ── 6. Übersicht ──────────────────────────────────────────────────────
  await aufnehmen(s, "uebersicht", null, "Gesamtübersicht");
  await schritt(s, "uebersicht", s.getByText(/Kraftfahrer/).first(), "Offener Punkt antippen", (l) => l.click(), { ohneZiel: true });
  await schritt(s, "uebersicht", s.getByLabel("Alle Angaben (Karten)"), "Karten-Ansicht", (l) => l.check());
  // Person 3 (Kai Hartmann) fährt den GKW.
  await schritt(s, "uebersicht", s.getByLabel("Fahrerlaubnis").nth(2), "Fahrerlaubnis CE", (l) => l.selectOption({ label: "CE" }));
  await schritt(s, "uebersicht", s.getByRole("button", { name: /^6\. Übersicht/ }), "Zurück zur Übersicht", (l) => l.click(), { ohneZiel: true });
  await aufnehmen(s, "uebersicht", s.getByText(/^Stärke \d/).first(), "Bogen vollständig");
  await schritt(s, "uebersicht", s.getByRole("button", { name: "Vorschau anzeigen" }), "PDF-Vorschau", (l) => l.click());
  await s.waitForTimeout(2500);
  await s.getByRole("heading", { name: "PDF-Vorschau" }).evaluate((el) => el.scrollIntoView({ block: "start" }));
  await aufnehmen(s, "pdf", null, "PDF im Papier-Layout");
  // QR-Code im Vollbild: so hält Karsten das Telefon am Meldekopf hin.
  await schritt(s, "qr", s.getByRole("button", { name: "Bogen übergeben…" }), "Bogen übergeben", (l) => l.click());
  await s.locator('img[alt^="EEB2-QR-Code"]').first().waitFor({ timeout: 30_000 });
  await schritt(s, "qr", s.getByRole("button", { name: "QR-Code im Vollbild zeigen" }), "QR-Vollbild", (l) => l.click());
  await s.keyboard.press("Escape");
  await s.waitForTimeout(300);
  if (!(await s.getByRole("button", { name: "PDF erzeugen" }).isVisible())) await s.getByRole("button", { name: "Bogen übergeben…" }).click();
  // Echtes PDF für ein scharfes Bild der Papierseite.
  const [download] = await Promise.all([
    s.waitForEvent("download"),
    s.getByRole("button", { name: "PDF erzeugen" }).click(),
  ]);
  await download.saveAs(ZIEL + "bogen.pdf");
  await new Promise((fertig, fehler) =>
    spawn("pdftoppm", ["-png", "-r", "150", ZIEL + "bogen.pdf", ZIEL + "pdf-seite"]).on("exit", (c) => (c === 0 ? fertig() : fehler(new Error("pdftoppm " + c)))),
  );
  // Die Papierseiten als eigene Bilder; `papier` sagt dem Film, dass sie
  // nicht im Browserfenster, sondern als Blatt erscheinen. Zielrechtecke in
  // Bildpunkten der Seite (150 dpi, A4 = 1240×1754).
  (index.pdf ??= []).push(
    { bild: "pdf-seite-1.png", papier: true, ziel: { x: 120, y: 60, w: 1000, h: 640 }, notiz: "pdf-seite-1" },
    { bild: "pdf-seite-2.png", papier: true, ziel: { x: 300, y: 30, w: 680, h: 560 }, notiz: "pdf-seite-2" },
  );

  const eigenerBogen = await s.evaluate(() => JSON.parse(localStorage.getItem("eeb.entwurf.v1")).bogen);
  await kontext.close();

  // ── Meldekopf: Einsatz-Sammlung ───────────────────────────────────────
  // Ein zweites Gerät: das Tablet am Meldekopf. Vier THW-Einheiten aus den
  // Beispielbögen sind schon eingetroffen, die Bergungsgruppe Ulm kommt dazu.
  const vorher = await Promise.all(
    ["thw/001-albstadt-ztr-tz.json", "thw/004-freiburg-fgr-wp-a.json", "thw/012-sinsheim-fgr-w-b.json", "thw/007-laufenburg-ztr-fz-log.json"].map(beispielBogen),
  );
  for (const [szene, boegen] of [
    ["meldekopf", vorher],
    ["meldekopf", [...vorher, eigenerBogen]],
  ]) {
    const seed = { "eeb-debug": "0", ...einsatzSeed("Sturmtief", "Albstadt", boegen) };
    const meldekopf = await browser.newContext({
      viewport: { width: BREITE, height: HOEHE },
      deviceScaleFactor: SKALA,
      locale: "de-DE",
      timezoneId: "Europe/Berlin",
    });
    const seite = await meldekopf.newPage();
    await seite.addInitScript((paare) => {
      for (const [k, w] of paare) localStorage.setItem(k, w);
    }, Object.entries(seed));
    await seite.goto(`${BASIS_URL}/`, { waitUntil: "networkidle" });
    await seite.getByRole("button", { name: "Öffnen", exact: true }).click();
    const leiste = seite.locator(".staerke-leiste");
    await leiste.waitFor();
    await leiste.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await seite.mouse.wheel(0, -60);
    await aufnehmen(seite, szene, leiste, `Sammlung mit ${boegen.length} Einheiten`);
    await meldekopf.close();
  }
  await browser.close();
  await writeFile(ZIEL + "index.json", JSON.stringify({ breite: BREITE, hoehe: HOEHE, skala: SKALA, szenen: index }, null, 2));
} finally {
  server?.kill("SIGTERM");
}
