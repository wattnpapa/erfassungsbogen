/**
 * Runde 20, Block Speicher, Verhalten der ganzen App (jsdom): L3 (Zeile „zuletzt erzeugt“ bei vollem Speicher), O5/D4 (Papierkorb der Einsätze
 * auf der Startseite), D3 (Nummernwechsel beim Zusammenführen, Rückgängig, bleibender Hinweis).
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, einsatzLoeschen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";
import { einsatzDateiInhalt } from "./einsatz-transport";
import { nummernHinweisLaden } from "./nummern-hinweis";

const geladen: { name: string }[] = [];
vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => true,
  einsatzLageblattErzeugen: async () => true,
  blankoPdfErzeugen: async () => true,
}));
vi.mock("./hilfen", async () => {
  const echt = await vi.importActual<typeof import("./hilfen")>("./hilfen");
  return { ...echt, blobAlsDownload: (name: string) => void geladen.push({ name }) };
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
  vi.restoreAllMocks();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
  geladen.length = 0;
});

function bogen(name: string) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

describe("R20-L3 Export bei vollem Speicher: „zuletzt erzeugt“ und Übergabe-Liste sagen dasselbe", () => {
  it("ohne gespeicherten Vermerk steht keine Zeile „zuletzt erzeugt“, die Quittung nennt den fehlenden Vermerk", async () => {
    const s = einsatzAnlegen("Hochwasser Voll", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Hochwasser Voll" });

    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.startsWith("eeb.export-stand")) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      return echt.call(this, k, v);
    });
    await nutzer.click(screen.getByRole("button", { name: "Übersicht als CSV" }));
    await waitFor(() => expect(geladen.length).toBeGreaterThan(0));
    await waitFor(() => expect(document.body.textContent).toContain("Vermerk nicht gespeichert (Speicher voll)"));
    expect(document.body.textContent).not.toMatch(/Übersicht als CSV: zuletzt erzeugt/);
  }, 30000);

  it("mit gespeichertem Vermerk steht die Zeile da (Gegenprobe)", async () => {
    const s = einsatzAnlegen("Hochwasser Frei", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Hochwasser Frei" });
    await nutzer.click(screen.getByRole("button", { name: "Übersicht als CSV" }));
    await waitFor(() => expect(document.body.textContent).toMatch(/Übersicht als CSV: zuletzt erzeugt/));
  }, 30000);
});

describe("R20-O5/D4 Papierkorb der Einsätze auf der Startseite", () => {
  it("ein gelöschter Einsatz hinterlässt oben einen 44-px-Knopf, der den Papierkorb öffnet", async () => {
    const s = einsatzAnlegen("Hochwasser Weg", EinsatzArt.EINSATZ);
    einsatzLoeschen(s.id);
    Element.prototype.scrollIntoView = vi.fn();
    const nutzer = userEvent.setup();
    render(<App />);
    const hinweis = document.querySelector<HTMLElement>(".papierkorb-hinweis")!;
    expect(hinweis.textContent).toContain("1 Einsatz liegt im Papierkorb (30 Tage rückholbar)");
    // Er steht vor den beiden Wegen der Weiche, nicht darunter.
    const weiche = document.querySelector<HTMLElement>(".weiche")!;
    expect(hinweis.compareDocumentPosition(weiche) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await nutzer.click(within(hinweis).getByRole("button", { name: "Zum Papierkorb" }));
    const umschalter = await screen.findByRole("button", { name: "Papierkorb Einsätze ausblenden" });
    expect(umschalter.className).toContain("papierkorb-umschalter");
    expect(screen.getByRole("button", { name: "Wiederherstellen" })).toBeDefined();
  });
});

describe("R20-D4 Papierkorb-Umschalter in Fingergröße", () => {
  it("die Regel im Abschnitt „Runde 20 (Speicher)“ der index.html gibt dem Knopf mindestens 44 px (im Browser gemessen: 44 px)", () => {
    const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
    const von = html.indexOf("/* ===== Runde 20 (Speicher) ===== */");
    const bis = html.indexOf("/* ===== Ende Runde 20 (Speicher) ===== */");
    expect(von).toBeGreaterThan(0);
    expect(bis).toBeGreaterThan(von);
    expect(html.slice(von, bis)).toMatch(/button\.link\.papierkorb-umschalter \{[^}]*min-height: 44px/);
  });
});

