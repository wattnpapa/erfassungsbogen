/**
 * Runde 17, Block Neuer Nutzer: Autokorrektur aus bei Namen und Orten (H2), „✓ Abgerückt" als Bestätigung statt Knopf und kein
 * zweites „neu" (N4, H4), Erklärung des Strichs im Reiter und Modus-Marken ohne Knopfrahmen (N5), Bildweg zuerst ohne Kamera (N8),
 * Erklärung der zwei CSV-Dateien (N9), Zeitraum und Uhrzeiten getrennt benannt (N10), Lagemonitor ausgeschrieben (N11).
 * N1/H5 (Namen einfügen) liegen im Block Zustand und werden dort getestet (runde17-zustand-ui.test.tsx).
 */
import { readFileSync } from "node:fs";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, MeldeStatus, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";
import { Dialogschicht, frageFelder } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { statusMitZeitSetzen } from "./eintrag-zeiten";
import { QrScannerWeb } from "./qr-scanner-web";
import { Lagemonitor } from "./lagemonitor-ui";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittEinsatz } from "./schritte/einsatz";
import { Uebersicht } from "./schritte/uebersicht";

vi.mock("./qr-decoder", () => ({ qrLeserLaden: async () => async () => null }));
vi.mock("./pdf", async () => {
  const echt = await vi.importActual<typeof import("./pdf")>("./pdf");
  return { ...echt, pdfErzeugen: async () => {}, einsatzPdfErzeugen: async () => true, einsatzLageblattErzeugen: async () => true };
});

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 17 (Neuer Nutzer) ===== */");
  const bis = html.indexOf("/* ===== Ende Runde 17 (Neuer Nutzer) ===== */");
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

type Props = Parameters<typeof EinsatzDetail>[0];

function Wirt({ id }: { id: string }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  const extra: Partial<Props> = {};
  return (
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={() => setEinsatz(einsaetzeLaden().find((s) => s.id === id)!)}
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
}

function bogen(ort: string) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  return b;
}

function karteVon(name: string): HTMLElement {
  return [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes(name))!;
}

describe("R17-H2 keine Autokorrektur bei Funkrufname, Einsatzname, Ort und Auftrag", () => {
  it("die Felder einer Rückfrage (Name, Ort/Auftrag) schalten Autokorrektur und Rechtschreibprüfung ab", async () => {
    render(<Dialogschicht />);
    void frageFelder({
      titel: "Neue Einsatz-Sammlung anlegen",
      ok: "Einsatz anlegen",
      felder: [
        { name: "name", label: "Name", platzhalter: "z. B. Hochwasser Weser" },
        { name: "ort", label: "Ort / Auftrag (optional)", optional: true },
        { name: "notiz", label: "Notiz", mehrzeilig: true },
      ],
    });
    const felder = await screen.findAllByRole("textbox");
    expect(felder).toHaveLength(3);
    for (const f of felder) {
      expect(f.getAttribute("autocorrect")).toBe("off");
      expect(f.getAttribute("spellcheck")).toBe("false");
    }
  });

  it("das Feld „Auftrag/Notiz“ der Karte hat Autokorrektur und Prüfung aus", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Notiz", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Crailsheim"));
    render(<Wirt id={s.id} />);
    await nutzer.click(within(karteVon("Crailsheim")).getByRole("button", { name: "Auftrag/Notiz" }));
    const feld = screen.getByLabelText("Auftrag/Notiz");
    expect(feld.getAttribute("autocorrect")).toBe("off");
    expect(feld.getAttribute("spellcheck")).toBe("false");
  });

  it("das Feld „Funkrufname (optional)“ am Lagemonitor hat Autokorrektur und Prüfung aus", async () => {
    const s = einsatzAnlegen("Hochwasser Funk", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Crailsheim"));
    render(<Wirt id={s.id} />);
    const feld = await screen.findByLabelText(/Funkrufname \(optional\)/, undefined, { timeout: 5000 });
    expect(feld.getAttribute("autocorrect")).toBe("off");
    expect(feld.getAttribute("spellcheck")).toBe("false");
  });
});

