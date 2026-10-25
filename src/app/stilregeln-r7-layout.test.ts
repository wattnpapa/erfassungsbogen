/**
 * Stilregeln aus Runde 7 des Audits (Block Layout, Bedienbarkeit, Anzeige), die nur im Stylesheet (index.html) leben.
 * Wie stilregeln-r6 prüft der Test den Quelltext (jsdom rechnet kein Layout); die Messwerte stehen im
 * „Stand der Behebung" der Berichte.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const css = html.replace(/\/\*[\s\S]*?\*\//g, "");
const vite = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");
const einsaetze = readFileSync(new URL("./einsaetze-ui.tsx", import.meta.url), "utf8");

describe("„Bedarf:“ bricht nicht im Wort (R7-M1, R7-G9)", () => {
  it("die Beschriftung ist unteilbar und schrumpft nicht, die Werte brechen um", () => {
    expect(css).toMatch(/details\.bedarf-block > summary > strong\s*\{[^}]*flex:\s*none[^}]*white-space:\s*nowrap/);
    expect(css).toMatch(/details\.bedarf-block > summary > \.bedarf-werte\s*\{[^}]*min-width:\s*0/);
    expect(einsaetze).toMatch(/<strong>Bedarf:<\/strong>\{" "\}[\s\S]{0,300}className="bedarf-werte"/);
  });

  it("bei großer Schrift ist die Zeile gedeckelt", () => {
    expect(css).toMatch(/html\.schrift-gross details\.bedarf-block > summary\s*\{[^}]*font-size:\s*min\(var\(--t-s\), 16px\)/);
  });
});

describe("Entwurfskarte bei großer Schrift (R7-H1, R7-S4, R7-H8)", () => {
  it("bricht mit der Klasse schrift-gross selbst um, nicht nur unter 30rem", () => {
    expect(css).toMatch(/html\.schrift-gross \.entwurf-karte\s*\{\s*flex-wrap:\s*wrap/);
    expect(css).toMatch(/html\.schrift-gross \.entwurf-karte \.entwurf-text\s*\{\s*flex:\s*1 1 100%/);
  });

  it("die Knöpfe stehen ab 30rem nebeneinander", () => {
    expect(css).toMatch(/@media \(min-width: 30rem\)\s*\{\s*html\.schrift-gross \.entwurf-karte \.entwurf-aktionen\s*\{\s*flex-direction:\s*row/);
  });

  it("quer zeigt die Themenleiste nur Logo, „Alle Themen“ und „Anleitung“", () => {
    expect(css).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\)\s*\{\s*\.kopfnav-links \.nur-breit\s*\{\s*display:\s*none/);
  });

  it("bei 180 px Breite entfällt das Zeichen, der Name bekommt die Breite", () => {
    expect(css).toMatch(/@media \(max-width: 16rem\)\s*\{\s*\.entwurf-karte img\.einheit-avatar\s*\{\s*display:\s*none/);
  });
});

describe("Vorschlagsliste (R7-N2)", () => {
  it("ist höchstens so breit wie das Fenster und bricht Namen um", () => {
    expect(css).toMatch(/ul\.vorschlaege\s*\{[^}]*min-width:\s*min\(15rem, 100%\)[^}]*max-width:\s*100%[^}]*overflow-wrap:\s*anywhere/);
  });
});

describe("Kopf und Fußleiste des Assistenten bei Zoom und großer Schrift (R7-M3, R7-M5, R7-M7)", () => {
  it("bei 200 % Schrift am Telefon entfällt das Zeichen, und die Reiter brechen ihren Status unter die Ziffer", () => {
    expect(css).toMatch(/@media \(max-width: 30rem\)\s*\{\s*html\.schrift-gross \.seiten-kopf\.assistent-kopf img\.einheit-avatar\s*\{\s*display:\s*none/);
    expect(css).toMatch(/html\.schrift-gross \.seiten-kopf\.assistent-kopf \.schritte button\s*\{\s*flex-wrap:\s*wrap/);
  });

  it("bei 180 px bleibt die Fußleiste einzeilig (drei Spalten, Pfeil statt Wort)", () => {
    expect(css).toMatch(/@media \(max-width: 16rem\)\s*\{\s*footer\.nav\.assistent-nav\s*\{[^}]*grid-template-columns:\s*auto auto minmax\(0, 1fr\)/);
    expect(css).toMatch(/@container assistent-nav \(max-width: 260px\)\s*\{[\s\S]{0,700}?> \.primaer\s*\{[^}]*grid-column:\s*3/);
    expect(css).toMatch(/\.nav-weiter-wort\s*\{\s*display:\s*none/);
  });

  it("auf 360 px zeigt der Knopf „Ansicht“ in allen Schritten nur „◐“", () => {
    expect(css).toMatch(/@container assistent-nav \(max-width: 22rem\)\s*\{\s*footer\.nav\.assistent-nav \.anzeige-leiste-text\s*\{\s*display:\s*none/);
  });
});

describe("Einsatzansicht: Tabelle und Ecke (R7-M4, R7-M8, R7-G4)", () => {
  it("die Tabelle ist bei großer Schrift gedeckelt", () => {
    expect(css).toMatch(/html\.schrift-gross table\.einheiten-tabelle\s*\{\s*font-size:\s*min\(var\(--t-s\), 16px\)/);
  });

  it("quer lässt die Inhaltsspalte rechts einen Streifen für die Ecke „◐“", () => {
    expect(css).toMatch(/@media \(max-height: 30rem\)\s*\{\s*html:has\(\.anzeige-balken\) main[^{]*\{\s*padding-right:\s*max\(var\(--r-3\), calc\(76px/);
  });
});

describe("Musterung (R7-G7, R7-H7)", () => {
  it("der Umschalter behält Breite und Platz, der Zähler seine Breite", () => {
    expect(css).toMatch(/\.musterung \.kopfzeile > \.muster-umschalter:last-child\s*\{[^}]*min-width:\s*calc\(9\.5em \+ 20px\)/);
    expect(css).toMatch(/\.musterung \.kopfzeile h2 \.zaehler\s*\{[^}]*min-width:\s*7ch/);
  });

  it("die klebende Kopfzeile hängt unter der Stärke-Leiste, nicht darauf", () => {
    expect(css).toMatch(/\.musterung \.kopfzeile\.klebend\s*\{\s*top:\s*calc\(var\(--fest-warnung-hoehe, 0px\) \+ var\(--muster-leiste-hoehe, 0px\)\)/);
  });

  it("im niedrigen Bild klebt die Kopfzeile nicht, bei großer Schrift auch die Leiste nicht", () => {
    expect(css).toMatch(/@media \(max-height: 31\.25rem\)\s*\{\s*\.musterung \.kopfzeile\.klebend\s*\{\s*position:\s*static/);
    expect(css).toMatch(/html\.schrift-gross \.musterung \.staerke-leiste\s*\{\s*position:\s*static/);
  });
});

describe("Nacht-Modus: „offen“ im Schrittband (R7-L4)", () => {
  it("trägt nicht die Farbe des aktiven Schritts, sondern eine umrandete Marke", () => {
    const regel = /\.nacht-modus \.schritte button\.status-begonnen \.schritt-status\s*\{([^}]*)\}/g;
    const regeln = [...css.matchAll(regel)].map((m) => m[1]);
    const letzte = regeln[regeln.length - 1] ?? "";
    expect(letzte).toMatch(/color:\s*var\(--kopf-auf\)/);
    expect(letzte).toMatch(/border:\s*1px solid currentColor/);
    expect(letzte).not.toMatch(/akzent-hell/);
  });
});

describe("Hinweis im QR-Vollbild quer (R7-H4)", () => {
  it("liegt fest unten, nicht über dem Tipport", () => {
    expect(css).toMatch(/\.tipp-moment\.im-vollbild\s*\{\s*top:\s*auto !important;\s*bottom:/);
  });
});

describe("Knopfreihen und Zoom im Feld-Modus (R7-G5)", () => {
  it("Knöpfe einer Knopfreihe brechen um, statt die Seite zu weiten", () => {
    expect(css).toMatch(/\.knopfreihe > button\s*\{\s*max-width:\s*100%;\s*white-space:\s*normal/);
  });
});

describe("Zoom im Feld-Modus: Fußzeile und Fußleiste (R7-G5)", () => {
  it("die Spalten der Fußzeile haben keine feste Mindestbreite über der Fensterbreite", () => {
    expect(css).toMatch(/\.fuss-gruppen\s*\{\s*grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(9rem, 100%\), 1fr\)\)/);
  });

  it("unter 9rem (R8-G2: vorher 12rem) bekommt der Pfeil vorwärts eine eigene Zeile", () => {
    expect(css).toMatch(/@media \(max-width: 9rem\)\s*\{\s*footer\.nav\.assistent-nav:not\(\.mit-uebernehmen\) > \.primaer\s*\{\s*grid-row:\s*1;\s*grid-column:\s*1 \/ -1/);
  });
});

describe("Service Worker: Themenseiten im Funkloch (R7-O6)", () => {
  it("HTML-Seiten kommen zuerst aus dem Gerät und werden im Hintergrund aufgefrischt", () => {
    expect(vite).toMatch(/\\\.html\$\/\.test\(url\.pathname\)[\s\S]{0,80}handler:\s*"StaleWhileRevalidate"/);
    expect(vite).not.toMatch(/\.html\$[^\n]*\n[^\n]*handler:\s*"NetworkFirst"/);
  });
});
