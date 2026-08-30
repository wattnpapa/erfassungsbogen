/**
 * Erzeugt zu jedem Foto und Bildschirmfoto unter public/bilder und
 * public/screenshots eine WebP-Fassung und hängt sie als `<source>` vor das
 * bestehende `<img>`.
 *
 * Warum: Die Content-Seiten sind mit 12–23 KB HTML sehr leicht, schleppen aber
 * knapp 5 MB Bildmaterial als JPEG und PNG mit — auf Seiten mit vier Fotos rund
 * 800 KB. Die Zielgruppe ruft diese Seiten im Zweifel im Mobilfunknetz auf.
 * WebP spart bei gleicher Qualität grob zwei Drittel.
 *
 * Das `<img>` bleibt unverändert als Fallback stehen: `<picture>` ist seit
 * Jahren überall verfügbar, aber ein Browser ohne WebP-Unterstützung soll das
 * Foto trotzdem bekommen — und das Markup bleibt ohne JavaScript gültig.
 *
 * Aufruf (Node ≥ 22, cwebp muss installiert sein): npm run bilder-webp
 *
 * Idempotent: Bereits umgewandelte Bilder werden übersprungen (es sei denn, die
 * Quelle ist neuer), bereits umgebaute `<img>` nicht erneut verpackt.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

/** Verzeichnisse mit umzuwandelnden Bildern, relativ zu public/. */
const BILD_ORDNER = ["bilder", "screenshots"];

/**
 * Qualität 82 ist der übliche Kompromiss für Fotos: unterhalb davon werden
 * Uniformen und Warnfarben sichtbar fleckig, oberhalb wächst die Datei ohne
 * erkennbaren Gewinn. Bildschirmfotos laufen verlustfrei (-lossless), weil
 * Schrift und harte Kanten sonst ausfransen — genau das, was auf einem
 * Bildschirmfoto gezeigt werden soll.
 */
const FOTO_QUALITAET = "82";

function istFoto(datei: string): boolean {
  return /\.(jpe?g)$/i.test(datei);
}

function istPng(datei: string): boolean {
  return /\.png$/i.test(datei);
}

function webpPfad(datei: string): string {
  return datei.replace(/\.(jpe?g|png)$/i, ".webp");
}

/** Wandelt ein Bild um, sofern noch keine aktuelle WebP-Fassung existiert. */
function umwandeln(ordner: string, datei: string): "neu" | "aktuell" {
  const quelle = join(publicDir, ordner, datei);
  const ziel = join(publicDir, ordner, webpPfad(datei));
  if (existsSync(ziel) && statSync(ziel).mtimeMs >= statSync(quelle).mtimeMs) return "aktuell";

  const argumente = istPng(datei)
    ? ["-lossless", "-quiet", quelle, "-o", ziel]
    : ["-q", FOTO_QUALITAET, "-quiet", quelle, "-o", ziel];
  execFileSync("cwebp", argumente);
  return "neu";
}

/**
 * Verpackt ein `<img src="./bilder/x.jpg" …>` in ein `<picture>` mit
 * vorangestellter WebP-Quelle. Bereits verpackte Bilder erkennt die Funktion am
 * öffnenden `<picture>` davor — **einschließlich der `<source>`-Zeile**, die
 * dieses Skript selbst dazwischensetzt. Ohne sie im Muster griff die Erkennung
 * nie: Jeder Lauf legte eine weitere `<picture>`-Schicht um dasselbe Bild, und
 * nach fünf Läufen stand jedes Foto in fünf verschachtelten `<picture>`. Der
 * Zähler blieb dabei unauffällig, weil er verpackte Bilder zählt, nicht neue.
 */
function verpacken(html: string): { html: string; anzahl: number } {
  let anzahl = 0;
  const neu = html.replace(
    /(<picture>\s*(?:<source\b[^>]*>\s*)?)?<img\b([^>]*?)src="\.\/((?:bilder|screenshots)\/[^"]+\.(?:jpe?g|png))"([^>]*?)>/gi,
    (treffer, schonVerpackt: string | undefined, vor: string, pfad: string, nach: string) => {
      if (schonVerpackt) return treffer;
      anzahl++;
      const einrueckung = " ".repeat(6);
      return [
        "<picture>",
        `${einrueckung}<source srcset="./${webpPfad(pfad)}" type="image/webp">`,
        `${einrueckung}<img${vor}src="./${pfad}"${nach}>`,
        `${einrueckung.slice(2)}</picture>`,
      ].join(`\n${einrueckung}`);
    },
  );
  return { html: neu, anzahl };
}

function main(): void {
  let neu = 0;
  let gesamtVorher = 0;
  let gesamtNachher = 0;

  for (const ordner of BILD_ORDNER) {
    const pfad = join(publicDir, ordner);
    if (!existsSync(pfad)) continue;
    for (const datei of readdirSync(pfad)) {
      if (!istFoto(datei) && !istPng(datei)) continue;
      if (umwandeln(ordner, datei) === "neu") neu++;
      gesamtVorher += statSync(join(pfad, datei)).size;
      gesamtNachher += statSync(join(pfad, webpPfad(datei))).size;
    }
  }

  let seiten = 0;
  let bilder = 0;
  for (const datei of readdirSync(publicDir).filter((d) => d.endsWith(".html"))) {
    const p = join(publicDir, datei);
    const vorher = readFileSync(p, "utf8");
    const { html, anzahl } = verpacken(vorher);
    if (html !== vorher) {
      writeFileSync(p, html, "utf8");
      seiten++;
      bilder += anzahl;
    }
  }

  const mb = (n: number) => (n / 1024 / 1024).toFixed(2);
  const ersparnis = Math.round((1 - gesamtNachher / gesamtVorher) * 100);
  console.log(`WebP erzeugt: ${neu} neu.`);
  console.log(`Bildgewicht: ${mb(gesamtVorher)} MB → ${mb(gesamtNachher)} MB (−${ersparnis} %).`);
  console.log(`Markup umgebaut: ${bilder} Bilder auf ${seiten} Seiten.`);
}

main();
