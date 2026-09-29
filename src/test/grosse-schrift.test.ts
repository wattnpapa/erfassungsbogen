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
    const kontext = APP.map((r) => r.kontext).find((k) => k.startsWith("@container kopf"));
    const schwelle = Number(kontext?.match(/max-width: ([\d.]+)rem/)?.[1]);
    // Unter 320 px ÷ (16 px × 112 % Feld-Modus) = 17,86rem: bei normaler
    // Schrift greift sie auf keinem Telefon, auch nicht im Feld-Modus.
    expect(schwelle).toBeGreaterThan(0);
    expect(schwelle).toBeLessThan(320 / (16 * 1.12));
    expect(werte(APP, ".seiten-kopf.assistent-kopf .schritte", "flex-wrap", kontext)).toEqual(["nowrap"]);
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
