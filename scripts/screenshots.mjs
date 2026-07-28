/**
 * Bildschirmfotos für das Web-Manifest und die SEO-Landingpages
 * (public/screenshots/).
 *
 * Android-Installationsdialoge und die freien PWA-Verzeichnisse zeigen nur dann
 * eine richtige Vorschau, wenn das Manifest `screenshots` mitbringt — ein Icon
 * allein reicht ihnen nicht. Aufnahmen sind Handarbeit, die veraltet; deshalb
 * dieses Skript: `npm run screenshots` nimmt sie reproduzierbar neu auf,
 * einmal breit (Desktop) und einmal schmal (Telefon).
 *
 * Dazu kommen keyword-benannte Aufnahmen für die Landingpages (thw.html,
 * meldekopf.html …): Statt der leeren Startseite zeigen sie die App bei der
 * Arbeit — ausgefüllter Bogen, Einsatz-Sammlung mit Stärke-Summen, QR-Übergabe.
 * Der App-Zustand entsteht über localStorage-Seeds aus den Beispielbögen in
 * examples/ plus wenige UI-Klicks. Diese Bilder gehören NICHT ins Manifest.
 *
 * Startet selbst einen Vite-Dev-Server, sofern nicht EEB_BASE_URL auf einen
 * laufenden zeigt (gleiche Regel wie in den E2E-Tests, features/support/haken.ts).
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PORT = 5373;
const BASIS_URL = process.env.EEB_BASE_URL ?? `http://localhost:${PORT}`;
const ZIEL = fileURLToPath(new URL("../public/screenshots/", import.meta.url));

// Die Maße stehen so auch im Manifest — beides muss zusammenpassen, sonst
// verwirft der Browser die Aufnahme.
const AUFNAHMEN = [
  { datei: "start-breit.png", breite: 1280, hoehe: 800 },
  { datei: "start-schmal.png", breite: 390, hoehe: 844 },
];

// Maße der Landingpage-Bilder — identisch zu den Manifest-Formaten, damit die
// <figure>-Einbindungen (width/height) einheitlich bleiben.
const BREIT = { breite: 1280, hoehe: 800 };
const SCHMAL = { breite: 390, hoehe: 844 };

/** Beispielbogen aus examples/ lesen (dieselben Daten wie im Beispiele-Dialog). */
async function beispielBogen(pfad) {
  return JSON.parse(await readFile(new URL(`../examples/${pfad}`, import.meta.url), "utf8"));
}

/** localStorage-Seed: Bogen als automatisch gesicherter Entwurf (entwurf.ts). */
function entwurfSeed(bogen) {
  return { "eeb.entwurf.v1": JSON.stringify({ gespeichert: Date.now(), bogen }) };
}

/**
 * localStorage-Seed: eine Einsatz-Sammlung (einsaetze.ts) mit den übergebenen
 * Bögen als bereits gescannte Meldungen. Eintrags-ID und Einheiten-Fingerabdruck
 * müssen nur eindeutig sein — die App berechnet beide sonst inhaltsbasiert,
 * für die Aufnahme reicht ein stabiler Platzhalter je Bogen.
 */
function einsatzSeed(name, ort, boegen) {
  const jetzt = Date.now();
  const sammlung = {
    id: "seed-einsatz",
    name,
    art: 0, // EinsatzArt.EINSATZ
    ort,
    angelegt: jetzt - 90 * 60_000,
    geaendert: jetzt,
    eintraege: boegen.map((bogen, i) => ({
      id: `seed-${i}`,
      einheitSchluessel: `seed-${i}`,
      empfangenAm: jetzt - (boegen.length - i) * 11 * 60_000,
      quelle: "scan",
      status: 0, // MeldeStatus.ANWESEND
      bogen,
    })),
  };
  return { "eeb.einsaetze.v1": JSON.stringify([sammlung]) };
}

/**
 * Den geseedeten Entwurf über die Startseiten-Karte fortsetzen — landet in der
 * Übersicht des Bogens (Stärke, Fahrzeuge, Übergabewege).
 */
async function entwurfFortsetzen(seite) {
  await seite.getByRole("button", { name: "Fortsetzen", exact: true }).click();
  await seite.getByText("QR-Code (Offline-Transport)").waitFor();
}

/**
 * Landingpage-Aufnahmen: `seed` befüllt localStorage vor dem Laden, `aktion`
 * stellt per UI-Interaktion die gewünschte Ansicht her.
 */
