/**
 * Runde 16, Block Inhalte: Verhalten in der Oberfläche — Dauer der Papierabgleich-Eingaben (R16-A2), Name und Ort des
 * Einsatzes ändern (R16-K1), Tabellenzelle „Stand vor …“ (R16-N1), Schnelleinstieg und Karte der Startseite (R16-N2).
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { PapierAbgleich } from "./papier-abgleich-ui";
import { ENTWURF_DAUER_TEXT } from "./papier-abgleich-entwurf";
import { PRELLSCHUTZ_MS } from "./tipp-schutz";
import { meldungAufnehmen, vomPapierMarkieren } from "./eintrag-zeiten";

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

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

function bogen(ort: string, mod: (b: Erfassungsbogen) => void = () => {}): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  mod(b);
  return b;
}

type Props = Parameters<typeof EinsatzDetail>[0];

function Wirt({ id, extra }: { id: string; extra?: Partial<Props> }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
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

describe("R16-A2 Dauer der Papierabgleich-Eingaben", () => {
  it("das Formular und die Karte nennen dieselbe Dauer", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const ids = ["Ansbach", "Ulm"].map((n) => meldungAufnehmen(s.id, bogen(n), { quelle: "scan" })!.eintrag.id);
    vomPapierMarkieren(s.id, ids, 999);
    const eintraege = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    render(<PapierAbgleich einsatzId={s.id} eintraege={eintraege} zuege={[]} onGeaendert={() => {}} />);
    await nutzer.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    await nutzer.type(screen.getAllByLabelText(/Nr\. laut Blatt/)[0]!, "7");
    const formularSatz = screen.getByText(/schließt nur das Formular/).textContent!;
    expect(formularSatz).toContain(ENTWURF_DAUER_TEXT);
    expect(formularSatz).not.toContain("diese Sitzung");
    await nutzer.click(screen.getByRole("button", { name: "Später" }));
    const karteSatz = screen.getByText(/Angefangene Eingaben für 1 Einheit sind noch da/).textContent!;
    expect(karteSatz).toContain(ENTWURF_DAUER_TEXT);
  });
});

describe("R16-K1 Name und Ort des Einsatzes ändern", () => {
  it("trägt den Ort nach, ändert den Namen und nimmt beides mit „Rückgängig“ zurück; Einheiten bleiben", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Wardenburg"));
    render(<Wirt id={s.id} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Hochwasser Weser");

    await nutzer.click(screen.getByRole("button", { name: "Ort eintragen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Einsatz bearbeiten']")!;
    const name = within(dialog).getByLabelText("Name") as HTMLInputElement;
    expect(name.value).toBe("Hochwasser Weser");
    await nutzer.clear(name);
    await nutzer.type(name, "Hochwasser Neckar");
    await nutzer.type(within(dialog).getByLabelText(/^Ort \/ Auftrag/), "Sporthalle Rottenburg");
    await nutzer.click(within(dialog).getByRole("button", { name: "Übernehmen" }));

    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Hochwasser Neckar"));
    expect(document.body.textContent).toContain("Sporthalle Rottenburg");
    const danach = einsaetzeLaden().find((x) => x.id === s.id)!;
    expect(danach.name).toBe("Hochwasser Neckar");
    expect(danach.ort).toBe("Sporthalle Rottenburg");
    expect(danach.eintraege).toHaveLength(1);
    // Der Knopf heißt jetzt „Name / Ort ändern…“, die Quittung trägt den Rückweg.
    expect(screen.getByRole("button", { name: "Name / Ort ändern…" })).toBeTruthy();
    expect(document.body.textContent).toContain("Einsatz geändert");

    // Der Prellschutz der Leiste verwirft einen Tipp in den ersten Zehntelsekunden.
    await new Promise((r) => setTimeout(r, PRELLSCHUTZ_MS + 100));
    await nutzer.click(screen.getByRole("button", { name: /Änderung an Name und Ort rückgängig/ }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Hochwasser Weser"));
    expect(einsaetzeLaden().find((x) => x.id === s.id)!.ort).toBeUndefined();
    expect(document.body.textContent).toContain('Der Einsatz heißt wieder „Hochwasser Weser"');
  });

  it("ändert nichts und quittiert nichts, wenn der Dialog ohne Änderung bestätigt wird", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ, "Deich Nord");
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Name / Ort ändern…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Einsatz bearbeiten']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Übernehmen" }));
    expect(document.body.textContent).not.toContain("Einsatz geändert");
    expect(einsaetzeLaden().find((x) => x.id === s.id)!.name).toBe("Hochwasser Weser");
  });
});

describe("R16-N1 Tabellenzelle „Meldung vor“", () => {
  it("schreibt bei altem Stand „Stand vor 101 Tagen“ statt „Stand 101 Tagen“", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Alt", EinsatzArt.EINSATZ);
    // Stand in der Vergangenheit, Eingang jetzt: der Stand liegt weit vor dem Eingang.
    meldungHinzufuegen(s.id, bogen("Alt", (b) => { b.stand = 100; }));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));
    const zellen = [...document.querySelectorAll<HTMLElement>("td.warnung-text")].map((z) => z.textContent!.trim());
    const stand = zellen.find((t) => t.startsWith("⚠ Stand"));
    expect(stand, `Zellen: ${zellen.join(" | ")}`).toMatch(/^⚠ Stand vor \d+ (Tag|Tagen)$/);
  });
});

describe("R16-N2 Startseite: ein Einsatz, eine ausführliche Zeile", () => {
  it("der Schnelleinstieg nennt nur die Zeit der letzten Meldung; die Karte trägt die ausführliche Zeile; beide zählen gleich", async () => {
    const s = einsatzAnlegen("Hochwasser Elbe", EinsatzArt.EINSATZ);
    for (const ort of ["Alpha", "Beta", "Gamma"]) meldungHinzufuegen(s.id, bogen(ort, (b) => { b.stand = 100; }));
    render(<App />);
    // Seit R17-A7 gibt es den Schnelleinstieg nicht mehr: Der Einsatz steht einmal da, als Karte mit der ausführlichen Zeile.
    expect(document.querySelector("button.sammlung-oeffnen")).toBeNull();
    // Die Karte in der Liste nennt das Zählwort und trägt die ausführliche Zeile.
    const karte = [...document.querySelectorAll<HTMLElement>(".karte")].find((k) => k.querySelector("h2")?.textContent === "Hochwasser Elbe")!;
    expect(karte.textContent).toContain("3 Einheiten anwesend · Stärke");
    expect(karte.textContent).not.toContain("Einheit(en)");
    expect(karte.querySelector(".letzte-meldung")!.textContent).toContain("älteste Meldung");
  }, 20000);
});

describe("R16-L1 Beschriftung der Kennzahlen-Kacheln (Stilregel)", () => {
  // Gemessen im Produktionsbuild (Chromium, Touch, 390/360/320 px, Standard/Feld/Nacht): Text höchstens Zellbreite, mindestens 7 px Reserve.
  const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
  const von = html.indexOf("/* ===== Runde 16 (Inhalte) ===== */");
  const bis = html.indexOf("/* ===== Ende Runde 16 (Inhalte) ===== */");
  const abschnitt = html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");

  it("deckelt die Beschriftung der ersten drei Kacheln und kürzt deren Innenrand am Telefon", () => {
    expect(von).toBeGreaterThan(0);
    expect(bis).toBeGreaterThan(von);
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\)[\s\S]*?:nth-child\(-n \+ 3\) span \{ font-size: min\(var\(--t-xs\), 13px\); letter-spacing: 0\.04em; \}/);
    expect(abschnitt).toMatch(/@media \(max-width: 21rem\)[\s\S]*?:nth-child\(-n \+ 3\) span \{ font-size: min\(var\(--t-xs\), 12px\)/);
    expect(abschnitt).toMatch(/:nth-child\(-n \+ 3\) \{ padding-inline: 6px; \}/);
  });
});
