/**
 * Runde 20, Block Layout: Scanner ohne Kamera quer (E1, H8, G5, M2, S2, L5), Assistent und Schnellerfassung quer (G7, M3, S3, H7, M4),
 * Dialoge am kleinen Telefon (H9, M5, L2), Ziele von 44 px („Warum?", „ganz zeigen", Papierkorb; G1, M6, L1, O4, A4, D4, O5),
 * „Anderer Einsatz?"-Chip (G2, M1), „Zur Kenntnis genommen" (G3), Einheitenliste nach oben (W6, H5, G6, N4), Tabelle am Telefon
 * (N6, H11, H12, S5, E2), Startseite (A1), Kopf der Einsatzansicht (H4, G4), Abstände der Sprungverweise (H6), Ort im Vollassistenten (N2).
 *
 * Die Maße stammen aus Messungen im Produktionsbuild mit Playwright (Chromium, Touch; siehe Bericht); jsdom rechnet kein Layout. Hier stehen
 * das Verhalten (Bedienung, Reihenfolge, Texte) und die Stilregeln in index.html, Abschnitt „Runde 20 (Layout)".
 */
import { readFileSync } from "node:fs";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { StaerkeRolle, type Person } from "@bos/eeb-format/model";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail, KERN_KOPF, kuerzeAnWortgrenze, tabellenSpaltenFuer } from "./einsaetze-ui";
import { neuePerson, neuerBogen } from "./hilfen";
import { QrScannerWeb, hinweiseGeoeffnet } from "./qr-scanner-web";
import { KENNTNIS_SPERRE_MS, ORTSSPERRE_MS, ortFreigeben, ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";
import { Uebersicht } from "./schritte/uebersicht";
import { SchrittEinheit } from "./schritte/einheit";
import { SchrittBuehne } from "../test/schritt-buehne";

vi.mock("./qr-decoder", () => ({ qrLeserLaden: async () => async () => null }));

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 20 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 20 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

function telefon() {
  window.matchMedia = ((q: string) => ({
    matches: true,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

function bogenMitName(name: string) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

function Wirt({ id }: { id: string }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  return (
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={() => setEinsatz({ ...einsaetzeLaden().find((s) => s.id === id)! })}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={() => {}}
        onBilderImport={() => {}}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onWeitergeben={() => {}}
        onGeloescht={() => {}}
      />
      <Dialogschicht />
    </>
  );
}

describe("Runde 20 (Layout): die Stilregeln sind da", () => {
  it("der Abschnitt ist da", () => {
    expect(abschnitt.length).toBeGreaterThan(3000);
  });

  it("R20-E1, H8, G5, M2, S2, L5: Scanner ohne Kamera quer in einer Zeile, Rollkante und Rollleiste wo doch gerollt wird", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 30rem\) \{[\s\S]*\.scanner-text\.fehler \{[^}]*flex-wrap: nowrap/);
    expect(abschnitt).toMatch(/\.scanner-handscanner > \.handscanner-hinweise > summary \{[^}]*min-height: 44px/);
    expect(abschnitt).toContain(".scanner-mitte.scrollt::-webkit-scrollbar { width: 12px; }");
    expect(abschnitt).toMatch(/\.scanner-mitte\.scrollt \{[^}]*scrollbar-width: auto[^}]*linear-gradient\(#000 30%/);
  });

  it("R20-G7, M3, S3, H7, M4: Kopf des Assistenten quer in einer Zeile mit der Schrittleiste, Einsatzansicht quer mit Raster", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf\.assistent-kopf \.kopf-inhalt \{ flex-wrap: nowrap;/);
    expect(abschnitt).toMatch(/\.seiten-kopf\.assistent-kopf \.schritte \{ order: 2; flex: 0 0 auto;/);
    expect(abschnitt).toMatch(/grid-template-areas: "zur titel ansicht" "info info aendern"/);
  });

  it("R20-H9, M5, L2: „Datensicherung“ und „Alle Daten löschen“ am kleinen Telefon: Entscheidung klebt, Kopf klebt nicht", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\) and \(max-height: 40rem\) \{[\s\S]*dialog\.rollhinweis > \.kopfzeile:first-child \{ position: static;/);
    expect(abschnitt).toMatch(/dialog\.rollhinweis \.dialog-entscheidung \{ position: sticky; bottom: 0;/);
  });

  it("R20-G1, M6, L1, O4, A4: „ganz zeigen“, „Warum?“ und „Hinweise“ sind Ziele von mindestens einer Fingerhöhe ohne Überlappung", () => {
    expect(abschnitt).toMatch(/--ziel-karte: calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    expect(abschnitt).toMatch(/\.ort-warum > summary \{\s*display: inline-block;[^}]*min-height: var\(--ziel-karte, 44px\)[^}]*margin-bottom: 8px/);
    expect(abschnitt).toMatch(/button\.link\.zeit-aendern \{\s*display: inline-block;[^}]*margin: 0 0 0 0\.25rem/);
    expect(abschnitt).toMatch(/> button\.link\.luecken-marke \{\s*display: block; margin: 0;/);
  });

  it("R20-G2, M1: der Chip liegt über dem Aufklapp-Knopf der Karte", () => {
    expect(abschnitt).toMatch(/button\.kompakt-merkmal\.marke-knopf \{ position: relative; z-index: 2;/);
  });

  it("R20-W6, H5, G6: am Telefon steht die Liste vor Bedarf und Zwischensummen, der Sprung zur Liste entfällt", () => {
    expect(abschnitt).toMatch(/main\.einsatz-detail > \.einsatz-liste \{ order: 2; \}/);
    expect(abschnitt).toMatch(/details\.bedarf-block, main\.einsatz-detail \.einsatz-seite > details\.zug-summen,\s*main\.einsatz-detail \.einsatz-seite > details\.uebung-ausgenommen \{ order: 3; \}/);
    expect(abschnitt).toMatch(/p\.ausgabe-sprung:not\(\.ausgabe-sprung ~ \.ausgabe-sprung\) \{ display: none; \}/);
  });

  it("R20-H6: Sprungverweise und Tabellenknöpfe halten mindestens 8 px Abstand", () => {
    for (const regel of [/main\.einsatz-detail p\.hinweis\.ausgabe-sprung \{ margin: (\d+)px 0 0; \}/, /p\.hinweis\.ausgabe-sprung > button\.link \{[^}]*margin: 0 (\d+)px (\d+)px 0;/]) {
      const m = regel.exec(abschnitt);
      expect(m, String(regel)).not.toBeNull();
      for (const zahl of m!.slice(1)) expect(Number(zahl)).toBeGreaterThanOrEqual(8);
    }
    expect(abschnitt).toMatch(/p\.tabellen-spalten \{ margin-top: 10px; \}/);
    expect(abschnitt).toMatch(/p\.hinweis\.luecken-zaehler \{ margin-block: 4px 10px; \}/);
  });

  it("R20-S5, N6, H11: Tabelle am Telefon endet am Kartenrand, Zellen mindestens 14 px, Köpfe in Fließschrift", () => {
    expect(abschnitt).toMatch(/\.karte > \.tabellen-scroll:has\(> table\.einheiten-tabelle\) \{ margin-inline: -8px; \}/);
    expect(abschnitt).toMatch(/tabelle-kern thead th \{ font-family: inherit; text-transform: none; letter-spacing: 0; font-size: 14px;/);
    expect(abschnitt).toMatch(/tabelle-kern tbody td, :root:root table\.einheiten-tabelle\.tabelle-kern tbody th \{ font-size: 14px; vertical-align: top;/);
  });

  it("R20-E2: Erreichbarkeit unter dem Namen am Telefon, eigene Spalte darüber", () => {
    expect(abschnitt).toContain(".kontakt-unter { display: none; }");
    expect(abschnitt).toMatch(/table\.uebersicht \.kontakt-spalte \{ display: none; \}/);
  });

  it("R20-H4, G4: „Ansicht“ steht im Kopf der Einsatzansicht", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf\.einsatz-kopf \.anzeige-mit-name \{ display: inline-flex; \}/);
  });
});

describe("R20-A4: gekürzte Bemerkungen enden an einer Wortgrenze", () => {
  it("kürzt nie mitten im Wort und lässt kurze Texte stehen", () => {
    const text = "2 Helfer über StAN-Soll (Reserve aktiviert). Anhänger nicht mit ausgerückt.";
    expect(kuerzeAnWortgrenze("kurz", 40)).toBe("kurz");
    for (const grenze of [20, 30, 40, 50]) {
      const kurz = kuerzeAnWortgrenze(text, grenze);
      expect(kurz.endsWith(" …")).toBe(true);
      const stamm = kurz.slice(0, -2);
      expect(text.startsWith(stamm)).toBe(true);
      // Das nächste Zeichen im Original ist ein Leerzeichen: das letzte Wort ist ganz.
      expect(/\s/.test(text.charAt(stamm.length))).toBe(true);
    }
    expect(kuerzeAnWortgrenze(text, 40)).toBe("2 Helfer über StAN-Soll (Reserve …");
  });

  it("hart kürzen, wenn es kein Leerzeichen gibt", () => {
    expect(kuerzeAnWortgrenze("Wortohneleerzeichenundlang", 10)).toBe("Wortohnele …");
  });
});

describe("R20-L5: „Hinweise zum Handscanner“ aufgeklappt beginnt oben im Rollfenster", () => {
  it("rollt den Text beim Aufklappen an den Anfang, beim Zuklappen nicht", () => {
    const rollen = vi.fn();
    const offen = { currentTarget: { open: true, scrollIntoView: rollen } } as unknown as Parameters<typeof hinweiseGeoeffnet>[0];
    hinweiseGeoeffnet(offen);
    expect(rollen).toHaveBeenCalledWith({ block: "start" });
    rollen.mockClear();
    hinweiseGeoeffnet({ currentTarget: { open: false, scrollIntoView: rollen } } as unknown as Parameters<typeof hinweiseGeoeffnet>[0]);
    expect(rollen).not.toHaveBeenCalled();
  });

  it("im Scanner ohne Kamera löst das Aufklappen den Bildlauf aus", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn(async () => { throw Object.assign(new Error("NotFoundError"), { name: "NotFoundError" }); }) },
      configurable: true,
    });
    const rollen = vi.fn();
    HTMLElement.prototype.scrollIntoView = rollen;
    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);
    const details = await waitFor(() => {
      const d = document.querySelector<HTMLDetailsElement>("details.handscanner-hinweise");
      expect(d).not.toBeNull();
      return d!;
    });
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(rollen).toHaveBeenCalled();
    delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });
});

describe("R20-G3: nach „Zur Kenntnis genommen“ bleibt die Stelle unter dem Finger gesperrt", () => {
  function tipp(el: HTMLElement, x: number, y: number) {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1 }));
  }

  it("ein zweiter Tipp nach 1,5 s öffnet nichts; „Rückgängig“ gibt die Stelle frei", () => {
    expect(KENNTNIS_SPERRE_MS).toBeGreaterThan(1500);
    expect(KENNTNIS_SPERRE_MS).toBeGreaterThan(ORTSSPERRE_MS);
    const knopf = document.createElement("button");
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 100, 300); // „Zur Kenntnis genommen“
    ortSperren(KENNTNIS_SPERRE_MS, undefined, { marke: "kenntnis" });
    uhr.mockReturnValue(echt + 1500);
    tipp(knopf, 104, 298); // „Bögen einlesen…“ liegt jetzt dort
    expect(getroffen).toHaveBeenCalledTimes(1);
    ortFreigeben("kenntnis"); // „Rückgängig“: der Kasten ist wieder da
    uhr.mockReturnValue(echt + 1600);
    tipp(knopf, 100, 300);
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });

  it("nach Ablauf ist die Stelle frei", () => {
    const knopf = document.createElement("button");
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 100, 300);
    ortSperren(KENNTNIS_SPERRE_MS, undefined, { marke: "kenntnis" });
    uhr.mockReturnValue(echt + KENNTNIS_SPERRE_MS + 10);
    tipp(knopf, 100, 300);
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });
});

