/**
 * Stilregeln aus Runde 5 des Audits, Paket 3 („Touch, Tipp-Sperre, QR-Vollbild,
 * Layout, Sicht"), die nur im Stylesheet (index.html) leben. jsdom rechnet
 * keine Kaskade und kein Layout, deshalb prüft der Test den Quelltext — wie
 * stilregeln-r4.test.ts. Die Messwerte (Positionen, Höhen, Kontraste) stehen im
 * Bericht unter „Stand der Behebung"; hier hängen die Regeln, an denen sie
 * hängen, damit eine spätere Aufräumrunde sie nicht still zurücknimmt.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bloecke } from "./stilregeln-r4.test";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const css = html.replace(/\/\*[\s\S]*?\*\//g, "");
const quelle = (datei: string) => readFileSync(new URL(datei, import.meta.url), "utf8");

describe("Kurz-Liste: feste Plätze und Abstände (R5-G2, R5-G4)", () => {
  it("die Pfeile stehen mit mindestens 12 px Abstand, das ✕ ist gedeckelt und rückt um 12 px ab", () => {
    expect(bloecke(".sortieren").join("\n")).toMatch(/gap:\s*calc\(12px \+ var\(--ziel\)\)/);
    const x = bloecke(".schnell-tabelle td.sortier-spalte + td > button").join("\n");
    expect(x).toMatch(/min-width:\s*min\([^;]*50px/);
    expect(bloecke(".schnell-tabelle td.sortier-spalte + td").join("\n")).toMatch(/padding-left:\s*max\(var\(--r-3\), 12px\)/);
    expect(bloecke(".eintrag-kopf > .sortieren + .entfernen").join("\n")).toMatch(/margin-left:\s*max\(var\(--r-3\), 12px\)/);
  });

  it("am Telefon trägt die Stelle eine eigene Zeile, Pfeile links und ✕ rechts teilen sich die zweite", () => {
    expect(bloecke("table.uebersicht.schnell-tabelle td.stelle").join("\n")).toMatch(/grid-column:\s*1 \/ -1;\s*grid-row:\s*1/);
    const pfeile = bloecke("table.uebersicht.schnell-tabelle td.sortier-spalte").join("\n");
    expect(pfeile).toMatch(/grid-row:\s*2/);
    expect(pfeile).toMatch(/justify-self:\s*start/);
    // Die Pfeile geben nach (Umbruch), nie das ✕: Platz für das ✕ plus 12 px bleibt frei.
    expect(pfeile).toMatch(/max-width:\s*calc\(100% - min\(.*\) - 12px\)/);
    expect(bloecke("table.uebersicht.schnell-tabelle td.sortier-spalte + td").join("\n")).toMatch(/justify-self:\s*end/);
    expect(bloecke("table.uebersicht.schnell-tabelle .sortieren").join("\n")).toMatch(/flex-wrap:\s*wrap/);
  });

  it("„⇑“ steht in jeder Zeile an derselben Stelle, in der ersten gesperrt statt weggelassen", () => {
    const q = quelle("./schritte/personal.tsx");
    expect(q).not.toMatch(/\{index > 0 && \(\s*\/\*[^]*?<button/);
    expect(q).toMatch(/disabled=\{index === 0\}\s*aria-label=\{`Person \$\{index \+ 1\} an die erste Stelle`\}/);
  });

  it("die Felder neuer Personen tragen ihre Bezeichnung als Platzhalter (R5-M5)", () => {
    const q = quelle("./schritte/personal.tsx");
    expect(q).toMatch(/placeholder="Vorname"/);
    expect(q).toMatch(/placeholder="Nachname"/);
  });
});

describe("Knopfpaare und Reihen mit Lücke (R5-G3, R5-G7)", () => {
  it("zwischen „In Einsatz übernehmen“ und „Weiter →“ liegen mindestens 12 px", () => {
    expect(bloecke("footer.nav.assistent-nav").join("\n")).toMatch(/column-gap:\s*max\(12px/);
    expect(css).toMatch(/footer\.nav\.assistent-nav\.mit-uebernehmen\s*\{[^}]*row-gap:\s*max\(12px, min\(0\.9rem, 14px\)\)/);
    expect(css).toMatch(/footer\.nav\.assistent-nav \{ row-gap: max\(12px, min\(0\.9rem, 14px\)\); \}/);
  });

  it("Schrittleiste, Moduswahl und „Karten“/„Tabelle“ liegen nicht mehr bündig oder überdeckt", () => {
    expect(bloecke(".schritte button + button").join("\n")).toMatch(/border-left:\s*2px solid/);
    expect(bloecke(".anzeige-schalter button + button").join("\n")).toMatch(/border-left:\s*max\(var\(--strich\), 2px\)/);
    expect(bloecke(".ansicht-umschalter button").join("\n")).toMatch(/margin-left:\s*0/);
    expect(bloecke(".ansicht-umschalter button").join("\n")).not.toMatch(/margin-left:\s*-1px/);
  });
});

describe("Moduswechsel in der Einsatzansicht: feste Leiste statt schwebendem Knopf (R5-L1)", () => {
  it("die Leiste sitzt am unteren Rand über die ganze Breite und deckt keinen Inhalt ab", () => {
    const b = bloecke(".anzeige-balken").join("\n");
    expect(b).toMatch(/position:\s*fixed/);
    expect(b).toMatch(/left:\s*0;\s*right:\s*0;\s*bottom:\s*0/);
    expect(b).toMatch(/border-top:/);
    // Nichts „schwebt" mehr: kein Schatten auf dem Knopf, der Text überdeckt.
    expect(css).not.toMatch(/\.anzeige-schwebe/);
  });

  it("der Knopf trägt Text und ein Tippziel in Handschuhmaß", () => {
    expect(bloecke(".anzeige-balken .anzeige-leiste-knopf").join("\n")).toMatch(/min-height:\s*min\([^;]*44px/);
    const q = quelle("./anzeige-schalter.tsx");
    expect(q).toMatch(/\{mitText && <span className="anzeige-leiste-text">Ansicht: \{aktuell\}<\/span>\}/);
    expect(quelle("./einsaetze-ui.tsx")).toMatch(/<AnzeigeLeistenKnopf mitText \/>/);
  });
});

describe("Deckel-Regel für Dialog, Startseite, Kopf und Leiste (R5-M1, R5-M2, R5-M3, R5-G6, R5-M7)", () => {
  it("der Übergabe-Dialog ist in Schrift, Knopfmaß und Polster gedeckelt", () => {
    expect(bloecke(".teilen-dialog").join("\n")).toMatch(/font-size:\s*min\(var\(--t-m\), 18px\)/);
    expect(bloecke(".teilen-dialog button").join("\n")).toMatch(/min-height:\s*min\([^;]*44px/);
    expect(bloecke(".teilen-dialog button").join("\n")).toMatch(/padding:\s*min\(0\.55rem, 10px\)/);
    expect(bloecke(".teilen-dialog h2").join("\n")).toMatch(/min\(var\(--t-xl\), 24px\)/);
  });

  it("in der Übergabe steht der Primärknopf vor „Für neuen Einsatz vorbereiten“", () => {
    const q = quelle("./schritte/uebersicht.tsx");
    expect(q.indexOf("QR-Code im Vollbild zeigen\n          </button>")).toBeGreaterThan(0);
    expect(q.indexOf("QR-Code im Vollbild zeigen\n          </button>")).toBeLessThan(q.indexOf("Für neuen Einsatz vorbereiten\n            </button>"));
  });

  it("die Startseite deckelt Themenleiste, Einleitung und Überschrift und kürzt die Einleitung am Telefon", () => {
    expect(css).toMatch(/\.kopfnav-logo, \.kopfnav-links a\s*\{\s*min-height:\s*min\(var\(--ziel-basis\), 44px\)/);
    expect(bloecke(".start > p.start-intro").join("\n")).toMatch(/min\(var\(--t-l\), 20px\)/);
    expect(bloecke(".weiche > .weiche-weg > h2").join("\n")).toMatch(/min\(var\(--t-xl\), 28px\)/);
    expect(css).toMatch(/@media \(max-width: 640px\)\s*\{\s*\.start-intro-lang\s*\{\s*display:\s*none/);
    // Beim Erstbesuch steht der Offline-Hinweis unter den Aktionen des ersten Wegs.
    expect(quelle("./app.tsx")).toMatch(/\{erststart && offlineHinweis\}/);
    expect(quelle("./app.tsx")).toMatch(/\{!bogen && !erststart && offlineHinweis\}/);
  });

  it("bei niedrigem Fenster (quer) und bei großer Schrift (Hochformat) verdichtet sich der Kopf in px-Deckeln", () => {
    expect(css).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\)\s*\{\s*\.seiten-kopf \.zur-start\s*\{[^}]*min\(var\(--t-m\), 18px\)/);
    expect(css).toMatch(/@media \(max-height: 44rem\)\s*\{\s*html\.schrift-gross \.seiten-kopf \.zur-start/);
    expect(css).toMatch(/html\.schrift-gross \.uebungs-band, html\.schrift-gross \.frist-band\s*\{[^}]*white-space:\s*nowrap/);
    expect(css).toMatch(/html\.schrift-gross main \.karte\s*\{\s*padding:\s*min\(var\(--r-4\), 16px\)/);
  });

  it("die Leiste des Assistenten steht auf der Spalte von main, nicht am Fensterrand (Tablet quer)", () => {
    const b = bloecke("footer.nav").join("\n");
    expect(b).toMatch(/padding-left:\s*max\([^;]*calc\(\(100% - 60rem\) \/ 2 \+ min\(var\(--r-4\), 18px\)\)\)/);
    expect(b).toMatch(/padding-right:\s*max\([^;]*calc\(\(100% - 60rem\) \/ 2 \+ min\(var\(--r-4\), 18px\)\)\)/);
  });
});

describe("Tablet quer mit großer Schrift (R5-M6)", () => {
  it("die linke Spalte der Einsatzansicht ist in px gedeckelt, die Liste behält mindestens 20 rem", () => {
    expect(css).toMatch(/grid-template-columns:\s*minmax\(min\(20rem, 320px\), min\(27rem, 432px\)\) minmax\(0, 1fr\)/);
  });
});

describe("Tabelle am Telefon (R5-M4)", () => {
  it("die Zelle nach der klebenden Spalte beginnt mit Abstand, Marken brechen nicht im Wort", () => {
    expect(bloecke("table.einheiten-tabelle > * > tr > :nth-child(2)").join("\n")).toMatch(/padding-left:\s*max\(var\(--r-3\), 12px\)/);
    const m = bloecke("table.einheiten-tabelle .status-badge").join("\n");
    expect(m).toMatch(/white-space:\s*nowrap/);
    expect(m).toMatch(/overflow-wrap:\s*normal/);
  });
});

describe("Sicht: Speicherzeile, Feld-Kopf, Anleitung (R5-L2, R5-L3, R5-L6)", () => {
  it("die Speicherzeile im Assistenten-Kopf bricht um statt mit Auslassungspunkten zu enden", () => {
    const b = bloecke(".seiten-kopf.assistent-kopf .autosave:not(.speicher-fehler)").filter((x) => /white-space:\s*normal/.test(x));
    expect(b.length).toBeGreaterThan(0);
    expect(css).not.toMatch(/\.seiten-kopf\.assistent-kopf \.autosave:not\(\.speicher-fehler\)\s*\{\s*white-space:\s*nowrap/);
  });

  it("der Feld-Modus färbt den Kopf mit der auf 7:1 abgedunkelten Kennfarbe, nicht in den Apps", () => {
    const b = bloecke("html.feld-modus:not(.platform-ios):not(.platform-android)").join("\n");
    expect(b).toMatch(/--kopf-fond:\s*var\(--org-kopf-feld, var\(--akzent\)\)/);
    expect(b).toMatch(/--kopf-auf-2:\s*var\(--org-kopf-auf-2-feld/);
    expect(b).toMatch(/--gut-auf-kopf:\s*var\(--org-kopf-gut-feld/);
  });
});
