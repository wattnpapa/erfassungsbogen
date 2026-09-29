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
 * - **Modus-Regel (Anzeigemodus der App):** Wer in der App „Nacht" gewählt hat
 *   und aus der Fußzeile die Anleitung öffnet, bekam eine weiße Seite — genau
 *   in der Situation, in der Hilfe gesucht wird, war die Nachtsicht weg. Die
 *   Seiten lesen deshalb dieselbe Wahl (localStorage `eeb.anzeigemodus.v1`,
 *   gleiche Herkunft wie die App) in einem kleinen Inline-Skript VOR dem
 *   ersten Malen und setzen die Klassen `dunkel-/feld-/nacht-modus` auf
 *   `<html>`; ohne gespeicherte Wahl zählt `prefers-color-scheme` (dunkel →
 *   Dunkel), wie in anzeige-modus.ts. Damit die Klassen etwas bewirken, werden
 *   die Rohwerte der Seiten zu Rollen-Token: `background: #fff` →
 *   `--flaeche`, `#5c6478` → `--text-2`, weiße Schrift auf der Kennfarbe →
 *   `--auf-blau`, die Tabellenköpfe und die Länderkarte → `--flaeche-2`.
 *   Ein Block am Ende des Stylesheets belegt die Token je Modus neu — mit den
 *   Werten aus index.html, damit App und Seiten dieselbe Nacht zeigen.
 *   Ausgenommen bleiben Bilder (`img`): Fotos, Screenshots und die
 *   Strichcodes der Handscanner-Einrichtung brauchen ihre weiße Unterlage —
 *   die Codes werden vom Bildschirm abgescannt.
 *   Inline statt externer Datei: Die Seiten tragen keine Content-Security-
 *   Policy (die der App setzt vite.config.ts nur in index.html), und ein
 *   externes Skript käme erst nach dem ersten Malen — genau das Aufblitzen
 *   der hellen Seite, das vermieden werden soll.
 *
 * Aufruf (Node ≥ 22): npm run content-stil
 *
 * Idempotent: Ein bereits angeglichener Wert wird nicht erneut ersetzt; ein
 * zweiter Lauf meldet 0 geänderte Seiten.
 */

import { readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
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
 * Rollen-Token, die jede Seite in `:root` führt (Modus-Regel). Werte der hellen
 * Belegung; die Modus-Blöcke unten belegen sie neu. `--flaeche-2` steht auf
 * dem Wert der App (--n-100) statt der drei Grautöne, die die Seiten für
 * Tabellenköpfe und Karte benutzten (#e6e8ee, #e7eaf3, #e8eaf2).
 */
const TOKEN: [name: string, wert: string][] = [
  ["--text", TEXT],
  ["--text-2", TEXT_2],
  ["--flaeche", "#fff"],
  ["--flaeche-2", "#e8ebf2"],
  ["--auf-blau", "#fff"],
];

/**
 * Anzeigemodus der App auf den Seiten. Das Skript läuft VOR dem ersten Malen
 * und setzt nur eine Klasse auf <html> — dieselbe Regel wie das Boot-Skript in
 * index.html und anzeigeModus() in anzeige-modus.ts: gespeicherte Wahl (auch
 * „standard“) geht vor, sonst zählt die Systemeinstellung.
 */
const THEMA_SKRIPT = `<!-- THEMA:JS:START -->
  <script>
    // Anzeigemodus der App (Dunkel/Feld/Nacht) VOR dem ersten Malen übernehmen:
    // gleiche Herkunft, gleicher Speicher, gleiche Regel wie in der App
    // (index.html, anzeige-modus.ts). Erzeugt von scripts/content-stil.mts.
    try {
      var eebModus = localStorage.getItem("eeb.anzeigemodus.v1")
        || (localStorage.getItem("eeb.feldmodus.v1") === "1" ? "feld" : "");
      if (!eebModus && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
        eebModus = "dunkel";
      if (eebModus === "feld" || eebModus === "nacht" || eebModus === "dunkel")
        document.documentElement.classList.add(eebModus + "-modus");
    } catch (e) { /* Privatmodus/blockierter Speicher: helle Darstellung */ }
  </script>
  <!-- THEMA:JS:END -->
`;

/**
 * Belegung der Token je Modus — Werte aus index.html (.feld-modus,
 * .dunkel-modus, .nacht-modus), damit die Anleitung dieselbe Nacht zeigt wie
 * die App. Steht am Ende des Stylesheets, damit die Selektor-Regeln darin
 * auch die Blöcke der anderen Generatoren (NAV:CSS, LAENDER:CSS, …) schlagen:
 * die schreiben ihre Rohwerte beim nächsten Lauf zurück, und dann trüge die
 * Kopfleiste im Dunkeln wieder Weiß — das Sicherheitsnetz fängt genau das.
 */
export const THEMA_CSS = `    /* THEMA:CSS:START */
    /* Anzeigemodus der App (Modus-Regel, scripts/content-stil.mts): Werte aus
       index.html. Feld: 112 % Schrift, harte Linien, schwarze Schrift. Dunkel
       und Nacht: dunkle Flächen, helle Schrift; nachts weicht die Kennfarbe
       Bernstein, damit kein sattes Blau die Dunkeladaption zerstört. */
    html.feld-modus { font-size: 112%; --grau: #e8eaef; --text: #000000; --text-2: #262b36; --rand: #111318; --flaeche-2: #dfe3ea; }
    html.dunkel-modus { color-scheme: dark; --grau: #0f1116; --flaeche: #171a21; --flaeche-2: #21252e; --text: #e7eaf1; --text-2: #aab2c2; --rand: #3a414f; --blau: #a8bdf2; --blau-hell: #c6d4f8; --auf-blau: #101a33; }
    html.nacht-modus { color-scheme: dark; --grau: #0d0c08; --flaeche: #17150f; --flaeche-2: #221f16; --text: #d9cdb6; --text-2: #a2977e; --rand: #423c2d; --blau: #a8791a; --blau-hell: #c9932c; --auf-blau: #100d07; }
    /* Sicherheitsnetz gegen die Rohwerte der anderen Generatoren (siehe oben). */
    html.dunkel-modus :is(.kopfnav, .kopfnav-unter, .hinweis, table, th, .themenliste li, .laenderliste a),
    html.nacht-modus :is(.kopfnav, .kopfnav-unter, .hinweis, table, th, .themenliste li, .laenderliste a) { background: var(--flaeche); }
    html.dunkel-modus :is(.kopfnav-links a, footer, figcaption, .fussnav-titel, .marken-hinweis, .sprungmenue-titel, .abschluss .zusicherung, .laenderliste .anzahl, h2#andere-bundeslaender, h2#andere-bundeslaender + p, .frage > summary::before, .aufklapp > summary::before),
    html.nacht-modus :is(.kopfnav-links a, footer, figcaption, .fussnav-titel, .marken-hinweis, .sprungmenue-titel, .abschluss .zusicherung, .laenderliste .anzahl, h2#andere-bundeslaender, h2#andere-bundeslaender + p, .frage > summary::before, .aufklapp > summary::before) { color: var(--text-2); }
    /* Der umrandete Knopf .start.papier steht auf der Fläche, nicht auf der
       Kennfarbe — er behält seine Schrift in var(--blau) (R2-L1). */
    html.dunkel-modus :is(.start:not(.papier), .sprunglink), html.nacht-modus :is(.start:not(.papier), .sprunglink) { color: var(--auf-blau); }
    /* Fotos und Bildschirmfotos sind nachts helle Flächen — gedimmt, aber
       erkennbar. Die Strichcodes (.scancodes) bleiben ungedimmt: sie werden
       vom Bildschirm abgescannt. */
    html.nacht-modus figure:not(.scancodes figure) img { filter: brightness(0.7); }
    /* THEMA:CSS:END */
`;

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
  /** Blöcke, deren Selektorliste hierauf passt, bleiben unangetastet. */
  ausser?: RegExp;
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
    // Nur in `:root`: Die Modus-Blöcke (THEMA:CSS) belegen `--text` bewusst
    // anders — hell in Dunkel/Nacht, #000000 im Feld. Ungebunden schrieb diese
    // Regel dort ebenfalls #11141b zurück; Überschriften und Fließtext standen
    // dann im Dunkeln bei 1,01:1 auf dem Grund (Audit Runde 2, R2-L1).
    name: "Textfarbe als Token",
    selektor: /^:root$/,
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
  // Modus-Regel: Rohwerte zu Rollen-Token, damit die Modus-Blöcke greifen.
  {
    // Nicht bei Bildern: Fotos, Screenshots und die Handscanner-Strichcodes
    // behalten ihre weiße Unterlage in jedem Modus.
    name: "Fläche statt #fff",
    ausser: /\bimg\b/,
    suchen: /background:\s*#fff\b/g,
    ersetzen: "background: var(--flaeche)",
  },
  {
    // Weiße Schrift steht auf den Seiten nur auf der Kennfarbe (.start,
    // .sprunglink) — nachts ist die Kennfarbe Bernstein und die Schrift dunkel.
    name: "Schrift auf der Kennfarbe als Token",
    suchen: /color:\s*#fff\b/g,
    ersetzen: "color: var(--auf-blau)",
  },
  {
    // Das Aufklapp-Vorzeichen behält den Rohwert: scripts/content-seiten.test.ts
    // prüft dort auf #5c6478 wörtlich; der Modus-Block oben belegt es per
    // Selektor neu.
    name: "Zweittext als Token",
    ausser: /summary::before/,
    suchen: /color:\s*#5c6478\b/g,
    ersetzen: "color: var(--text-2)",
  },
  {
    name: "Tabellenkopf auf --flaeche-2",
    suchen: /background:\s*#e(?:7eaf3|8eaf2)\b/g,
    ersetzen: "background: var(--flaeche-2)",
  },
  {
    name: "Länderkarte: Fläche als Token",
    suchen: /fill:\s*#fff\b/g,
    ersetzen: "fill: var(--flaeche)",
  },
  {
    name: "Länderkarte: Zweitfläche als Token",
    suchen: /fill:\s*#e6e8ee\b/g,
    ersetzen: "fill: var(--flaeche-2)",
  },
  {
    name: "Länderkarte: Linie als Token",
    suchen: /stroke:\s*#(?:9aa1b4|b3b9c8)\b/g,
    ersetzen: "stroke: var(--rand)",
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

/** Die Rollen-Token (TOKEN) gehören neben die schon vorhandenen in `:root`. */
function tokenErgaenzen(css: string): { css: string; ergaenzt: number } {
  let ergaenzt = 0;
  let neu = css;
  for (const [name, wert] of TOKEN) {
    if (new RegExp(`${name}:`).test(neu)) continue;
    neu = neu.replace(/(:root\s*\{[^}]*?)(\s*\})/, (_ganz, kopf: string, ende: string) => {
      ergaenzt++;
      return `${kopf} ${name}: ${wert};${ende}`;
    });
  }
  return { css: neu, ergaenzt };
}

/**
 * Modus-Block am Ende des Stylesheets — ersetzt eine ältere Fassung zwischen
 * den Marken, damit ein zweiter Lauf nichts verdoppelt.
 */
function themaCssEinbinden(css: string): { css: string; ergaenzt: number } {
  const muster = /[ \t]*\/\* THEMA:CSS:START \*\/[\s\S]*?\/\* THEMA:CSS:END \*\/\n?/;
  if (muster.test(css)) {
    const neu = css.replace(muster, THEMA_CSS);
    return { css: neu, ergaenzt: neu === css ? 0 : 1 };
  }
  return { css: `${css.replace(/\s*$/, "\n")}${THEMA_CSS}  `, ergaenzt: 1 };
}

/** Das Modus-Skript steht im <head> vor dem Stylesheet — vor dem ersten Malen. */
function themaSkriptEinbinden(html: string): { html: string; ergaenzt: number } {
  const muster = /<!-- THEMA:JS:START -->[\s\S]*?<!-- THEMA:JS:END -->\n?/;
  if (muster.test(html)) {
    const neu = html.replace(muster, THEMA_SKRIPT);
    return { html: neu, ergaenzt: neu === html ? 0 : 1 };
  }
  const neu = html.replace(/([ \t]*)<style>/, (ganz, einzug: string) => `${einzug}${THEMA_SKRIPT}${ganz}`);
  return { html: neu, ergaenzt: neu === html ? 0 : 1 };
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
    // Ohne den Kommentar davor: der gehört zum vorigen Block und enthält
    // Wörter wie „img“, die sonst die Ausnahme auslösten.
    const liste = selektor.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (regel.selektor && !regel.selektor.test(liste)) return ganz;
    if (regel.ausser?.test(liste)) return ganz;
    const treffer = (rumpf.match(regel.suchen) ?? []).length;
    if (!treffer) return ganz;
    anzahl += treffer;
    return `${selektor}{${rumpf.replace(regel.suchen, regel.ersetzen)}}`;
  });
  return { css: neu, anzahl };
}

