/**
 * Runde 13, Block Inhalte: Verhalten in der Oberfläche — Kurzzeile „Bedarf“ (R13-K1), Zug bei der Aufnahme (R13-W5),
 * Hinweis am Einsatzende (R13-W6), Quittung nach dem Abrücken (R13-W2), Startseite (R13-W3).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, MeldeStatus, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";
import { Dialogschicht } from "./dialoge";
import { ZugSchnellZuordnen } from "./einsaetze-ui";
import { statusMitZeitSetzen } from "./eintrag-zeiten";

const einsatzPdfErzeugen = vi.fn(async () => true);
vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: (...a: unknown[]) => (einsatzPdfErzeugen as (...x: unknown[]) => Promise<boolean>)(...a),
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

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  einsatzPdfErzeugen.mockClear();
});

function bogen(ort: string, mod: (b: Erfassungsbogen) => void = () => {}): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  mod(b);
  return b;
}

function schmalesTelefon() {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: true,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

describe("R13-K1 zugeklappte Bedarfszeile am Telefon nennt alle Kraftstoffe", () => {
  it("Diesel, Benzin und Gemisch stehen in der Zeile über dem Aufklapper", async () => {
    schmalesTelefon();
    const s = einsatzAnlegen("Hochwasser Kraftstoff", EinsatzArt.EINSATZ);
    meldungHinzufuegen(
      s.id,
      bogen("Wardenburg", (b) => {
        b.sofortbedarf = { verpflegungPersonen: 5, dieselLiter: 580, benzinLiter: 160, gemischLiter: 10, unterbringung: false, ruhezeitErforderlich: false };
      }),
    );
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Hochwasser Kraftstoff" });
    const kurz = document.querySelector(".bedarf-block summary .bedarf-werte")!;
    expect(kurz.textContent).toContain("Diesel 580 l");
    expect(kurz.textContent).toContain("Benzin 160 l");
    expect(kurz.textContent).toContain("Gemisch 10 l");
  }, 20000);
});

describe("R13-W6 Hinweis am Einsatzende", () => {
  it("erscheint, sobald alle Einheiten abgerückt sind, und führt zum Sichern; vorher nicht", async () => {
    const s = einsatzAnlegen("Hochwasser Ende", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen("Wardenburg"))!;
    const nutzer = userEvent.setup();
    const ansicht = render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Hochwasser Ende" });
    expect(document.body.textContent).not.toContain("Alle Einheiten sind abgerückt");
    ansicht.unmount();

    statusMitZeitSetzen(s.id, r.eintrag.id, MeldeStatus.ABGERUECKT);
    expect(einsaetzeLaden()[0]!.eintraege[0]!.status).toBe(MeldeStatus.ABGERUECKT);
    render(<App />);
    // Die App öffnet den zuletzt geöffneten Einsatz selbst wieder.
    await screen.findByRole("heading", { level: 1, name: "Hochwasser Ende" });
    expect(document.body.textContent).toContain("Alle Einheiten sind abgerückt");
    await nutzer.click(screen.getByRole("button", { name: "Jetzt sichern" }));
    await waitFor(() => expect(einsatzPdfErzeugen).toHaveBeenCalledTimes(1));
  }, 30000);
});

describe("R13-W3 Startseite: eine Aufteilung der Einheitenzahl", () => {
  it("Schnellzugriff und Karte nennen für die abgerückte einzige Einheit dasselbe", async () => {
    const s = einsatzAnlegen("Hochwasser Zahl", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen("Wardenburg"))!;
    statusMitZeitSetzen(s.id, r.eintrag.id, MeldeStatus.ABGERUECKT);
    render(<App />);
    // Seit R17-A7 gibt es keinen zweiten Schnelleinstieg mehr: Die Karte ist der einzige Eintrag.
    expect(document.querySelector(".sammlung-kenndaten")).toBeNull();
    expect(document.body.textContent).not.toContain("0 Einheit(en) anwesend");
    expect(document.body.textContent).toContain("1 Einheit gemeldet · 0 anwesend · Stärke");
  }, 20000);
});

describe("R13-W5 Zug gleich bei der Aufnahme", () => {
  function sammlung() {
    const s = einsatzAnlegen("Hochwasser Zug", EinsatzArt.EINSATZ);
    for (const ort of ["Alpha", "Beta", "Gamma"]) meldungHinzufuegen(s.id, bogen(ort));
    const eintraege = einsaetzeLaden()[0]!.eintraege;
    return { s, eintraege };
  }

  it("drei Einheiten ohne Zug: ein Feld, ein Tipp ordnet alle zu (Schreibweise wie an der Karte)", async () => {
    const { s, eintraege } = sammlung();
    const geaendert = vi.fn();
    const nutzer = userEvent.setup();
    render(
      <>
        <ZugSchnellZuordnen einsatzId={s.id} einheiten={eintraege} vorhandene={[]} onGeaendert={geaendert} />
        <Dialogschicht />
      </>,
    );
    const gruppe = screen.getByRole("group", { name: "Zug zuordnen" });
    expect(gruppe.textContent).toContain("Zug für 3 Einheiten ohne Zug:");
    const zuordnen = within(gruppe).getByRole("button", { name: "Zuordnen" }) as HTMLButtonElement;
    expect(zuordnen.disabled).toBe(true);
    await nutzer.type(within(gruppe).getByLabelText("Zug für diese Einheiten"), "2.Zug");
    await nutzer.click(zuordnen);
    expect(geaendert).toHaveBeenCalledTimes(1);
    expect(einsaetzeLaden()[0]!.eintraege.map((e) => e.zugEtikett)).toEqual(["2. Zug", "2. Zug", "2. Zug"]);
  });

  it("vergebene Züge stehen als Knöpfe: ein Tipp, und Tippfehler im Zugnamen entstehen nicht", async () => {
    const { s, eintraege } = sammlung();
    const geaendert = vi.fn();
    const nutzer = userEvent.setup();
    render(<ZugSchnellZuordnen einsatzId={s.id} einheiten={eintraege.slice(0, 2)} vorhandene={["1. Zug", undefined]} onGeaendert={geaendert} />);
    await nutzer.click(screen.getByRole("button", { name: "1. Zug" }));
    const zuege = einsaetzeLaden()[0]!.eintraege.map((e) => e.zugEtikett);
    expect(zuege.filter((z) => z === "1. Zug")).toHaveLength(2);
    expect(zuege.filter((z) => z === undefined)).toHaveLength(1);
  });

  it("zeigt nichts für Einheiten, die schon einen Zug haben oder abgerückt sind", () => {
    const { s, eintraege } = sammlung();
    const mitZug = eintraege.map((e, i) => (i === 0 ? { ...e, zugEtikett: "1. Zug" } : { ...e, status: MeldeStatus.ABGERUECKT }));
    render(<ZugSchnellZuordnen einsatzId={s.id} einheiten={mitZug} vorhandene={[]} onGeaendert={() => {}} />);
    expect(screen.queryByRole("group", { name: "Zug zuordnen" })).toBeNull();
  });
});
