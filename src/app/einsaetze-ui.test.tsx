/**
 * Einsatzansicht des Meldekopfs — geprüft wird der eine Weg, an dem fremde
 * Meldedaten verschwinden: „Entfernen" an einer Meldung.
 *
 * Dazu die Tabellensicht: sie ist die Sicht, aus der in der Lagebesprechung
 * abgelesen wird, also muss der Umschalter beide Richtungen können und die
 * Sortierung am Spaltenkopf tatsächlich umsortieren.
 *
 * Wie überall bei Rückfragen zählen beide Richtungen. Ein Bestätigen, das nicht
 * entfernt, lässt eine abgerückte Einheit in der Stärkesumme stehen; ein
 * Abbruch, der trotzdem entfernt, wirft eine fremde Meldung samt Historie weg.
 *
 * Dazu der Einzelbogen als PDF: dort hängt am Ablauf ein Fenster, das der
 * Klick öffnet — es muss die Meldung zu sehen bekommen und darf im Fehlerfall
 * nicht als weißer Tab zurückbleiben.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail, PRELLSCHUTZ_MS } from "./einsaetze-ui";
import {
  EinsatzArt,
  MeldeStatus,
  einheitZugEtikettSetzen,
  einsaetzeLaden,
  einsatzAnlegen,
  meldungAufteilen,
  meldungHinzufuegen,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { eintreffzeitSetzen, notizSetzen } from "./eintrag-zeiten";
import { aggregiere } from "./auswertung";
import { neuerBogen } from "./hilfen";
import { lageblattVermerken, type ExportStand, type ExportUmfang } from "./export-stand";

// pdfmake selbst hat hier nichts zu suchen: geprüft wird der Weg dorthin.
const meldungPdfAnzeigen = vi.fn<(m: MeldeEintrag, fenster: Window | null) => Promise<void>>(async () => {});
vi.mock("./pdf", () => ({
  meldungPdfAnzeigen: (m: MeldeEintrag, fenster: Window | null) => meldungPdfAnzeigen(m, fenster),
}));

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

type Props = Parameters<typeof EinsatzDetail>[0];

/** Die Detailansicht auf dem aktuellen Speicherstand — die App lädt nach jeder Änderung neu. */
function ansicht(einsatzId: string, extra: Partial<Props> = {}) {
  const geaendert = vi.fn();
  const bilderImport = vi.fn<(dateien: File[]) => void>();
  const dateiImport = vi.fn<(dateien: File[]) => void>();
  const sammelPdf = vi.fn<(umfang: ExportUmfang) => void>();
  const csvExport = vi.fn<(umfang: ExportUmfang) => void>();
  const baum = () => (
    <>
      <EinsatzDetail
        einsatz={einsaetzeLaden().find((s) => s.id === einsatzId)!}
        onZurueck={() => {}}
        onGeaendert={geaendert}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={dateiImport}
        onBilderImport={bilderImport}
        onExport={() => {}}
        onCsvExport={csvExport}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={sammelPdf}
        onGeloescht={() => {}}
        {...extra}
      />
      <Dialogschicht />
    </>
  );
  const r = render(baum());
  /** Ansicht mit dem neuen Speicherstand neu aufbauen (Rolle von onGeaendert in der App). */
  function neuLaden() {
    r.rerender(baum());
  }
  return { einsatzId, geaendert, bilderImport, dateiImport, sammelPdf, csvExport, neuLaden };
}

/**
 * Einsatz mit den genannten Einheiten (Vorgabe: eine), Detailansicht offen.
 * `standAus` stellt die Ansicht so, als wäre schon einmal exportiert worden,
 * und nennt die Einheiten, die damals schon in der Sammlung standen.
 */
function buehne(
  namen: string[] = ["Wardenburg"],
  opt: Partial<Props> & { standAus?: string[]; zeitpunkt?: number } = {},
) {
  const { standAus, zeitpunkt, ...extra } = opt;
  const angelegt = einsatzAnlegen("Hochwasser Wardenburg", EinsatzArt.EINSATZ);
  for (const n of namen) meldungHinzufuegen(angelegt.id, bogenMitName(n));
  const einsatz = einsaetzeLaden().find((s) => s.id === angelegt.id)!;
  const exportStand: ExportStand | null = standAus
    ? {
        zeitpunkt: zeitpunkt ?? Date.now(),
        eintragIds: einsatz.eintraege
          .filter((e) => standAus.includes(e.bogen.einheit.hierarchie[0]!.name))
          .map((e) => e.id),
      }
    : null;
  return ansicht(angelegt.id, { exportStand, ...extra });
}

/** Die gespeicherte Meldung der genannten Einheit. */
function gespeichert(einsatzId: string, name: string): MeldeEintrag {
  return einsaetzeLaden()
    .find((s) => s.id === einsatzId)!
    .eintraege.find((e) => e.bogen.einheit.hierarchie[0]!.name === name)!;
}

describe("Meldung aus dem Einsatz entfernen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /** Meldung aufklappen und „Entfernen" drücken — die Rückfrage steht dann da. */
  async function entfernenDruecken(nutzer: ReturnType<typeof userEvent.setup>) {
    await nutzer.click(screen.getByRole("button", { name: "Details" }));
    // Entfernen liegt hinter „Mehr…" (R2-H9).
    await nutzer.click(screen.getByRole("button", { name: "Mehr…" }));
    await nutzer.click(screen.getByRole("button", { name: "Entfernen" }));
    return document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
  }

  it("entfernt die Meldung, wenn die Rückfrage bejaht wird", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, geaendert } = buehne();

    const dialog = await entfernenDruecken(nutzer);
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));

    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(0);
    expect(geaendert).toHaveBeenCalled();
  });

  it("behält die Meldung, wenn die Rückfrage abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, geaendert } = buehne();

    const dialog = await entfernenDruecken(nutzer);
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
    expect(geaendert).not.toHaveBeenCalled();
  });
});

/**
 * Audit Runde 2, R2-D1: „Entfernen … samt Historie" nahm nur die neueste
 * Fassung weg — die ältere rückte nach, die Einheit blieb in der Lage und die
 * Summe stieg sogar. Geprüft wird die Einheit mit Folgemeldung, der Rückweg
 * mit allen Fassungen und der eigene Weg „nur diese Fassung verwerfen".
 */
