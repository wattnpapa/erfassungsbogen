/**
 * Stilregeln aus Runde 4 des Audits, Paket 3 („Layout, 200 % Schrift, Touch,
 * Sicht"), die nur im Stylesheet (index.html) leben. jsdom rechnet keine
 * Kaskade und kein Layout, deshalb prüft der Test den Quelltext — wie
 * stilregeln-r3.test.ts. Die Messwerte (Positionen, Höhen, Kontraste) stehen
 * im Bericht unter „Stand der Behebung"; hier hängen die Regeln, an denen sie
 * hängen, damit eine spätere Aufräumrunde sie nicht still zurücknimmt.
 */

import { readFileSync } from "node:fs";
import { TASTATUR_KLASSE } from "./tastatur";
import { describe, expect, it } from "vitest";
import { ANZEIGE_MODI } from "./anzeige-modus";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
// Kommentare raus, sonst zählen Begründungen als Regeln.
const css = html.replace(/\/\*[\s\S]*?\*\//g, "");

const glatt = (t: string) => t.replace(/\s+/g, " ").trim();

/** Alle Deklarationsblöcke, deren Selektorliste genau `selektor` ist (Leerraum egal). */
export function bloecke(selektor: string): string[] {
  const treffer: string[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(css); m; m = re.exec(css)) {
    if (glatt(m[1]!) === glatt(selektor)) treffer.push(m[2]!);
  }
  return treffer;
}

describe("Fußleiste des Assistenten: Raster mit festen Plätzen (R4-M2, R4-M3, R4-G2)", () => {
  const leiste = () => bloecke("footer.nav.assistent-nav").join("\n");

  it("ist ein Raster mit vier Spalten und bricht nie um", () => {
    expect(leiste()).toMatch(/display:\s*grid/);
    expect(leiste()).toMatch(/grid-template-columns:\s*auto auto minmax\(0, 1fr\) minmax\(0, auto\)/);
    expect(leiste()).not.toMatch(/flex-wrap/);
  });

  it("legt den Primärknopf in jedem Schritt an dieselbe Stelle rechts außen", () => {
    expect(bloecke("footer.nav.assistent-nav > .primaer").join("\n")).toMatch(/justify-self:\s*end/);
    expect(bloecke("footer.nav.assistent-nav > .primaer").join("\n")).toMatch(/grid-area:\s*weiter/);
  });

  it("hält die Erfassungsleiste auf zwei Zeilen: Abschluss oben, darunter dieselbe Ordnung", () => {
    const b = bloecke("footer.nav.assistent-nav.mit-uebernehmen").join("\n");
    expect(b).toMatch(/grid-template-areas:\s*"mitte mitte mitte mitte" "zurueck modus leer weiter"/);
  });

  it("kürzt „Zurück“ per Container-Abfrage auf die Breite der Leiste, nicht per Media Query in rem", () => {
    // Media Queries rechnen rem mit der Browser-Grundschrift (16 px) und sehen
    // weder den Feld-Modus (112 %) noch 200 % Systemschrift.
    expect(css).toMatch(/@container assistent-nav \(max-width: 25rem\)\s*\{\s*\.nav-wort\s*\{\s*display:\s*none/);
    expect(css).not.toMatch(/@media \(max-width: 22\.4rem\)\s*\{\s*footer\.nav \.nav-wort/);
    expect(leiste()).toMatch(/container:\s*assistent-nav \/ inline-size/);
  });

  it("deckelt „◐“ in Maß und Schrift wie die anderen Leistenknöpfe", () => {
    const b = bloecke("footer.nav .anzeige-leiste-knopf").join("\n");
    expect(b).toMatch(/min-width:\s*min\([^;]*44px/);
    expect(b).toMatch(/font-size:\s*min\(var\(--t-l\),\s*20px\)/);
    expect(b).not.toMatch(/min-width:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\);/);
  });

  it("lässt zwischen den Knöpfen mindestens 12 px (R4-G4)", () => {
    expect(leiste()).toMatch(/column-gap:\s*max\(12px,/);
  });

  it("deckelt den Abschluss „In Einsatz übernehmen“ und die Reserve unter dem Inhalt", () => {
    expect(css).toMatch(/footer\.nav\.mit-uebernehmen \.uebernehmen\s*\{[^}]*min-height:\s*min\([^;]*44px/);
    expect(css).toMatch(/main\.mit-uebernehmen\s*\{\s*padding-bottom:\s*calc\(min\(10rem, 160px\)/);
    expect(bloecke("main").join("\n")).toMatch(/min\(6rem, 108px\)/);
  });

  it("deckelt die Bedienelemente des Kopfes bei großer Schrift (Container „kopf“)", () => {
    expect(css).toMatch(/@container kopf \(max-width: 17\.5rem\)[\s\S]*?\.seiten-kopf\.assistent-kopf \.schritte button\s*\{[^}]*min\(var\(--t-s\), 18px\)/);
  });
});

describe("Überschriften und Fußzeilen-Links brechen im Wort (R4-M1)", () => {
  it("h1–h5 und summary tragen overflow-wrap: anywhere", () => {
    const b = bloecke("h1, h2, h3, h4, h5, summary").join("\n");
    expect(b).toMatch(/overflow-wrap:\s*anywhere/);
    expect(b).toMatch(/hyphens:\s*auto/);
  });

  it("Links der Fußzeile (nachrichtenvordruck.app) dürfen die Breite nicht sprengen", () => {
    const b = bloecke("footer.seite a, footer.seite button.link").join("\n");
    expect(b).toMatch(/max-width:\s*100%/);
    expect(b).toMatch(/overflow-wrap:\s*anywhere/);
  });
});

describe("Daumen-Quittung und Rückfragen bei großer Schrift (R4-M1)", () => {
  it("die Quittung deckelt ihre Schrift, darf umbrechen und hält „Rückgängig“ und „✕“ als Paar zusammen", () => {
    const b = bloecke(".quittung-daumen").join("\n");
    expect(b).toMatch(/flex-wrap:\s*wrap/);
    expect(b).toMatch(/font-size:\s*min\(var\(--t-s\),\s*18px\)/);
    expect(bloecke(".quittung-daumen > .quittung-knoepfe").join("\n")).toMatch(/gap:\s*max\(var\(--r-3\),\s*12px\)/);
    expect(bloecke(".quittung-daumen > .quittung-text").join("\n")).toMatch(/min-width:\s*min\(5\.5em,\s*100%\)/);
  });

  it("Dialoge nehmen Rand und Polster nicht mit der Schrift mit und überschreiben den Rand 2em des Browsers", () => {
    const b = bloecke("dialog").join("\n");
    expect(b).toMatch(/width:\s*min\(34rem, calc\(100vw - min\(2rem, 32px\)\)\)/);
    expect(b).toMatch(/max-width:\s*calc\(100vw - min\(2rem, 32px\)\)/);
    expect(b).toMatch(/padding:\s*min\(var\(--r-4\), 16px\) min\(var\(--r-5\), 24px\)/);
  });

  it("die Antwortknöpfe einer Rückfrage kleben am unteren Rand des rollenden Dialogs", () => {
    expect(bloecke("dialog.abfrage .abfrage-aktionen:not(.abgesetzt)").join("\n")).toMatch(/position:\s*sticky/);
  });

  it("unter 260 px Leistenbreite (Browser-Zoom 200 %) bekommt der Primärknopf eine eigene Zeile", () => {
    expect(css).toMatch(/@container assistent-nav \(max-width: 260px\)/);
    expect(bloecke("footer.nav.assistent-nav > .primaer").join("\n")).toMatch(/grid-area:\s*weiter/);
  });
});

describe("Startseite bei großer Schrift (R4-M6)", () => {
  it("der Titel behält die Breite seines längsten Worts, die Zeile darf umbrechen", () => {
    const zeile = bloecke(".seiten-kopf.start-kopf .titelzeile").join("\n");
    expect(zeile).toMatch(/flex-wrap:\s*wrap/);
    expect(zeile).not.toMatch(/nowrap/);
    expect(bloecke(".seiten-kopf.start-kopf .titelzeile h1").join("\n")).toMatch(/min-width:\s*min-content/);
  });
});

describe("Moduswahl (R4-M7, R4-G5)", () => {
  it("die Segmente der aufgeklappten Wahl haben das Grundmaß, nicht 42 px", () => {
    expect(bloecke("footer.nav .anzeige-leiste-wahl button").join("\n")).toMatch(/min-height:\s*calc\(44px \+ var\(--ziel\)\)/);
  });

  it("jeder Modus nennt seinen Zweck in einer Zeile, „Feld“ die großen Tasten", () => {
    for (const m of ANZEIGE_MODI) expect(m.kurz.length).toBeGreaterThan(0);
    expect(ANZEIGE_MODI.find((m) => m.modus === "feld")!.kurz).toMatch(/Tasten/);
  });
});

describe("QR-Vollbild bei großer Schrift: der Code hat Vorrang (R4-M4)", () => {
  it("Schrift, Knopfmaß, Polster und Ruhezone sind in px gedeckelt", () => {
    expect(bloecke("dialog.qr-vollbild").join("\n")).toMatch(/font-size:\s*min\(var\(--t-m\), 18px\)/);
    expect(bloecke("dialog.qr-vollbild p.qr-vollbild-kopf").join("\n")).toMatch(/font-size:\s*min\(var\(--t-xl\), 22px\)/);
    expect(bloecke("dialog.qr-vollbild button").join("\n")).toMatch(/min-height:\s*min\([^;]*44px/);
    expect(bloecke("dialog.qr-vollbild .qr-vollbild-code img").join("\n")).toMatch(/padding:\s*min\(1\.5rem, 24px\)/);
  });

  it("der Code behält höchstens 192 px Mindesthöhe, nicht 12rem (384 px bei 200 %)", () => {
    expect(bloecke("dialog.qr-vollbild > .qr-vollbild-code").join("\n")).toMatch(/min-height:\s*min\(12rem, 192px\)/);
  });

  it("die Blätterknöpfe brechen nicht um", () => {
    expect(bloecke("dialog.qr-vollbild > .qr-vollbild-nav.mit-teilen > button:not(.primaer)").join("\n")).toMatch(/white-space:\s*nowrap/);
  });
});

describe("Abstände zwischen gegensätzlichen Knöpfen (R4-G4)", () => {
  it("Blättern und „Schließen“ im QR-Vollbild: mindestens 12 px", () => {
    expect(bloecke("dialog.qr-vollbild > .qr-vollbild-nav.mit-teilen").join("\n")).toMatch(
      /gap:\s*max\(1rem, 14px\) max\(0\.8rem, 12px\)/,
    );
  });

  it("Knopfreihen, Entwurfskarte und Quittungspaar tragen 12 px", () => {
    expect(bloecke(".knopfreihe").join("\n")).toMatch(/gap:\s*12px/);
    expect(bloecke(".aktionen").join("\n")).toMatch(/gap:\s*12px/);
    expect(bloecke(".entwurf-karte .entwurf-aktionen").join("\n")).toMatch(/gap:\s*12px/);
  });

  it("„+ übergeordnete Ebene“ und die OV-Vorlage stehen in einer Knopfreihe, nicht als Fließtext", () => {
    const quelle = readFileSync(new URL("./schritte/einheit.tsx", import.meta.url), "utf8");
    expect(quelle).toMatch(/<p className="knopfreihe">\s*<button/);
  });
});

describe("Bildschirmtastatur (R4-G3)", () => {
  it("die feste Leiste ist bei offener Tastatur ausgeblendet", () => {
    expect(TASTATUR_KLASSE).toBe("tastatur-offen");
    expect(bloecke("html.tastatur-offen footer.nav").join("\n")).toMatch(/display:\s*none/);
  });

  it("der Wächter wird beim Start der App angeschaltet", () => {
    const main = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    expect(main).toMatch(/tastaturWaechterStarten\(\);/);
  });
});

describe("Kein Doppeltipp-Zoom an Bedienelementen (R4-G6)", () => {
  it("Knöpfe, Links, Felder und Zähler tragen touch-action: manipulation", () => {
    const b = bloecke('button, a, summary, select, input, textarea, label, [role="button"], .datei-knopf').join("\n");
    expect(b).toMatch(/touch-action:\s*manipulation/);
  });

  it("der Viewport sperrt den Zwei-Finger-Zoom nicht (Barrierefreiheit)", () => {
    expect(html).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
    expect(html).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/);
  });
});

describe("Kopfbalken: Kontrast auf der Kennfarbe (R4-L1, R4-L2)", () => {
  it("die Speicherzeile im Kopf trägt im Dunkel-Modus die Zweitschrift der Kennfarbe, nicht das Grün der Seite", () => {
    expect(bloecke(".dunkel-modus .seiten-kopf .autosave").join("\n")).toMatch(/color:\s*var\(--kopf-auf-2\)/);
    // Gewinnt gegen die allgemeine Regel: höhere Spezifität UND später im Blatt.
    expect(css.indexOf(".dunkel-modus .seiten-kopf .autosave")).toBeGreaterThan(css.indexOf(".dunkel-modus .vollstaendig-ok, .dunkel-modus .autosave"));
  });

  it("„‹ Startseite“ im Kopf läuft nicht mehr über Deckkraft (0,85 ergab 3,75:1 auf DRK-Rot)", () => {
    const b = bloecke(".seiten-kopf .zur-start").join("\n");
    expect(b).toMatch(/color:\s*var\(--kopf-auf-2\)/);
    expect(b).not.toMatch(/opacity:\s*0?\.\d/);
    expect(bloecke(".seiten-kopf .zur-start:hover").join("\n")).not.toMatch(/opacity/);
  });

  it("der Kopfbalken im Dunkel-Modus nimmt die abgedunkelte Kennfarbe", () => {
    expect(css).toMatch(/--kopf-fond:\s*var\(--org-kopf-dunkel, var\(--org-akzent, #12275e\)\);/);
  });
});

describe("Kurz-Liste am Telefon (R4-H2, R4-N3)", () => {
  it("unter 44rem Rahmenbreite wird jede Person ein Raster, nicht eine 700 px breite Tabellenzeile", () => {
    expect(css).toMatch(/@container \(max-width: 44rem\)\s*\{\s*table\.uebersicht\.schnell-tabelle, table\.uebersicht\.schnell-tabelle tbody\s*\{\s*display:\s*block/);
    const zeile = bloecke("table.uebersicht.schnell-tabelle tr").join("\n");
    expect(zeile).toMatch(/display:\s*grid/);
    expect(zeile).toMatch(/repeat\(6, minmax\(0, 1fr\)\)/);
  });

  it("Geschlecht steht direkt unter dem Namen, in derselben Karte (kein Schieben nötig)", () => {
    expect(bloecke("table.uebersicht.schnell-tabelle td:nth-child(5)").join("\n")).toMatch(/grid-row:\s*3/);
    expect(bloecke("table.uebersicht.schnell-tabelle td:nth-child(2)").join("\n")).toMatch(/grid-row:\s*2/);
  });

  it("die Tabelle behält ihre Semantik über ausdrückliche Rollen", () => {
    const quelle = readFileSync(new URL("./schritte/personal.tsx", import.meta.url), "utf8");
    expect(quelle).toMatch(/<table className="uebersicht schnell-tabelle" role="table">/);
    expect(quelle).toMatch(/<tr key=\{i\} role="row">/);
  });
});

describe("Stärke-Leiste der Musterung (R4-H3)", () => {
  it("trägt unter 24rem Kürzel (F / UF / M / Ges) statt abgeschnittener Wörter", () => {
    expect(css).toMatch(/@container \(max-width: 24rem\)\s*\{\s*\.musterung \.staerke-leiste \.etikett-lang\s*\{[^}]*clip-path/);
    expect(bloecke(".staerke-leiste .etikett-kurz").join("\n")).toMatch(/display:\s*none/);
    const quelle = readFileSync(new URL("./vorlagen-ui.tsx", import.meta.url), "utf8");
    for (const k of ["F", "UF", "M", "Ges"]) expect(quelle).toContain(`aria-hidden="true">${k}</span>`);
  });
});
