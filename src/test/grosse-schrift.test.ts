/**
 * Große Systemschrift (Audit Runde 2, R2-M1 und R2-G2): Bei 200 % Schrift war
 * die Seite breiter als das Gerät, die Fußleiste des Assistenten 179 px hoch
 * und „Weiter →" 79 px über dem rechten Rand; in der Einsatz-Tabelle ragten die
 * Vorleser-Beschriftungen der Spaltenköpfe aus dem Rollrahmen.
 *
 * Gemessen wird das im Browser (Layout kann jsdom nicht). Dieser Test hält die
 * CSS-Regeln fest, an denen die Messwerte hängen — damit eine spätere
 * Aufräumrunde nicht still ein `nowrap` oder einen fehlenden Bezugsrahmen
 * zurückbringt.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WURZEL = join(import.meta.dirname, "..", "..");
const INDEX = readFileSync(join(WURZEL, "index.html"), "utf8");

interface Regel {
  /** Umschließende At-Regel („@media …", „@container …") oder leer. */
  kontext: string;
  selektoren: string[];
  deklarationen: Map<string, string>;
}

/** Kleiner Zerleger für das eine Stylesheet: Kommentare raus, Blöcke per Klammertiefe. */
function regeln(css: string): Regel[] {
  const ohneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const ergebnis: Regel[] = [];
  const kontexte: string[] = [];
  let kopf = "";
  for (let i = 0; i < ohneKommentare.length; i++) {
    const z = ohneKommentare[i]!;
    if (z === "{") {
      const k = kopf.trim();
      kopf = "";
      if (k.startsWith("@")) {
        kontexte.push(k);
        continue;
      }
      const ende = ohneKommentare.indexOf("}", i);
      const rumpf = ohneKommentare.slice(i + 1, ende);
      const deklarationen = new Map<string, string>();
      for (const teil of rumpf.split(";")) {
        const doppelpunkt = teil.indexOf(":");
        if (doppelpunkt < 0) continue;
        deklarationen.set(teil.slice(0, doppelpunkt).trim(), teil.slice(doppelpunkt + 1).trim());
      }
      ergebnis.push({
        kontext: kontexte[kontexte.length - 1] ?? "",
        selektoren: k.split(",").map((s) => s.trim().replace(/\s+/g, " ")),
        deklarationen,
      });
      i = ende;
    } else if (z === "}") {
      kontexte.pop();
      kopf = "";
    } else {
      kopf += z;
    }
  }
  return ergebnis;
}

const APP = regeln(INDEX.match(/<style>([\s\S]*?)<\/style>/)![1]!);

/** Alle Werte einer Eigenschaft für einen Selektor, in Kaskadenreihenfolge. */
function werte(regelwerk: Regel[], selektor: string, eigenschaft: string, kontext = ""): string[] {
  return regelwerk
    .filter((r) => r.kontext === kontext && r.selektoren.includes(selektor) && r.deklarationen.has(eigenschaft))
    .map((r) => r.deklarationen.get(eigenschaft)!);
}

/** Der Wert, der in der Kaskade gewinnt (letzte Regel gleicher Spezifität). */
function wert(selektor: string, eigenschaft: string, kontext = ""): string | undefined {
  const alle = werte(APP, selektor, eigenschaft, kontext);
  return alle[alle.length - 1];
}