describe("Einheit mit Folgemeldung entfernen (R2-D1)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function mitStaerke(name: string, stand: number, gesamt: number): Erfassungsbogen {
    const b = bogenMitName(name);
    b.stand = stand;
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 2, mannschaft: gesamt - 2, gesamt };
    b.personal = [];
    return b;
  }

  /** Ulm mit erster Meldung (8) und Folgemeldung (7), Blaubeuren daneben (5); Ulm hat Zug und Auftrag. */
  function lage() {
    const angelegt = einsatzAnlegen("Hochwasser Ulm", EinsatzArt.EINSATZ);
    const erste = meldungHinzufuegen(angelegt.id, mitStaerke("Ulm", 1000, 8))!.eintrag;
    const folge = meldungHinzufuegen(angelegt.id, mitStaerke("Ulm", 2000, 7))!.eintrag;
    meldungHinzufuegen(angelegt.id, mitStaerke("Blaubeuren", 1000, 5));
    einheitZugEtikettSetzen(angelegt.id, erste.einheitSchluessel, "1. Zug");
    notizSetzen(angelegt.id, folge.id, "Deich Nord");
    eintreffzeitSetzen(angelegt.id, erste.id, 4242);
    return { ...ansicht(angelegt.id), erste, folge };
  }

  function summen(einsatzId: string) {
    const s = einsaetzeLaden().find((x) => x.id === einsatzId)!;
    return aggregiere(s.eintraege, s.art);
  }

  /** Die Zahlen der Stärkeleiste, wie sie auf dem Bildschirm stehen. */
  function leiste() {
    const felder = [...document.querySelectorAll(".staerke-leiste > div")];
    const wert = (label: string) =>
      Number(felder.find((d) => d.querySelector("span")!.textContent === label)!.querySelector("strong")!.textContent);
    return { einheiten: wert("Einheiten"), gesamt: wert("Gesamt") };
  }

  function karteVon(name: string) {
    return [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes(name));
  }

  it("nimmt die Einheit mit allen Fassungen heraus; Rückgängig bringt beide samt Zug, Auftrag und Zeit zurück", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden, erste, folge } = lage();
    expect(leiste()).toEqual({ einheiten: 2, gesamt: 12 });

    const karte = karteVon("Ulm")!;
    expect(within(karte).getByRole("button", { name: "Historie (2)" })).toBeTruthy();
    await nutzer.click(within(karte).getByRole("button", { name: "Details" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    expect(dialog.textContent).toContain("samt Historie");
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    neuLaden();

    // Beide Fassungen weg, die Summen fallen — keine ältere Fassung rückt nach.
    const s = einsaetzeLaden().find((x) => x.id === einsatzId)!;
    expect(s.eintraege.map((e) => e.bogen.einheit.hierarchie[0]!.name)).toEqual(["Blaubeuren"]);
    expect(summen(einsatzId).einheiten).toBe(1);
    expect(leiste()).toEqual({ einheiten: 1, gesamt: 5 });
    expect(karteVon("Ulm")).toBeUndefined();
    const quittung = screen.getByRole("status");
    expect(quittung.textContent).toContain("entfernt (2 Fassungen)");

    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    neuLaden();

    const zurueck = einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege;
    expect(zurueck).toHaveLength(3);
    const e1 = zurueck.find((e) => e.id === erste.id)!;
    const e2 = zurueck.find((e) => e.id === folge.id)!;
    expect(e1.zugEtikett).toBe("1. Zug");
    expect(e1.eingetroffenAm).toBe(4242);
    expect(e2.zugEtikett).toBe("1. Zug");
    expect(e2.notiz).toBe("Deich Nord");
    expect(leiste()).toEqual({ einheiten: 2, gesamt: 12 });
    expect(within(karteVon("Ulm")!).getByRole("button", { name: "Historie (2)" })).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("zeigt in der Historie die Eingangszeit je Fassung und die Vermerke der Führungsstelle (R2-K6)", async () => {
    const nutzer = userEvent.setup();
    lage();
    const karte = karteVon("Ulm")!;
    await nutzer.click(within(karte).getByRole("button", { name: "Historie (2)" }));
    const text = karteVon("Ulm")!.textContent!;
    expect(text).toContain("eingegangen");
    expect(text).toContain("Vermerke der Führungsstelle");
    expect(text).toContain("Auftrag/Notiz: Deich Nord");
    expect(text).toMatch(/Empfangen|Manuell erfasst|Aus Datei/);
  });

  it("lässt einen abgeteilten Truppteil (eigener Schlüssel) stehen", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Ulm", EinsatzArt.EINSATZ);
    const ulm = meldungHinzufuegen(angelegt.id, mitStaerke("Ulm", 1000, 8))!.eintrag;
    const ergebnis = meldungAufteilen(angelegt.id, ulm.id, {
      teilEtikett: "Fachberater",
      personal: [],
      staerke: { fuehrer: 0, unterfuehrer: 1, mannschaft: 1 },
      fahrzeuge: [],
    })!;
    expect(ergebnis.abgeteilt.einheitSchluessel).not.toBe(ulm.einheitSchluessel);
    const { neuLaden } = ansicht(angelegt.id);

    const karte = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find(
      (k) => !k.textContent!.includes("Fachberater"),
    )!;
    await nutzer.click(within(karte).getByRole("button", { name: "Details" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    neuLaden();

    const bleibt = einsaetzeLaden().find((x) => x.id === angelegt.id)!.eintraege;
    expect(bleibt.map((e) => e.id)).toEqual([ergebnis.abgeteilt.id]);
  });

  it("verwirft über die Historie nur eine Fassung, nennt den dann gültigen Stand und bietet Rückgängig an", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden, folge } = lage();

    const karte = karteVon("Ulm")!;
    await nutzer.click(within(karte).getByRole("button", { name: "Historie (2)" }));
    // Oberste Zeile ist die aktuelle Fassung (die Folgemeldung).
    await nutzer.click(within(karte).getAllByRole("button", { name: "Fassung verwerfen…" })[0]!);
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Fassung verwerfen?']")!;
    expect(dialog.textContent).toMatch(/Gültig ist dann wieder Stand .* mit Stärke 0 \/ 2 \/ 6 \/ 8/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Fassung verwerfen" }));
    neuLaden();

    expect(einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege.some((e) => e.id === folge.id)).toBe(false);
    expect(leiste()).toEqual({ einheiten: 2, gesamt: 13 });
    const quittung = screen.getByRole("status");
    expect(quittung.textContent).toContain("verworfen");

    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    neuLaden();
    expect(leiste()).toEqual({ einheiten: 2, gesamt: 12 });
    expect(einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege.find((e) => e.id === folge.id)!.notiz).toBe("Deich Nord");
  });
});

describe("Einzelbogen einer Meldung als PDF", () => {
  beforeEach(() => {
    localStorage.clear();
    meldungPdfAnzeigen.mockClear();
    meldungPdfAnzeigen.mockResolvedValue();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Fenster, wie window.open es im Browser liefert — nur so viel, wie der Weg anfasst. */
  function tabAttrappe() {
    return {
      document: { body: { textContent: "" } },
      close: vi.fn(),
    } as unknown as Window & { close: ReturnType<typeof vi.fn> };
  }

  it("öffnet einen Tab im Klick und gibt ihm die Meldung mit", async () => {
    const nutzer = userEvent.setup();
    const tab = tabAttrappe();
    const oeffnen = vi.fn(() => tab);
    vi.stubGlobal("open", oeffnen);
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Bogen als PDF" }));

    // Leer aufgemacht und erst danach befüllt: nur so übersteht der Tab das
    // Nachladen des PDF-Satzes, ohne vom Popup-Blocker kassiert zu werden.
    expect(oeffnen).toHaveBeenCalledWith("", "_blank");
    expect(meldungPdfAnzeigen).toHaveBeenCalledTimes(1);
    const [meldung, fenster] = meldungPdfAnzeigen.mock.calls[0]!;
    expect(meldung.bogen.einheit.hierarchie[0]!.name).toBe("Wardenburg");
    expect(fenster).toBe(tab);
  });

  it("schließt den leeren Tab und meldet den Fehler, wenn die PDF scheitert", async () => {
    const nutzer = userEvent.setup();
    const tab = tabAttrappe();
    vi.stubGlobal("open", vi.fn(() => tab));
    meldungPdfAnzeigen.mockRejectedValue(new Error("Schriften fehlen"));
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Bogen als PDF" }));

    expect(tab.close).toHaveBeenCalled();
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Bogen als PDF']")!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain("Schriften fehlen");
  });

  it("kommt ohne Tab aus, wenn der Popup-Blocker keinen zulässt", async () => {
    const nutzer = userEvent.setup();
    vi.stubGlobal("open", vi.fn(() => null));
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Bogen als PDF" }));

    // Ohne Fenster bleibt der gewohnte Weg (Download bzw. Share-Sheet) — das
    // entscheidet meldungPdfAnzeigen, es muss den Fall aber zu sehen bekommen.
    expect(meldungPdfAnzeigen).toHaveBeenCalledTimes(1);
    expect(meldungPdfAnzeigen.mock.calls[0]![1]).toBeNull();
  });
});

describe("Einheiten als Tabelle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /** Zeilenköpfe der Tabelle in Anzeigereihenfolge — die Einheitennamen. */
  function einheitenSpalte() {
    const tabelle = screen.getByRole("table", { name: /Gemeldete Einheiten/ });
    return within(tabelle)
      .getAllByRole("rowheader")
      .map((z) => z.textContent ?? "");
  }

  it("schaltet zwischen Karten und Tabelle um und merkt sich die Wahl", async () => {
    const nutzer = userEvent.setup();
    buehne();

    // Karten sind die Vorgabe: dort steht der Details-Knopf einer Meldung.
    expect(screen.queryByRole("table", { name: /Gemeldete Einheiten/ })).toBeNull();

    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));
    expect(screen.getByRole("table", { name: /Gemeldete Einheiten/ })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Details" })).toBeNull();

    await nutzer.click(screen.getByRole("button", { name: "Karten" }));
    expect(screen.queryByRole("table", { name: /Gemeldete Einheiten/ })).toBeNull();

    // Die Wahl hängt am Arbeitsplatz, nicht am Einsatz: der nächste Aufbau
    // startet in der zuletzt genutzten Sicht.
    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));
    cleanup();
    buehne();
    expect(screen.getByRole("table", { name: /Gemeldete Einheiten/ })).not.toBeNull();
  });

  it("sortiert am Spaltenkopf und dreht die Richtung beim zweiten Klick", async () => {
    const nutzer = userEvent.setup();
    buehne(["Wardenburg", "Ahlhorn"]);
    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));

    // Vorgabe ist die Sortierung der Leiste (Name A–Z).
    expect(einheitenSpalte()[0]).toContain("Ahlhorn");

    const spaltenkopf = screen.getAllByRole("columnheader")[0]!;
    const kopf = within(spaltenkopf).getByRole("button");
    await nutzer.click(kopf);
    expect(einheitenSpalte()[0]).toContain("Ahlhorn");
    await nutzer.click(kopf);
    expect(einheitenSpalte()[0]).toContain("Wardenburg");
  });

  it("weist die Summe über die angezeigten Einheiten aus", async () => {
    const nutzer = userEvent.setup();
    buehne(["Wardenburg", "Ahlhorn"]);
    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));

    const tabelle = screen.getByRole("table", { name: /Gemeldete Einheiten/ });
    expect(tabelle.querySelector("tfoot")!.textContent).toContain("Summe (2 zählend)");
  });

  /**
   * Die Entscheidungsspalten stehen vorn — Bedarf, Eintreffzeit und Auftrag
   * lagen auf dem Tablet rechts außerhalb des Bilds (Audit Runde 2, R2-K5).
   * Die Zellen jeder Zeile müssen dabei unter ihrem Kopf stehen.
   */
  it("stellt Zug, Stärke, Bedarf, Eintreffzeit und Auftrag vor die Aufschlüsselung und hält die Zellen unter ihrem Kopf", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId } = buehne(["Wardenburg"]);
    notizSetzen(einsatzId, gespeichert(einsatzId, "Wardenburg").id, "Deich Nord");
    cleanup();
    ansicht(einsatzId);
    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));

    const tabelle = screen.getByRole("table", { name: /Gemeldete Einheiten/ });
    const koepfe = within(tabelle).getAllByRole("columnheader").map((k) => k.textContent ?? "");
    expect(koepfe.slice(0, 6).map((k) => k.replace(/^(\S+?)[A-ZÄÖÜ].*$/, "$1"))).toEqual([
      "Einheit", "Zug", "Ges.", "Bedarf", "Eingetr.", "Auftrag",
    ]);
    const zeile = within(tabelle).getAllByRole("row")[1]!;
    const zellen = [...zeile.children].map((z) => z.textContent ?? "");
    expect(zellen[0]).toContain("Wardenburg");
    expect(zellen[koepfe.findIndex((k) => k.startsWith("Auftrag"))]).toBe("Deich Nord");
    // Die Aufschlüsselung folgt dahinter, der Absender-Stand steht zuletzt.
    expect(koepfe.findIndex((k) => k.startsWith("Unt. M"))).toBeGreaterThan(5);
    expect(koepfe[koepfe.length - 1]).toMatch(/^Stand/);
  });
});

