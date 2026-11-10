/**
 * Runde 17, Block Neuer Nutzer: Autokorrektur aus bei Namen und Orten (H2), „✓ Abgerückt" als Bestätigung statt Knopf und kein
 * zweites „neu" (N4, H4), Erklärung des Strichs im Reiter und Modus-Marken ohne Knopfrahmen (N5), Bildweg zuerst ohne Kamera (N8),
 * Erklärung der zwei CSV-Dateien (N9), Zeitraum und Uhrzeiten getrennt benannt (N10), Lagemonitor ausgeschrieben (N11).
 * N1/H5 (Namen einfügen) liegen im Block Zustand und werden dort getestet (runde17-zustand-ui.test.tsx).
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuerBogen } from "./hilfen";
import { Dialogschicht, frageFelder } from "./dialoge";
import { QrScannerWeb } from "./qr-scanner-web";
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
});

describe("R17-N5 Strich im Reiter und Modus-Marke", () => {

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

  it("nennt den Bildweg zuerst und zeigt „QR aus Bild einlesen…“ einmal als Hauptknopf", async () => {
    const fehler = Object.assign(new Error("x"), { name: "NotFoundError" });
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: vi.fn(async () => { throw fehler; }) }, configurable: true });
    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} onBild={() => {}} />);
    await screen.findByText("Dieses Gerät meldet keine nutzbare Kamera.");
    const rahmen = document.querySelector(".scanner-handscanner")!;
    expect(screen.getAllByText("QR aus Bild einlesen…")).toHaveLength(1);
    // Immer dieselbe Instanz in der Knopfleiste (ein Neuaufbau beim Kamerafehler verlöre ein schon gewähltes Bild), nur als Hauptknopf.
    const bild = document.querySelector(".scanner-aktionen label.datei-knopf")!;
    expect(bild.textContent).toContain("QR aus Bild einlesen…");
    expect(bild.className).toContain("primaer");
    const titel = [...rahmen.querySelectorAll(".handscanner-titel")].map((t) => t.textContent);
    expect(titel[0]).toMatch(/Foto oder Bildschirmfoto/);
    expect(titel[1]).toBe("Oder mit dem USB-Handscanner scannen");
  });

  it("bei blockierter Erlaubnis bleibt der Rat zum Freischalten, der Bildweg ebenfalls zuerst genannt", async () => {
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

  // Seit Schema 11 trägt der Zeitraum eine Uhrzeit (vorbelegt 08:00–18:00) — „(Tage)" stimmt nicht mehr.
  it("die Übersicht schreibt „Zeitraum“ mit Uhrzeit und „Uhrzeit Beginn / Ende“", () => {
    render(<Uebersicht bogen={neuerBogen()} geheZu={() => {}} neu={() => {}} />);
    expect(screen.getByText("Zeitraum")).toBeTruthy();
    expect(screen.getByText(/, 08:00 – .*, 18:00$/)).toBeTruthy();
    expect(screen.getByText("Uhrzeit Beginn / Ende")).toBeTruthy();
  });
});