describe("R20-G2, M1: „Anderer Einsatz? Prüfen ▸“ bringt die Entscheidung ins Bild", () => {
  it("klappt die Karte auf und setzt den Fokus auf „Gehört zu dieser Lage“", async () => {
    telefon();
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    const liste = einsaetzeLaden();
    liste.find((x) => x.id === s.id)!.ort = "Ulm Donau";
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify(liste));
    const g = bogenMitName("Gamma");
    g.einsatz.ortAuftrag = "Waldbrand Cottbus";
    meldungHinzufuegen(s.id, g);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    const rollen = vi.fn();
    HTMLElement.prototype.scrollIntoView = rollen;
    render(<Wirt id={s.id} />);
    const karte = () => [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes("Gamma"))!;
    await nutzer.click(within(karte()).getByRole("button", { name: /Anderer Einsatz\? Prüfen/ }));
    const knopf = await within(karte()).findByRole("button", { name: "Gehört zu dieser Lage" });
    await waitFor(() => expect(document.activeElement).toBe(knopf));
    expect(rollen).toHaveBeenCalledWith({ block: "center" });
    delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });
});

describe("R20-N6, H11, H12: Kernspalten der Tabelle am Telefon", () => {
  it("Köpfe ausgeschrieben, die leere Bedarfsspalte entfällt", () => {
    expect(KERN_KOPF.gesamt).toBe("Stärke");
    expect(KERN_KOPF.eingetroffen).toBe("Eingetroffen");
    const kern = (auftrag: boolean, bedarf: boolean) => tabellenSpaltenFuer(false, true, true, auftrag, bedarf).map((s) => s.schluessel);
    expect(kern(false, true)).toEqual(["einheit", "gesamt", "eingetroffen", "bedarf"]);
    expect(kern(false, false)).toEqual(["einheit", "gesamt", "eingetroffen"]);
    expect(kern(true, false)).toEqual(["einheit", "gesamt", "eingetroffen", "auftrag"]);
  });

  it("das Alter der Angaben steht beim Namen, nicht in der Spalte „Eingetroffen“", () => {
    telefon();
    localStorage.setItem("eeb.einheiten-ansicht", "tabelle");
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const alt = bogenMitName("Alt");
    alt.stand -= 300;
    meldungHinzufuegen(s.id, alt);
    render(<Wirt id={s.id} />);
    const zeile = document.querySelector("table.tabelle-kern tbody tr")!;
    expect(zeile.querySelector("th .alter-marke")).not.toBeNull();
    expect(zeile.querySelector("td .alter-marke")).toBeNull();
    const koepfe = [...document.querySelectorAll("table.tabelle-kern thead th")].map((th) => th.textContent!);
    expect(koepfe.some((k) => /^Stärke/.test(k))).toBe(true);
    expect(koepfe.some((k) => /^Eingetroffen/.test(k))).toBe(true);
  });
});