const SEO_AUFNAHMEN = [
  {
    datei: "thw-erfassungsbogen.png",
    ...BREIT,
    seed: async () => entwurfSeed(await beispielBogen("thw/013-ulm-b.json")),
    aktion: entwurfFortsetzen,
  },
  {
    datei: "feuerwehr-erfassungsbogen.png",
    ...SCHMAL,
    seed: async () =>
      entwurfSeed(await beispielBogen("katastrophenschutz/sachsen/loeschgruppe-loeschzug-retten-kamenz.json")),
    aktion: entwurfFortsetzen,
  },
  {
    datei: "dlrg-erfassungsbogen.png",
    ...SCHMAL,
    seed: async () => entwurfSeed(await beispielBogen("dlrg/wrz-mittelbaden-bootsgruppe.json")),
    aktion: entwurfFortsetzen,
  },
  {
    datei: "katastrophenschutz-erfassungsbogen.png",
    ...BREIT,
    seed: async () =>
      entwurfSeed(await beispielBogen("katastrophenschutz/sachsen/behandlungszug-1-mtf-torgau.json")),
    aktion: entwurfFortsetzen,
  },
  {
    // Einsatz-Sammlung des Meldekopfs: mehrere gescannte Einheiten
    // verschiedener Organisationen mit Stärke- und Bedarfssummen.
    datei: "meldekopf-einsatz-sammlung.png",
    ...BREIT,
    seed: async () =>
      einsatzSeed("Sturmtief Quirin", "Albstadt", [
        await beispielBogen("thw/001-albstadt-ztr-tz.json"),
        await beispielBogen("thw/013-ulm-b.json"),
        await beispielBogen("katastrophenschutz/sachsen/loeschgruppe-loeschzug-retten-kamenz.json"),
        await beispielBogen("dlrg/wrz-mittelbaden-bootsgruppe.json"),
        await beispielBogen("katastrophenschutz/sachsen/sanitaetsgruppe-einsatzzug-goerlitz.json"),
      ]),
    aktion: async (seite) => {
      await seite.getByRole("button", { name: "Öffnen", exact: true }).click();
      await seite.locator(".staerke-leiste").waitFor();
    },
  },
  {
    // QR-Anzeige eines Bogens: der Offline-Transport, das Kernversprechen der
    // App. Bewusst ein kleiner Bogen, damit ein einzelner Code entsteht.
    datei: "qr-code-uebergabe.png",
    ...SCHMAL,
    seed: async () => entwurfSeed(await beispielBogen("thw/073-speyer-tr-mhp.json")),
    aktion: async (seite) => {
      await entwurfFortsetzen(seite);
      // Signieren + QR-Rendern läuft asynchron — erst warten, dann hinscrollen.
      await seite.locator('img[alt^="EEB2-QR-Code"]').first().waitFor({ timeout: 30_000 });
      await seite.locator(".qr-box").evaluate((el) => el.scrollIntoView({ block: "start" }));
    },
  },
];

async function warteAufServer(url, versuche = 60) {
  for (let i = 0; i < versuche; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* Server noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev-Server unter ${url} nicht erreichbar geworden`);
}

const server = process.env.EEB_BASE_URL
  ? undefined
  : spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: "ignore", env: process.env });

try {
  await warteAufServer(BASIS_URL);
  await mkdir(ZIEL, { recursive: true });
  const browser = await chromium.launch();
  for (const { datei, breite, hoehe, seed, aktion } of [...AUFNAHMEN, ...SEO_AUFNAHMEN]) {
    const kontext = await browser.newContext({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1 });
    // Der Dev-Server zeigt von sich aus die Debug-Leiste zur Plattform-Vorschau
    // (siehe src/app/debug-plattform.tsx). Auf einem Bildschirmfoto, das als
    // Vorschau der App dient, hat sie nichts zu suchen — gemerktes „0" schaltet
    // sie ab, ohne dass dafür ein Produktions-Build nötig wäre.
    await kontext.addInitScript(() => localStorage.setItem("eeb-debug", "0"));
    if (seed) {
      const eintraege = Object.entries(await seed());
      await kontext.addInitScript((paare) => {
        for (const [schluessel, wert] of paare) localStorage.setItem(schluessel, wert);
      }, eintraege);
    }
    const seite = await kontext.newPage();
    await seite.goto(`${BASIS_URL}/`, { waitUntil: "networkidle" });
    await aktion?.(seite);
    await seite.screenshot({ path: ZIEL + datei });
    await seite.context().close();
    console.log(`${datei} (${breite}×${hoehe})`);
  }
  await browser.close();
} finally {
  server?.kill("SIGTERM");
}
