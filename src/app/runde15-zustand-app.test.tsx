/**
 * Runde 15, Block Zustand: Verhalten der ganzen App — Handscanner hält bei ungültiger Signatur an (E1), Satzbau und
 * Abbruch mehrteiliger Codes (E3), Hinweiszeile verschwindet mit der Zurück-Geste (S3), Rückfrage zu offenen
 * Folgeschritten (S4), Text des Neuladen-Dialogs nach „Sicherung einspielen“ (W4).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { encodePayload, encodePayloadUrl, fragmentInhalt, segmentPayloadUrls } from "@bos/eeb-format/codec";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen as einsatzImSpeicherAnlegen } from "@bos/meldekopf/einsaetze";
import { browserKompressor, neuerBogen } from "./hilfen";

vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => true,
  einsatzLageblattErzeugen: async () => true,
  blankoPdfErzeugen: async () => true,
}));
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

// Der Signaturstatus ist im Test steuerbar: ein echter, absichtlich veränderter Link würde schon beim Dekodieren scheitern.
let signaturZustand: "unsigniert" | "ungueltig" = "unsigniert";
vi.mock("@bos/eeb-format/signatur", async () => {
  const echt = await vi.importActual<typeof import("@bos/eeb-format/signatur")>("@bos/eeb-format/signatur");
  return {
    ...echt,
    signaturVonText: async (t: string) => (signaturZustand === "ungueltig" ? { zustand: "ungueltig" } : echt.signaturVonText(t)),
    signaturVonPayload: async (p: Uint8Array) => (signaturZustand === "ungueltig" ? { zustand: "ungueltig" } : echt.signaturVonPayload(p)),
  };
});

const { App } = await import("./app");

beforeEach(() => {
  signaturZustand = "unsigniert";
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

function fragmentSetzen(qrUrl: string): void {
  window.location.hash = fragmentInhalt(qrUrl);
  window.dispatchEvent(new Event("hashchange"));
}

/** Einsatz anlegen und den Kiosk-Scanner darin öffnen (wie in app.test.tsx). */
async function scannerImEinsatz(nutzer: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
  await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
  const anlegen = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
  await nutzer.type(within(anlegen).getByLabelText("Name"), "Meldekopfhausen");
  await nutzer.click(within(anlegen).getByRole("button", { name: "Einsatz anlegen" }));
  await nutzer.click(await screen.findByRole("button", { name: "Bogen scannen…" }));
  return screen.findByRole("dialog", { name: "QR-Code scannen" });
}

describe("R15-E1 Handscanner: ein Bogen mit ungültiger Signatur geht nicht grün durch", () => {
  it("zeigt eine Warnung statt „✓ aufgenommen“ und nimmt nichts auf; ein unsignierter Bogen daneben wird aufgenommen", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    const scanner = await scannerImEinsatz(nutzer);

    signaturZustand = "ungueltig";
    fragmentSetzen(encodePayloadUrl(bogenMitName("Veränderthausen"), browserKompressor));
    const warnung = await within(scanner).findByText(/nicht aufgenommen — Signatur ungültig/);
    expect(warnung.textContent).toMatch(/^⚠ „.*Veränderthausen.*" nicht aufgenommen/);
    expect(warnung.textContent).toContain("Nochmal scannen");
    expect(scanner.textContent).not.toContain("✓");
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(0);

    // Der nächste, unveränderte Bogen läuft durch — der Reihenscan geht weiter.
    signaturZustand = "unsigniert";
    fragmentSetzen(encodePayloadUrl(bogenMitName("Heilhausen"), browserKompressor));
    await within(scanner).findByText(/✓ „.*Heilhausen.*" aufgenommen/);
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1);
  }, 30000);
});

describe("R15-E3 Mehrteilige Codes im Handscanner", () => {
  it("Teil 2 zuerst: „Teil 2 gelesen — es fehlt noch Teil 1.“; „Abbrechen“ nennt, was verworfen wird", async () => {
    const nutzer = userEvent.setup();
    const teile = segmentPayloadUrls(encodePayload(bogenMitName("Teilhausen"), browserKompressor), 2);
    render(<App />);
    const scanner = await scannerImEinsatz(nutzer);

    fragmentSetzen(teile[1]!);
    const satz = await within(scanner).findByText(/Teil 2 gelesen/);
    expect(satz.textContent).toBe("Teil 2 gelesen — es fehlt noch Teil 1.");
    expect(scanner.textContent).not.toMatch(/Teil \d von \d gescannt/);

    await nutzer.click(within(scanner).getByRole("button", { name: "Abbrechen" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "QR-Code scannen" })).toBeNull());
    expect(document.body.textContent).toMatch(/1 von 2 Teilen verworfen\./);
  }, 30000);
});

describe("R15-S3 und S4 Schnellerfassung", () => {
  async function bisFahrzeuge(nutzer: ReturnType<typeof userEvent.setup>) {
    einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    await nutzer.click(
      within(document.querySelector<HTMLElement>("dialog[aria-label='Einheit schnell erfassen — für welche Sammlung?']")!).getByRole("button", { name: /Für „Sammelhausen" erfassen/ }),
    );
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Schnellhausen");
  }

  it("S4: im Schritt Fahrzeuge fragt „In Einsatz übernehmen“ nach, solange Fahrzeuge und Sofortbedarf offen sind", async () => {
    const nutzer = userEvent.setup();
    await bisFahrzeuge(nutzer);
    for (let i = 0; i < 2; i++) await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
    // R19-A6: In der Schnellerfassung (nur Stärke) fehlen Fahrzeuge und Sofortbedarf gewollt — keine Rückfrage dazu,
    // gleich die Rückfrage zur fehlenden Stärke.
    const frage = await screen.findByRole("dialog", { name: "Stärke fehlt" });
    expect(screen.queryByRole("dialog", { name: "Erfassung schon abschließen?" })).toBeNull();
    // „Stärke eintragen“: nichts aufgenommen, die Erfassung bleibt offen.
    await nutzer.click(within(frage).getByRole("button", { name: "Stärke eintragen" }));
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(0);
    expect(screen.queryByRole("heading", { level: 1, name: "Sammelhausen" })).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Stärke fehlt" })).getByRole("button", { name: "Trotzdem mit Stärke 0 übernehmen" }));
    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1);
  }, 40000);

  it("S3: nach „In Einsatz übernehmen“ und Zurück-Geste steht auf der Startseite keine Zeile zu einer einzelnen Einheit", async () => {
    const nutzer = userEvent.setup();
    await bisFahrzeuge(nutzer);
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Stärke fehlt" })).getByRole("button", { name: "Trotzdem mit Stärke 0 übernehmen" }));
    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
    // In der Sammlung gehört die Zeile hin ...
    // (R20-H2: als Teil der Aufnahme-Quittung mit der Nummer, nicht mehr als loser Satz am Seitenende.)
    expect(document.querySelector(".eingang-quittung")!.textContent).toMatch(/Zuletzt abgelegt: Nr\. 1 .*Nummer auf den Zettel schreiben/);
    expect(document.body.textContent).not.toMatch(/die Nummer auf dem Zettel eintragen/);
    await new Promise((r) => setTimeout(r, 50));
    act(() => { history.back(); });
    await waitFor(() => expect(screen.queryByRole("heading", { level: 1, name: "Sammelhausen" })).toBeNull());
    // ... auf der Startseite nicht.
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
    expect(document.body.textContent).not.toMatch(/Nummer auf den Zettel schreiben/);
  }, 40000);
});
