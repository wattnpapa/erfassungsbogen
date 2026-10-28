/**
 * Runde 15, Block Zustand: Verhalten in der Oberfläche (jsdom) — eine Quittungsleiste zur Zeit (D1), Rückgängig nach
 * „Meldung entfernen“ über das Verlassen der Ansicht (D2), Herkunft nach „Als Übung kennzeichnen…“ (D4), Marke bei nicht
 * übernommener neuerer Eingabe (E2), „Aufteilen…“ rollt ins Bild (E4), Kennzeichen-Frage (E5), Hinweis auf unterbrochenen
 * Stapel (S1), Quittung für Auftrag/Notiz (W3), Bestätigung nach „Bogen als PDF“ (A5).
 */
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail, quelleText } from "./einsaetze-ui";
import { neuerBogen } from "./hilfen";
import { importBeginnt, importEndet } from "./import-unterbrochen";
import { kenntnisVermerken } from "./export-stand";
import { meldungAufnehmen } from "./eintrag-zeiten";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittFahrzeuge } from "./schritte/fahrzeuge";

// pdfmake hat hier nichts zu suchen: geprüft wird der Weg dorthin.
const meldungPdfAnzeigen = vi.fn<(m: MeldeEintrag, fenster: Window | null) => Promise<void>>(async () => {});
vi.mock("./pdf", () => ({
  meldungPdfAnzeigen: (m: MeldeEintrag, fenster: Window | null) => meldungPdfAnzeigen(m, fenster),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  importEndet();
  localStorage.clear();
  sessionStorage.clear();
});

function bogenMitName(name: string, aendern?: (b: Erfassungsbogen) => void): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  aendern?.(b);
  return b;
}

type Props = Parameters<typeof EinsatzDetail>[0];

/** Detailansicht wie in der App: nach jeder Änderung (`onGeaendert`) mit dem neuen Speicherstand. */
function Wirt({ id }: { id: string }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  const props: Props = {
    einsatz,
    onZurueck: () => {},
    onGeaendert: () => setEinsatz(einsaetzeLaden().find((s) => s.id === id)!),
    onScannen: () => {},
    onManuell: () => {},
    onDateiImport: () => {},
    onBilderImport: () => {},
    onExport: () => {},
    onCsvExport: () => {},
    onCsvDetailExport: () => {},
    onOldenburgExport: () => {},
    onSammelPdf: () => {},
    onGeloescht: () => {},
  };
  return (
    <>
      <EinsatzDetail {...props} />
      <Dialogschicht />
    </>
  );
}

const karteVon = (name: string) => [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes(name))!;
/** Die Quittungsleiste nimmt ihre Knöpfe erst nach dem Prellschutz an (daumen-quittung.tsx). */
async function bereit(knopf: HTMLElement) {
  // Seit R16-D1 trägt die Leiste im Prellschutz `aria-disabled` statt `disabled` (ein Tipp sagt „Einen Moment …").
  await waitFor(() => expect((knopf as HTMLButtonElement).disabled || knopf.getAttribute("aria-disabled") === "true").toBe(false), { timeout: 2500 });
}
const leisten = () => [...document.querySelectorAll<HTMLElement>(".quittung-daumen")];

/** Einsatz, in dem schon „zur Kenntnis genommen“ ist; die danach aufgenommenen Einheiten sind neu. */
function einsatzMit(namen: string[], aendern?: (b: Erfassungsbogen, name: string) => void) {
  const s = einsatzAnlegen("Hochwasser Zustand", EinsatzArt.EINSATZ);
  kenntnisVermerken(einsaetzeLaden().find((x) => x.id === s.id)!);
  for (const n of namen) meldungHinzufuegen(s.id, bogenMitName(n, (b) => aendern?.(b, n)));
  return s.id;
}

