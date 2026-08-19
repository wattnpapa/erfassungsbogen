/**
 * Zieht den Basis-Stil der Content-Seiten auf die Handschrift der App nach.
 *
 * Die Seiten unter public/ tragen jeweils ihr eigenes `<style>`. Das ist so
 * gewollt (kein Build-Templating, jede Seite steht allein), führt aber dazu,
 * dass Werte, die in DESIGN.md geregelt sind, hier als Rohwerte auftauchen und
 * beim Anlegen einer neuen Seite mitkopiert werden. Dieses Skript zieht genau
 * die geregelten Werte nach — chirurgisch, ohne das Stylesheet umzubauen:
 *
 * - **Null-Radius-Regel:** `border-radius` ist überall 0. Der abgerundete Knopf
 *   war das einzige Bauteil dieser Seiten, das nach Consumer-App aussah statt
 *   nach Vordruck.
 * - **Rollen-Token statt Rohgrau:** #555 und #444 werden zu den Werten, die die
 *   App als `--text-2` (Zweittext) führt. Beide bestehen den Kontrast auf dem
 *   Seitengrund; der Gewinn ist, dass es künftig einen Wert gibt statt drei.
 *   Ebenso #1a1c22 als Fließtextfarbe: das ist `--text` (#11141b) der App.
 * - **Deckzeilen-Regel:** Ein Kasten, der sich abheben soll, bekommt die schwere
 *   4-px-Oberkante des gedruckten Formularabschnitts — nie einen farbigen
 *   Streifen an der linken Flanke. Der Seitenstreifen ist die Handschrift der
 *   Consumer-Oberflächen, die Deckzeile die des Vordrucks; sie steht in
 *   `--text`, weil die Kennfarbe dem Kopfbalken und der primären Aktion gehört.
 * - **Gewichts-Regel:** Überschriften tragen Gewicht und Größe, nie Farbe. h1
 *   und h2 standen in der Kennfarbe und h2 zusätzlich auf einer 2-px-Linie in
 *   der Kennfarbe — damit war das Blau auf jeder Seite dutzendfach vergeben und
 *   als Signal für Aktionen verbraucht. Jetzt tragen h1/h2/h3 `--text`, die
 *   h2-Unterlinie steht auf `1px solid var(--rand)`, und die Kennfarbe gehört
 *   allein dem Knopf `.start` und den Links.
 * - **Ein-Leiter-Regel:** Jeder Schriftgrad kommt aus `--t-xs` … `--t-2xl`
 *   (0.8125 / 0.875 / 1 / 1.125 / 1.375 / 1.75 rem). Die Seiten setzten elf
 *   eigene Grade zwischen 0.72 und 1.4 rem; Zwischenwerte wie 0.78 oder 0.92
 *   sehen im Einzelfall richtig aus und ergeben über eine Seite hinweg eine
 *   Leiter ohne Stufen.
 * - **Archivo, selbst gehostet:** Die Oberflächenschrift der App liegt in der
 *   App als Modul-Import (`@fontsource-variable/archivo`) und wird von Vite mit
 *   Hash nach dist/assets/ gebaut — diesen Dateinamen können die statischen
 *   Seiten nicht referenzieren. Deshalb liegt das Latin-Subset der variablen
 *   Schrift zusätzlich unter public/schrift/ mit stabilem Namen: eine Datei,
 *   34 KB, `font-display: swap` (der Text steht sofort in der Systemschrift und
 *   tauscht nach). Kein CDN — DESIGN.md verbietet das ausdrücklich, und es wäre
 *   ein Drittanbieter-Request auf Seiten, die genau damit werben, keinen zu
 *   haben.
 *
 * Aufruf (Node ≥ 22): npm run content-stil
 *
 * Idempotent: Ein bereits angeglichener Wert wird nicht erneut ersetzt; ein
 * zweiter Lauf meldet 0 geänderte Seiten.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

/**
 * `--text-2` der App (#5c6478, Aktenschrift-Grau). Ersetzt #555 und #444: Beide
 * waren als „etwas leiser als Fließtext“ gemeint und meinen dieselbe Rolle.
 */
