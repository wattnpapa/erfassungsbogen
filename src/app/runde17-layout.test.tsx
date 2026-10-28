/**
 * Runde 17, Block Layout (Handschuh, Mobile-UI, Nacht, Feldtauglichkeit): Fußleiste und Kopf des Assistenten (G2, G3, G4, M1,
 * M2, M3, M4, H6, L2, N7), Tabelle am Telefon (H8, K7, G7), Quittungs- und Ansichtsleiste (H7, K6, G5, N3), Abstände (G1, G6,
 * G9, G10), Verweise der Startseite (G8, H9), Scanner quer (G12), Einlese-Meldung (G13), Doppeltipp (G11, H3, G14),
 * Offline-Zeile (H1), gesperrte Knöpfe (L1), Aufnahmeknöpfe (N6).
 *
 * Die Maße stehen im Bericht und sind im Produktionsbuild mit Playwright gemessen (Chromium, Touch); jsdom rechnet kein
 * Layout. Hier prüfen die Tests Verhalten (Bedienung, Zustände, Texte) und die Stilregeln in index.html. Die Tests der ganzen
 * App (Fußleiste, Kopf, Weiter-Takt, Einlese-Meldung) stehen in runde17-layout-app.test.tsx.
 */
import { readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht, frageFelder } from "./dialoge";
import { EinsatzDetail, tabellenSpaltenFuer } from "./einsaetze-ui";
import { Fusszeile } from "./fusszeile";
import { neuerBogen } from "./hilfen";
import { SchrittEinheit } from "./schritte/einheit";
import { ASSISTENT_SCHRITT_SPERRE_MS, ORTSSPERRE_MS, ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";
import { BALKEN_WEG_KLASSE, balkenEinziehen, balkenWeg } from "./balken-einziehen";
import { MAX_ZEILEN, fehlerZeilenBuendeln, type DateiFehler } from "./fehler-buendeln";
import { offlineText, offlineZeileOffen, type OfflineZustand } from "./offline-bereit";
import { gemerkteAlleSpalten, merkeAlleSpalten } from "./einheiten-tabelle";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 17 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 17 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

type Props = Parameters<typeof EinsatzDetail>[0];

/** Die Einsatzansicht auf dem aktuellen Speicherstand. */
function ansicht(namen: string[], extra: Partial<Props> = {}) {
  const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
  for (const n of namen) meldungHinzufuegen(angelegt.id, bogenMitName(n));
  const baum = () => (
    <>
      <EinsatzDetail
        einsatz={einsaetzeLaden().find((s) => s.id === angelegt.id)!}
        onZurueck={() => {}}
        onGeaendert={() => {}}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={() => {}}
        onBilderImport={() => {}}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onGeloescht={() => {}}
        {...extra}
      />
      <Dialogschicht />
    </>
  );
  const r = render(baum());
  return { neuLaden: () => r.rerender(baum()) };
}

/** Telefon: `matchMedia` meldet jede Abfrage als zutreffend (die Ansicht wählt dann ihre kompakte Form). */
function telefonSimulieren() {
  window.matchMedia = ((q: string) => ({
    matches: true,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("Fußleiste des Assistenten (R17-G4, M3, G2, G3, N7, H6)", () => {
  it("am Telefon eine Zeile: Zurück, Abschluss, Weiter; „◐“ entfällt (die Wahl steht im Kopf), „Weiter“ bleibt ein Wort", () => {
    expect(abschnitt).toMatch(
      /@media \(min-width: 17rem\) and \(max-width: 35\.99rem\) and \(not \(\(orientation: landscape\) and \(max-height: 31\.25rem\)\)\)/,
    );
    expect(abschnitt).toMatch(/grid-template-areas:\s*"zurueck mitte weiter";\s*grid-template-columns:\s*auto minmax\(0, 1fr\) auto/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav > \.anzeige-leiste\s*\{\s*display:\s*none/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav\.mit-uebernehmen \.nav-weiter-wort\s*\{\s*display:\s*inline/);
  });

  it("niedriges Querformat behält „◐“ (der Kopf trägt die Wahl dort nicht): kein Ausblenden außerhalb der Hochformat-Abfrage", () => {
    // Die Regel zum Ausblenden steht in genau einem Medienblock, und der schließt das niedrige Querformat aus.
    const blockStart = abschnitt.indexOf("@media (min-width: 17rem)");
    const ausblenden = abschnitt.indexOf("> .anzeige-leiste { display: none; }");
    expect(blockStart).toBeGreaterThan(-1);
    expect(ausblenden).toBeGreaterThan(blockStart);
    expect(abschnitt.slice(0, blockStart)).not.toMatch(/\.anzeige-leiste\s*\{\s*display:\s*none/);
  });

  it("jeder Knopf der Leiste misst mindestens 44 px: Abschluss und „◐“ tragen ein Mindestmaß", () => {
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav > \.uebernehmen\s*\{\s*min-height:\s*min\(calc\(var\(--ziel-basis\) \+ var\(--ziel\)\), calc\(44px \+ var\(--ziel\)\)\)/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav \.anzeige-leiste-knopf\s*\{\s*min-width:\s*calc\(44px \+ var\(--ziel\)\)/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav > \.nav-zurueck\s*\{[^}]*min-width:\s*calc\(44px \+ var\(--ziel\)\)/);
  });

  it("schmale Leiste zeigt „Übernehmen“ statt „In Einsatz übernehmen“ (Container unter 20,25 rem)", () => {
    expect(abschnitt).toMatch(/@container assistent-nav \(max-width: 20\.25rem\)\s*\{\s*footer\.nav\.assistent-nav \.nav-einsatz\s*\{\s*display:\s*none/);
    expect(abschnitt).toMatch(/\.nav-ue::first-letter\s*\{\s*text-transform:\s*uppercase/);
  });

  it("in der Schnellerfassung ist der Abschluss der dunkle Hauptknopf, „Weiter →“ der Nebenknopf", () => {
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav\.uebernehmen-haupt > \.uebernehmen\s*\{\s*background:\s*var\(--akzent\);\s*color:\s*var\(--auf-akzent\)/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav\.uebernehmen-haupt > \.nav-weiter\s*\{\s*background:\s*var\(--flaeche\)/);
  });
});

describe("Kopf des Assistenten am Telefon (R17-M1, L2, M2)", () => {
  it("der Rücksprung bricht den Einsatznamen um, statt ihn zu kürzen; die Marke mit demselben Namen entfällt", () => {
    expect(abschnitt).toMatch(/\.kopf-oberzeile \.zur-start\s*\{\s*display:\s*flex;\s*white-space:\s*normal;\s*overflow:\s*visible;\s*text-overflow:\s*clip;\s*overflow-wrap:\s*break-word/);
    expect(abschnitt).toMatch(/\.titelzeile \.modus-marke\.marke-einsatz\s*\{\s*display:\s*none/);
  });

  it("Erklärzeile und Speicherzeile teilen sich keine Zeile mit dem Rücksprung und bleiben einzeilig", () => {
    expect(abschnitt).toMatch(/\.kopf-oberzeile\s*\{\s*flex:\s*1 1 100%/);
    expect(abschnitt).toMatch(/\.schritte-erklaerung\s*\{\s*order:\s*4;\s*flex:\s*1 1 100%/);
    expect(abschnitt).toMatch(/\.autosave:not\(\.speicher-fehler\):not\(\.fest-warnung\)\s*\{\s*font-size:\s*min\(var\(--t-xs\), 13px\)/);
  });
});

describe("Platzhalter im Feld „Einheitstyp“ (R17-M4)", () => {
  it("passt am Telefon: kurzes Beispiel, und was nicht passt, endet mit „…“", () => {
    render(<SchrittEinheit bogen={neuerBogen()} aendern={() => {}} />);
    const feld = screen.getByRole("combobox", { name: "Einheitstyp" }) as HTMLInputElement;
    expect(feld.placeholder).toBe("z. B. Bergungsgruppe, FGr WP");
    expect(feld.placeholder.length).toBeLessThanOrEqual(30);
    expect(abschnitt).toMatch(/input::placeholder, textarea::placeholder\s*\{\s*text-overflow:\s*ellipsis/);
  });
});

describe("Tabelle am Telefon (R17-H8, K7, G7)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Kernspalten (R18-A5): Einheit, Gesamt, Eingetroffen, Zug (nur wenn vergeben), Auftrag — mit „Alle Spalten“ wie bisher", () => {
    const kern = (zug: boolean) => tabellenSpaltenFuer(zug, true, true).map((s) => s.schluessel);
    expect(kern(true)).toEqual(["einheit", "gesamt", "eingetroffen", "zugEtikett", "auftrag"]);
    expect(kern(false)).toEqual(["einheit", "gesamt", "eingetroffen", "auftrag"]);
    // Ohne Kern-Wunsch und auf großen Bildschirmen ändert sich nichts.
    expect(tabellenSpaltenFuer(true, true).length).toBeGreaterThan(20);
    expect(tabellenSpaltenFuer(true, false, true).length).toBeGreaterThan(20);
  });

  it("zeigt am Telefon zuerst die Kernspalten ohne Sortierknöpfe, „Alle Spalten zeigen“ bringt die Sortierköpfe zurück und wird gemerkt", async () => {
    telefonSimulieren();
    localStorage.setItem("eeb.einheiten-ansicht", "tabelle");
    const nutzer = userEvent.setup();
    ansicht(["Crailsheim", "Aalen"]);

    const tabelle = document.querySelector("table.einheiten-tabelle")!;
    expect(tabelle.classList.contains("tabelle-kern")).toBe(true);
    const koepfe = [...tabelle.querySelectorAll("thead th")].map((th) => th.textContent);
    // R20-N6, H11: Köpfe ausgeschrieben; ohne Auftrag und ohne Bedarf in irgendeiner Zeile entfällt die letzte (leere) Spalte.
    expect(koepfe).toHaveLength(3);
    expect(koepfe[0]).toMatch(/^Einheit/);
    expect(koepfe[1]).toMatch(/^Stärke/);
    expect(koepfe[2]).toMatch(/^Eingetroffen/);
    // Fünf Tippziele von 44 px stünden ohne Abstand nebeneinander: Die Köpfe sind dort nur Text.
    expect(tabelle.querySelectorAll("thead th button")).toHaveLength(0);
    // Name und Kernzahlen stehen in jeder Zeile.
    expect(tabelle.querySelectorAll("tbody tr")).toHaveLength(2);

    await nutzer.click(screen.getByRole("button", { name: "Alle Spalten zeigen" }));
    const alle = document.querySelector("table.einheiten-tabelle")!;
    expect(alle.classList.contains("tabelle-kern")).toBe(false);
    expect(alle.querySelectorAll("thead th button").length).toBeGreaterThan(20);
    expect(screen.getByRole("button", { name: "Nur Kernspalten" })).toBeDefined();
    expect(localStorage.getItem("eeb.einheiten-tabelle-alle-spalten")).toBe("1");
    expect(gemerkteAlleSpalten()).toBe(true);

    await nutzer.click(screen.getByRole("button", { name: "Nur Kernspalten" }));
    expect(localStorage.getItem("eeb.einheiten-tabelle-alle-spalten")).toBeNull();
  });

  it("am Rechner (breit) gibt es weder Umschalter noch Kernspalten", () => {
    localStorage.setItem("eeb.einheiten-ansicht", "tabelle");
    ansicht(["Crailsheim"]);
    expect(screen.queryByRole("button", { name: "Alle Spalten zeigen" })).toBeNull();
    expect(document.querySelector("table.tabelle-kern")).toBeNull();
    expect(document.querySelectorAll("thead th button").length).toBeGreaterThan(20);
  });

  it("merkt die Wahl nur, wenn der Speicher mitspielt (kein Wurf)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("voll");
    });
    expect(() => merkeAlleSpalten(true)).not.toThrow();
  });

  it("Stilregeln: feste Spaltenbreiten, „1. Zug“ unteilbar, Sortierköpfe der breiten Tabelle 8 px auseinander", () => {
    expect(abschnitt).toMatch(/table\.einheiten-tabelle\.tabelle-kern\s*\{\s*table-layout:\s*fixed;\s*width:\s*100%/);
    expect(abschnitt).toMatch(/table\.einheiten-tabelle\.tabelle-kern td\.zug-zelle\s*\{\s*white-space:\s*nowrap/);
    expect(abschnitt).toMatch(/th:has\(> \.spalten-sortierung\)\s*\{\s*padding-inline:\s*2px;\s*min-width:\s*52px/);
    expect(abschnitt).toMatch(/thead th > \.spalten-sortierung\s*\{\s*margin-inline:\s*2px;\s*width:\s*calc\(100% - 4px\)/);
  });
});

describe("Ansichtsleiste zieht sich beim Lesen ein (R17-N3, H7, G5, K6)", () => {
  it("balkenWeg: oben weg (der Kopf trägt die Wahl), beim Rollen nach unten weg, nach oben und am Ende da", () => {
    expect(balkenWeg(0, 0, 640, 5000, false)).toBe(true); // ganz oben
    expect(balkenWeg(500, 0, 640, 5000, false)).toBe(true); // nach unten
    expect(balkenWeg(450, 500, 640, 5000, true)).toBe(false); // nach oben
    expect(balkenWeg(445, 450, 640, 5000, false)).toBe(false); // Zittern ändert nichts
    expect(balkenWeg(455, 450, 640, 5000, true)).toBe(true); // … in beide Richtungen
    expect(balkenWeg(4400, 4000, 640, 5000, true)).toBe(false); // am Seitenende
    expect(balkenWeg(0, 0, 900, 700, true)).toBe(false); // Seite kürzer als das Bild
  });

  it("balkenEinziehen setzt und entfernt die Klasse am Wurzelelement und meldet sich ab", () => {
    const klassen = new Set<string>();
    const lauscher: Record<string, () => void> = {};
    const fenster = {
      scrollY: 0,
      innerHeight: 640,
      document: {
        documentElement: {
          scrollHeight: 5000,
          classList: {
            toggle: (k: string, an: boolean) => (an ? klassen.add(k) : klassen.delete(k)),
            remove: (k: string) => klassen.delete(k),
          },
        },
      },
      addEventListener: (n: string, f: () => void) => {
        lauscher[n] = f;
      },
      removeEventListener: (n: string) => {
        delete lauscher[n];
      },
      requestAnimationFrame: (f: () => void) => f(),
    };
    const rollen = (y: number) => {
      fenster.scrollY = y;
      lauscher.scroll?.();
      return klassen.has(BALKEN_WEG_KLASSE);
    };
    const ab = balkenEinziehen(fenster as unknown as Window);
    expect(klassen.has(BALKEN_WEG_KLASSE)).toBe(true); // oben
    expect(rollen(500)).toBe(true);
    expect(rollen(450)).toBe(false); // zurück: die Leiste kommt
    expect(rollen(440)).toBe(false);
    expect(rollen(600)).toBe(true);
    expect(rollen(4400)).toBe(false); // Seitenende: in dem Platz, den main frei hält
    ab();
    expect(klassen.has(BALKEN_WEG_KLASSE)).toBe(false);
    expect(lauscher.scroll).toBeUndefined();
  });

  it("die Einsatzansicht zieht die Leiste ein, solange sie offen ist (ganz oben: weg), und räumt beim Verlassen auf", async () => {
    // Eine lange Seite: oben ist die Leiste weg, weil der Kopf dieselbe Wahl trägt.
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 5000 });
    try {
      ansicht(["Crailsheim"]);
      await waitFor(() => expect(document.documentElement.classList.contains(BALKEN_WEG_KLASSE)).toBe(true));
      cleanup();
      expect(document.documentElement.classList.contains(BALKEN_WEG_KLASSE)).toBe(false);
    } finally {
      delete (document.documentElement as { scrollHeight?: number }).scrollHeight;
    }
  });

  it("Stilregeln: weg = unsichtbar (außer im Fokus), Quittung verdrängt die Leiste, Quittung steht nebeneinander", () => {
    expect(abschnitt).toMatch(/html\.balken-weg \.anzeige-balken:not\(:focus-within\)\s*\{\s*visibility:\s*hidden/);
    expect(abschnitt).toMatch(/html:has\(\.quittung-daumen\) \.anzeige-balken\s*\{\s*display:\s*none/);
    expect(abschnitt).toMatch(/html:has\(\.anzeige-balken\):has\(\.quittung-daumen\) \.quittung-daumen\s*\{\s*bottom:\s*max\(var\(--r-3\), env\(safe-area-inset-bottom\)\)/);
    expect(abschnitt).toMatch(/\.quittung-daumen:not\(\.quittung-kompakt\)\s*\{\s*flex-wrap:\s*nowrap/);
    expect(abschnitt).toMatch(/\.quittung-daumen > \.quittung-text\s*\{\s*flex:\s*1 1 0;\s*min-width:\s*0/);
  });
});

describe("Gleichartige Fehler beim Einlesen (R17-G13)", () => {
  const stand = "In der Datei ist kein Bogen lesbar — 1 von 1 Bogen ist unvollständig (der Stand (Zeitpunkt der letzten Änderung) fehlt) und wurde nicht übernommen.";
  const elf: DateiFehler[] = Array.from({ length: 11 }, (_, i) => ({ datei: `bogen-${String(i + 1).padStart(2, "0")}.json`, text: stand }));

  it("elf gleiche Meldungen werden ein Satz mit Zahl und den ersten Dateinamen", () => {
    const zeilen = fehlerZeilenBuendeln(elf);
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]).toContain(stand);
    expect(zeilen[0]).toContain("11 Dateien");
    expect(zeilen[0]).toContain("„bogen-01.json“");
    expect(zeilen[0]).toContain("und 8 weitere");
    expect(zeilen[0]).not.toContain("bogen-11.json");
  });

  it("eine einzelne Meldung bleibt, wie sie war (mit Namen vorn, wenn der Satz ihn nicht nennt)", () => {
    expect(fehlerZeilenBuendeln([{ datei: "a.json", text: "Die Datei ist beschädigt." }])).toEqual(["Die Datei ist beschädigt."]);
    expect(fehlerZeilenBuendeln([{ datei: "a.json", text: "1 von 1 Bogen ist unvollständig.", nameVorn: true }])).toEqual([
      "„a.json“: 1 von 1 Bogen ist unvollständig.",
    ]);
  });

  it("gleiche Sätze mit Namen vorn werden gezählt, verschiedene bleiben getrennt", () => {
    const zeilen = fehlerZeilenBuendeln([
      { datei: "a.json", text: "Stand fehlt.", nameVorn: true },
      { datei: "b.json", text: "Stand fehlt.", nameVorn: true },
      { datei: "c.csv", text: "„c.csv“ ist eine Tabelle." },
    ]);
    expect(zeilen).toEqual(["„a.json“, „b.json“ (2 Dateien): Stand fehlt.", "„c.csv“ ist eine Tabelle."]);
  });

  it("höchstens fünf Zeilen, der Rest wird gezählt", () => {
    const viele = Array.from({ length: 12 }, (_, i) => ({ datei: `d${i}.json`, text: `Grund ${i}.` }));
    const zeilen = fehlerZeilenBuendeln(viele);
    expect(zeilen).toHaveLength(MAX_ZEILEN);
    expect(zeilen[MAX_ZEILEN - 1]).toMatch(/^Und 8 weitere Meldungen/);
    expect(zeilen[0]).toBe("Grund 0.");
  });

  it("ohne Fehler keine Zeilen", () => {
    expect(fehlerZeilenBuendeln([])).toEqual([]);
  });
});

describe("Offline-Zeile in den ersten Sekunden (R17-H1)", () => {
  const basis: OfflineZustand = { stand: "bereit", frischBereit: true, online: true };

  it("ist „offen“, solange sie wechselt: Laden, bereit ohne Zählung, Beispielbögen n von m", () => {
    expect(offlineZeileOffen({ ...basis, stand: "laedt" })).toBe(true);
    expect(offlineZeileOffen({ ...basis, zweiStufen: true })).toBe(true);
    expect(offlineZeileOffen({ ...basis, zweiStufen: true, zusatz: { fertig: 12, gesamt: 549 } })).toBe(true);
  });

  it("ist in der Endfassung nicht mehr offen und hält dann nichts frei", () => {
    expect(offlineZeileOffen({ ...basis, zweiStufen: true, zusatz: { fertig: 549, gesamt: 549 } })).toBe(false);
    expect(offlineZeileOffen(basis)).toBe(false);
    expect(offlineZeileOffen({ ...basis, stand: "ohne" })).toBe(false);
  });

  it("die längste Fassung ist höchstens so lang wie die Reserve (6 Zeilen bei 360 px)", () => {
    const hakt = offlineText({ ...basis, zweiStufen: true, zusatz: { fertig: 12, gesamt: 549 }, zusatzHakt: true, zusatzVersuch: 2 });
    // Rund 38 Zeichen je Zeile bei 360 px und 14 px Schrift.
    expect(Math.ceil(hakt.length / 38)).toBeLessThanOrEqual(7);
    expect(abschnitt).toMatch(/\.offline-badge\.offline-offen\s*\{\s*min-height:\s*9rem/);
  });
});

describe("Doppeltipp (R17-G11, H3, G14)", () => {
  beforeEach(() => {
    localStorage.clear();
    tippSchutzZuruecksetzen();
  });

  it("G11 (R18-G3: 0,3 s): „Weiter →“ im Assistenten sperrt 0,3 s; ein Tipp nach 0,4 s kommt an, der Doppeltipp (≤ 0,2 s) nicht", () => {
    expect(ASSISTENT_SCHRITT_SPERRE_MS).toBe(300);
    expect(ASSISTENT_SCHRITT_SPERRE_MS).toBeLessThan(ORTSSPERRE_MS);
    const knopf = document.createElement("button");
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    const t0 = 1_800_000_000_000;
    const uhr = vi.spyOn(Date, "now").mockReturnValue(t0);
    const tipp = () => knopf.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 290, clientY: 606, detail: 1 }));
    tipp();
    ortSperren(ASSISTENT_SCHRITT_SPERRE_MS);
    uhr.mockReturnValue(t0 + 200);
    tipp(); // Doppeltipp: gesperrt
    expect(getroffen).toHaveBeenCalledTimes(1);
    uhr.mockReturnValue(t0 + 400);
    tipp(); // bewusstes Weitertippen: kommt an
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });

  it("H3: nach „Abrücken“ nimmt ein anderer Knopf der Karte sofort an — geschützt ist der Wechselknopf, nicht die Karte", async () => {
    const nutzer = userEvent.setup();
    ansicht(["Crailsheim"]);
    await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
    // Eine halbe Sekunde, nicht eine: der Tipp auf „Zug zuordnen“ öffnet das Feld.
    await nutzer.click(screen.getByRole("button", { name: "Zug zuordnen" }));
    expect(screen.queryByLabelText("Zug")).not.toBeNull();
  });

  it("H3: der Wechselknopf selbst bleibt im Prellfenster gesperrt (zweiter Tipp des Doppeltipps)", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = ansicht(["Crailsheim"]);
    await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
    neuLaden();
    const knopf = screen.getByRole("button", { name: "✓ Abgerückt" }) as HTMLButtonElement;
    expect(knopf.disabled).toBe(true);
  });

  it("G14: rückt die Karte beim Abrücken weit weg (ans Listenende), rollt die Ansicht um den Versatz nach — der Knopf bleibt unter dem Finger", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = ansicht(["Crailsheim"]);
    const proto = HTMLButtonElement.prototype;
    const vorher = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function (this: HTMLButtonElement) {
      const oben = this.textContent?.trim() === "Abrücken" ? 168 : 2168;
      return { top: oben, bottom: oben + 44, left: 33, right: 126, width: 93, height: 44, x: 33, y: oben, toJSON() {} } as DOMRect;
    };
    const rollen = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    try {
      await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
      neuLaden();
      expect(rollen).toHaveBeenCalledWith(0, 2000);
    } finally {
      proto.getBoundingClientRect = vorher;
    }
  });
});

describe("Gesperrte Knöpfe bleiben lesbar und nennen den Grund (R17-L1)", () => {
  it("„Alle Daten löschen“: bis zum Haken steht, was „Endgültig löschen“ braucht", async () => {
    const nutzer = userEvent.setup();
    render(
      <>
        <Fusszeile onBogenOeffnen={async () => true} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Alle Daten löschen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Alle lokalen Daten löschen']")!;
    const knopf = within(dialog).getByRole("button", { name: "Endgültig löschen" }) as HTMLButtonElement;
    expect(knopf.disabled).toBe(true);
    expect(within(dialog).getByText(/„Endgültig löschen“ geht erst, wenn der Haken gesetzt ist\./)).toBeDefined();
    await nutzer.click(within(dialog).getByLabelText(/Ja, alle lokalen Daten/));
    expect(knopf.disabled).toBe(false);
    expect(within(dialog).queryByText(/geht erst, wenn der Haken gesetzt ist/)).toBeNull();
  });

  it("„Einsatz anlegen“: der gesperrte Knopf nennt das fehlende Feld", async () => {
    render(<Dialogschicht />);
    void frageFelder({ titel: "Neue Einsatz-Sammlung anlegen", ok: "Einsatz anlegen", felder: [{ name: "name", label: "Name" }] });
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    expect((within(dialog).getByRole("button", { name: "Einsatz anlegen" }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(dialog).getByText(/Einsatz anlegen geht erst, wenn das Feld „Name“ ausgefüllt ist/)).toBeDefined();
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Hochwasser" } });
    await act(async () => {});
    expect((within(dialog).getByRole("button", { name: "Einsatz anlegen" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("Stilregel: Text in der Nebentextfarbe und gestrichelter Rand statt Deckkraft 0,4; Bestätigung und Fortschritt bleiben ausgenommen", () => {
    expect(abschnitt).toMatch(
      /button:disabled:not\(\.arbeitet\):not\(\.wechsel-quittiert\)\s*\{\s*opacity:\s*1;\s*color:\s*var\(--text-2\);\s*background:\s*var\(--flaeche-2\);\s*border:\s*var\(--strich-stark\) dashed var\(--linie-stark\)/,
    );
  });
});

describe("Abstände und Tippflächen (R17-G1, G6, G9, G10, G8, H9, N6, G12)", () => {
  it("G1, G10: Hinweisverweis und Filterverweise halten Abstand zu den Knöpfen", () => {
    expect(abschnitt).toMatch(/\.einheit-zeile \.muster-sub:has\(> button\.luecken-marke\)\s*\{\s*margin-bottom:\s*8px/);
    expect(abschnitt).toMatch(/p\.hinweis\.luecken-zaehler\s*\{\s*margin:\s*22px 0 20px/);
    expect(abschnitt).toMatch(/p\.hinweis\.ausgabe-sprung\s*\{\s*margin-top:\s*28px/);
  });

  it("G6: Schrittleiste, Karten | Tabelle, Vorschläge und Fußzeilenlisten berühren sich nicht", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf \.schritte\s*\{\s*gap:\s*4px/);
    expect(abschnitt).toMatch(/\.ansicht-umschalter\s*\{\s*gap:\s*6px !important/);
    expect(abschnitt).toMatch(/ul\.vorschlaege li \+ li\s*\{\s*margin-top:\s*4px/);
    expect(abschnitt).toMatch(/\.fuss-gruppe\s*\{\s*gap:\s*4px/);
    expect(abschnitt).toMatch(/footer\.seite \.fuss-werkzeuge\s*\{\s*row-gap:\s*4px/);
  });

  it("G9: „−“ und „+“ der Stärkefelder liegen 10 px auseinander", () => {
    expect(abschnitt).toMatch(/\.stepper\s*\{\s*gap:\s*10px/);
  });

  it("G8, H9: Verweise im Fließtext der Startseite sind 44-px-Ziele mit Abstand zur Nachbarzeile", () => {
    expect(abschnitt).toMatch(
      /\.start-seo a\s*\{\s*display:\s*inline-flex;\s*align-items:\s*center;\s*min-height:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\);\s*margin-block:\s*4px/,
    );
  });

  it("N6: auch am niedrigen Telefon tragen die Aufnahmeknöpfe ihre Unterzeile, untereinander", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\) and \(max-height: 720px\)\s*\{\s*main\.einsatz-detail \.einsatz-seite > \.aktionen\s*\{\s*display:\s*flex;\s*flex-direction:\s*column/);
    expect(abschnitt).toMatch(/\.aktionen > :not\(\.primaer\) \.knopf-zusatz\s*\{\s*display:\s*block/);
  });

  it("G12: Scanner ohne Kamera quer: Leiste einzeilig, Anleitung zweispaltig, Hinweiszeile frei", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 30rem\)\s*\{\s*\.scanner\s*\{\s*padding-top:\s*6px/);
    expect(abschnitt).toMatch(/\.scanner > \.scanner-aktionen\s*\{\s*flex-wrap:\s*nowrap/);
    expect(abschnitt).toMatch(/grid-template-areas:\s*"titel titel" "schritte lampe" "schritte hinweise"/);
  });
});