describe("R20-L2 „Alle Daten löschen“: der sichere Weg steht über der festen Leiste", () => {
  it("„Vorher Sicherung erstellen…“ kommt vor der Folge-Zeile und vor der Entscheidungsleiste", async () => {
    const s = einsatzAnlegen("Hochwasser Loeschen", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Alle Daten löschen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Alle lokalen Daten löschen']")!;
    const sicherung = within(dialog).getAllByRole("button", { name: "Vorher Sicherung erstellen…" })[0]!;
    const folge = dialog.querySelector(".loesch-kurz")!;
    const leiste = dialog.querySelector(".dialog-entscheidung")!;
    expect(sicherung.compareDocumentPosition(folge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sicherung.compareDocumentPosition(leiste) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Und nur einmal im Dialog (kein zweiter Knopf unter der Aufzählung).
    expect(within(dialog).getAllByRole("button", { name: "Vorher Sicherung erstellen…" })).toHaveLength(1);
  }, 30000);
});

describe("R20-W4 Satz zu einem älteren Stand beim Einlesen", () => {
  it("nennt beide Stände, damit sich belegen lässt, was „älter“ heißt", async () => {
    const s = einsatzAnlegen("Hochwasser Stand", EinsatzArt.EINSATZ);
    const jetzt = bogen("Haßmersheim");
    jetzt.stand = 3_440_000;
    meldungHinzufuegen(s.id, jetzt);
    const aelter = bogen("Haßmersheim");
    aelter.stand = 3_439_990; // zehn Minuten früher
    aelter.einsatz = { ...aelter.einsatz, ortAuftrag: "Deich Süd" };
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Hochwasser Stand" });
    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), new File([JSON.stringify(aelter)], "hassmersheim.json", { type: "application/json" }));
    const quittung = await waitFor(() => {
      const q = document.querySelector<HTMLElement>(".einlese-quittung");
      expect(q).not.toBeNull();
      return q!;
    });
    const zeile = quittung.textContent ?? "";
    expect(zeile).toMatch(/älterer Stand \([^)]*\) als der vorhandene \([^)]*\) — nur in die Historie gelegt/);
    // Beide Zeitstempel stehen da und unterscheiden sich.
    const [, neu, alt] = /älterer Stand \(([^)]*)\) als der vorhandene \(([^)]*)\)/.exec(zeile)!;
    expect(neu).not.toBe(alt);
  }, 30000);
});

describe("R20-D3 „In die vorhandene Sammlung übernehmen“", () => {
  async function vorbereiten() {
    // Die Datei kommt von einem zweiten Meldekopf: gleicher Name, eigene Kennung, früher empfangene Einheiten.
    const fremd = einsatzAnlegen("Hochwasser Jagst", EinsatzArt.EINSATZ);
    for (const n of ["Sinsheim", "Ulm", "Weinsberg"]) meldungHinzufuegen(fremd.id, bogen(n));
    const roh = JSON.parse(einsatzDateiInhalt(einsaetzeLaden().find((x) => x.id === fremd.id)!)) as { einsatz: { eintraege: { empfangenAm: number }[] } };
    for (const e of roh.einsatz.eintraege) e.empfangenAm -= 600_000;
    const datei = new File([JSON.stringify(roh)], "jagst.json", { type: "application/json" });
    localStorage.clear();
    const hier = einsatzAnlegen("Hochwasser Jagst", EinsatzArt.EINSATZ);
    for (const n of ["Ansbach", "Bamberg"]) meldungHinzufuegen(hier.id, bogen(n));
    return { hierId: hier.id, datei, vorher: structuredClone(einsaetzeLaden().find((x) => x.id === hier.id)!) };
  }

  it("nennt die Nummernwechsel vor dem Tipp, quittiert mit „Rückgängig“ und hält den Hinweis in der Einsatzansicht", async () => {
    const { hierId, datei, vorher } = await vorbereiten();
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.upload(screen.getByLabelText("Einsatz importieren…"), datei);
    const frage = await screen.findByRole("dialog", { name: /Es gibt schon eine Sammlung/ });
    expect(frage.textContent).toMatch(/Dabei ändern sich 2 Nummern: .*Ansbach 1 → 4/);
    expect(frage.textContent).toContain("Rückgängig“ danach möglich");
    await nutzer.click(within(frage).getByRole("button", { name: /In die vorhandene Sammlung übernehmen/ }));

    const quittung = await waitFor(() => {
      const q = document.querySelector<HTMLElement>(".einlese-quittung");
      expect(q).not.toBeNull();
      return q!;
    });
    expect(quittung.textContent).toMatch(/2 Nummern geändert/);
    // Der Hinweis überlebt die Quittung: gemerkt und in der Ansicht sichtbar.
    expect(nummernHinweisLaden(hierId)).toMatch(/2 Nummern geändert/);
    expect(document.querySelector(".nummern-hinweis")!.textContent).toMatch(/Nummern geändert/);

    await nutzer.click(within(quittung).getByRole("button", { name: "Zusammenführen rückgängig" }));
    await waitFor(() => expect(einsaetzeLaden().find((x) => x.id === hierId)!.eintraege.map((e) => e.id)).toEqual(vorher.eintraege.map((e) => e.id)));
    expect(nummernHinweisLaden(hierId)).toBeNull();
    expect(document.querySelector(".einlese-quittung")!.textContent).toMatch(/Zusammenführen zurückgenommen/);
  }, 30000);
});
