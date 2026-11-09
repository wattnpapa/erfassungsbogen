/**
 * Runde 17, Block Inhalte: Unterbringung/WC in der Änderungsspalte (A1), Alter der Meldung bei Handänderungen (K1), eine Zahl ein Wort
 * (K8, W4), Anführungszeichen (W3), Nachtrag-CSV (A3, W2, K9), Abgerückte am Ende (E6, K4), Einzelbogen-Dateiname (A2), eigene
 * CSV beim Einlesen (A5), ungültiger Zeitraum (A6), einzeilige Quittung (W1), Kurzzeile nach „Stärke ändern…“ (K2), Lagemonitor
 * (K3, K11), Reihenfolge der Einsatzansicht am Telefon (K12), Aufklappzeichen (K10), ein Einsatz auf der Startseite (A7, K5, N2).
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Erfassungsbogen } from "@bos/eeb-format/model";
import { MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { neuerBogen, neuePerson, datumAnzeige, zeitraumDeutsch, pruefpunkte } from "./hilfen";
import { DaumenQuittung, QUITTUNG_ENDE_NACH_MS } from "./daumen-quittung";
import { anfuehrung, anfuehrungWaechterStarten } from "./typografie";
import { csvFeld, mitNachtragSpalte } from "./csv";
import { winAnsiText, bemerkungKurz } from "./pdf-dokument";
import { dateiFehlerText } from "./datei-fehler";

vi.mock("./pdf", async () => {
  const echt = await vi.importActual<typeof import("./pdf")>("./pdf");
  return {
    ...echt,
    pdfErzeugen: async () => {},
    pdfBlobUrl: async () => "blob:pdf-vorschau",
    einsatzPdfErzeugen: async () => true,
    einsatzLageblattErzeugen: async () => true,
    blankoPdfErzeugen: async () => true,
    meldungPdfAnzeigen: async () => "eeb-test.pdf",
  };
});
vi.mock("./nativ", async () => {
  const echt = await vi.importActual<typeof import("./nativ")>("./nativ");
  return {
    istNativ: () => false,
    plattform: () => "web",
    imWebBrowser: () => true,
    bogenLinksEmpfangen: () => () => {},
    qrScannen: async () => "",
    binaerTeilen: async () => {},
    linkTeilen: async () => {},
    textTeilen: async () => {},
    shareSheetVerfuegbar: () => false,
    nahbereichDienst: echt.nahbereichDienst,
    pdfEinbettbar: () => true,
  };
});
vi.mock("./pdf-qr", () => ({ qrTexteAusPdfBytes: async () => [] }));

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const lmCss = readFileSync(`${process.cwd()}/src/app/lagemonitor.css`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 17 (Inhalte) ===== */");
  const bis = html.indexOf("/* ===== Ende Runde 17 (Inhalte) ===== */");
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

function bogen(ort: string, mod: (b: Erfassungsbogen) => void = () => {}): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  mod(b);
  return b;
}

function mitPersonen(b: Erfassungsbogen, n: number): void {
  b.personal = Array.from({ length: n }, (_, i) => ({ ...neuePerson(), nachname: `P${i}`, vorname: "X" }));
}




describe("R17-K8 / R17-W4 eine Zahl, ein Wort", () => {

  it("kürzt die Bemerkung an der Wortgrenze und setzt keine Klammer in die Klammer", () => {
    const lang = "(2 Helfer über StAN-Soll (Reserve aktiviert). Verpflegung zusätzlich über Staffelkommandant angefordert, Rest folgt später)";
    const kurz = bemerkungKurz(lang, 70);
    expect(kurz.endsWith("… Rest: Sammel-PDF)")).toBe(true);
    const vorRest = kurz.slice(1, kurz.indexOf(" …"));
    // Nie mitten im Wort: der gekürzte Text endet an einer Wortgrenze des Originals.
    expect(lang.replace(/[()]/g, (z) => (z === "(" ? "[" : "]"))).toMatch(new RegExp(`${vorRest.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`));
    // Keine verschachtelten runden Klammern.
    expect(kurz.slice(1, -1)).not.toMatch(/[()]/);
    // Kurze Bemerkungen bleiben ganz.
    expect(bemerkungKurz("Sandsäcke", 70)).toBe("(Sandsäcke)");
    expect(bemerkungKurz("", 70)).toBe("");
  });
});