describe("R20-H6: Sprungverweise unter den Kennzahlen", () => {
  it("die zwei Verweise zu Ausgabe und Abschluss stehen in einem Absatz, der Erklärsatz ist eigens auszublenden", () => {
    const s = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    const absaetze = [...document.querySelectorAll("p.ausgabe-sprung")];
    expect(absaetze).toHaveLength(2);
    expect(within(absaetze[0] as HTMLElement).getByRole("button", { name: /Zur Einheitenliste/ })).toBeDefined();
    const zweiter = absaetze[1] as HTMLElement;
    expect(within(zweiter).getByRole("button", { name: /Weitergeben, Lageblatt, Export/ })).toBeDefined();
    expect(within(zweiter).getByRole("button", { name: /Übergabe, Abschluss/ })).toBeDefined();
    expect(zweiter.querySelector(".sprung-erklaerung")).not.toBeNull();
  });
});

describe("R20-E2: Personaltabelle der Übersicht", () => {
  it("die Erreichbarkeit steht zusätzlich unter dem Namen (am Telefon), die Spalte gehört zum Tablet", () => {
    const bogen = neuerBogen();
    const person: Person = {
      ...neuePerson(),
      vorname: "Anna",
      nachname: "Ahrens",
      staerkeRolle: StaerkeRolle.FUEHRER,
      kontakte: [{ art: 0, dienstlich: true, wert: "441987654" }],
    };
    render(<Uebersicht bogen={{ ...bogen, personal: [person] }} geheZu={() => {}} neu={() => {}} />);
    const tabelle = document.querySelector("table.personal-tabelle")!;
    const zeile = tabelle.querySelector("tbody tr")!;
    expect(zeile.querySelector("td .kontakt-unter")!.textContent).toContain("441987654");
    expect(zeile.querySelector("td.kontakt-spalte")!.textContent).toContain("441987654");
    expect(tabelle.querySelector("th.kontakt-spalte")!.textContent).toBe("Erreichbarkeit");
  });

  it("ohne Kontakte gibt es weder Spalte noch Zeile unter dem Namen", () => {
    const bogen = neuerBogen();
    render(<Uebersicht bogen={{ ...bogen, personal: [{ ...neuePerson(), nachname: "Ahrens" }] }} geheZu={() => {}} neu={() => {}} />);
    expect(document.querySelector(".kontakt-unter")).toBeNull();
    expect(document.querySelector(".kontakt-spalte")).toBeNull();
  });
});

