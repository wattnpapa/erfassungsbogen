/**
 * Vorschaubild für geteilte Links (public/og-bild.png, 1200×630).
 *
 * Der Verbreitungsweg dieser App sind Messenger-Gruppen von Ortsverbänden und
 * Wehren — dort entscheidet die Vorschaukarte, ob jemand den Link antippt. Ein
 * quadratisches Icon füllt diese Karte nicht; das Format 1200×630 ist das, was
 * WhatsApp, Signal, Mastodon und die Suchmaschinen groß ausspielen.
 *
 * Aufbau: Titel und Versprechen links, ein echtes Bildschirmfoto der App
 * rechts. Das Foto kommt aus public/screenshots/ (npm run screenshots) — so
 * bleibt die Karte aktuell, ohne dass dieses Skript einen Dev-Server braucht.
 *
 * Aufruf: npm run og  (vorher ggf. npm run screenshots)
 */
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const wurzel = new URL("../", import.meta.url);
// JPEG, nicht PNG: WhatsApp lädt Vorschaubilder oberhalb von etwa 300 KB nicht
// mehr nach und zeigt dann gar keine Karte. Die Verlustkompression kostet bei
// dieser Bildgröße nichts Sichtbares.
const ZIEL = fileURLToPath(new URL("public/og-bild.jpg", wurzel));

/** Datei als data:-URL — Playwright rendert den HTML-String ohne Basis-Adresse. */
async function datenUrl(pfad, typ) {
  const inhalt = await readFile(fileURLToPath(new URL(pfad, wurzel)));
  return `data:${typ};base64,${inhalt.toString("base64")}`;
}

const schriftUrl = await datenUrl(
  "node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2",
  "font/woff2",
);
const schirmUrl = await datenUrl("public/screenshots/start-breit.png", "image/png");

const karte = `
<style>
  @font-face {
    font-family: "Archivo Variable";
    src: url("${schriftUrl}") format("woff2-variations");
    font-weight: 100 900;
    font-display: block;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    display: flex; align-items: center; gap: 56px;
    padding: 64px 0 64px 72px;
    font-family: "Archivo Variable", system-ui, sans-serif;
    color: #fff;
    background: linear-gradient(160deg, #1d3d8f 0%, #12275e 62%, #0d1c45 100%);
  }
  /* Textspalte: feste Breite, damit der Umbruch reproduzierbar ist und nicht
     von der Schriftmetrik des ausführenden Rechners abhängt. */
  .text { width: 596px; flex: none; }
  /* Der Titel bricht am Bindestrich um — deshalb steht hier ein gewöhnlicher
     Trennstrich und kein geschützter: zweizeilig bleibt Platz für das Foto. */
  h1 {
    font-size: 62px; font-weight: 700; line-height: 1.04; letter-spacing: -0.025em;
  }
  p {
    margin-top: 24px; font-size: 29px; line-height: 1.34; font-weight: 400;
    color: rgba(255, 255, 255, 0.88);
  }
  /* Die drei Versprechen als Marken, nicht als Fließtext — sie müssen auch in
     der auf Daumennagelgröße geschrumpften Vorschau noch trennbar sein. */
  ul { display: flex; gap: 12px; margin-top: 34px; list-style: none; padding: 0; }
  li {
    font-size: 22px; font-weight: 600; padding: 9px 16px;
    border: 2px solid rgba(255, 255, 255, 0.45);
  }
  .adresse {
    margin-top: 40px; font-size: 26px; font-weight: 700;
    letter-spacing: 0.01em; color: #fff;
  }
  /* Das Bildschirmfoto läuft rechts bewusst aus dem Bild heraus: es wirkt als
     Fenster in die App, statt als kleingerechnetes vollständiges Rechteck. */
  .schirm {
    width: 520px; flex: none; border: 3px solid rgba(255, 255, 255, 0.35);
    border-radius: 4px; overflow: hidden; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  }
  .schirm img { display: block; width: 100%; }
</style>
<div class="text">
  <h1>Einheiten-Erfassungsbogen</h1>
  <p>Für Feuerwehr, THW, Hilfsorganisationen und Katastrophenschutz: ausfüllen, im Papier&#8209;Layout drucken, per QR&#8209;Code weitergeben.</p>
  <ul><li>ohne Anmeldung</li><li>offline</li><li>kostenlos</li></ul>
  <div class="adresse">erfassungsbogen.app</div>
</div>
<div class="schirm"><img src="${schirmUrl}" alt=""></div>
`;

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await seite.setContent(karte);
await seite.evaluate(() => document.fonts.ready);
const bild = await seite.screenshot({ type: "jpeg", quality: 88 });
await writeFile(ZIEL, bild);
await browser.close();
console.log(`public/og-bild.jpg (1200×630, ${(bild.length / 1024).toFixed(1)} KiB)`);