describe("R17-N4 / H4 „✓ Abgerückt“ ist eine Bestätigung, kein Knopf", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("steht nach dem Abrücken gesperrt am Platz des Wechselknopfs und ist ohne Rahmen und Grund gestaltet", async () => {
    const nutzer = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const s = einsatzAnlegen("Hochwasser Abrücken", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Crailsheim"));
    render(<Wirt id={s.id} />);
    await nutzer.click(within(karteVon("Crailsheim")).getByRole("button", { name: "Abrücken" }));
    const bestaetigung = within(karteVon("Crailsheim")).getByRole("button", { name: "✓ Abgerückt" }) as HTMLButtonElement;
    expect(bestaetigung.disabled).toBe(true);
    expect(bestaetigung.className).toContain("wechsel-quittiert");
    // Das Stylesheet nimmt dem gesperrten Knopf Rahmen und Grund — er sieht aus wie eine Anzeige.
    expect(abschnitt).toMatch(/button\.wechsel-knopf\.wechsel-quittiert:disabled\s*\{[^}]*border-color:\s*transparent[^}]*background:\s*transparent/);
    // Danach folgt der benannte Rückweg.
    await waitFor(() => expect(within(karteVon("Crailsheim")).getByRole("button", { name: "Wieder anwesend" })).toBeTruthy(), { timeout: 4000 });
  }, 20000);

  it("eine zurückgeholte Einheit trägt nicht erneut die Marke „neu“", () => {
    const s = einsatzAnlegen("Hochwasser Neu", EinsatzArt.EINSATZ);
    const a = meldungHinzufuegen(s.id, bogen("Crailsheim"))!.eintrag;
    meldungHinzufuegen(s.id, bogen("Aalen"));
    statusMitZeitSetzen(s.id, a.id, MeldeStatus.ABGERUECKT, Date.now());
    statusMitZeitSetzen(s.id, a.id, MeldeStatus.ANWESEND, Date.now());
    render(<Wirt id={s.id} />);
    expect(karteVon("Aalen").querySelector(".neu-badge")).not.toBeNull(); // Vergleich: die unberührte Einheit bleibt „neu"
    expect(karteVon("Crailsheim").querySelector(".neu-badge")).toBeNull();
  });
});

describe("R17-N5 Strich im Reiter und Modus-Marke", () => {
  it("die Schnellerfassung erklärt auf Schritt 1 den Strich und nennt ihn „entfällt“ für Vorlesesoftware", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    expect(document.querySelector(".schritte-erklaerung")!.textContent).toMatch(/Schritt 2 und 5 entfallen/);
    expect(screen.getByRole("button", { name: /^2\. .* entfällt in der Schnellerfassung$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^5\. .* entfällt in der Schnellerfassung$/ })).toBeTruthy();
    await nutzer.click(screen.getByRole("button", { name: /^3\. Personal/ }));
    expect(document.querySelector(".schritte-erklaerung")).toBeNull();
  });

  it("der volle Bogen zeigt die Erklärzeile nicht", () => {
    render(<SchrittBuehne komponente={SchrittEinsatz} />);
    expect(document.querySelector(".schritte-erklaerung")).toBeNull();
  });

  it("die Modus-Marken im Kopf haben keinen Knopfrahmen mehr", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf \.modus-marke\s*\{[^}]*border-color:\s*transparent/);
  });
});