describe("R15-D1 Nur eine Quittungsleiste gleichzeitig: die zuletzt ausgelöste", () => {
  it("Abrücken → Rückgängig → „Zur Kenntnis genommen“: sichtbar ist nur die Kenntnisnahme, und ihr Rückgängig wirkt", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta"]);
    render(<Wirt id={id} />);
    // Abrücken und zurücknehmen: danach steht die Info-Leiste ohne Knopf („Wieder anwesend: …“).
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Abrücken" }));
    const rueck = await screen.findByRole("button", { name: "Rückgängig" });
    await bereit(rueck);
    await nutzer.click(rueck);
    await waitFor(() => expect(leisten()).toHaveLength(1));
    expect(leisten()[0]!.textContent).toMatch(/^Wieder anwesend: Abrücken von Nr\. \d/);
    expect(leisten()[0]!.querySelector(".quittung-rueckgaengig")).toBeNull();

    // Jetzt „Zur Kenntnis genommen“: die alte Leiste weicht, es bleibt genau eine — mit Rückgängig.
    await nutzer.click(screen.getByRole("button", { name: "Zur Kenntnis genommen" }));
    await waitFor(() => expect(leisten()).toHaveLength(1));
    expect(leisten()[0]!.textContent).toMatch(/^Zur Kenntnis genommen: 2 Einheiten/);
    const rueckKenntnis = screen.getByRole("button", { name: "Zur Kenntnis genommen rückgängig machen" });
    await bereit(rueckKenntnis);
    await nutzer.click(rueckKenntnis);
    // Die Liste „Neu seit der letzten Kenntnisnahme“ ist wieder da, die ältere Info-Leiste kommt nicht zurück.
    expect(document.body.textContent).toMatch(/Neu seit dem letzten Mal \(2\)/);
    expect(leisten().some((l) => l.textContent!.startsWith("Wieder anwesend"))).toBe(false);
  });

  it("eine neue Handlung ersetzt eine ältere Leiste mit Rückgängig, statt unter ihr zu liegen", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta"]);
    render(<Wirt id={id} />);
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Abrücken" }));
    await screen.findByText(/Abgerückt \d\d:\d\d/);
    await nutzer.click(screen.getByRole("button", { name: "Zur Kenntnis genommen" }));
    await waitFor(() => expect(leisten()).toHaveLength(1));
    expect(leisten()[0]!.textContent).toMatch(/^Zur Kenntnis genommen/);
    expect(document.body.textContent).not.toMatch(/Abgerückt \d\d:\d\d:/);
  });

  it("eine Leiste ohne Knopf geht nach einigen Sekunden von selbst", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const id = einsatzMit(["Alpha"]);
    render(<Wirt id={id} />);
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(within(karteVon("Alpha")).getByRole("button", { name: "Abrücken" }));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    const rueck = screen.getByRole("button", { name: "Rückgängig" });
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    fireEvent.click(rueck);
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(leisten()[0]?.textContent).toMatch(/^Wieder anwesend/);
    await act(async () => {
      vi.advanceTimersByTime(13_000);
    });
    expect(leisten()).toHaveLength(0);
  });
});

describe("R15-D2 „Rückgängig“ nach „Meldung entfernen“ hält über das Verlassen der Ansicht", () => {
  it("nach Verlassen und Wiederöffnen (ohne Neuladen der Seite) ist die Leiste da und holt die Meldung zurück", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta"]);
    const { unmount } = render(<Wirt id={id} />);
    const karte = karteVon("Alpha");
    expect(karte).toBeTruthy();
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    // Die Rückfrage nennt die tatsächliche Grenze.
    expect(dialog.textContent).toMatch(/„Rückgängig" gilt bis zum Neuladen/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege).toHaveLength(1));

    // „‹ Startseite“ und wieder öffnen: dieselbe Seite, neue Ansicht.
    unmount();
    cleanup();
    render(<Wirt id={id} />);
    const leiste = await screen.findByRole("button", { name: "Rückgängig" });
    expect(leiste.closest(".quittung-daumen")!.textContent).toMatch(/^Entfernt: Meldung .*Alpha/);
    await bereit(leiste);
    await nutzer.click(leiste);
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege).toHaveLength(2));
  }, 30000);
});

describe("R15-D4 „Als Übung kennzeichnen…“ behält die Herkunft", () => {
  it("die Karte nennt weiter „aus Datei übernommen“, nicht „am Meldekopf von Hand erfasst“", () => {
    const s = einsatzAnlegen("Herkunft", EinsatzArt.EINSATZ);
    meldungAufnehmen(s.id, bogenMitName("Sinsheim"), { quelle: "pdf-import" });
    const kopf = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege[0]!;
    expect(quelleText(kopf, [kopf])).toBe("aus Datei übernommen");
    // Die Kennzeichnung legt eine Fassung mit Quelle „manuell“ obenauf; die Herkunft bleibt die der ersten.
    const umgestellt = { ...kopf, id: "neu", quelle: "manuell" as const };
    const text = quelleText(umgestellt, [umgestellt, kopf]);
    expect(text).toMatch(/^aus Datei übernommen/);
    expect(text).not.toBe("am Meldekopf von Hand erfasst");
  });
});

