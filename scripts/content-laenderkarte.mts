/**
 * Setzt die anklickbare Deutschlandkarte auf die Katastrophenschutz-Seiten:
 * auf die Übersicht, auf die KatS-Startseite und auf jede der zwölf
 * Länderseiten — dort mit dem eigenen Land hervorgehoben.
 *
 * Warum ein Skript: public/*.html sind eigenständige Dateien ohne Templating
 * (siehe content-nav.mts). Die Karte wiegt rund 18 kB Pfaddaten; sie in
 * vierzehn Seiten von Hand zu pflegen, hieße jede Korrektur vierzehnmal
 * abzutippen. Kommt eine dreizehnte Länderseite dazu, genügt hier ein Eintrag
 * in LAENDER und ein Lauf — die neue Fläche wird auf allen Seiten vom Grau der
 * Länder ohne Seite zum Link.
 *
 * Aufruf (Node ≥ 22): npm run content-laenderkarte
 *
 * Wie content-nav.mts arbeitet das Skript über markierte Blöcke
 * (`<!-- KARTE:START -->` … `<!-- KARTE:END -->` im Text, dazu
 * `<!-- KARTE:CSS:START -->` … `<!-- KARTE:CSS:END -->` im <style>) und ersetzt
 * beim zweiten Lauf, statt zu verdoppeln.
 *
 * Die Geometrie entsteht bei jedem Lauf neu aus scripts/quellen/
 * karte-bundeslaender.svg (Wikimedia Commons, CC BY-SA 2.0 DE, siehe
 * Bildunterschrift im erzeugten Block). Die Originaldatei zeichnet jede
 * Landesgrenze auf wenige Hundertstel genau und wiegt 105 kB — bei 22 rem
 * Anzeigebreite ist davon nichts zu sehen. Darum werden die Umrisse hier mit
 * Douglas-Peucker vereinfacht und Inselchen unterhalb einer Mindestfläche
 * weggelassen; übrig bleiben rund 18 kB. Wer schärfere Umrisse will, dreht
 * TOLERANZ herunter — die Seiten wachsen dann entsprechend.
 *
 * Bewusst ohne JavaScript zur Laufzeit: Die Karte ist reines SVG mit <a>, sie
 * funktioniert offline, ohne Skript und im Ausdruck (gleiche Prämisse wie der
 * Rest der App). Für Tastatur und Screenreader ist sie ausgeblendet — jede
 * Seite trägt dieselben Ziele daneben als Text (Liste, Tabelle oder Absatz),
 * und ein zweiter, stummer Durchlauf durch zwölf Links wäre dort nur Ballast.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");
const quelle = join(wurzel, "scripts", "quellen", "karte-bundeslaender.svg");

/** Abstand in Einheiten der Zeichenfläche (592 × 801), ab dem ein Punkt bleibt. */
const TOLERANZ = 1.2;
/** Inseln unterhalb dieser Fläche entfallen — sonst blieben Halligen als Pixel. */
const MIN_FLAECHE = 10;

/**
 * Die zwölf Länder mit eigener Seite, alphabetisch wie im Untermenü der
 * Kopfnavigation. Der Name muss der id des Pfades in der Quelldatei
 * entsprechen; die vier übrigen Länder bleiben ohne Link.
 */
const LAENDER: { datei: string; name: string }[] = [
  { datei: "katastrophenschutz-baden-wuerttemberg.html", name: "Baden-Württemberg" },
  { datei: "katastrophenschutz-bayern.html", name: "Bayern" },
  { datei: "katastrophenschutz-berlin.html", name: "Berlin" },
  { datei: "katastrophenschutz-brandenburg.html", name: "Brandenburg" },
  { datei: "katastrophenschutz-hessen.html", name: "Hessen" },
  { datei: "katastrophenschutz-mecklenburg-vorpommern.html", name: "Mecklenburg-Vorpommern" },
  { datei: "katastrophenschutz-niedersachsen.html", name: "Niedersachsen" },
  { datei: "katastrophenschutz-nordrhein-westfalen.html", name: "Nordrhein-Westfalen" },
  { datei: "katastrophenschutz-rheinland-pfalz.html", name: "Rheinland-Pfalz" },
  { datei: "katastrophenschutz-saarland.html", name: "Saarland" },
  { datei: "katastrophenschutz-sachsen.html", name: "Sachsen" },
  { datei: "katastrophenschutz-thueringen.html", name: "Thüringen" },
];