describe("R20-N2: Ort der Einheit im Vollassistenten", () => {
  beforeEach(() => localStorage.clear());
  it("steht vor „Zugehörigkeit / Kontaktstellen“ (nicht dahinter unter dem Falz) und nur einmal", () => {
    render(<SchrittBuehne komponente={SchrittEinheit} />);
    const ort = screen.getByLabelText("Ort der Einheit (Pflicht)");
    const zugehoerigkeit = screen.getByRole("heading", { name: "Zugehörigkeit / Kontaktstellen" });
    expect(ort.compareDocumentPosition(zugehoerigkeit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByLabelText("Ort der Einheit (Pflicht)")).toHaveLength(1);
    const organisation = screen.getByLabelText("Organisation");
    expect(organisation.compareDocumentPosition(ort) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("R20-A1: Startseite mit beendetem und übergebenem Einsatz", () => {
  async function reihenfolge(erledigt: boolean) {
    const s = einsatzAnlegen("Hochwasser Elbe", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    if (erledigt) {
      const { abschlussSetzen } = await import("./einsatz-abschluss");
      abschlussSetzen(s.id, { beendetAm: Date.now() - 3600_000, uebergabeAm: Date.now() - 1800_000, uebergabeAn: "Stab" }, [s.id]);
    }
    const { App } = await import("./app");
    render(<App />);
    const sammlung = screen.getByRole("heading", { name: "Einsatz-Sammlung (Meldekopf)" });
    const wege = screen.getByRole("heading", { name: "Meinen Bogen ausfüllen" });
    return sammlung.compareDocumentPosition(wege) & Node.DOCUMENT_POSITION_FOLLOWING ? "sammlung-zuerst" : "wege-zuerst";
  }

  it("ein laufender Einsatz steht über den beiden Wegen", async () => {
    expect(await reihenfolge(false)).toBe("sammlung-zuerst");
  });

  it("ist er beendet und übergeben, stehen die Wege vor seiner langen Karte", async () => {
    expect(await reihenfolge(true)).toBe("wege-zuerst");
  });
});