describe("Vorleser-Beschriftung und Tabellenrahmen (R2-G2)", () => {
  it(".nur-sr ist aus dem Bild geklippt, aber im Baum", () => {
    expect(wert(".nur-sr", "position")).toBe("absolute");
    expect(wert(".nur-sr", "width")).toBe("1px");
    expect(wert(".nur-sr", "height")).toBe("1px");
    expect(wert(".nur-sr", "overflow")).toBe("hidden");
    expect(wert(".nur-sr", "clip-path")).toBe("inset(50%)");
    // Kein display:none / visibility:hidden — das nähme Vorlesesoftware mit heraus.
    expect(wert(".nur-sr", "display")).toBeUndefined();
    expect(wert(".nur-sr", "visibility")).toBeUndefined();
  });

  it("der Rollrahmen ist Bezugsrahmen der absolut gesetzten Spaltenkopf-Beschriftungen", () => {
    // Ohne position hingen die .nur-sr-Spans am Dokument, lagen an ihrer
    // Spaltenposition außerhalb des Rahmens und machten die Seite 1 677 px breit.
    expect(wert(".tabellen-scroll", "overflow-x")).toBe("auto");
    expect(wert(".tabellen-scroll", "position")).toBe("relative");
  });
});

describe("nichts Unumbrechbares breiter als die Karte (R2-M1)", () => {
  it("ein Wort, das allein nicht in die Zeile passt, bricht", () => {
    expect(wert("body", "overflow-wrap")).toBe("break-word");
  });

  it("die Stärke „0 / 2 / 6 / 8“ darf als letzte Rettung umbrechen", () => {
    expect(wert(".einheit-kopf.leitzeile .einheit-staerke strong", "white-space")).toBeUndefined();
  });

  it.each([".zug-badge", ".teil-badge", ".neu-badge", ".alt-badge", ".bedarf-marke"])(
    "Marke %s ist nicht mehr nowrap",
    (marke) => {
      expect(wert(marke, "white-space")).toBe("normal");
      expect(wert(marke, "max-width")).toBe("100%");
    },
  );

  it("das Vorschlagsfeld in der Chip-Zeile nimmt die Kartenbreite an", () => {
    expect(wert(".autocomplete.im-fluss", "min-width")).toBe("0");
    expect(wert(".autocomplete.im-fluss", "max-width")).toBe("100%");
  });
});

describe("Fußleiste des Assistenten wächst nicht mit der Schrift (R2-M1)", () => {
  it("Knöpfe bleiben einzeilig und kürzen notfalls statt zu überragen", () => {
    expect(wert("footer.nav button", "white-space")).toBe("nowrap");
    expect(wert("footer.nav button", "text-overflow")).toBe("ellipsis");
    expect(wert("footer.nav button", "min-width")).toBe("0");
  });

  it("Schrift, Zielhöhe und Polster sind nach oben gedeckelt", () => {
    // Der Deckel ist ein fester Wert (px/vmin), keiner in rem — rem wächst mit
    // der Systemschrift, genau das soll die Leiste nicht.
    expect(wert("footer.nav button", "font-size")).toMatch(/^min\(var\(--t-m\), max\(\d+px, \d+vmin\)\)$/);
    expect(wert("footer.nav button", "min-height")).toMatch(/^min\(.*rem.*, calc\(\d+px \+ var\(--ziel\)\)\)$/);
    expect(wert("footer.nav button", "padding")).toMatch(/^min\([\d.]+rem, \d+px\) min\([\d.]+rem, \d+px\)$/);
    for (const eigenschaft of ["padding-bottom", "padding-left", "padding-right"]) {
      for (const w of werte(APP, "footer.nav", eigenschaft)) expect(w).toMatch(/min\([\d.]+rem, [\d.]+px\)/);
    }
  });
});

describe("Assistenten-Kopf verdichtet sich bei großer Schrift (R2-M1)", () => {
  it("der Kopf ist Container, die Schwelle liegt in rem der tatsächlichen Schrift", () => {
    expect(wert(".seiten-kopf.assistent-kopf", "container")).toBe("kopf / inline-size");
    // Die Abfrage, die die Schrittleiste rollen lässt (daneben gibt es eine
    // weitere für den Anzeigemodus, R2-H7).
    const kontext = APP.find(
      (r) => r.kontext.startsWith("@container kopf") && r.selektoren.includes(".seiten-kopf.assistent-kopf .schritte"),
    )?.kontext;
    const schwelle = Number(kontext?.match(/max-width: ([\d.]+)rem/)?.[1]);
    // Unter 320 px ÷ (16 px × 112 % Feld-Modus) = 17,86rem: bei normaler
    // Schrift greift sie auf keinem Telefon, auch nicht im Feld-Modus.
    expect(schwelle).toBeGreaterThan(0);
    expect(schwelle).toBeLessThan(320 / (16 * 1.12));
    expect(werte(APP, ".seiten-kopf.assistent-kopf .schritte", "flex-wrap", kontext)).toEqual(["nowrap"]);
  });
});