describe("Bögen einlesen (ein Knopf für Datei, Bilder und Ordner)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reicht die ganze Mehrfachauswahl an Bildern weiter", async () => {
    const nutzer = userEvent.setup();
    const { bilderImport } = buehne();

    const feld = screen.getByLabelText("Dateien wählen…") as HTMLInputElement;
    expect(feld.multiple).toBe(true);
    await nutzer.upload(feld, [
      new File(["a"], "bogen-1.png", { type: "image/png" }),
      new File(["b"], "bogen-2.png", { type: "image/png" }),
    ]);

    expect(bilderImport).toHaveBeenCalledTimes(1);
    expect(bilderImport.mock.calls[0]![0].map((d) => d.name)).toEqual(["bogen-1.png", "bogen-2.png"]);
    // Zurückgesetzt, sonst löst dieselbe Auswahl beim zweiten Mal nichts aus.
    expect(feld.value).toBe("");
  });

  it("trennt eine gemischte Auswahl nach Dateityp", async () => {
    const nutzer = userEvent.setup();
    const { bilderImport, dateiImport } = buehne();

    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), [
      new File(["a"], "bogen.png", { type: "image/png" }),
      new File(["{}"], "bogen.json", { type: "application/json" }),
      new File(["%PDF"], "sammlung.pdf", { type: "application/pdf" }),
    ]);

    expect(bilderImport.mock.calls[0]![0].map((d) => d.name)).toEqual(["bogen.png"]);
    expect(dateiImport.mock.calls[0]![0].map((d) => d.name)).toEqual(["bogen.json", "sammlung.pdf"]);
  });

  it("bietet die Ordnerauswahl im Menü an, wo es sie gibt", async () => {
    // Ein Rechner: feines Zeigergerät und ein Browser, der `webkitdirectory`
    // kennt. jsdom bringt beides nicht mit und sähe sonst aus wie ein Telefon.
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("pointer: fine") }));
    const hatteAttribut = "webkitdirectory" in HTMLInputElement.prototype;
    if (!hatteAttribut) (HTMLInputElement.prototype as unknown as Record<string, boolean>).webkitdirectory = false;
    try {
      const nutzer = userEvent.setup();
      const { bilderImport } = buehne();

      await nutzer.click(screen.getByRole("button", { name: "Bögen einlesen…" }));
      await nutzer.click(screen.getByRole("menuitem", { name: "Ganzen Ordner wählen…" }));

      const feld = screen.getByLabelText("Ganzen Ordner wählen…") as HTMLInputElement;
      expect(feld.getAttribute("webkitdirectory")).toBe("");
      await nutzer.upload(feld, [
        new File(["a"], "bogen-1.png", { type: "image/png" }),
        // Ordner-Beifang: wird übergangen, statt als „kein QR-Code" zu melden.
        new File(["x"], ".DS_Store", { type: "" }),
      ]);

      expect(bilderImport.mock.calls[0]![0].map((d) => d.name)).toEqual(["bogen-1.png"]);
    } finally {
      vi.unstubAllGlobals();
      if (!hatteAttribut) delete (HTMLInputElement.prototype as unknown as Record<string, boolean>).webkitdirectory;
    }
  });

  it("öffnet ohne Ordnerauswahl direkt das Dateifenster statt eines Menüs", async () => {
    // jsdom meldet kein Zeigergerät — genau wie ein Telefon, wo der Ordnerknopf
    // etwas anderes täte als er verspricht.
    const nutzer = userEvent.setup();
    buehne();
    const knopf = screen.getByRole("button", { name: "Bögen einlesen…" });
    expect(knopf.getAttribute("aria-haspopup")).toBeNull();

    const feld = screen.getByLabelText("Dateien wählen…") as HTMLInputElement;
    const geoeffnet = vi.spyOn(feld, "click").mockImplementation(() => {});
    await nutzer.click(knopf);
    expect(geoeffnet).toHaveBeenCalledTimes(1);

    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(screen.queryByLabelText("Ganzen Ordner wählen…")).toBeNull();
  });
});