const TEXT_2 = "#5c6478";

/** `--text` der App (#11141b, Tintenschwarz): Fließtext und Überschriften. */
const TEXT = "#11141b";

/**
 * Schriftgrad-Leiter der App. Jeder auf den Seiten vorgefundene Zwischenwert
 * wird auf die nächstgelegene tragende Stufe gelegt — Tabellen, Bildunterzeilen
 * und Fußzeile auf den Nebentext (0.875), Nav-Links und Markenhinweis auf das
 * Label-Maß (0.8125). h1/h2/h3 laufen separat über selektorgebundene Regeln,
 * weil 1rem dort auf 1.125rem steigt, anderswo aber ein gültiger Grad ist.
 */
const GRAD_ZUORDNUNG: Record<string, string> = {
  "0.72rem": "0.8125rem",
  "0.78rem": "0.8125rem",
  "0.8rem": "0.875rem",
  "0.82rem": "0.8125rem",
  "0.85rem": "0.875rem",
  "0.9rem": "0.875rem",
  "0.92rem": "0.875rem",
  "0.95rem": "0.875rem",
};

interface Regel {
  name: string;
  /** Nur Blöcke, deren Selektorliste hierauf passt (ohne: das ganze Stylesheet). */
  selektor?: RegExp;
  suchen: RegExp;
  ersetzen: string;
}