describe("Assistenten-Kopf auf dem Telefon (R2-H7)", () => {
  const TELEFON = "@media (max-width: 29.999rem)";

  it("Titel und Schrittnamen sind nur aus dem Bild genommen, nicht aus dem Baum", () => {
    for (const selektor of [
      ".seiten-kopf.assistent-kopf .titelzeile h1",
      ".seiten-kopf.assistent-kopf .schritte .schritt-name",
    ]) {
      expect(werte(APP, selektor, "clip-path", TELEFON)).toEqual(["inset(50%)"]);
      expect(werte(APP, selektor, "display", TELEFON)).toEqual([]);
      expect(werte(APP, selektor, "visibility", TELEFON)).toEqual([]);
    }
  });

  it("der Anzeigemodus klappt nur auf dem Telefon ein", () => {
    expect(wert(".anzeige-schalter .anzeige-klappe", "display")).toBe("none");
    expect(werte(APP, ".anzeige-schalter.klappbar .anzeige-klappe", "display", TELEFON)).toEqual(["inline-flex"]);
    expect(werte(APP, ".anzeige-schalter.klappbar:not(.offen) > button:not(.anzeige-klappe)", "display", TELEFON)).toEqual([
      "none",
    ]);
  });

  it("die ausgeblendeten Schrittnamen bleiben im Rahmen der Leiste (vgl. R2-G2)", () => {
    expect(werte(APP, ".seiten-kopf.assistent-kopf .schritte", "position", TELEFON)).toEqual(["relative"]);
  });
});