describe("Abrücken mit Zeit, Quittung und Rückweg", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hält die Abrückzeit fest, quittiert mit Uhrzeit und bietet Rückgängig an", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, geaendert, neuLaden } = buehne(["Crailsheim"]);

    await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));

    const e = gespeichert(einsatzId, "Crailsheim");
    expect(e.status).toBe(MeldeStatus.ABGERUECKT);
    expect(typeof e.abgerueckAm).toBe("number");
    expect(geaendert).toHaveBeenCalled();
    // Die Quittung steht in der Ansicht — nicht nur der Zustand der Karte —,
    // und zwar in der festen Leiste im Daumenbereich (R2-H4).
    const quittung = screen.getByRole("status");
    expect(quittung.textContent).toMatch(/„.*Crailsheim.*" abgerückt \d\d:\d\d/);
    expect(quittung.className).toContain("quittung-daumen");

    // Prellschutz: Die Leiste kann unter dem Finger des Doppeltipps liegen —
    // „Rückgängig" nimmt erst nach einem Augenblick an.
    const rueckgaengig = within(quittung).getByRole("button", { name: "Rückgängig" }) as HTMLButtonElement;
    expect(rueckgaengig.disabled).toBe(true);
    await waitFor(() => expect(rueckgaengig.disabled).toBe(false), { timeout: PRELLSCHUTZ_MS + 500 });
    await nutzer.click(rueckgaengig);
    const zurueck = gespeichert(einsatzId, "Crailsheim");
    expect(zurueck.status).toBe(MeldeStatus.ANWESEND);
    expect(zurueck.abgerueckAm).toBeUndefined();
    neuLaden();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("zeigt nur eine Quittung zur Zeit und lässt sie schließen", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = buehne(["Crailsheim", "Aalen"]);
    const karten = () => [...document.querySelectorAll<HTMLElement>(".einheit-zeile")];
    await nutzer.click(within(karten()[1]!).getByRole("button", { name: "Abrücken" }));
    neuLaden();
    await nutzer.click(within(karten()[0]!).getByRole("button", { name: "Abrücken" }));
    neuLaden();
    const quittungen = screen.getAllByRole("status");
    expect(quittungen).toHaveLength(1);
    expect(quittungen[0]!.textContent).toContain("Aalen");

    const schliessen = within(quittungen[0]!).getByRole("button", { name: "Quittung schließen" }) as HTMLButtonElement;
    await waitFor(() => expect(schliessen.disabled).toBe(false), { timeout: PRELLSCHUTZ_MS + 500 });
    await nutzer.click(schliessen);
    expect(screen.queryByRole("status")).toBeNull();
  });

  /** Knopfbeschriftungen der Karte in Reihenfolge. */
  function kartenKnoepfe() {
    return [...document.querySelector(".einheit-zeile .vorlage-aktionen")!.querySelectorAll("button")].map(
      (b) => b.textContent?.trim() ?? "",
    );
  }

  it("setzt den Rückweg „Wieder anwesend“ an die Stelle von „Abrücken“, die übrigen Knöpfe bleiben stehen", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = buehne(["Crailsheim"]);
    const vorher = kartenKnoepfe();
    const platz = vorher.indexOf("Abrücken");
    await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
    neuLaden();

    expect(screen.queryByRole("button", { name: "Abrücken" })).toBeNull();
    const nachher = kartenKnoepfe();
    // Unter dem Finger liegt der Rückweg, nicht „Zug zuordnen" (R2-G4).
    expect(nachher[platz]).toBe("Wieder anwesend");
    expect(nachher.slice(0, platz)).toEqual(vorher.slice(0, platz));
    expect(nachher[platz + 1]).toBe(vorher[platz + 1]);
    // Die Karte nennt die Abrückzeit ohne weiteren Tipp.
    expect(document.querySelector(".zeiten-zeile")!.textContent).toMatch(/abgerückt \d\d:\d\d/);
  });

  it("rollt um den Versatz nach, wenn die Karte beim Abrücken wächst — der Rückweg bleibt unter dem Finger", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = buehne(["Crailsheim"]);
    // Nach dem Abrücken rutscht die Knopfreihe um eine Zeile (28 px) nach unten.
    const proto = HTMLButtonElement.prototype;
    const vorher = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function (this: HTMLButtonElement) {
      const oben = this.textContent?.trim() === "Wieder anwesend" ? 278 : 250;
      return { top: oben, bottom: oben + 44, left: 33, right: 126, width: 93, height: 44, x: 33, y: oben, toJSON() {} } as DOMRect;
    };
    const rollen = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    try {
      await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
      neuLaden();
      expect(rollen).toHaveBeenCalledWith(0, 28);
    } finally {
      rollen.mockRestore();
      proto.getBoundingClientRect = vorher;
    }
  });

  it("schluckt den zweiten Tipp eines Doppeltipps: weder Zurückschalten noch Zug-Editor", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = buehne(["Crailsheim"]);
    const platz = kartenKnoepfe().indexOf("Abrücken");
    const knopfAmPlatz = () =>
      document.querySelector(".einheit-zeile .vorlage-aktionen")!.querySelectorAll("button")[platz]!;

    await nutzer.click(knopfAmPlatz());
    neuLaden();
    // Zweiter Tipp an derselben Stelle, 150 ms später: gesperrt.
    await nutzer.click(knopfAmPlatz());
    expect(gespeichert(einsatzId, "Crailsheim").status).toBe(MeldeStatus.ABGERUECKT);
    expect(screen.queryByRole("textbox", { name: "Zug" })).toBeNull();
    // Auch ein anderer Knopf der Karte nimmt im Prellfenster nichts an.
    await nutzer.click(screen.getByRole("button", { name: "Zug zuordnen" }));
    expect(screen.queryByRole("textbox", { name: "Zug" })).toBeNull();

    // Nach dem Prellfenster wirkt der Rückweg wie gewohnt.
    const echt = Date.now.bind(Date);
    const uhr = vi.spyOn(Date, "now").mockImplementation(() => echt() + PRELLSCHUTZ_MS + 50);
    try {
      await waitFor(() => expect((knopfAmPlatz() as HTMLButtonElement).disabled).toBe(false), { timeout: PRELLSCHUTZ_MS + 500 });
      await nutzer.click(knopfAmPlatz());
    } finally {
      uhr.mockRestore();
    }
    expect(gespeichert(einsatzId, "Crailsheim").status).toBe(MeldeStatus.ANWESEND);
  });
});