const CSS_MUSTER = /\n?\s*\/\* KARTE:CSS:START \*\/[\s\S]*?\/\* KARTE:CSS:END \*\//;
const BLOCK_MUSTER = /\n?[^\S\n]*<!-- KARTE:START -->[\s\S]*?<!-- KARTE:END -->/;
/** Die zuerst von Hand eingesetzte Fassung — beim ersten Lauf übernimmt der Block ihren Platz. */
const ALT_MUSTER = /\n?[^\S\n]*<!-- Die Umrisse stammen[\s\S]*?<\/figure>/;
const ALT_CSS_MUSTER = /\n?[^\S\n]*\/\* Dieselben Ziele wie die (?:Länderliste|Tabelle)[\s\S]*?\.laenderkarte figcaption \{[^}]*\}/;

type Punkt = [number, number];

/** Zerlegt ein d-Attribut in geschlossene Linienzüge (die Quelle kennt nur Geraden). */
function pfadPunkte(d: string): Punkt[][] {
  const teile = d.match(/[MLHVmlhvzZ]|-?\d*\.?\d+/g) ?? [];
  const zuege: Punkt[][] = [];
  let zug: Punkt[] = [];
  let befehl = "";
  let x = 0;
  let y = 0;
  let i = 0;
  const zahl = () => Number(teile[i++]);
  while (i < teile.length) {
    const t = teile[i];
    if (/^[MLHVmlhvzZ]$/.test(t)) {
      befehl = t;
      i++;
      if (befehl === "z" || befehl === "Z") {
        if (zug.length) zuege.push(zug);
        zug = [];
      }
      continue;
    }
    switch (befehl) {
      case "M":
      case "m": {
        if (zug.length) zuege.push(zug);
        const [a, b] = [zahl(), zahl()];
        x = befehl === "M" ? a : x + a;
        y = befehl === "M" ? b : y + b;
        zug = [[x, y]];
        // Weitere Zahlenpaare nach einem M sind Linien, nicht neue Anfänge.
        befehl = befehl === "M" ? "L" : "l";
        break;
      }
      case "L":
      case "l": {
        const [a, b] = [zahl(), zahl()];
        x = befehl === "L" ? a : x + a;
        y = befehl === "L" ? b : y + b;
        zug.push([x, y]);
        break;
      }
      case "H":
      case "h": {
        const a = zahl();
        x = befehl === "H" ? a : x + a;
        zug.push([x, y]);
        break;
      }
      case "V":
      case "v": {
        const a = zahl();
        y = befehl === "V" ? a : y + a;
        zug.push([x, y]);
        break;
      }
      default:
        throw new Error(`Unerwarteter Pfadbefehl: ${befehl}`);
    }
  }
  if (zug.length) zuege.push(zug);
  return zuege;
}