describe("R17-N8 Scanner ohne Kamera: der Bildweg steht zuerst", () => {
  const echt = navigator.mediaDevices;
  afterEach(() => {
    Object.defineProperty(navigator, "mediaDevices", { value: echt, configurable: true });
  });

  it("zeigt „QR aus Bild einlesen…“ oben im Rahmen, einmal, vor dem Handscanner", async () => {
    const fehler = Object.assign(new Error("x"), { name: "NotFoundError" });
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: vi.fn(async () => { throw fehler; }) }, configurable: true });
    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} onBild={() => {}} />);
    await screen.findByText("Dieses Gerät meldet keine nutzbare Kamera.");
    const rahmen = document.querySelector(".scanner-handscanner")!;
    expect(screen.getAllByText("QR aus Bild einlesen…")).toHaveLength(1);
    const bild = rahmen.querySelector(".scanner-bildweg label.datei-knopf")!;
    expect(bild.textContent).toContain("QR aus Bild einlesen…");
    expect(bild.className).toContain("primaer");
    const titel = [...rahmen.querySelectorAll(".handscanner-titel")].map((t) => t.textContent);
    expect(titel[0]).toMatch(/Foto oder Bildschirmfoto/);
    expect(titel[1]).toBe("Oder mit dem USB-Handscanner scannen");
    expect(bild.compareDocumentPosition(rahmen.querySelector(".scanner-schritte")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("bei blockierter Erlaubnis bleibt der Rat zum Freischalten, der Bildweg ebenfalls oben", async () => {
    const fehler = Object.assign(new Error("x"), { name: "NotAllowedError" });
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: vi.fn(async () => { throw fehler; }) }, configurable: true });
    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} onBild={() => {}} />);
    await screen.findByText(/Die Kamera ist für diese Seite blockiert/);
    expect(document.querySelector(".scanner-handscanner .scanner-bildweg")).not.toBeNull();
  });

  it("läuft die Kamera, bleibt der Bildknopf in der Knopfleiste", async () => {
    const spur = { stop: () => {}, getSettings: () => ({ deviceId: "" }) };
    const stream = { getTracks: () => [spur], getVideoTracks: () => [spur] } as unknown as MediaStream;
    HTMLMediaElement.prototype.play = vi.fn(async () => {});
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: vi.fn(async () => stream) }, configurable: true });
    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} onBild={() => {}} />);
    await waitFor(() => expect(document.querySelector(".scanner-aktionen label.datei-knopf")).not.toBeNull());
    expect(document.querySelector(".scanner-bildweg")).toBeNull();
  });
});

describe("R17-N9 die zwei CSV-Dateien sind erklärt", () => {
  it("nennt unter den Knöpfen, was „Übersicht“ und „Alle Daten“ enthalten und ob Namen dabei sind", () => {
    const s = einsatzAnlegen("Hochwasser CSV", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Crailsheim"));
    render(<Wirt id={s.id} />);
    const text = document.querySelector(".csv-erklaerung")!.textContent!;
    expect(text).toMatch(/Übersicht.*eine Zeile je Einheit.*ohne Namen/);
    expect(text).toMatch(/Alle Daten.*je Person.*Namen und Rufnummern.*je Fahrzeug/);
  });
});

describe("R17-N10 Zeitraum und Uhrzeit von Beginn und Ende", () => {
  it("Schritt 2 benennt beide Gruppen und stellt den Erklärsatz über die Kästchen", () => {
    render(<SchrittBuehne komponente={SchrittEinsatz} />);
    const titel = [...document.querySelectorAll(".gruppen-titel")].map((t) => t.textContent);
    expect(titel[0]).toMatch(/^Zeitraum: die Tage/);
    expect(titel[1]).toMatch(/^Uhrzeit von Beginn und Ende/);
    const erklaerung = screen.getByText(/Setzt die aktuelle Uhrzeit, danach änderbar/);
    const kaestchen = screen.getByLabelText("Einsatzbeginn eintragen");
    expect(erklaerung.compareDocumentPosition(kaestchen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("die Übersicht schreibt „Zeitraum (Tage)“ und „Uhrzeit Beginn / Ende“", () => {
    render(<Uebersicht bogen={neuerBogen()} geheZu={() => {}} neu={() => {}} />);
    expect(screen.getByText("Zeitraum (Tage)")).toBeTruthy();
    expect(screen.getByText("Uhrzeit Beginn / Ende")).toBeTruthy();
  });
});

describe("R17-N11 Lagemonitor: Stärke ausgeschrieben", () => {
  it("schreibt Führer / Unterführer / Mannschaft = gesamt statt F / U / M // gesamt", () => {
    const s = einsatzAnlegen("Lage Stärke", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Crailsheim"));
    render(<Lagemonitor einsatzId={s.id} />);
    const zeile = document.querySelector(".lm-r3")!;
    expect(zeile.textContent).toContain("Stärke Führer / Unterführer / Mannschaft = gesamt");
    expect(zeile.textContent).not.toContain("//");
    expect(zeile.textContent).toMatch(/\d+ \/ \d+ \/ \d+ = \d+/);
  });
});