describe("Zeiten, Auftrag und Bedarf auf der Karte", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("zeigt die Eintreffzeit und lässt sie über „ändern“ korrigieren", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, geaendert } = buehne(["Wardenburg"]);
    expect(document.querySelector(".zeiten-zeile")!.textContent).toMatch(/eingetroffen \d\d:\d\d/);

    await nutzer.click(screen.getByRole("button", { name: "ändern" }));
    const feld = screen.getByLabelText("Eingetroffen am") as HTMLInputElement;
    // Nachtragen vom Papier: die Einheit kam gestern Abend, erfasst wird heute.
    await nutzer.clear(feld);
    await nutzer.type(feld, "2026-09-26T20:30");
    await nutzer.click(screen.getByRole("button", { name: "Speichern" }));

    expect(gespeichert(einsatzId, "Wardenburg").eingetroffenAm).toBe(new Date("2026-09-26T20:30").getTime());
    expect(geaendert).toHaveBeenCalled();
  });

  it("nimmt einen Auftrag der Führungsstelle auf und speichert ihn beim Verlassen des Felds", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = buehne(["Wardenburg"]);

    await nutzer.click(screen.getByRole("button", { name: "Auftrag/Notiz" }));
    await nutzer.type(screen.getByLabelText("Auftrag/Notiz"), "Deichabschnitt Nord ab 14:00");
    // Kein Speichern-Tipp: der Blick wandert weiter, der Finger tippt irgendwo
    // anders hin (S5) — das Feld darf die Eingabe deshalb nicht vergessen.
    await nutzer.click(document.body);

    expect(gespeichert(einsatzId, "Wardenburg").notiz).toBe("Deichabschnitt Nord ab 14:00");
    neuLaden();
    expect(document.querySelector(".auftrag-notiz")!.textContent).toContain("Deichabschnitt Nord ab 14:00");
    expect(screen.getByRole("button", { name: "Auftrag ändern" })).not.toBeNull();
  });

  it("speichert das Zug-Etikett beim Verlassen des Felds, lässt ein leeres Feld aber unverändert", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = buehne(["Wardenburg"]);

    await nutzer.click(screen.getByRole("button", { name: "Zug zuordnen" }));
    await nutzer.type(screen.getByLabelText("Zug"), "1. Zug");
    await nutzer.click(document.body);
    expect(gespeichert(einsatzId, "Wardenburg").zugEtikett).toBe("1. Zug");

    // Leer verlassen: nichts geändert, Formular zu — der Zug bleibt.
    neuLaden();
    await nutzer.click(screen.getByRole("button", { name: "Zug ändern" }));
    await nutzer.clear(screen.getByLabelText("Zug"));
    await nutzer.click(document.body);
    expect(gespeichert(einsatzId, "Wardenburg").zugEtikett).toBe("1. Zug");
    expect(screen.queryByLabelText("Zug")).toBeNull();
  });

  it("markiert Sofortbedarf auf der Karte und filtert auf Einheiten mit Bedarf", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    const mitBedarf = bogenMitName("Crailsheim");
    mitBedarf.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 400, benzinLiter: 0, gemischLiter: 0, unterbringung: true, ruhezeitErforderlich: true };
    meldungHinzufuegen(angelegt.id, mitBedarf);
    meldungHinzufuegen(angelegt.id, bogenMitName("Albstadt"));
    ansicht(angelegt.id);

    const marken = [...document.querySelectorAll(".bedarf-marke")].map((m) => m.textContent);
    expect(marken).toEqual(["Ruhezeit", "Unterbringung angefordert", "Diesel 400 l"]);
    // Kraftstoff als Routine abgesetzt, Dringendes hervorgehoben (R2-K4).
    expect(document.querySelectorAll(".bedarf-marke.dringend")).toHaveLength(2);
    expect(document.querySelectorAll(".bedarf-marke.routine")).toHaveLength(1);

    await nutzer.click(screen.getByLabelText(/nur dringender Bedarf/));
    const namen = [...document.querySelectorAll(".muster-name")].map((n) => n.textContent ?? "");
    expect(namen).toHaveLength(1);
    expect(namen[0]).toContain("Crailsheim");
    expect(screen.getByRole("heading", { name: /Einheiten \(1 von 2 gemeldet · 2 zählend\)/ })).not.toBeNull();
  });

  it("filtert nicht auf Kraftstoff allein und springt aus „Ruhezeit: n×“ in den Filter (R2-K4)", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    for (const [name, ruhe] of [["Aalen", false], ["Biberach", true], ["Calw", false]] as const) {
      const b = bogenMitName(name);
      b.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 80, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: ruhe };
      meldungHinzufuegen(angelegt.id, b);
    }
    ansicht(angelegt.id);
    await nutzer.click(screen.getByLabelText(/nur dringender Bedarf/));
    let namen = [...document.querySelectorAll(".muster-name")].map((n) => n.textContent ?? "");
    expect(namen).toHaveLength(1);
    expect(namen[0]).toContain("Biberach");

    await nutzer.click(screen.getByLabelText(/nur dringender Bedarf/));
    expect(document.querySelectorAll(".muster-name")).toHaveLength(3);
    await nutzer.click(screen.getByRole("button", { name: "Ruhezeit: 1×" }));
    namen = [...document.querySelectorAll(".muster-name")].map((n) => n.textContent ?? "");
    expect(namen).toHaveLength(1);
    expect(screen.getByText(/1 Einheit mit Ruhezeit/)).not.toBeNull();
  });

  it("zeigt die Lücken des Bogens als Marke mit aufklappbarer Liste", async () => {
    const nutzer = userEvent.setup();
    // Ein leerer Bogen: Stärke 0, kein Auftrag — die Prüfliste hat etwas zu sagen.
    buehne(["Wardenburg"]);
    const marke = screen.getByRole("button", { name: /\d+ Lücken?/ });
    expect(marke.getAttribute("aria-expanded")).toBe("false");
    await nutzer.click(marke);
    expect(document.querySelector(".luecken-liste")!.textContent).toContain("Stärke ist 0");
  });
});