describe("R17-W3 Anführungszeichen", () => {
  it("ersetzt das schließende gerade Zeichen durch “ und lässt alles andere stehen", () => {
    expect(anfuehrung('Abgerückt: Nr. 1 „THW Biberach"')).toBe("Abgerückt: Nr. 1 „THW Biberach“");
    expect(anfuehrung('Einsatz „A" und „B" übernommen')).toBe("Einsatz „A“ und „B“ übernommen");
    expect(anfuehrung("Alles „gut“ und 5\" Zoll")).toBe("Alles „gut“ und 5\" Zoll");
    expect(anfuehrung("ohne Anführung")).toBe("ohne Anführung");
  });

  it("gilt in den Dateien: CSV, PDF", () => {
    expect(csvFeld('Hinweis „Nr. 2"')).toBe("Hinweis „Nr. 2“");
    expect(winAnsiText('Zug „1. Zug"')).toBe("Zug „1. Zug“");
  });

  it("der Wächter richtet Text und Beschriftungen in der Oberfläche aus, auch später eingefügte", async () => {
    const wurzel = document.createElement("div");
    document.body.append(wurzel);
    wurzel.innerHTML = '<p id="a">Einsatz „Hochwasser" übernommen</p><button id="b">x</button><textarea id="t">„roh"</textarea>';
    wurzel.querySelector("#b")!.setAttribute("title", 'Zug „1. Zug" gesetzt');
    const stop = anfuehrungWaechterStarten(wurzel);
    expect(wurzel.querySelector("#a")!.textContent).toBe("Einsatz „Hochwasser“ übernommen");
    expect(wurzel.querySelector("#b")!.getAttribute("title")).toBe("Zug „1. Zug“ gesetzt");
    expect(wurzel.querySelector("#t")!.textContent).toBe('„roh"'); // Eingabefelder bleiben unberührt
    const neu = document.createElement("span");
    neu.textContent = 'Nr. 2 „THW"';
    wurzel.append(neu);
    wurzel.querySelector("#a")!.firstChild!.nodeValue = 'Nochmal „X"';
    await waitFor(() => expect(neu.textContent).toBe("Nr. 2 „THW“"));
    await waitFor(() => expect(wurzel.querySelector("#a")!.textContent).toBe("Nochmal „X“"));
    stop();
    wurzel.remove();
  });

  it("der Wächter schließt auch über mehrere Textknoten, wie React sie anlegt („, Name, \")", async () => {
    function Quittung({ name }: { name: string }) {
      return <p id="q"><strong>Abgerückt 17:50:</strong> Nr. 1 „{name}" und „{name}" noch einmal.</p>;
    }
    const wurzel = document.createElement("div");
    document.body.append(wurzel);
    const stop = anfuehrungWaechterStarten(wurzel);
    const r = render(<Quittung name="THW Biberach/Riß" />, { container: wurzel });
    await waitFor(() => expect(wurzel.querySelector("#q")!.textContent).toBe("Abgerückt 17:50: Nr. 1 „THW Biberach/Riß“ und „THW Biberach/Riß“ noch einmal."));
    // Ändert sich der Name, bleibt es dabei.
    r.rerender(<Quittung name="THW Ulm" />);
    await waitFor(() => expect(wurzel.querySelector("#q")!.textContent).toBe("Abgerückt 17:50: Nr. 1 „THW Ulm“ und „THW Ulm“ noch einmal."));
    // Ein gerades Zeichen ohne öffnendes „ bleibt, ebenso eines in einem neuen Satz nach Zeilenumbruch.
    expect(anfuehrung('5" Zoll')).toBe('5" Zoll');
    stop();
    wurzel.remove();
  });

  it("main.tsx startet den Wächter", () => {
    expect(readFileSync(`${process.cwd()}/src/app/main.tsx`, "utf8")).toMatch(/anfuehrungWaechterStarten\(/);
  });
});

describe("R17-A3 / W2 / K9 Nachtrag-CSV: der Vermerk steht in Zeile 1", () => {
  function nachtragSammlung() {
    const alt = bogen("Crailsheim", (b) => mitPersonen(b, 3));
    const neu = bogen("Bamberg", (b) => mitPersonen(b, 2));
    const mk = (id: string, b: Erfassungsbogen) => {
      const e = { id, einheitSchluessel: "", empfangenAm: 1, quelle: "scan" as const, status: MeldeStatus.ANWESEND, bogen: b } as MeldeEintrag;
      return e;
    };
    return { alt: mk("a", alt), neu: mk("b", neu) };
  }

  it("mitNachtragSpalte setzt die Vorspalte nur vor Kopf, Daten und Schlusszeilen", () => {
    expect(mitNachtragSpalte(["k", "d1", "d2", "s"], "VERMERK", 2)).toEqual(["VERMERK;k", "NACHTRAG;d1", "NACHTRAG;d2", ";s"]);
  });
});

describe("R17-A5 eigene Auswertung beim Einlesen", () => {
  it("die CSV des Stabs verweist auf Sammel-PDF und Sicherung, nicht auf „Personal“", () => {
    for (const name of [
      "eeb-einsatz-271913okt26_Hochwasser_Test.csv",
      "eeb-einsatz-271913okt26_Hochwasser_Test-alle-daten.csv",
      "eeb-einsatz-271913okt26_Test-oldenburg.xlsx", // Excel-Liste bis 2026-11; alte Dateien bleiben erkannt
      "2026-10-27_1913_eeb-einsatz_Hochwasser_Test.csv",
      "2026-10-27_1913_eeb-einsatz-alle-daten-nachtrag_Hochwasser_Test.csv",
      "2026-10-27_1913_eeb-einsatz-oldenburg_Test.xlsx",
    ]) {
      const art = name.endsWith("xlsx") ? "fremd" : "tabelle";
      const t = dateiFehlerText(name, art, "einsatz")!;
      expect(t, name).toContain("Sammel-PDF");
      expect(t, name).toContain("Datensicherung");
      expect(t, name).not.toContain("Personal");
    }
  });

  it("eine fremde Liste bleibt bei ihrem bisherigen Satz", () => {
    expect(dateiFehlerText("liste.csv", "tabelle", "boegen")).toContain("Schritt „Personal“");
  });
});

describe("R17-A6 ungültiger Einsatzzeitraum", () => {
  it("nennt ein Datum außerhalb des Bereichs „ungültiges Datum“, nie „undefined“", () => {
    expect(datumAnzeige(Number.MAX_SAFE_INTEGER)).toBe("ungültiges Datum");
    expect(datumAnzeige(1e12)).toBe("ungültiges Datum");
    expect(datumAnzeige(200)).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    const b = bogen("Spinner", (x) => { x.einsatz = { ...x.einsatz, zeitraumVon: 1e12, zeitraumBis: 1e12 + 5 }; });
    expect(zeitraumDeutsch(b)).not.toContain("undefined");
    const hinweise = pruefpunkte(b, true, 100).map((p) => p.text).join("\n");
    expect(hinweise).toContain("mehr als ein Jahr entfernt");
    expect(hinweise).not.toMatch(/undefined|\+0\d{5}/);
  });
});

describe("R17-W1 → R18-S2/W1 Die Quittung nennt Einheit und Folge vollständig, bis sie verschwindet", () => {
  it("zeigt den vollen Satz mit Namen und fällt nicht auf eine Kurzfassung zurück", () => {
    vi.useFakeTimers();
    render(
      <DaumenQuittung kurz="Nr. 2 abgerückt 17:41" onRueckgaengig={() => {}} onSchliessen={() => {}}>
        <strong>Abgerückt 17:41:</strong> Nr. 2 „THW Biberach/Riß Fachgruppe Ortung (B)“
      </DaumenQuittung>,
    );
    expect(document.querySelector(".quittung-text")!.textContent).toContain("THW Biberach");
    act(() => { vi.advanceTimersByTime(QUITTUNG_ENDE_NACH_MS - 10); });
    expect(document.querySelector(".quittung-daumen")!.className).not.toContain("quittung-kompakt");
    expect(document.querySelector(".quittung-text")!.textContent).toContain("THW Biberach");
  });
});

describe("R17-K3 / K11 Lagemonitor", () => {

  it("die Lageleiste des Telefons steht am Ende, die Angaben der Lagezeile bleiben ungeteilt", () => {
    expect(lmCss).toMatch(/\.lm-stufenleiste \{ order: 99;/);
    expect(lmCss).toMatch(/\.lm-nb \{ white-space: nowrap; \}/);
  });
});

describe("R17-K12 / K10 Einsatzansicht am Telefon", () => {
  it("die Erfassungsknöpfe folgen der Lage: erst Kennzahlen, Neues, Bedarf, dann die Knöpfe, dann die Liste (nur Darstellung)", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\) \{[\s\S]*main\.einsatz-detail \{ display: flex; flex-direction: column; \}/);
    expect(abschnitt).toMatch(/\.einsatz-seite > \.aktionen \{ order: 1;/);
    expect(abschnitt).toMatch(/main\.einsatz-detail > \.einsatz-liste, main\.einsatz-detail > \.einsatz-liste ~ \* \{ order: 2; \}/);
  });

  it("die Kennzahlen stehen am Telefon in drei Spalten, „Gesamt“ als breite Zelle", () => {
    expect(abschnitt).toMatch(/@media \(16rem < width <= 30rem\) \{[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
    expect(abschnitt).toMatch(/> div\.gesamt \{ grid-column: span 2; \}/);
  });

  it("„Angaben vom Zettel (optional)“ trägt ein Aufklappzeichen", () => {
    expect(abschnitt).toMatch(/details\.zettel-angaben > summary::before \{ content: "▸"/);
    expect(abschnitt).toMatch(/details\.zettel-angaben\[open\] > summary::before \{ content: "▾"/);
  });
});