/** Nur der <style>-Block wird angefasst — im Fließtext hat nichts davon etwas zu suchen. */
export function stilAngleichen(html: string): { html: string; treffer: Record<string, number> } {
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
    if (token.ergaenzt) treffer["Rollen-Token angelegt"] = (treffer["Rollen-Token angelegt"] ?? 0) + token.ergaenzt;

    for (const regel of REGELN) {
      if (regel.selektor || regel.ausser) {
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

    // Der Modus-Block kommt erst NACH den Regeln hinein und ersetzt eine ältere
    // Fassung vollständig: Er trägt die Werte aus index.html wörtlich, und
    // keine Angleich-Regel darf sie verändern. Vorher lief er durch die Regeln,
    // und „Textfarbe als Token“ machte aus dem hellen Text der dunklen Modi
    // Tintenschwarz (Audit Runde 2, R2-L1).
    const thema = themaCssEinbinden(angepasst);
    angepasst = thema.css;
    if (thema.ergaenzt) treffer["Modus-Block eingebunden"] = (treffer["Modus-Block eingebunden"] ?? 0) + 1;

    return `<style>${angepasst}</style>`;
  });
  const skript = themaSkriptEinbinden(neu);
  if (skript.ergaenzt) treffer["Modus-Skript eingebunden"] = (treffer["Modus-Skript eingebunden"] ?? 0) + 1;
  return { html: skript.html, treffer };
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

// Direkt aufgerufen (npm run content-stil): Seiten schreiben. Als Modul
// importiert — von scripts/content-stil.test.ts — passiert hier nichts.
if (process.argv[1] && import.meta.filename === realpathSync(process.argv[1])) main();