describe("Ausgabewege der Einsatzansicht", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("bietet Weitergeben und Lageblatt an, sobald die App sie verdrahtet", async () => {
    const nutzer = userEvent.setup();
    const weitergeben = vi.fn();
    const lageblatt = vi.fn();
    const sammelPdf = vi.fn();
    buehne(["Wardenburg"], { onWeitergeben: weitergeben, onLageblatt: lageblatt, onSammelPdf: sammelPdf });

    await nutzer.click(screen.getByRole("button", { name: "Einsatz weitergeben / sichern" }));
    await nutzer.click(screen.getByRole("button", { name: "Lageblatt (A4 quer)" }));
    expect(weitergeben).toHaveBeenCalledTimes(1);
    expect(lageblatt).toHaveBeenCalledTimes(1);
    // Die ganze Sammel-PDF gibt es nur noch über „Einsatz weitergeben"; der
    // zweite Knopf erzeugte dieselbe Datei (R2-A3). Der Nachtrag bleibt.
    expect(screen.queryByRole("button", { name: "Sammel-PDF (alle Bögen)" })).toBeNull();
    await nutzer.click(screen.getByRole("checkbox", { name: /Nur neue Bögen seit dem letzten Export/ }));
    await nutzer.click(screen.getByRole("button", { name: "Sammel-PDF (nur neue Bögen)" }));
    expect(sammelPdf).toHaveBeenCalledWith("neue");
  });

  it("sagt, wann zuletzt ein Lageblatt entstand und was seitdem neu ist (R2-A3)", () => {
    buehne(["Wardenburg"], { onLageblatt: vi.fn() });
    expect(document.querySelector(".lageblatt-stand")!.textContent).toBe("Noch kein Lageblatt aus diesem Einsatz.");
    cleanup();
    const angelegt = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, bogenMitName("Wardenburg"));
    lageblattVermerken(einsaetzeLaden().find((s) => s.id === angelegt.id)!);
    meldungHinzufuegen(angelegt.id, bogenMitName("Hatten"));
    ansicht(angelegt.id, { onLageblatt: vi.fn() });
    expect(document.querySelector(".lageblatt-stand")!.textContent).toMatch(/^Lageblatt erstellt .* · seitdem 1 neue Meldung$/);
  });

  it("zeigt die Herkunft als „Empfangen“ statt „Scan“", () => {
    buehne(["Wardenburg"]);
    expect(document.querySelector(".zeiten-zeile")!.textContent).toContain("Empfangen");
  });
});

/**
 * Nachlieferung an den Stab: einmal alles, danach nur, was seitdem dazukam.
 * Das Kästchen schaltet alle Ausgabewege um — der Umfang muss beim Aufrufer
 * ankommen, und ohne neue Bögen darf kein leerer Export entstehen.
 */
describe("Nur neue Bögen seit dem letzten Export", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("gibt vor dem ersten Export alles heraus und sagt, dass alle Bögen neu sind", async () => {
    const nutzer = userEvent.setup();
    const { sammelPdf } = buehne(["Wardenburg", "Hatten"]);

    expect(screen.getByText(/Noch kein Export aus diesem Einsatz/)).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Sammel-PDF (alle Bögen)" }));
    expect(sammelPdf).toHaveBeenCalledWith("alle");
  });

  it("zählt ab, was seit dem letzten Export dazukam, und reicht den Umfang weiter", async () => {
    const nutzer = userEvent.setup();
    const { sammelPdf, csvExport } = buehne(["Wardenburg", "Hatten", "Ganderkesee"], { standAus: ["Wardenburg"] });

    expect(screen.getByText(/seitdem 2 neue Bögen/)).toBeDefined();
    await nutzer.click(screen.getByRole("checkbox", { name: /Nur neue Bögen seit dem letzten Export/ }));

    await nutzer.click(screen.getByRole("button", { name: "Sammel-PDF (nur neue Bögen)" }));
    expect(sammelPdf).toHaveBeenCalledWith("neue");
    await nutzer.click(screen.getByRole("button", { name: "Übersicht als CSV" }));
    expect(csvExport).toHaveBeenCalledWith("neue");

    // Zurück auf alle: die Knöpfe heißen wieder wie vorher und liefern alles.
    await nutzer.click(screen.getByRole("checkbox", { name: /Nur neue Bögen seit dem letzten Export/ }));
    await nutzer.click(screen.getByRole("button", { name: "Sammel-PDF (alle Bögen)" }));
    expect(sammelPdf).toHaveBeenLastCalledWith("alle");
  });

  it("sperrt die Ausgabewege, wenn seit dem letzten Export nichts Neues da ist", async () => {
    const nutzer = userEvent.setup();
    const { sammelPdf } = buehne(["Wardenburg"], { standAus: ["Wardenburg"] });

    expect(screen.getByText(/seitdem keine neuen Bögen/)).toBeDefined();
    const knopf = screen.getByRole("button", { name: "Sammel-PDF (alle Bögen)" });
    expect((knopf as HTMLButtonElement).disabled).toBe(false);

    await nutzer.click(screen.getByRole("checkbox", { name: /Nur neue Bögen seit dem letzten Export/ }));

    for (const name of ["Sammel-PDF (nur neue Bögen)", "Übersicht als CSV", "Alle Daten als CSV", /^Excel-Liste/]) {
      expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(true);
    }
    await nutzer.click(screen.getByRole("button", { name: "Sammel-PDF (nur neue Bögen)" }));
    expect(sammelPdf).not.toHaveBeenCalled();
  });
});