/** Douglas-Peucker: behält nur Punkte, die weiter als toleranz von der Sehne abweichen. */
function vereinfachen(punkte: Punkt[], toleranz: number): Punkt[] {
  if (punkte.length < 3) return punkte;
  const [x1, y1] = punkte[0];
  const [x2, y2] = punkte[punkte.length - 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const laenge = Math.hypot(dx, dy);
  let maximum = 0;
  let index = 0;
  for (let i = 1; i < punkte.length - 1; i++) {
    const [px, py] = punkte[i];
    const abstand = laenge === 0
      ? Math.hypot(px - x1, py - y1)
      : Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / laenge;
    if (abstand > maximum) {
      maximum = abstand;
      index = i;
    }
  }
  if (maximum <= toleranz) return [punkte[0], punkte[punkte.length - 1]];
  const links = vereinfachen(punkte.slice(0, index + 1), toleranz);
  const rechts = vereinfachen(punkte.slice(index), toleranz);
  return [...links.slice(0, -1), ...rechts];
}

function flaeche(punkte: Punkt[]): number {
  let summe = 0;
  for (let i = 0; i < punkte.length; i++) {
    const [x1, y1] = punkte[i];
    const [x2, y2] = punkte[(i + 1) % punkte.length];
    summe += x1 * y2 - x2 * y1;
  }
  return Math.abs(summe) / 2;
}

const rund = (v: number): string => String(Math.round(v * 10) / 10);

/** Liest die Quellkarte und liefert je Land ein vereinfachtes d-Attribut. */
function umrisse(): Map<string, string> {
  const svg = readFileSync(quelle, "utf8");
  const karte = new Map<string, string>();
  for (const treffer of svg.matchAll(/<path\s+id="([^"]+)"[^>]*?\sd="([^"]*)"/g)) {
    const [, name, d] = treffer;
    const teile: string[] = [];
    for (let zug of pfadPunkte(d)) {
      const [ex, ey] = zug[zug.length - 1];
      const [ax, ay] = zug[0];
      if (zug.length > 1 && ex === ax && ey === ay) zug = zug.slice(0, -1);
      if (flaeche(zug) < MIN_FLAECHE) continue;
      const einfach = vereinfachen([...zug, zug[0]], TOLERANZ).slice(0, -1);
      if (einfach.length < 3) continue;
      let [px, py] = einfach[0];
      let stueck = `M${rund(px)} ${rund(py)}`;
      for (const [x, y] of einfach.slice(1)) {
        stueck += `l${rund(x - px)} ${rund(y - py)}`;
        px = x;
        py = y;
      }
      teile.push(`${stueck}z`);
    }
    karte.set(name, teile.join("").replace(/\s+-/g, "-"));
  }
  if (karte.size !== 16) throw new Error(`16 Länder erwartet, ${karte.size} gefunden`);
  return karte;
}

const cssBlock = `
/* KARTE:CSS:START */
    /* Dieselben Ziele wie der Text daneben, nur räumlich — darum ist das SVG
       für Tastatur und Screenreader ausgeblendet. Weiß und anklickbar sind die
       Länder mit eigener Seite, schraffiert die ohne, blau das Land dieser Seite.

       Warum Schraffur statt Grau: #e6e8ee gegen #fff auf dem Grund #f2f3f7 sind
       drei fast gleiche Helligkeiten — der Unterschied zwischen „führt irgendwo
       hin" und „führt nirgendwo hin" hing an rund 4 % Helligkeit, und die
       Semantik war verkehrt herum: Das *nicht* Eingefärbte war das Klickbare.
       Die Schraffur trennt die beiden Zustände nach Struktur statt nach
       Helligkeit; sie funktioniert damit auch bei Farbenblindheit, im
       Schwarzweißdruck und auf einem Bildschirm im Sonnenlicht. Eine neue Farbe
       kommt nicht in Frage: Die Kennfarbe gehört Kopf und Aktion, und die
       Hervorhebung des aktuellen Landes ist der eine dokumentierte Sonderfall,
       der nicht ausgeweitet wird. */
    .laenderkarte { margin: 1rem 0 0; }
    .laenderkarte svg { display: block; width: 100%; max-width: 22rem; height: auto; margin: 0 auto; }
    /* Der Zeiger bleibt der Standardpfeil: Eine Fläche, die wie ein Ziel
       aussieht und auf den Klick nicht reagiert, ist schlimmer als eine, die
       gar nicht erst danach aussieht. */
    .laenderkarte path { fill: #e6e8ee; stroke: var(--rand); stroke-width: 1.4; stroke-linejoin: round; cursor: default; }
    /* Stärkere Kante zusätzlich zur weißen Fläche: Die anklickbaren Länder
       stehen damit nicht nur heller, sondern auch fester im Bild. */
    .laenderkarte a path { fill: #fff; stroke: #9aa1b4; stroke-width: 1.6; cursor: pointer; }
    .laenderkarte a:hover path { fill: var(--blau-hell); stroke: var(--blau); }
    .laenderkarte .hier { fill: var(--blau); stroke: var(--blau); }
    .laenderkarte .ohne-seite { fill: url(#karte-ohne-seite); stroke: #b3b9c8; stroke-width: 1.2; }
    /* Grad aus der Leiter (--t-s = 0.875rem), nicht 0.8rem: content-stil.mts
       zieht jeden Zwischenwert ohnehin auf die nächste tragende Stufe. Stünde
       hier der Zwischenwert, machte ein Lauf dieses Skripts die Angleichung
       wieder rückgängig — die Generatoren müssen in beliebiger Reihenfolge
       laufen können. */
    .laenderkarte figcaption { font-size: 0.875rem; color: #5c6478; margin-top: 0.6rem; }
/* KARTE:CSS:END */`;

function karteHtml(datei: string, formen: Map<string, string>): string {
  const hier = LAENDER.find((l) => l.datei === datei);
  const flaechen = [...formen].map(([name, d]) => {
    const land = LAENDER.find((l) => l.name === name);
    if (land && land.datei === datei) {
      return `        <path class="hier" d="${d}"><title>${name} — diese Seite</title></path>`;
    }
    if (land) {
      // href und xlink:href doppelt: Ältere WebViews auf Einsatz-Tablets kennen
      // den SVG-2-Anker noch nicht und folgen nur der xlink-Form.
      //
      // tabindex="-1" nimmt die Fläche aus der Tabreihenfolge — zwingend, weil
      // das <svg> aria-hidden trägt: Ein fokussierbares Element in einem
      // aria-hidden-Teilbaum landet zwar im Tabstopp, wird der Vorlesesoftware
      // aber verschwiegen (WCAG 4.1.2). Man tabbt dann auf „nichts“.
      // Die Karte bleibt damit bewusst Maus-und-Finger-Bedienung; unmittelbar
      // darunter steht dieselbe Auswahl als Textliste, und die ist mit der
      // Tastatur ohnehin die bessere: dreizehn gleich aussehende Umrisse
      // nacheinander abzutabben sagt niemandem, wo er gerade ist.
      return `        <a href="./${land.datei}" xlink:href="./${land.datei}" tabindex="-1"><title>${name}</title><path d="${d}"/></a>`;
    }
    return `        <path class="ohne-seite" d="${d}"><title>${name} — noch keine Seite</title></path>`;
  });
  const einleitung = hier
    ? `Karte zum Anklicken: Hervorgehoben ist ${hier.name}, die weißen Länder
        führen auf ihre Seite, schraffierte haben noch keine.`
    : `Karte zum Anklicken: Ein weißes Land führt auf seine Seite, schraffierte
        Länder haben noch keine.`;
  return `
    <!-- KARTE:START -->
    <figure class="laenderkarte">
      <svg viewBox="0 0 592 801" width="592" height="801" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <!-- Schraffur für Länder ohne eigene Seite: ein Strukturunterschied
               statt eines vierten Grautons, siehe .ohne-seite im CSS-Block. -->
          <pattern id="karte-ohne-seite" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#e6e8ee"/>
            <line x1="0" y1="0" x2="0" y2="7" stroke="#a8afc0" stroke-width="2.4"/>
          </pattern>
        </defs>
${flaechen.join("\n")}
      </svg>
      <figcaption>
        ${einleitung}
        Kartengrundlage: „Karte Bundesrepublik Deutschland“ von David Liuzzo nach
        Daten der statistischen Ämter des Bundes und der Länder,
        <a href="https://commons.wikimedia.org/wiki/File:Karte_Bundesrepublik_Deutschland.svg">Wikimedia Commons</a>
        (CC BY-SA 2.0 DE), Umrisse vereinfacht.
      </figcaption>
    </figure>
    <!-- KARTE:END -->`;
}

/**
 * Setzt den Block an seinen Platz: auf der Übersicht vor die Länderliste, auf
 * der KatS-Seite vor die Tabelle der Landesvorlagen, auf einer Länderseite hinter
 * den Absatz zu den anderen Bundesländern — überall dort, wo der Text neben der
 * Karte dieselben Ziele nennt.
 */
function einsetzen(inhalt: string, datei: string, block: string): string {
  if (BLOCK_MUSTER.test(inhalt)) return inhalt.replace(BLOCK_MUSTER, block);
  if (ALT_MUSTER.test(inhalt)) return inhalt.replace(ALT_MUSTER, block);
  if (datei === "uebersicht.html") {
    return inhalt.replace(/\n(\s*)<ul class="laenderliste">/, `${block}\n\n$1<ul class="laenderliste">`);
  }
  if (datei === "katastrophenschutz.html") {
    // Ohne `>` am Ende: content-rollbereich.mts hängt an denselben Rahmen noch
    // tabindex, role und aria-label — das Muster darf daran nicht scheitern.
    return inhalt.replace(/\n(\s*)(<div class="tabellenrahmen")/, `${block}\n\n$1$2`);
  }
  if (/<!-- LAENDER:END -->/.test(inhalt)) {
    return inhalt.replace(/<!-- LAENDER:END -->/, `<!-- LAENDER:END -->\n${block}`);
  }
  throw new Error(`Kein Platz für die Karte gefunden: ${datei}`);
}

function cssEinsetzen(inhalt: string): string {
  if (CSS_MUSTER.test(inhalt)) return inhalt.replace(CSS_MUSTER, cssBlock);
  if (ALT_CSS_MUSTER.test(inhalt)) return inhalt.replace(ALT_CSS_MUSTER, cssBlock);
  // Vor den Nav-Block, damit die handgeschriebenen Regeln der Seite zusammenbleiben.
  if (/\/\* NAV:CSS:START \*\//.test(inhalt)) {
    return inhalt.replace(/\n?\/\* NAV:CSS:START \*\//, `${cssBlock}\n/* NAV:CSS:START */`);
  }
  return inhalt.replace(/\n(\s*)<\/style>/, `${cssBlock}\n$1</style>`);
}

function main(): void {
  const formen = umrisse();
  const seiten = ["uebersicht.html", "katastrophenschutz.html", ...LAENDER.map((l) => l.datei)];
  const vorhanden = new Set(readdirSync(publicDir));

  let geaendert = 0;
  for (const datei of seiten) {
    if (!vorhanden.has(datei)) {
      console.warn(`Seite fehlt, übersprungen: ${datei}`);
      continue;
    }
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    const nachher = einsetzen(cssEinsetzen(vorher), datei, karteHtml(datei, formen));
    if (nachher !== vorher) {
      writeFileSync(pfad, nachher, "utf8");
      geaendert++;
    }
  }
  console.log(`Länderkarte aktualisiert: ${geaendert}/${seiten.length} Seiten.`);
}

main();
