/**
 * Runde 18, Block Layout: Aufnahme und Kennzahlen der Einsatzansicht (M1, G2, S1, W4, K3, N5, K9, S8, N4, M8), Knöpfe statt Verweise
 * (K6, G4, M4, L4, H7), Tabelle am Telefon (E5, S10, K8, M2, L1, M3), Scanner ohne Kamera (M5, L2, S9, H8), Karte (M7, S11),
 * Assistent (M6, M9, G5, W7), Rückfrage der Sollstärke (S4), Lagemonitor (L3), Offline-Zeile (K7, M10), Dialoge (D4).
 *
 * Die Maße stammen aus Messungen im Produktionsbuild mit Playwright (Chromium, Touch; Bericht des Blocks); jsdom rechnet kein Layout.
 * Hier stehen das Verhalten (Bedienung, Zustände, Texte) und die Stilregeln in index.html.
 */
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen, einsaetzeLaden } from "@bos/meldekopf/einsaetze";
import { Dialogschicht, frageWahl } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { neuerBogen } from "./hilfen";
import { QrScannerWeb } from "./qr-scanner-web";
import { offlineLangText, offlineText, type OfflineZustand } from "./offline-bereit";

vi.mock("./qr-decoder", () => ({ qrLeserLaden: async () => async () => null }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 18 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 18 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

function ansicht(namen: string[]) {
  const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
  for (const n of namen) meldungHinzufuegen(angelegt.id, bogenMitName(n));
  return render(
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
      />
      <Dialogschicht />
    </>,
  );
}

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

describe("Aufnahme und Kennzahlen (R18-M1, G2, S1, W4, K3, N5, K9, S8, N4, M8)", () => {
  it("Stilregeln: Bedarfsposten bricht in sich um; Aufnahme steht am Telefon vor Neuem, Bedarf und Summen (order 0)", () => {
    expect(abschnitt).toMatch(/\.bedarf-posten\s*\{\s*display:\s*inline-block;\s*max-width:\s*100%;\s*white-space:\s*normal;\s*overflow-wrap:\s*anywhere/);
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\)\s*\{\s*main\.einsatz-detail \.einsatz-seite > \.aktionen\s*\{\s*order:\s*0/);
  });

  it("Stilregeln: Kennzahlen auf einem Raster aus sechs Spalten, Gesamt über vier Spalten, gleiche Linien und Beschriftung", () => {
    expect(abschnitt).toMatch(/grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
    expect(abschnitt).toMatch(/div\.gesamt:nth-child\(n\)\s*\{\s*grid-column:\s*span 4/);
    expect(abschnitt).toMatch(/span\s*\{\s*font-size:\s*min\(var\(--t-xs\), 12\.5px\);\s*letter-spacing:\s*0/);
  });

  it("die Aufnahmeknöpfe stehen im Dokument direkt hinter den Kennzahlen (Reihenfolge für Tab und Vorleseprogramm)", () => {
    ansicht(["Crailsheim"]);
    const seite = document.querySelector(".einsatz-seite")!;
    const kinder = [...seite.children];
    const leiste = kinder.findIndex((e) => e.classList.contains("staerke-leiste"));
    const aktionen = kinder.findIndex((e) => e.classList.contains("aktionen"));
    expect(leiste).toBe(0);
    expect(aktionen).toBeGreaterThan(leiste);
    expect(kinder.slice(leiste + 1, aktionen).every((e) => e.tagName === "P")).toBe(true);
  });

  it("ohne Meldung steht kein Bedarf („Bedarf: Verpflegung 0“), mit Meldung schon (R18-N4)", () => {
    telefonSimulieren();
    ansicht([]);
    expect(document.querySelector(".bedarf-block")).toBeNull();
    expect(screen.queryByText(/Verpflegung 0/)).toBeNull();
    cleanup();
    localStorage.clear();
    ansicht(["Crailsheim"]);
    expect(document.querySelector(".bedarf-block")).not.toBeNull();
  });
});

describe("Knöpfe statt Textverweise (R18-K6, G4, M4, L4, H7)", () => {
  it("Stilregeln: „Gehört zu dieser Lage“ ist ein Knopf von Tippgröße; Quittungsverweise und Startseitenverweise ebenso", () => {
    expect(abschnitt).toMatch(/\.muster-sub button\.ort-knopf\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    expect(abschnitt).toMatch(/\.eingang-quittung button\.link\s*\{[^}]*min-height:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    expect(abschnitt).toMatch(/\.start-seo a\s*\{\s*min-width:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
  });

  it("die drei Entscheidungsknöpfe der Karte tragen die Klasse ort-knopf (Quelltext der Karte)", () => {
    const quelle = readFileSync(`${process.cwd()}/src/app/einsaetze-ui.tsx`, "utf8");
    for (const aufruf of ["ortGehoert(true)", "ortGehoert(false)", "fassungGilt(nachgereicht)"]) {
      expect(quelle).toMatch(new RegExp(`className="link ort-knopf"[^>]*onClick=\\{\\(\\) => void ${aufruf.replace(/[()]/g, "\\$&")}\\}`));
    }
  });
});

describe("Tabelle am Telefon (R18-E5, S10, K8, M2, L1, M3)", () => {
  beforeEach(() => localStorage.clear());

  it("ein Tipp irgendwo in der Zeile öffnet die Karte der Einheit und wechselt zu den Karten (nicht nur auf den Namen)", async () => {
    telefonSimulieren();
    localStorage.setItem("eeb.einheiten-ansicht", "tabelle");
    const nutzer = userEvent.setup();
    ansicht(["Crailsheim", "Aalen"]);
    const zeilen = document.querySelectorAll("table.einheiten-tabelle tbody tr");
    expect(zeilen).toHaveLength(2);
    expect(zeilen[1]!.classList.contains("zeile-antippbar")).toBe(true);
    const zelle = zeilen[1]!.querySelectorAll("td")[0]!;
    await nutzer.click(zelle);
    expect(document.querySelector("table.einheiten-tabelle")).toBeNull();
    const schluessel = (zeilen[1] as HTMLElement).dataset.einheit!;
    expect(JSON.parse(sessionStorage.getItem("eeb.karte-offen.v1")!).einheit).toBe(schluessel);
  });

  it("ein Tipp auf einen Knopf in der Zeile löst nur dessen Weg aus (kein zweites Öffnen)", async () => {
    telefonSimulieren();
    localStorage.setItem("eeb.einheiten-ansicht", "tabelle");
    const nutzer = userEvent.setup();
    ansicht(["Crailsheim", "Aalen"]);
    const knopf = document.querySelectorAll("table.einheiten-tabelle tbody tr")[0]!.querySelector("button.tabelle-oeffnen") as HTMLElement;
    const spy = vi.spyOn(Storage.prototype, "setItem");
    await nutzer.click(knopf);
    expect(spy.mock.calls.filter(([k]) => k === "eeb.karte-offen.v1")).toHaveLength(1);
  });

  it("Stilregeln: Köpfe und Marken mindestens 12 px, Name höchstens drei Zeilen, keine Deckfläche über der Tabelle, Einheitenspalte klebt", () => {
    expect(abschnitt).toMatch(/table\.einheiten-tabelle thead th, table\.einheiten-tabelle\.tabelle-kern thead th\s*\{\s*font-size:\s*12px/);
    expect(abschnitt).toMatch(/\.fassung-badge\s*\{\s*font-size:\s*12px/);
    expect(abschnitt).toMatch(/\.tabelle-name\s*\{[^}]*-webkit-line-clamp:\s*3/);
    expect(abschnitt).toMatch(/button\.tabelle-oeffnen::after\s*\{\s*content:\s*none/);
    expect(abschnitt).toMatch(/table\.einheiten-tabelle:not\(\.tabelle-kern\) > \* > tr > :first-child\s*\{\s*position:\s*sticky;\s*left:\s*0/);
    // Keine Schrift der Tabelle unter 12 px in dieser Gruppe.
    const kleine = [...abschnitt.matchAll(/table\.einheiten-tabelle[^{]*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
    expect(kleine.length).toBeGreaterThan(0);
    expect(Math.min(...kleine)).toBeGreaterThanOrEqual(12);
  });
});

describe("Scanner ohne Kamera (R18-M5, L2, S9, H8)", () => {
  it("„Kamera erneut versuchen“ steht in der Meldung, nicht in der Knopfleiste; die Leiste trägt nur Bildweg und Abbruch", async () => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
    const { container } = render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} onBild={() => {}} />);
    await screen.findByText(/gibt die Kamera für Webseiten nicht frei/);
    const erneut = screen.getByRole("button", { name: "Kamera erneut versuchen" });
    expect(container.querySelector(".scanner-text.fehler")!.contains(erneut)).toBe(true);
    const leiste = container.querySelector(".scanner-aktionen")!;
    expect(leiste.contains(erneut)).toBe(false);
    expect(within(leiste as HTMLElement).getByText("QR aus Bild einlesen…")).toBeDefined();
    expect(within(leiste as HTMLElement).getByRole("button", { name: "Abbrechen" })).toBeDefined();
    // Die Mitte rollt für sich, die Leiste steht darunter.
    expect(container.querySelector(".scanner-mitte.scrollt")).not.toBeNull();
    expect(container.querySelector(".scanner-mitte.scrollt")!.nextElementSibling).toBe(leiste);
  });

  it("Stilregeln: rollende Mitte, Leiste in der Reihenfolge statt klebend, 16 px zwischen den Knöpfen", () => {
    expect(abschnitt).toMatch(/\.scanner-mitte\.scrollt\s*\{[^}]*overflow-y:\s*auto/);
    expect(abschnitt).toMatch(/\.scanner:has\(> \.scanner-mitte\.scrollt\) > \.scanner-aktionen\s*\{\s*position:\s*static;[^}]*gap:\s*16px/);
  });
});

describe("Rückfrage mit einem Satz je Antwort (R18-S4)", () => {
  it("zeigt den Satz unter dem Knopf im festen Fuß; die Liste im Rumpf entfällt und der Knopf hängt am Satz", async () => {
    render(<Dialogschicht />);
    void frageWahl({
      titel: "Nur Sollplätze, keine gemeldete Stärke",
      text: "Niemand hat gezählt.",
      wege: [
        { wert: "eintragen", label: "Stärke jetzt eintragen", kurz: "Springt zum Personal." },
        { wert: "soll", label: "Als Sollstärke ablegen", kurz: "Zählt nur als Sollwert." },
      ],
    });
    const d = await screen.findByRole("dialog", { name: "Nur Sollplätze, keine gemeldete Stärke" });
    expect(d.querySelector(".abfrage-wegehinweise")).toBeNull();
    const fuss = d.querySelector(".abfrage-fuss")!;
    const knopf = within(d).getByRole("button", { name: "Als Sollstärke ablegen" });
    const satz = document.getElementById(knopf.getAttribute("aria-describedby")!)!;
    expect(satz.textContent).toBe("Zählt nur als Sollwert.");
    expect(fuss.contains(satz)).toBe(true);
    expect(d.querySelector(".abfrage-rumpf")!.textContent).not.toContain("Springt zum Personal.");
  });

  it("der Text der Sollstärke-Rückfrage ist kurz und trägt die Sätze als `kurz` (Quelltext)", () => {
    const quelle = readFileSync(`${process.cwd()}/src/app/app.tsx`, "utf8");
    expect(quelle).toMatch(/label: "Stärke jetzt eintragen", kurz:/);
    expect(quelle).toMatch(/label: "Als Sollstärke ablegen", kurz:/);
    expect(quelle).toMatch(/label: "Zahlen stimmen, so gezählt",\s*kurz:/);
  });
});

describe("Karte und Assistent am Telefon (R18-M7, S11, M6, M9, G5, W7)", () => {
  it("die Knöpfe der Karte tragen ihre Klassen für das Raster (Abrücken, Zug, Notiz, Details, PDF, Mehr, Zuklappen)", async () => {
    telefonSimulieren();
    const nutzer = userEvent.setup();
    ansicht(["Crailsheim"]);
    await nutzer.click(document.querySelector("button.karte-aufklappen") as HTMLElement);
    const reihe = document.querySelector(".einheit-zeile .vorlage-aktionen")!;
    for (const klasse of ["aktion-zuklappen", "aktion-details", "aktion-pdf", "wechsel-knopf", "aktion-zug", "aktion-notiz", "karte-mehr-knopf"]) {
      expect(reihe.querySelector(`button.${klasse}`), klasse).not.toBeNull();
    }
  });

  it("Stilregeln: Raster der Kartenknöpfe (drei Spalten, bei Feld und 320 px zwei), Abrücken zuerst", () => {
    expect(abschnitt).toMatch(/\.einheit-zeile \.vorlage-aktionen\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
    expect(abschnitt).toMatch(/html\.feld-modus \.einheit-zeile \.vorlage-aktionen\s*\{\s*grid-template-columns:\s*repeat\(2/);
    expect(abschnitt).toMatch(/@media \(max-width: 20\.5rem\)\s*\{\s*\.einheit-zeile \.vorlage-aktionen\s*\{\s*grid-template-columns:\s*repeat\(2/);
    expect(abschnitt).toMatch(/\.wechsel-knopf\s*\{\s*order:\s*1/);
  });

  it("Stilregeln: Reiter 44 px breit, 8 px Abstand, bei 320 px über den Textrand hinaus; Kopf im Querformat zweizeilig", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf \.schritte\s*\{\s*gap:\s*8px/);
    expect(abschnitt).toMatch(/\.schritte button\s*\{\s*min-width:\s*44px/);
    expect(abschnitt).toMatch(/@media \(max-width: 21rem\)\s*\{\s*:root:root \.seiten-kopf\.assistent-kopf \.schritte\s*\{\s*margin-inline:\s*-8px/);
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\)\s*\{\s*\.seiten-kopf\.assistent-kopf \.kopf-inhalt\s*\{\s*display:\s*flex/);
  });

  it("die Zettel-Zeile der Schnellerfassung trägt ihre Felder in einem Zusatz, der am Telefon entfällt", () => {
    const quelle = readFileSync(`${process.cwd()}/src/app/nacherfassung.tsx`, "utf8");
    expect(quelle).toMatch(/<span className="zettel-felder">: Eingetroffen um, Abgerückt um, Nr\., Zug<\/span>/);
    expect(abschnitt).toMatch(/details\.zettel-angaben > summary > \.zettel-felder\s*\{\s*display:\s*none/);
  });
});

describe("Lagemonitor und Dialoge (R18-L3, D4)", () => {
  it("gesperrte Stufenknöpfe behalten volle Deckkraft und nennen den Anschlag", () => {
    expect(abschnitt).toMatch(/\.lm-knopf\[aria-disabled="true"\]\s*\{\s*opacity:\s*1;\s*border-style:\s*dashed/);
    expect(abschnitt).toMatch(/\.lm-knopf\[data-anschlag\]::after\s*\{\s*content:\s*" \(am Ende\)"/);
    const quelle = readFileSync(`${process.cwd()}/src/app/lagemonitor-ui.tsx`, "utf8");
    expect(quelle).toMatch(/data-anschlag=\{dunkler == null \|\| undefined\}/);
    expect(quelle).toMatch(/data-anschlag=\{heller == null \|\| undefined\}/);
  });

  it("die feste Leiste der Rückfrage rollt bei Feld auf niedrigen Telefonen mit", () => {
    expect(abschnitt).toMatch(/@media \(max-height: 40rem\)\s*\{\s*html\.feld-modus dialog \.dialog-entscheidung\s*\{\s*position:\s*static/);
  });
});

describe("Offline-Zeile beim Erstbesuch (R18-K7, M10)", () => {
  const laedt: OfflineZustand = { stand: "laedt", frischBereit: false, online: true, kern: { geladen: 1_000_000, gesamt: 6_000_000 }, zweiStufen: true };

  it("die längste Fassung ist nie kürzer als die aktuelle und kürzer als nichts: sie deckt Laden, Abbruch, Haken und Funkloch ab", () => {
    for (const z of [
      laedt,
      { ...laedt, kernHakt: true },
      { ...laedt, abgebrochen: true },
      { ...laedt, stand: "bereit" as const, zusatz: { fertig: 5, gesamt: 549 } },
      { ...laedt, stand: "bereit" as const, zusatz: { fertig: 549, gesamt: 549 }, frischBereit: true },
      { ...laedt, stand: "bereit" as const, zusatz: { fertig: 5, gesamt: 549 }, online: false },
    ]) {
      expect(offlineLangText(z).length).toBeGreaterThanOrEqual(offlineText(z).length);
    }
  });

  it("die Endfassung ist deutlich kürzer als die längste (deshalb braucht die Zeile den Platzhalter)", () => {
    const fertig: OfflineZustand = { ...laedt, stand: "bereit", frischBereit: true, zusatz: { fertig: 549, gesamt: 549 } };
    expect(offlineLangText(fertig).length).toBeGreaterThan(offlineText(fertig).length + 40);
  });

  it("Stilregeln: Platzhalter liegt im selben Raster, unsichtbar, ohne Textknoten (Text im Attribut)", () => {
    expect(abschnitt).toMatch(/\.offline-platz\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
    expect(abschnitt).toMatch(/\.offline-platz > p\.offline-geist\s*\{\s*visibility:\s*hidden/);
    expect(abschnitt).toMatch(/p\.offline-geist::after\s*\{\s*content:\s*attr\(data-text\)/);
  });

  it("die Startseite legt den Platzhalter beim Erstbesuch unter die Zeile, ohne dass er gefunden oder vorgelesen wird", async () => {
    const { App } = await import("./app");
    Object.defineProperty(navigator, "serviceWorker", {
      value: { controller: null, ready: new Promise(() => {}), addEventListener: () => {}, removeEventListener: () => {}, getRegistration: async () => undefined },
      configurable: true,
    });
    render(<App />);
    const platz = document.querySelector(".offline-platz");
    expect(platz).not.toBeNull();
    const geist = platz!.querySelector("p.offline-geist")!;
    expect(geist.getAttribute("aria-hidden")).toBe("true");
    expect(geist.textContent).toBe("");
    expect(geist.getAttribute("data-text")!.length).toBeGreaterThan(100);
    fireEvent.scroll(window);
  });
});