describe("R15-E2 Später eingegangene Meldung mit älterem Stand: bleibende Marke an der Karte", () => {
  it("die Karte trägt „Neuere Eingabe nicht übernommen“ mit Weg in die Historie, auch nach neuem Aufbau", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now());
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Uhr", EinsatzArt.EINSATZ);
    const jetzt = neuerBogen().stand;
    meldungHinzufuegen(s.id, bogenMitName("Albstadt", (x) => { x.stand = jetzt + 2 * 1440; }));
    vi.setSystemTime(Date.now() + 5000);
    meldungHinzufuegen(s.id, bogenMitName("Albstadt", (x) => { x.stand = jetzt - 5; x.sofortbedarf = { ...x.sofortbedarf!, dieselLiter: 500 }; }));
    vi.useRealTimers();
    render(<Wirt id={s.id} />);
    const karte = karteVon("Albstadt");
    // Zugeklappt: kurze Marke.
    expect(karte.textContent).toContain("⚠ Neuere Eingabe nicht übernommen");
    // Die Zeile wird nachgeladen und erscheint einen Augenblick später.
    const hinweis = await waitFor(() => {
      const h = karteVon("Albstadt").querySelector(".neuere-nicht-uebernommen");
      expect(h).toBeTruthy();
      return h!;
    });
    expect(hinweis.textContent).toMatch(/Neuere Eingabe nicht übernommen: später eingegangen, aber Stand .* ist älter/);
    await nutzer.click(within(hinweis as HTMLElement).getByRole("button", { name: "Historie ansehen" }));
    // Die Historie steht offen, und dort gibt es den Weg „Diese Fassung gilt…“.
    expect(within(karteVon("Albstadt")).getByRole("button", { name: "Historie schließen" })).toBeTruthy();
    expect(within(karteVon("Albstadt")).getAllByRole("button", { name: "Diese Fassung gilt…" }).length).toBeGreaterThan(0);
  }, 20000);
});

describe("R15-E4 „Aufteilen…“ holt das Formular in den Bildbereich", () => {
  it("rollt die Überschrift an den oberen Rand, statt unterhalb des Bildes zu öffnen", async () => {
    const nutzer = userEvent.setup();
    const rollen = vi.fn();
    const alt = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = rollen;
    try {
      const id = einsatzMit(["Alpha"]);
      render(<Wirt id={id} />);
      await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Mehr…" }));
      await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Aufteilen…" }));
      const panel = karteVon("Alpha").querySelector(".aufteilen-panel")!;
      expect(panel).toBeTruthy();
      const rufe = rollen.mock.contexts as unknown[];
      expect(rufe.some((c) => c === panel.querySelector("h4"))).toBe(true);
      expect(rollen).toHaveBeenCalledWith({ block: "start" });
    } finally {
      HTMLElement.prototype.scrollIntoView = alt;
    }
  });
});

describe("R15-E5 THW-Kennzeichen: „Stimmt das?“ nach dem Verlassen des Felds", () => {
  it("fragt bei vier Ziffern, nicht bei fünf und nicht bei freiem Text", async () => {
    const nutzer = userEvent.setup();
    const bogen = neuerBogen();
    bogen.fahrzeuge = [{ typ: {}, kennzeichen: "" }];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={bogen} />);
    const feld = () => document.getElementById("feld-kennzeichen-0") as HTMLInputElement;
    await nutzer.type(feld(), "thw 8439");
    // Beim Tippen noch keine Frage.
    expect(screen.queryByText(/Stimmt das\?/)).toBeNull();
    await nutzer.tab();
    expect(feld().value).toBe("THW-8439");
    expect(document.querySelector(".kennzeichen-frage")!.textContent).toMatch(/fünf Ziffern.*„THW-8439“ hat 4\. Stimmt das\?/);
    await nutzer.clear(feld());
    await nutzer.type(feld(), "THW-84397");
    await nutzer.tab();
    expect(screen.queryByText(/Stimmt das\?/)).toBeNull();
    await nutzer.clear(feld());
    await nutzer.type(feld(), "DAS IST KEIN KENNZEICHEN");
    await nutzer.tab();
    expect(screen.queryByText(/Stimmt das\?/)).toBeNull();
  });
});