const REGELN: Regel[] = [
  {
    name: "Null-Radius",
    // Nur im <style>-Block relevant; im Markup kommt border-radius nicht vor.
    suchen: /border-radius:\s*(?!0\b)[0-9.]+(?:px|rem|em)/g,
    ersetzen: "border-radius: 0",
  },
  {
    // Deckzeilen-Regel (DESIGN.md). Betroffen waren fünf Hinweiskästen: die
    // Beispielmeldung auf staerkemeldung-feuerwehr.html und die `.hinweis`-
    // Kästen der drei Fachgruppen-Seiten und von open-source-datenschutz.html.
    // Alle trugen den Streifen an der linken Flanke — und dazu die Kennfarbe,
    // die damit ein zweites Mal neben dem Knopf stand.
    //
    // Die Schwelle liegt bei 2 px: Ein 1-px-Rand links ist ein Kastenrand, ab
    // 2 px ist es ein Streifen. Die Zielbreite ist immer 4 px, das ist das Maß
    // der Oberkante im Vordruck (`--kopf-kante`), nicht der halbierte
    // Ausgangswert.
    name: "Deckzeile statt Seitenstreifen",
    suchen: /border-left:\s*(?:[2-9]|[1-9]\d)px solid var\(--(?:blau|blau-hell|akzent)\)/g,
    ersetzen: "border-top: 4px solid var(--text)",
  },
  {
    name: "Zweittext statt #555",
    suchen: /color:\s*#555\b/g,
    ersetzen: `color: ${TEXT_2}`,
  },
  {
    name: "Zweittext statt #444",
    suchen: /color:\s*#444\b/g,
    ersetzen: `color: ${TEXT_2}`,
  },
  {
    name: "Textfarbe als Token",
    suchen: /--text:\s*#(?!11141b\b)[0-9a-f]{3,8}\b/gi,
    ersetzen: `--text: ${TEXT}`,
  },
  {
    name: "Fließtext auf --text",
    suchen: /color:\s*#1a1c22\b/g,
    ersetzen: "color: var(--text)",
  },
  {
    name: "Archivo vor dem Systemstapel",
    suchen: /font-family:\s*(?!"Archivo Variable")-apple-system,/g,
    ersetzen: 'font-family: "Archivo Variable", -apple-system,',
  },
  // Ein-Leiter-Regel: alle Grade außerhalb der Überschriften.
  ...Object.entries(GRAD_ZUORDNUNG).map(([alt, neu]) => ({
    name: `Schriftgrad ${alt} → ${neu}`,
    suchen: new RegExp(`font-size:\\s*${alt.replace(".", "\\.")}(?![0-9])`, "g"),
    ersetzen: `font-size: ${neu}`,
  })),
  {
    // Bildwiedergabe: `height: 260px; object-fit: cover` schnitt jedes Foto auf
    // ein festes Fenster zu. Bei 1280 px Viewport ist die Inhaltsspalte rund
    // 704 px breit — ein 960×635-Foto träfe darin auf 704×466 und wurde auf
    // 704×260 mittig beschnitten: vom Arzttruppwagen blieben Räder und
    // Kühlergrill. Für BOS-Einsatzkräfte ist das Foto keine Dekoration,
    // sondern Wiedererkennung („so ein Fahrzeug fahre ich“); ein angeschnittenes
    // Fahrzeug leistet das nicht.
    //
    // Statt einer geratenen `aspect-ratio` steht hier `height: auto`: die
    // Seitenverhältnisse unter public/bilder/ reichen von 16:9 (960×540) über
    // 4:3 bis zu einem Hochformat (960×1440), eine gemeinsame Kachelhöhe gibt
    // es nicht. Die `width`/`height`-Attribute im Markup bleiben unangetastet,
    // der Browser rechnet aus `width`/`height` weiterhin das Seitenverhältnis
    // aus und reserviert den Platz vor dem Laden — kein Layout-Shift.
    //
    // Zwei Deckelungen wurden gemessen und verworfen, beide scheitern an genau
    // dieser Reservierung oder an der Wiedererkennung:
    //
    // - `max-height` + `object-fit: contain` lässt die Box 672 px breit und
    //   stellt das eine Hochformat der Sammlung (960×1440) in einen 165 px
    //   breiten weißen Rahmen links und rechts.
    // - `width: auto` + `max-width: 100%` vermeidet den Rahmen, nimmt dem
    //   Browser aber die Grundlage für die Vorabreservierung: ein noch nicht
    //   geladenes Bild maß im Test 2×2 px, das Bild sprang beim Laden ins
    //   Layout.
    //
    // Deshalb bleibt es bei `width: 100%; height: auto` — dieselbe Rechnung,
    // die `figure img` ohnehin macht. Das Hochformat wird damit 1008 px hoch;
    // das ist viel, aber es zeigt das Fahrzeug, und darum geht es hier. Die
    // Regel bleibt als eigener Selektor stehen, damit die Zusicherung sichtbar
    // ist und eine neu angelegte Seite den alten Zuschnitt nicht wieder erbt.
    name: "Foto ohne Zuschnitt",
    // Der Guard prüft auf die Zielfassung selbst, nicht auf eine einzelne
    // Deklaration: Zwischenstände dieses Umbaus trugen `height: auto` bereits
    // und wären sonst stehengeblieben.
    suchen: /figure\.foto img \{(?= )(?! width: 100%; height: auto; \})[^}]*\}/g,
    ersetzen: "figure.foto img { width: 100%; height: auto; }",
  },
  {
    // Zeilenlänge: `figcaption` läuft über die volle Inhaltsspalte und kam
    // dabei auf rund 99 Zeichen je Zeile — beim Zurückspringen verliert das
    // Auge die Zeile. Die Spalte selbst bleibt, wie sie ist; begrenzt wird nur
    // dieser Textblock. Der Selektor ist an den Zeilenanfang gebunden, damit
    // `.laenderkarte figcaption` (eigene Regel, eigene Breite) nicht mitläuft.
    name: "Bildunterzeile auf lesbare Breite",
    suchen: /^([ \t]*)figcaption \{(?![^}]*max-width)/gm,
    ersetzen: "$1figcaption { max-width: 60ch;",
  },
  {
    // Display-Rolle: DESIGN.md nennt für die h1 ausdrücklich `text-wrap:
    // balance`. Auf 375 px brach die Überschrift in vier sehr ungleiche Zeilen
    // („Katastrophen- / schutz: Einheiten / erfassen und / melden“); balance
    // verteilt die Wörter gleichmäßig, ohne den Grad anzutasten.
    //
    // Ein `clamp()` zwischen zwei Leiterstufen (1.375 → 1.75 rem) wurde geprüft
    // und verworfen: Es liefert auf allen mittleren Breiten Grade, die nicht auf
    // der Leiter liegen (1.42, 1.58, 1.61 rem …). Die Startseite darf das, weil
    // sie genau eine h1 hat; hier wären es 36 Seiten, auf denen die h1 damit
    // dauerhaft neben der Leiter stünde. 1.75rem bleibt der geregelte Grad.
    name: "h1 mit ausgeglichenem Umbruch",
    suchen: /^([ \t]*)h1 \{(?![^}]*text-wrap)/gm,
    ersetzen: "$1h1 { text-wrap: balance;",
  },
  // Gewichts-Regel: Überschriften in Textfarbe, h2-Linie als feiner Rand.
  {
    name: "h1 ohne Kennfarbe",
    selektor: /^h1$/,
    suchen: /color:\s*var\(--blau\)/g,
    ersetzen: "color: var(--text)",
  },
  {
    name: "h1 auf --t-2xl",
    selektor: /^h1$/,
    suchen: /font-size:\s*(?!1\.75rem)[0-9.]+rem/g,
    ersetzen: "font-size: 1.75rem",
  },
  {
    name: "h2 ohne Kennfarbe",
    selektor: /^h2$/,
    suchen: /color:\s*var\(--blau\)/g,
    ersetzen: "color: var(--text)",
  },
  {
    name: "h2-Linie als feiner Rand",
    selektor: /^h2$/,
    suchen: /border-bottom:\s*2px solid var\(--blau\)/g,
    ersetzen: "border-bottom: 1px solid var(--rand)",
  },
  {
    name: "h2 auf --t-xl",
    selektor: /^h2$/,
    suchen: /font-size:\s*(?!1\.375rem)[0-9.]+rem/g,
    ersetzen: "font-size: 1.375rem",
  },
  {
    name: "h3 ohne Kennfarbe",
    selektor: /^h3$/,
    suchen: /color:\s*var\(--blau\)/g,
    ersetzen: "color: var(--text)",
  },
  {
    name: "h3 auf --t-l",
    selektor: /^h3$/,
    suchen: /font-size:\s*(?!1\.125rem)[0-9.]+rem/g,
    ersetzen: "font-size: 1.125rem",
  },
];