describe("Tippziele im Standard-Thema (R2-G3)", () => {
  const ZIEL = "calc(var(--ziel-basis) + var(--ziel))";

  it("Chip-✕, Vorschläge und Spaltenköpfe tragen das Grundmaß auch ohne Feld-Modus", () => {
    expect(wert(".chip button", "min-width")).toBe("var(--ziel-basis)");
    expect(wert(".chip button", "min-height")).toBe("var(--ziel-basis)");
    expect(wert("ul.vorschlaege li", "min-height")).toBe(ZIEL);
    expect(wert("ul.vorschlaege li + li", "border-top")).toContain("solid");
    expect(wert("table.einheiten-tabelle thead th > .spalten-sortierung", "min-width")).toBe(ZIEL);
  });

  it("Schrittleiste mindestens 44 px, ohne den Feld-Modus zu vergrößern", () => {
    expect(wert(".schritte button", "min-height")).toBe("max(calc(2.5rem + var(--ziel)), 44px)");
    expect(wert(".schritte button", "min-width")).toBe("44px");
  });

  it("Kopf-Links auf dem Telefon nicht mehr auf 2rem verkleinert (App und Begleitseiten)", () => {
    expect(werte(APP, ".kopfnav-links a", "min-height", "@media (max-width: 30rem)")).toEqual([]);
    for (const datei of readdirSync(join(WURZEL, "public")).filter((d) => d.endsWith(".html"))) {
      expect(readFileSync(join(WURZEL, "public", datei), "utf8"), datei).not.toMatch(
        /\.kopfnav-links a \{ min-height: 2rem; \}/,
      );
    }
  });

  it("„ändern“, „Lücken“ und Hinweis-Links: 44 px Trefferfläche, Zeilenhöhe per Gegenrand unverändert", () => {
    for (const selektor of [
      ".zeiten-zeile button.link.zeit-aendern",
      "button.link.luecken-marke",
      ".hinweis > button.link",
      ".fuss-marke > button.link",
    ]) {
      const regel = APP.find((r) => r.kontext === "" && r.selektoren.includes(selektor))!;
      const polster = regel.deklarationen.get("padding-block") ?? regel.deklarationen.get("padding")!;
      expect(polster, selektor).toContain("var(--ziel-basis) + var(--ziel)");
      expect(regel.deklarationen.get("margin-block"), selektor).toMatch(/^calc\(0\.28rem \+ 0\.5 \* var\(--ziel\) - /);
    }
  });
});

describe("Begleitseiten: Umbruch-Regel (R2-M1)", () => {
  const PUBLIC = join(WURZEL, "public");
  const SEITEN = readdirSync(PUBLIC).filter((d) => d.endsWith(".html"));

  it.each(SEITEN)("%s trägt den Umbruch-Block am Ende des Stylesheets", (datei) => {
    const stil = readFileSync(join(PUBLIC, datei), "utf8").match(/<style>([\s\S]*?)<\/style>/)![1]!;
    const start = stil.indexOf("/* UMBRUCH:CSS:START */");
    expect(start, "npm run content-stil").toBeGreaterThan(-1);
    // Nach dem Modus-Block: sonst schlügen die Raster-Regeln der Generatoren
    // die min(…, 100%)-Fassungen in der Kaskade.
    expect(start).toBeGreaterThan(stil.indexOf("/* THEMA:CSS:END */"));
    const block = regeln(stil.slice(start));
    expect(werte(block, "html", "overflow-wrap")).toEqual(["break-word"]);
    expect(werte(block, ".sprungmenue ul", "grid-template-columns")[0]).toContain("min(14rem, 100%)");
  });
});

describe("Überschriften, Zusammenfassungen und Fußzeilen-Links brechen im Wort (R4-M1)", () => {
  // „Zwischensummen nach Zug (3 Züge)" (h2 in einer summary) machte die
  // Einsatzansicht bei 200 % 446 px breit, „nachrichtenvordruck.app" jede Seite
  // mit Fußzeile bei 320 px 342 px. overflow-wrap: break-word am body ändert die
  // Mindestbreite nicht — anywhere schon.
  it("h2 (wie h1–h5 und summary) trägt overflow-wrap: anywhere und hyphens: auto", () => {
    expect(wert("h2", "overflow-wrap")).toBe("anywhere");
    expect(wert("h2", "hyphens")).toBe("auto");
  });

  it("die Seite ist auf Deutsch ausgezeichnet, sonst trennt hyphens: auto nicht", () => {
    expect(INDEX).toMatch(/<html lang="de">/);
  });

  it("Links und Link-Knöpfe der Fußzeile überschreiten die Breite nicht", () => {
    expect(wert("footer.seite a", "max-width")).toBe("100%");
    expect(wert("footer.seite a", "overflow-wrap")).toBe("anywhere");
  });

  it("die Überschrift der Zwischensummen steht in einer summary (die Regel greift dort)", () => {
    const quelle = readFileSync(join(WURZEL, "src", "app", "einsaetze-ui.tsx"), "utf8");
    expect(quelle).toMatch(/<summary><h2>Zwischensummen nach Zug/);
  });
});

describe("Leiste des Assistenten: Raster statt Umbruch (R4-M2, R4-G2)", () => {
  it("die Kürzung von „Zurück“ hängt an einer Container-Abfrage, nicht an einer Media Query in rem", () => {
    const kontext = APP.find((r) => r.kontext.startsWith("@container assistent-nav (max-width: 25rem)"))?.kontext;
    expect(kontext).toBeDefined();
    expect(werte(APP, ".nav-wort", "display", kontext)).toEqual(["none"]);
    expect(APP.some((r) => r.kontext.startsWith("@media") && r.selektoren.includes("footer.nav .nav-wort"))).toBe(false);
  });
});