/**
 * Die Kartenansicht für Vorleseprogramme: Die Einheiten waren weder Liste
 * noch Überschrift, und 24 Knopfsätze hießen gleich — „Abrücken" ohne Bezug
 * zur Einheit (Audit Runde 2, R2-M4).
 */
describe("Einheitenkarten als Liste mit Überschrift und Knopfbezug", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("setzt jede Einheit als Listeneintrag mit dem Namen als Überschrift der Ebene 3", () => {
    buehne(["Wardenburg", "Ahlhorn"]);
    const liste = screen.getByRole("list");
    const eintraege = within(liste).getAllByRole("listitem");
    expect(eintraege).toHaveLength(2);
    const ueberschriften = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? "");
    expect(ueberschriften).toHaveLength(2);
    expect(ueberschriften[0]).toContain("Ahlhorn");
    expect(ueberschriften[1]).toContain("Wardenburg");
  });

  it("verbindet jeden Knopf einer Karte mit dem Einheitsnamen, ohne den sichtbaren Namen zu ändern", () => {
    buehne(["Wardenburg", "Ahlhorn"]);
    const abruecken = screen.getAllByRole("button", { name: "Abrücken" });
    expect(abruecken).toHaveLength(2);
    const beschreibungen = abruecken.map((k) => {
      const id = k.getAttribute("aria-describedby");
      return id ? document.getElementById(id)?.textContent ?? "" : "";
    });
    expect(beschreibungen[0]).toContain("Ahlhorn");
    expect(beschreibungen[1]).toContain("Wardenburg");
    // Kein Knopf einer Karte ohne Bezug.
    for (const karte of document.querySelectorAll(".einheit-zeile")) {
      for (const knopf of karte.querySelectorAll("button")) {
        expect(knopf.getAttribute("aria-describedby"), knopf.textContent ?? "").toBeTruthy();
      }
    }
  });
});

/**
 * Oben die Gesamtzahl, direkt darunter „nächste Einheit" — und nach einer
 * Aufnahme bleibt die Ansicht dort (Audit Runde 2, R2-S3).
 */
describe("Summe und Aufnahme im ersten Bild", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("setzt die Aufnahme-Knöpfe direkt unter die Stärkeleiste, vor Bedarf und Zwischensummen", () => {
    buehne(["Wardenburg"]);
    const leiste = document.querySelector(".staerke-leiste")!;
    const scannen = screen.getByRole("button", { name: "Bogen scannen…" });
    const bedarf = screen.getByRole("heading", { name: "Bedarf (anwesende Einheiten)" });
    expect(leiste.nextElementSibling!.contains(scannen)).toBe(true);
    expect(scannen.compareDocumentPosition(bedarf) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("kürzt den Übungshinweis auf eine Zeile; die Namen stehen dahinter", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, bogenMitName("Wardenburg"));
    for (const n of ["Albstadt", "Karlsruhe"]) {
      const b = bogenMitName(n);
      b.uebung = true;
      meldungHinzufuegen(angelegt.id, b);
    }
    ansicht(angelegt.id);
    const hinweis = document.querySelector<HTMLDetailsElement>("details.uebung-ausgenommen")!;
    const zeile = hinweis.querySelector("summary")!;
    expect(zeile.textContent).toBe("2 Übungsmeldungen nicht gezählt — anzeigen");
    expect(hinweis.open).toBe(false);
    await nutzer.click(zeile);
    expect(hinweis.open).toBe(true);
    expect(hinweis.textContent).toContain("Albstadt");
    expect(hinweis.textContent).toContain("Karlsruhe");
  });

  it("quittiert eine Aufnahme oben mit Namen und neuer Gesamtzahl und rollt nicht zur Karte", async () => {
    const nutzer = userEvent.setup();
    const proto = HTMLElement.prototype as unknown as { scrollIntoView?: unknown };
    const vorher = proto.scrollIntoView;
    const gerollt: string[] = [];
    proto.scrollIntoView = function (this: HTMLElement) {
      gerollt.push(this.dataset.einheit ?? this.className);
    };
    const nachOben = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    try {
      const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
      meldungHinzufuegen(angelegt.id, bogenMitName("Albstadt"));
      meldungHinzufuegen(angelegt.id, bogenMitName("Zeitz"));
      const zeitz = gespeichert(angelegt.id, "Zeitz");
      ansicht(angelegt.id, { eingang: { schluessel: zeitz.einheitSchluessel, nonce: 1 } });

      const quittung = screen.getByRole("status");
      expect(quittung.textContent).toMatch(/Zuletzt eingelesen: „.*Zeitz.*" · jetzt 2 Einheiten, Gesamt \d+\./);
      // Die Karte blitzt, aber die Seite bleibt oben.
      expect(document.querySelectorAll(".einheit-zeile.eingegangen")).toHaveLength(1);
      expect(gerollt).toEqual([]);
      expect(nachOben).toHaveBeenCalledWith(0, 0);

      // Auf Wunsch holt die Quittung die Karte ins Bild.
      await nutzer.click(within(quittung).getByRole("button", { name: "In der Liste zeigen" }));
      expect(gerollt).toEqual([zeitz.einheitSchluessel]);
    } finally {
      nachOben.mockRestore();
      if (vorher === undefined) delete proto.scrollIntoView;
      else proto.scrollIntoView = vorher;
    }
  });
});

/**
 * Abgerückte Einheiten traten über 55 % Deckkraft zurück und fielen dabei
 * unter 3:1 (Audit Runde 2, R2-L5). Der Zustand steht jetzt als Wort an der
 * Karte; die Deckkraft-Regel ist im Stylesheet aufgehoben.
 */
describe("Abgerückte Einheit ohne Dimmen (R2-L5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nennt den Zustand als Wort am Namen und lässt die Knöpfe bedienbar", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = buehne(["Ansbach"]);
    await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
    neuLaden();
    const karte = document.querySelector<HTMLElement>(".einheit-zeile")!;
    expect(karte.className).toContain("gestrichen");
    expect(within(karte).getByRole("heading", { level: 3 }).querySelector(".status-badge")!.textContent).toBe("abgerückt");
    const zurueck = within(karte).getByRole("button", { name: "Wieder anwesend" }) as HTMLButtonElement;
    await waitFor(() => expect(zurueck.disabled).toBe(false), { timeout: PRELLSCHUTZ_MS + 500 });
  });
});