/**
 * `@font-face` für die selbst gehostete Schrift. Der unicode-range stammt aus
 * dem Latin-Subset von @fontsource-variable/archivo — ohne ihn zöge der Browser
 * die Datei auch für Zeichen heran, die sie gar nicht enthält.
 */
const SCHRIFT_REGEL = `    @font-face {
      font-family: "Archivo Variable";
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url("./schrift/archivo-latin-wght-normal.woff2") format("woff2-variations"),
           url("./schrift/archivo-latin-wght-normal.woff2") format("woff2");
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
`;

/** Das Farb-Token `--text` gehört neben die schon vorhandenen in `:root`. */
function tokenErgaenzen(css: string): { css: string; ergaenzt: number } {
  if (/--text:/.test(css)) return { css, ergaenzt: 0 };
  let ergaenzt = 0;
  const neu = css.replace(/(:root\s*\{[^}]*?)(\s*\})/, (_ganz, kopf: string, ende: string) => {
    ergaenzt = 1;
    return `${kopf} --text: ${TEXT};${ende}`;
  });
  return { css: neu, ergaenzt };
}

/** Die @font-face-Regel steht vor allem anderen, direkt über dem `:root`-Block. */
function schriftEinbinden(css: string): { css: string; ergaenzt: number } {
  if (css.includes("@font-face")) return { css, ergaenzt: 0 };
  let ergaenzt = 0;
  const neu = css.replace(/([ \t]*):root\s*\{/, (ganz, einzug: string) => {
    ergaenzt = 1;
    return `${SCHRIFT_REGEL}${einzug}${ganz.trimStart()}`;
  });
  return { css: neu, ergaenzt };
}

/**
 * Der Einzeiler `h2 { clear: both; }` ist ein Artefakt der Regex-Nachzieherei:
 * Er wurde neben die vorhandene h2-Regel gesetzt statt in sie hinein — mal
 * direkt darüber, auf den Länderseiten zehn Zeilen weiter unten. Zusammenlegen:
 * eine Regel je Selektor, sonst liest man die Größe an einer und die
 * Ausrichtung an anderer Stelle.
 */
function h2Zusammenlegen(css: string): { css: string; ergaenzt: number } {
  const einzeiler = /^[ \t]*h2\s*\{\s*clear:\s*both;?\s*\}[ \t]*\r?\n/m;
  if (!einzeiler.test(css)) return { css, ergaenzt: 0 };
  const ohneEinzeiler = css.replace(einzeiler, "");
  // Die verbliebene h2-Regel bekommt clear: both an den Anfang, falls es fehlt.
  const neu = ohneEinzeiler.replace(
    /^([ \t]*)h2\s*\{(?!\s*clear:)\s*/m,
    (_ganz, einzug: string) => `${einzug}h2 { clear: both; `,
  );
  return { css: neu, ergaenzt: 1 };
}

/** Wendet eine selektorgebundene Regel nur in den Blöcken an, deren Selektor passt. */
function inSelektorErsetzen(css: string, regel: Regel): { css: string; anzahl: number } {
  let anzahl = 0;
  // Innerste Blöcke: @media-Vorspann enthält „{“ und passt deshalb nie auf `[^{}]+`.
  const neu = css.replace(/([^{}]+)\{([^{}]*)\}/g, (ganz, selektor: string, rumpf: string) => {
    if (!regel.selektor!.test(selektor.trim())) return ganz;
    const treffer = (rumpf.match(regel.suchen) ?? []).length;
    if (!treffer) return ganz;
    anzahl += treffer;
    return `${selektor}{${rumpf.replace(regel.suchen, regel.ersetzen)}}`;
  });
  return { css: neu, anzahl };
}

/** Nur der <style>-Block wird angefasst — im Fließtext hat nichts davon etwas zu suchen. */
function stilAngleichen(html: string): { html: string; treffer: Record<string, number> } {
  const treffer: Record<string, number> = {};
  const neu = html.replace(/<style>([\s\S]*?)<\/style>/, (_ganz, css: string) => {
    let angepasst = css;

    const schrift = schriftEinbinden(angepasst);
    angepasst = schrift.css;
    if (schrift.ergaenzt) treffer["Archivo eingebunden"] = (treffer["Archivo eingebunden"] ?? 0) + 1;

    const h2 = h2Zusammenlegen(angepasst);
    angepasst = h2.css;
    if (h2.ergaenzt) treffer["h2-Doppelregel zusammengelegt"] = (treffer["h2-Doppelregel zusammengelegt"] ?? 0) + h2.ergaenzt;

    const token = tokenErgaenzen(angepasst);
    angepasst = token.css;
    if (token.ergaenzt) treffer["Token --text angelegt"] = (treffer["Token --text angelegt"] ?? 0) + 1;

    for (const regel of REGELN) {
      if (regel.selektor) {
        const { css: nachher, anzahl } = inSelektorErsetzen(angepasst, regel);
        if (anzahl) {
          treffer[regel.name] = (treffer[regel.name] ?? 0) + anzahl;
          angepasst = nachher;
        }
        continue;
      }
      const anzahl = (angepasst.match(regel.suchen) ?? []).length;
      if (anzahl) {
        treffer[regel.name] = (treffer[regel.name] ?? 0) + anzahl;
        angepasst = angepasst.replace(regel.suchen, regel.ersetzen);
      }
    }
    return `<style>${angepasst}</style>`;
  });
  return { html: neu, treffer };
}

function main(): void {
  const dateien = readdirSync(publicDir).filter((d) => d.endsWith(".html"));
  const gesamt: Record<string, number> = {};
  let geaendert = 0;

  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    const { html, treffer } = stilAngleichen(vorher);
    for (const [k, v] of Object.entries(treffer)) gesamt[k] = (gesamt[k] ?? 0) + v;
    if (html !== vorher) {
      writeFileSync(pfad, html, "utf8");
      geaendert++;
    }
  }

  console.log(`Basis-Stil angeglichen: ${geaendert}/${dateien.length} Seiten.`);
  for (const [name, anzahl] of Object.entries(gesamt)) console.log(`  ${name}: ${anzahl} Werte`);
}

main();