describe("R15-S1 Hinweis auf einen unterbrochenen Stapelimport", () => {
  it("steht nach dem Neuladen im Einsatz, nennt die Zahlen und geht mit „Verstanden“", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta"]);
    // Ein Stapel mit 40 Dateien begann, als erst 0 Meldungen da waren; die Seite lud neu (Merker der Seite weg, Spur bleibt).
    importBeginnt(id, 40, 0);
    importEndet();
    sessionStorage.setItem("eeb.import-laeuft.v1", JSON.stringify({ einsatzId: id, dateien: 40, meldungenVorher: 0 }));
    render(<Wirt id={id} />);
    // Das Modul wird nachgeladen: der Hinweis erscheint einen Augenblick später.
    const zeile = await waitFor(() => {
      const z = document.querySelector<HTMLElement>(".import-unterbrochen");
      expect(z).toBeTruthy();
      return z!;
    });
    expect(zeile.textContent).toMatch(/Import unterbrochen: 40 Dateien waren gewählt, 2 Meldungen kamen an/);
    await nutzer.click(within(zeile).getByRole("button", { name: "Verstanden" }));
    expect(document.querySelector(".import-unterbrochen")).toBeNull();
    await waitFor(() => expect(sessionStorage.getItem("eeb.import-laeuft.v1")).toBeNull());
  });

  it("bei einem anderen Einsatz oder ohne Unterbrechung steht nichts da", async () => {
    const id = einsatzMit(["Alpha"]);
    sessionStorage.setItem("eeb.import-laeuft.v1", JSON.stringify({ einsatzId: "anderer", dateien: 3, meldungenVorher: 0 }));
    render(<Wirt id={id} />);
    await new Promise((r) => setTimeout(r, 100));
    expect(document.querySelector(".import-unterbrochen")).toBeNull();
  });
});

describe("R15-W3 Auftrag/Notiz speichern quittiert mit Rückgängig", () => {
  it("nennt Einheit und Text, auch wenn die Karte aus dem Filter fällt; Rückgängig stellt den früheren Stand her", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha", "Beta"]);
    render(<Wirt id={id} />);
    const karte = () => karteVon("Alpha");
    await nutzer.click(within(karte()).getByRole("button", { name: "Auftrag/Notiz" }));
    await nutzer.type(within(karte()).getByLabelText("Auftrag/Notiz"), "Pumpen am Deich Nord");
    await nutzer.click(within(karte()).getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege.find((e) => e.notiz)?.notiz).toBe("Pumpen am Deich Nord"));
    const leiste = await waitFor(() => {
      const l = leisten().find((x) => x.textContent!.startsWith("Auftrag gesetzt"));
      expect(l).toBeTruthy();
      return l!;
    });
    expect(leiste.textContent).toMatch(/^Auftrag gesetzt: Nr\. \d „.*Alpha.*" — Pumpen am Deich Nord/);
    const rueck = within(leiste).getByRole("button", { name: "Auftrag rückgängig machen" });
    await bereit(rueck);
    await nutzer.click(rueck);
    await waitFor(() => expect(einsaetzeLaden().find((s) => s.id === id)!.eintraege.some((e) => e.notiz)).toBe(false));
    expect(leisten()[0]!.textContent).toMatch(/^Auftrag zurückgenommen: Nr\. \d „.*Alpha.*"\./);
  }, 20000);

  it("ein unveränderter Text quittiert nichts", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha"]);
    render(<Wirt id={id} />);
    const karte = () => karteVon("Alpha");
    await nutzer.click(within(karte()).getByRole("button", { name: "Auftrag/Notiz" }));
    await nutzer.type(within(karte()).getByLabelText("Auftrag/Notiz"), "   ");
    await nutzer.click(within(karte()).getByRole("button", { name: "Speichern" }));
    expect(leisten().filter((l) => l.textContent!.startsWith("Auftrag"))).toHaveLength(0);
  });
});

describe("R15-A5 „Bogen als PDF“ bestätigt in der App", () => {
  it("nach der Erzeugung steht eine Bestätigung unter den Knöpfen der Karte", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMit(["Alpha"]);
    render(<Wirt id={id} />);
    await nutzer.click(within(karteVon("Alpha")).getByRole("button", { name: "Bogen als PDF" }));
    await waitFor(() => expect(meldungPdfAnzeigen).toHaveBeenCalled());
    const zeile = await waitFor(() => {
      const z = [...document.querySelectorAll("p.hinweis[role=status]")].find((p) => p.textContent!.startsWith("✓ Bogen als PDF"));
      expect(z).toBeTruthy();
      return z!;
    });
    expect(zeile.textContent).toMatch(/^✓ Bogen als PDF gespeichert.*\(Download-Ordner\)/);
    expect(zeile.getAttribute("role")).toBe("status");
  });
});