/**
 * Neun Knöpfe je Karte machten eine Einheit rund 450 px hoch; die seltenen
 * und folgenschweren Aktionen liegen jetzt hinter „Mehr…" (Audit Runde 2,
 * R2-H9).
 */
describe("Seltene Kartenaktionen hinter „Mehr…“ (R2-H9)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("zeigt Aufteilen, Verschieben und Entfernen erst nach „Mehr…“ und klappt mit „Weniger“ wieder zu", async () => {
    const nutzer = userEvent.setup();
    buehne(["Wardenburg"]);
    for (const name of ["Aufteilen…", "Verschieben…", "Entfernen"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    const mehr = screen.getByRole("button", { name: "Mehr…" });
    expect(mehr.getAttribute("aria-expanded")).toBe("false");
    await nutzer.click(mehr);
    for (const name of ["Aufteilen…", "Verschieben…", "Entfernen"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    const weniger = screen.getByRole("button", { name: "Weniger" });
    expect(weniger.getAttribute("aria-expanded")).toBe("true");
    await nutzer.click(weniger);
    expect(screen.queryByRole("button", { name: "Entfernen" })).toBeNull();
  });
});

/**
 * Telefon: Eine volle Karte war rund 450 px hoch, das Lagebild lief über
 * dreizehn Bildschirmhöhen. Auf schmalem Bildschirm steht jede Einheit
 * zugeklappt als Name, Stärke und Bedarf; Knöpfe erst nach Antippen
 * (Audit Runde 2, R2-K7).
 */
describe("Kompakte Einheiten auf dem Telefon (R2-K7)", () => {
  let vorher: typeof window.matchMedia | undefined;
  beforeEach(() => {
    localStorage.clear();
    vorher = window.matchMedia;
    window.matchMedia = ((abfrage: string) => ({
      matches: abfrage === "(max-width: 600px)",
      media: abfrage,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => {
    if (vorher) window.matchMedia = vorher;
    else delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it("zeigt zugeklappt nur Name, Stärke und Bedarf und klappt auf Tipp auf", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const b = bogenMitName("Crailsheim");
    b.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: true };
    meldungHinzufuegen(angelegt.id, b);
    ansicht(angelegt.id);
    const karte = document.querySelector<HTMLElement>(".einheit-zeile")!;
    expect(karte.className).toContain("kompakt");
    expect(karte.textContent).toMatch(/Stärke \d+ \/ \d+ \/ \d+ \/ \d+/);
    expect(karte.textContent).toContain("Ruhezeit");
    // Keine Knöpfe außer dem Aufklapper, keine Zeitenzeile.
    expect(within(karte).queryByRole("button", { name: "Abrücken" })).toBeNull();
    expect(karte.querySelector(".zeiten-zeile")).toBeNull();
    const auf = within(karte).getByRole("button", { name: /Aufklappen/ });
    expect(auf.getAttribute("aria-expanded")).toBe("false");
    expect(auf.getAttribute("aria-describedby")).toBeTruthy();

    await nutzer.click(auf);
    expect(karte.className).not.toContain("kompakt");
    expect(within(karte).getByRole("button", { name: "Abrücken" })).toBeTruthy();
    await nutzer.click(within(karte).getByRole("button", { name: "Zuklappen" }));
    expect(karte.className).toContain("kompakt");
  });
});

/**
 * Kommen mehrere Einheiten gleichzeitig, will der Meldekopf prüfen, ob alle
 * drin sind — die Quittung nannte nur „4 Bogen/Bögen aufgenommen." (Audit
 * Runde 2, R2-S4).
 */
describe("Quittung nennt die zuletzt aufgenommenen Einheiten (R2-S4)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("listet einen Stapel mit Namen, nennt die Übungen und stellt auf Wunsch die Neuesten nach oben", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = buehne(["Zeitz"]);
    // Vor dem Stapel: keine Sammelquittung.
    expect(document.querySelector(".stapel-eingang")).toBeNull();
    for (const n of ["Weinsberg", "Albstadt", "Ulm"]) {
      const b = bogenMitName(n);
      b.uebung = n !== "Ulm";
      meldungHinzufuegen(einsatzId, b);
    }
    neuLaden();
    const quittung = document.querySelector<HTMLElement>(".stapel-eingang")!;
    expect(quittung.getAttribute("role")).toBe("status");
    expect(quittung.textContent).toMatch(/Zuletzt aufgenommen \(3\): .*Weinsberg.*Albstadt.*Ulm — davon 2 Übung, nicht gezählt\./);
    expect(quittung.textContent).not.toContain("Zeitz");

    await nutzer.click(within(quittung).getByRole("button", { name: "Neueste oben zeigen" }));
    expect((screen.getByLabelText("Sortierung") as HTMLSelectElement).value).toBe("eintreffzeit");

    await nutzer.click(within(quittung).getByRole("button", { name: "Ausblenden" }));
    expect(document.querySelector(".stapel-eingang")).toBeNull();
  });

  it("zählt Aufteilen nicht als Eingang", async () => {
    const angelegt = einsatzAnlegen("Hochwasser Ulm", EinsatzArt.EINSATZ);
    const b = bogenMitName("Ulm");
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 2, mannschaft: 6, gesamt: 8 };
    const ulm = meldungHinzufuegen(angelegt.id, b)!.eintrag;
    const { neuLaden } = ansicht(angelegt.id);
    expect(
      meldungAufteilen(angelegt.id, ulm.id, {
        teilEtikett: "Fachberater",
        personal: [],
        staerke: { fuehrer: 0, unterfuehrer: 1, mannschaft: 1 },
        fahrzeuge: [],
      }),
    ).not.toBeNull();
    neuLaden();
    expect(document.querySelectorAll(".einheit-zeile")).toHaveLength(2);
    expect(document.querySelector(".stapel-eingang")).toBeNull();
  });
});
