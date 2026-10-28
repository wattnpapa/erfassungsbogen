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
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail, PRELLSCHUTZ_MS, letzteMeldungText, tabellenSpaltenFuer } from "./einsaetze-ui";
import { ORTSSPERRE_MS } from "./tipp-schutz";
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
import { eintreffzeitSetzen, meldungAufnehmen, notizSetzen, statusMitZeitSetzen, vomPapierMarkieren, zeitLang, zugSetzen } from "./eintrag-zeiten";
import { aggregiere } from "./auswertung";
import { neuerBogen, neuePerson } from "./hilfen";
import { EXPORT_ZIELE, lageblattVermerken, weitergabeVermerken, type ExportStand, type ExportUmfang, type ExportZiel } from "./export-stand";

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
  opt: Partial<Props> & { standAus?: string[]; zeitpunkt?: number; standJe?: readonly ExportZiel[] } = {},
) {
  const { standAus, zeitpunkt, standJe = EXPORT_ZIELE, ...extra } = opt;
  const angelegt = einsatzAnlegen("Hochwasser Wardenburg", EinsatzArt.EINSATZ);
  for (const n of namen) meldungHinzufuegen(angelegt.id, bogenMitName(n));
  const einsatz = einsaetzeLaden().find((s) => s.id === angelegt.id)!;
  const stand: ExportStand | null = standAus
    ? {
        zeitpunkt: zeitpunkt ?? Date.now(),
        eintragIds: einsatz.eintraege
          .filter((e) => standAus.includes(e.bogen.einheit.hierarchie[0]!.name))
          .map((e) => e.id),
      }
    : null;
  // Stand je Format (R4-W2); ohne Angabe haben alle Formate denselben.
  const exportStaende: Partial<Record<ExportZiel, ExportStand>> = {};
  if (stand) for (const z of standJe) exportStaende[z] = stand;
  return ansicht(angelegt.id, { exportStaende, ...extra });
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

  // Audit Runde 8, R8-D2: Die Rückfrage sagt, welche Nummern sich ändern; die Quittung auch.
  it("nennt in Rückfrage und Quittung die aufrückenden Nummern (R8-D2)", async () => {
    const nutzer = userEvent.setup();
    buehne(["Anna", "Berta", "Cäsar"]);
    // Die Karte von „Anna“ (Nr. 1): ihre Knöpfe liegen im selben Listenelement.
    const karte = screen.getByText(/Anna/, { selector: "h3, h3 *" }).closest("li, article, section")!;
    await nutzer.click(within(karte as HTMLElement).getByRole("button", { name: "Details" }));
    await nutzer.click(within(karte as HTMLElement).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte as HTMLElement).getByRole("button", { name: "Entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    // R18-A1: Die Nummern rücken nicht auf; die Rückfrage nennt die frei bleibende Nummer.
    expect(dialog.textContent).toContain("Nummern bleiben");
    expect(dialog.textContent).toContain("Nr. 1 bleibt frei, die übrigen Nummern (2–3) bleiben");
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    // Die Quittung nennt kurz die frei bleibende Nummer (die Rückfrage hatte den ganzen Satz).
    await waitFor(() => expect(document.querySelector(".quittung-daumen")!.textContent).toContain("Nr. 1 bleibt frei."));
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
    // Handlung vorn, Name danach — die Leiste kürzt am Ende (R3-G2).
    expect(quittung.textContent).toMatch(/^Entfernt \(2 Fassungen\): Meldung Nr\. \d+ „.*Ulm"/);
    expect(quittung.className).toContain("quittung-mehrzeilig"); // R11-D2: Umnummerierung nicht abgeschnitten

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
    // Das Zurückholen quittiert selbst, ohne weiteren Rückweg (R3-G2).
    const zurueckQuittung = screen.getByRole("status");
    expect(zurueckQuittung.textContent).toMatch(/Meldung „.*Ulm" zurückgeholt\./);
    expect(within(zurueckQuittung).queryByRole("button", { name: "Rückgängig" })).toBeNull();
  });

  // Audit Runde 4, R4-D3: Der Rückweg hält nur im Arbeitsspeicher. Die
  // Rückfrage sagt das vorher und nennt, ob es von der Meldung eine Kopie gibt.
  it("sagt in der Rückfrage, dass „Rückgängig“ nur bis zum Neuladen hält — und ob es einen Export gibt (R4-D3)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId } = lage();
    const karte = karteVon("Ulm")!;
    await nutzer.click(within(karte).getByRole("button", { name: "Details" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Entfernen" }));
    let dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    // Seit R17-E2 liegt die Meldung nach dem Neuladen im Papierkorb der Sammlung statt endgültig weg zu sein.
    expect(dialog.textContent).toMatch(/„Rückgängig" gilt bis zum Neuladen/);
    expect(dialog.textContent).toMatch(/danach liegt die Meldung 7 Tage unter „Zuletzt entfernte Meldungen“/);
    // R10-D1: der Name steht im ersten Satz, R10-S3: die Rückfrage ist kurz (höchstens rund 45 Wörter).
    // R14-D1: dazu Nummer und Stärke (bei einem abgeteilten Trupp auch der Teil), damit gleich benannte Karten verschieden lauten.
    expect(dialog.querySelector("p")!.textContent).toMatch(/^(Nr\. \d+ )?„.*Ulm.*" \(\d+ Personen?, Stand .*\) entfernen/);
    const woerter = dialog.querySelector("p")!.textContent!.split(/\s+/).filter(Boolean).length;
    expect(woerter).toBeLessThanOrEqual(50);
    expect(dialog.textContent).toMatch(/Noch kein Export und keine Weitergabe/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    // Mit Export nennt sie die Kopie.
    const s = einsaetzeLaden().find((x) => x.id === einsatzId)!;
    lageblattVermerken(s);
    await nutzer.click(within(karte).getByRole("button", { name: "Entfernen" }));
    dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    expect(dialog.textContent).toMatch(/Kopie: Export oder Weitergabe vom \d\d\.\d\d\.\d{4}/);
    expect(dialog.textContent).not.toMatch(/Noch kein Export/);
  });

  it("hält den Rückweg über das Verlassen der Ansicht hinweg (R3-D4)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = lage();
    const karte = karteVon("Ulm")!;
    await nutzer.click(within(karte).getByRole("button", { name: "Details" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karte).getByRole("button", { name: "Entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
    neuLaden();

    // Ansicht verlassen und wieder öffnen.
    cleanup();
    ansicht(einsatzId);
    const quittung = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(quittung.textContent).toMatch(/^Entfernt \(2 Fassungen\): .*Ulm/);
    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    expect(einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege).toHaveLength(3);

    // Danach ist der Rückweg verbraucht, auch nach erneutem Öffnen.
    cleanup();
    ansicht(einsatzId);
    expect(screen.queryByRole("button", { name: "Rückgängig" })).toBeNull();
  });

  // Audit Runde 9, R9-E2: Zwei Meldungen hintereinander entfernt, „Rückgängig" holte nur die letzte zurück.
  it("holt zwei nacheinander entfernte Meldungen mit zweimal „Rückgängig“ zurück, die jüngste zuerst (R9-E2)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = lage();
    for (const name of ["Ulm", "Blaubeuren"]) {
      const karte = karteVon(name)!;
      await nutzer.click(within(karte).getByRole("button", { name: "Details" }));
      await nutzer.click(within(karte).getByRole("button", { name: "Mehr…" }));
      await nutzer.click(within(karte).getByRole("button", { name: "Entfernen" }));
      const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
      await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));
      neuLaden();
    }
    expect(einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege).toHaveLength(0);
    let quittung = screen.getByRole("status");
    expect(quittung.textContent).toMatch(/Blaubeuren/);
    expect(quittung.textContent).toMatch(/davor noch 1 entfernt/);
    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    neuLaden();
    expect(einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege.map((e) => e.bogen.einheit.hierarchie[0]!.name)).toEqual(["Blaubeuren"]);
    quittung = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(quittung.textContent).toMatch(/Ulm/);
    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    neuLaden();
    expect(einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege).toHaveLength(3);
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
    expect(text).toMatch(/von der Einheit empfangen|am Meldekopf von Hand erfasst|aus Datei übernommen/);
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

  it("öffnet keinen Tab (R17-A2), sondern lädt herunter und gibt die Meldung ohne Fenster mit", async () => {
    const nutzer = userEvent.setup();
    const oeffnen = vi.fn(() => null);
    vi.stubGlobal("open", oeffnen);
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Bogen als PDF" }));

    // Ein Tab mit dem PDF trug im Download-Ordner eine Zufalls-ID als Namen; der Download hat den Namen aus Einheit und Stand.
    expect(oeffnen).not.toHaveBeenCalled();
    expect(meldungPdfAnzeigen).toHaveBeenCalledTimes(1);
    const [meldung, fenster] = meldungPdfAnzeigen.mock.calls[0]!;
    expect(meldung.bogen.einheit.hierarchie[0]!.name).toBe("Wardenburg");
    expect(fenster).toBeNull();
  });

  it("meldet den Fehler, wenn die PDF scheitert", async () => {
    const nutzer = userEvent.setup();
    meldungPdfAnzeigen.mockRejectedValue(new Error("Schriften fehlen"));
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Bogen als PDF" }));

    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Bogen als PDF']")!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain("Schriften fehlen");
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

    // Vorgabe ist die Sortierung nach Nr. wie auf dem Lageblatt (R7-K9); wer zuerst steht, hängt
    // bei gleicher Minute vom Schlüssel ab, darum nur die Nummer prüfen.
    expect(einheitenSpalte()[0]).toMatch(/^Nr\. 1 /);

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
    // F/U/M und Kfz stehen bei der Gesamtstärke — am Laptop lagen sie sonst
    // außerhalb des Rahmens (R3-K7).
    // Ohne vergebenen Zug entfällt die Spalte „Zug" (R10-K3: 45 px leer vor den Zahlen).
    expect(koepfe.slice(0, 9).map((k) => k.replace(/^(\S+?)[A-ZÄÖÜ].*$/, "$1"))).toEqual([
      "Einheit", "F", "U", "M", "Ges.", "Kfz", "Auftrag", "Eingetr.", "Bedarf",
    ]);
    const zeile = within(tabelle).getAllByRole("row")[1]!;
    const zellen = [...zeile.children].map((z) => z.textContent ?? "");
    expect(zellen[0]).toContain("Wardenburg");
    expect(zellen[koepfe.findIndex((k) => k.startsWith("Auftrag"))]).toBe("Deich Nord");
    // Die Aufschlüsselung folgt dahinter, der Absender-Stand steht zuletzt.
    expect(koepfe.findIndex((k) => k.startsWith("Unterbr. M"))).toBeGreaterThan(8);
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
    expect(quittung.textContent).toMatch(/^Abgerückt \d\d:\d\d: Nr\. 1 „.*Crailsheim.*"/);
    expect(quittung.className).toContain("quittung-daumen");

    // R18-G3: „Rückgängig" ist nie gesperrt und nimmt vom ersten Tipp an.
    const rueckgaengig = within(quittung).getByRole("button", { name: "Rückgängig" }) as HTMLButtonElement;
    expect(rueckgaengig.getAttribute("aria-disabled")).toBeNull();
    await nutzer.click(rueckgaengig);
    const zurueck = gespeichert(einsatzId, "Crailsheim");
    expect(zurueck.status).toBe(MeldeStatus.ANWESEND);
    expect(zurueck.abgerueckAm).toBeUndefined();
    neuLaden();
    // Das Zurücknehmen ist selbst quittiert (R3-G2).
    expect(screen.getByRole("status").textContent).toMatch(/^Wieder anwesend: Abrücken von Nr\. 1 „.*Crailsheim.*" zurückgenommen\./);
  });

  it("zeigt nur eine Quittung zur Zeit und lässt sie schließen", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = buehne(["Crailsheim", "Aalen"]);
    // Die Reihenfolge der Karten hängt bei gleicher Minute vom Schlüssel ab, darum über den Namen wählen.
    const karte = (name: string) =>
      [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent?.includes(name))!;
    await nutzer.click(within(karte("Aalen")).getByRole("button", { name: "Abrücken" }));
    neuLaden();
    await nutzer.click(within(karte("Crailsheim")).getByRole("button", { name: "Abrücken" }));
    neuLaden();
    const quittungen = screen.getAllByRole("status");
    expect(quittungen).toHaveLength(1);
    expect(quittungen[0]!.textContent).toContain("Crailsheim");

    const schliessen = within(quittungen[0]!).getByRole("button", { name: "Quittung schließen" }) as HTMLButtonElement;
    await waitFor(() => expect(schliessen.getAttribute("aria-disabled")).toBeNull(), { timeout: PRELLSCHUTZ_MS + 500 });
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
    let nachher = kartenKnoepfe();
    // Unter dem Finger liegt zuerst die Bestätigung, gesperrt (R3-S5) …
    expect(nachher[platz]).toBe("✓ Abgerückt");
    expect((screen.getByRole("button", { name: "✓ Abgerückt" }) as HTMLButtonElement).disabled).toBe(true);
    // … danach der Rückweg, nicht „Zug zuordnen" (R2-G4).
    await waitFor(() => expect(kartenKnoepfe()[platz]).toBe("Wieder anwesend"), { timeout: ORTSSPERRE_MS + 500 });
    nachher = kartenKnoepfe();
    expect(nachher.slice(0, platz)).toEqual(vorher.slice(0, platz));
    expect(nachher[platz + 1]).toBe(vorher[platz + 1]);
    // Die Karte nennt die Abrückzeit ohne weiteren Tipp.
    // Mit Datum, wie Tabelle und Lageblatt (R2-A6).
    expect(document.querySelector(".zeiten-zeile")!.textContent).toMatch(/abgerückt \d\d\.\d\d\.\d{4}, \d\d:\d\d/);
  });

  it("lässt beim Abrücken alle Knöpfe an ihrer Stelle; „Historie“ kommt hinter „Mehr…“ (R12-G3)", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = buehne(["Crailsheim"]);
    const vorher = kartenKnoepfe();
    const platz = vorher.indexOf("Abrücken");
    await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
    neuLaden();
    const nachher = kartenKnoepfe();
    // Jeder Knopf außer dem Statusknopf steht an derselben Stelle, auch „Mehr…“.
    vorher.forEach((name, i) => {
      if (i !== platz) expect(nachher[i]).toBe(name);
    });
    const mehr = nachher.indexOf("Mehr…");
    expect(mehr).toBe(vorher.indexOf("Mehr…"));
    // Die neue Historie steht dahinter, nicht dazwischen.
    expect(nachher.length).toBeGreaterThanOrEqual(vorher.length);
    nachher.forEach((name, i) => {
      if (name.startsWith("Historie")) expect(i).toBeGreaterThan(mehr);
    });
  });

  it("rollt um den Versatz nach, wenn die Karte beim Abrücken wächst — der Rückweg bleibt unter dem Finger", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = buehne(["Crailsheim"]);
    // Nach dem Abrücken rutscht die Knopfreihe um eine Zeile (28 px) nach unten.
    const proto = HTMLButtonElement.prototype;
    const vorher = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function (this: HTMLButtonElement) {
      const oben = this.textContent?.trim() === "Abrücken" ? 250 : 278;
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
    expect(screen.queryByLabelText("Zug")).toBeNull();
    // Ein anderer Knopf der Karte nimmt dagegen sofort an (R17-H3): geschützt ist der Wechselknopf selbst, nicht die Karte.

    // Nach der Sperre wirkt der Rückweg wie gewohnt.
    const echt = Date.now.bind(Date);
    const uhr = vi.spyOn(Date, "now").mockImplementation(() => echt() + ORTSSPERRE_MS + 50);
    try {
      await waitFor(() => expect((knopfAmPlatz() as HTMLButtonElement).disabled).toBe(false), { timeout: ORTSSPERRE_MS + 500 });
      await nutzer.click(knopfAmPlatz());
    } finally {
      uhr.mockRestore();
    }
    expect(gespeichert(einsatzId, "Crailsheim").status).toBe(MeldeStatus.ANWESEND);
  });
});

describe("Folgemeldung holt eine abgerückte Einheit zurück (R5-K1)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nennt die Rückkehr an der Karte und in der Quittung; „Wieder abrücken“ stellt die frühere Abrückzeit her", async () => {
    const nutzer = userEvent.setup();
    const b = buehne(["Wardenburg"]);
    const erste = gespeichert(b.einsatzId, "Wardenburg");
    const abAm = Date.now() - 3 * 3_600_000;
    statusMitZeitSetzen(b.einsatzId, erste.id, MeldeStatus.ABGERUECKT, abAm);
    const neuer = bogenMitName("Wardenburg");
    neuer.stand = erste.bogen.stand + 120;
    const r = meldungAufnehmen(b.einsatzId, neuer, { quelle: "scan" })!;
    expect(r.rueckkehr).toEqual({ abgerueckAm: abAm });
    b.neuLaden();

    // Die Karte sagt es ausdrücklich — nicht erst im Verlauf.
    const hinweis = document.querySelector(".rueckkehr")!;
    expect(hinweis.textContent).toContain("wieder anwesend — war abgerückt seit");
    expect(hinweis.textContent).toContain("zählt wieder mit");

    await nutzer.click(within(hinweis as HTMLElement).getByRole("button", { name: "Wieder abrücken" }));
    await waitFor(() => expect(gespeichert(b.einsatzId, "Wardenburg").status).toBe(MeldeStatus.ABGERUECKT));
    expect(gespeichert(b.einsatzId, "Wardenburg").abgerueckAm).toBe(abAm);
    expect(gespeichert(b.einsatzId, "Wardenburg").rueckkehr).toBeUndefined();
  });
});

describe("Zeiten, Auftrag und Bedarf auf der Karte", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("zeigt die Eintreffzeit und lässt sie über „ändern“ korrigieren", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, geaendert } = buehne(["Wardenburg"]);
    expect(document.querySelector(".zeiten-zeile")!.textContent).toMatch(/eingetroffen \d\d\.\d\d\.\d{4}, \d\d:\d\d/);

    await nutzer.click(screen.getByRole("button", { name: "ändern" }));
    const feld = screen.getByLabelText("Eingetroffen am") as HTMLInputElement;
    // Nachtragen vom Papier: die Einheit kam gestern Abend, erfasst wird heute.
    await nutzer.clear(feld);
    // „Gestern Abend" relativ zu jetzt (R12-E4: ältere Zeiten fragen nach).
    const vorher = new Date(Date.now() - 20 * 3_600_000);
    const zwei = (n: number) => String(n).padStart(2, "0");
    const wert = `${vorher.getFullYear()}-${zwei(vorher.getMonth() + 1)}-${zwei(vorher.getDate())}T${zwei(vorher.getHours())}:${zwei(vorher.getMinutes())}`;
    await nutzer.type(feld, wert);
    await nutzer.click(screen.getByRole("button", { name: "Speichern" }));

    expect(gespeichert(einsatzId, "Wardenburg").eingetroffenAm).toBe(new Date(wert).getTime());
    expect(geaendert).toHaveBeenCalled();
  });

  it("fragt bei einer Eintreffzeit in der Zukunft nach und markiert Abrücken vor Eintreffen (R3-E5)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = buehne(["Crailsheim"]);
    const zukunft = new Date(Date.now() + 10 * 86_400_000);
    zukunft.setSeconds(0, 0);
    const lokal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    await nutzer.click(screen.getByRole("button", { name: "ändern" }));
    const feld = screen.getByLabelText("Eingetroffen am") as HTMLInputElement;
    await nutzer.clear(feld);
    await nutzer.type(feld, lokal(zukunft));
    await nutzer.click(screen.getByRole("button", { name: "Speichern" }));
    const frage = () => document.querySelector<HTMLDialogElement>("dialog[aria-label='Stimmt die Zeit?']");
    expect(frage()!.textContent).toMatch(/liegt in der Zukunft — Tag oder Monat vertauscht\?/);
    // „Zeit korrigieren": nichts gespeichert, das Feld bleibt offen.
    await nutzer.click(within(frage()!).getByRole("button", { name: "Zeit korrigieren" }));
    expect(gespeichert(einsatzId, "Crailsheim").eingetroffenAm).toBeUndefined();
    expect(screen.getByLabelText("Eingetroffen am")).not.toBeNull();

    // „Ja, so speichern": gespeichert, die Karte nennt die Unstimmigkeit.
    await nutzer.click(screen.getByRole("button", { name: "Speichern" }));
    await nutzer.click(within(frage()!).getByRole("button", { name: "Ja, so speichern" }));
    expect(gespeichert(einsatzId, "Crailsheim").eingetroffenAm).toBe(zukunft.getTime());
    neuLaden();
    expect(document.querySelector(".zeit-unstimmig")!.textContent).toMatch(/in der Zukunft/);
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

  // R11-O1: Eingetippt, nicht gespeichert, Feld noch im Fokus — Seite ausgeblendet oder verlassen: Der Text ist nicht weg.
  it("sichert einen getippten Auftrag beim Ausblenden der Seite und ein Zug-Etikett beim Verlassen (R11-O1)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId } = buehne(["Wardenburg"]);

    await nutzer.click(screen.getByRole("button", { name: "Auftrag/Notiz" }));
    await nutzer.type(screen.getByLabelText("Auftrag/Notiz"), "Deich Nord ab 14:00 sichern");
    expect(gespeichert(einsatzId, "Wardenburg").notiz).toBeUndefined();
    const sicht = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState");
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    try {
      await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    } finally {
      delete (document as unknown as Record<string, unknown>).visibilityState;
      if (sicht) Object.defineProperty(Document.prototype, "visibilityState", sicht);
    }
    await waitFor(() => expect(gespeichert(einsatzId, "Wardenburg").notiz).toBe("Deich Nord ab 14:00 sichern"));
    // Das Feld bleibt offen und trägt den Text weiter.
    expect((screen.getByLabelText("Auftrag/Notiz") as HTMLInputElement).value).toBe("Deich Nord ab 14:00 sichern");

    await nutzer.click(screen.getByRole("button", { name: "Zug zuordnen" }));
    await nutzer.type(screen.getByLabelText("Zug"), "2. Zug");
    expect(gespeichert(einsatzId, "Wardenburg").zugEtikett).toBeUndefined();
    await act(async () => { window.dispatchEvent(new Event("pagehide")); });
    await waitFor(() => expect(gespeichert(einsatzId, "Wardenburg").zugEtikett).toBe("2. Zug"));
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
    expect(screen.getByRole("heading", { name: /Einheiten \(1 von 2 gemeldet · 2 anwesend\)/ })).not.toBeNull();
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
    await nutzer.click(screen.getByRole("button", { name: "Ruhezeit: 1 Einheit" }));
    namen = [...document.querySelectorAll(".muster-name")].map((n) => n.textContent ?? "");
    expect(namen).toHaveLength(1);
    expect(screen.getByText(/1 Einheit mit Ruhezeit/)).not.toBeNull();
  });

  it("zeigt die Lücken des Bogens als Marke mit aufklappbarer Liste", async () => {
    const nutzer = userEvent.setup();
    // Ein leerer Bogen: Stärke 0, kein Auftrag — die Prüfliste hat etwas zu sagen.
    buehne(["Wardenburg"]);
    // Der Inhalt statt „n Lücken" (R3-K7).
    const marke = screen.getByRole("button", { name: /^Hinweise: \d+ Punkte, u\. a\. .*$/ });
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
    await nutzer.click(screen.getByRole("button", { name: /^Sammel-PDF \((nur neue Bögen|erste Lieferung: alle Bögen)\)$/ }));
    expect(sammelPdf).toHaveBeenCalledWith("neue");
  });

  it("bietet den Blanko-Vordruck dort an, wo am Meldekopf gearbeitet wird (R3-A7)", async () => {
    const nutzer = userEvent.setup();
    const blanko = vi.fn();
    buehne(["Wardenburg"], { onWeitergeben: vi.fn(), onLageblatt: vi.fn(), onBlanko: blanko });
    await nutzer.click(screen.getByRole("button", { name: "Blanko-Vordruck (Papier-Reserve)" }));
    expect(blanko).toHaveBeenCalledTimes(1);
  });

  /** Audit Runde 5, R5-O3/R5-L4: Sperre, „wird erzeugt…" und Bestätigung unter den Knöpfen. */
  it("sperrt die PDF-Knöpfe während der Erzeugung, beschriftet den laufenden und bestätigt darunter (R5-O3, R5-L4)", async () => {
    const { arbeiten, arbeitetZuruecksetzen } = await import("./arbeitet");
    const weitergeben = vi.fn();
    let fertig!: () => void;
    const lauf = arbeiten("weitergeben", () => new Promise<void>((r) => (fertig = r)));
    try {
      await waitFor(() => expect(typeof fertig).toBe("function"));
      buehne(["Wardenburg"], { onWeitergeben: weitergeben, onLageblatt: vi.fn(), onBlanko: vi.fn() });
      const knopf = screen.getByRole("button", { name: "Einsatz wird erzeugt…" }) as HTMLButtonElement;
      expect(knopf.disabled).toBe(true);
      expect(knopf.getAttribute("aria-busy")).toBe("true");
      expect((screen.getByRole("button", { name: "Lageblatt (A4 quer)" }) as HTMLButtonElement).disabled).toBe(true);
      expect((screen.getByRole("button", { name: "Blanko-Vordruck (Papier-Reserve)" }) as HTMLButtonElement).disabled).toBe(true);
      // R15-O1: Die Dauer richtet sich nach der Zahl der Bögen (hier einer), nie nach einer festen Obergrenze.
      expect(document.querySelector(".arbeitet-zeile")!.textContent).toMatch(/bei 1 Bogen am Telefon etwa 2 Sekunden oder länger\. Nicht noch einmal tippen/);
    } finally {
      fertig();
      await lauf;
      arbeitetZuruecksetzen();
    }
  });

  it("zeigt die Bestätigung der letzten Erzeugung direkt unter den Knöpfen (R5-L4)", () => {
    buehne(["Wardenburg"], { onWeitergeben: vi.fn(), onLageblatt: vi.fn(), ausgabeQuittung: "✓ Lageblatt erzeugt (A4 quer)." });
    const zeile = document.querySelector(".ausgabe-quittung")!;
    expect(zeile.textContent).toBe("✓ Lageblatt erzeugt (A4 quer).");
    expect(zeile.previousElementSibling?.classList.contains("einsatz-weitergabe")).toBe(true);
  });

  it("sagt bei den Papier-Knöpfen, dass die PDFs hell bleiben (R5-L5)", () => {
    buehne(["Wardenburg"], { onWeitergeben: vi.fn(), onLageblatt: vi.fn() });
    expect(screen.getByText(/Die PDFs sind für Papier gedacht — hell, auch in der Ansicht „Nacht“/)).toBeDefined();
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
    expect(document.querySelector(".lageblatt-stand")!.textContent).toMatch(/^Lageblatt erstellt .* · seitdem 1 neue Meldung — Aushang ist nicht mehr aktuell, neu drucken$/);
  });

  it("sagt die Herkunft in Worten statt „Scan“ oder „Empfangen“ (R4-N4)", () => {
    buehne(["Wardenburg"]);
    expect(document.querySelector(".zeiten-zeile")!.textContent).toContain("von der Einheit empfangen, per Scan oder Link");
    expect(document.querySelector(".zeiten-zeile")!.textContent).not.toMatch(/\bScan ·|· Empfangen/);
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

    // Je Format ein eigener Bezugspunkt (R4-W2): hier haben alle vier denselben.
    expect(screen.getAllByText(/seitdem 2 neue Bögen/)).toHaveLength(4);
    await nutzer.click(screen.getByRole("checkbox", { name: /Nur neue Bögen seit dem letzten Export/ }));

    await nutzer.click(screen.getByRole("button", { name: /^Sammel-PDF \((nur neue Bögen|erste Lieferung: alle Bögen)\)$/ }));
    expect(sammelPdf).toHaveBeenCalledWith("neue");
    // R16-W2: Im Nachtrag-Modus nennt der Knopf Nachtrag und Zahl.
    await nutzer.click(screen.getByRole("button", { name: "Übersicht als CSV — Nachtrag (2 Einheiten)" }));
    expect(csvExport).toHaveBeenCalledWith("neue");

    // Zurück auf alle: die Knöpfe heißen wieder wie vorher und liefern alles.
    await nutzer.click(screen.getByRole("checkbox", { name: /Nur neue Bögen seit dem letzten Export/ }));
    await nutzer.click(screen.getByRole("button", { name: "Sammel-PDF (alle Bögen)" }));
    expect(sammelPdf).toHaveBeenLastCalledWith("alle");
  });

  it("sperrt die Ausgabewege, wenn seit dem letzten Export nichts Neues da ist", async () => {
    const nutzer = userEvent.setup();
    const { sammelPdf } = buehne(["Wardenburg"], { standAus: ["Wardenburg"] });

    expect(screen.getAllByText(/seitdem keine neuen Bögen/).length).toBeGreaterThan(0);
    const knopf = screen.getByRole("button", { name: "Sammel-PDF (alle Bögen)" });
    expect((knopf as HTMLButtonElement).disabled).toBe(false);

    await nutzer.click(screen.getByRole("checkbox", { name: /Nur neue Bögen seit dem letzten Export/ }));

    for (const name of [/^Sammel-PDF \(nur neue Bögen\)$/, "Übersicht als CSV — Nachtrag: nichts Neues", "Alle Daten als CSV — Nachtrag: nichts Neues", /^Excel-Liste .* — Nachtrag: nichts Neues$/]) {
      expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(true);
    }
    await nutzer.click(screen.getByRole("button", { name: /^Sammel-PDF \((nur neue Bögen|erste Lieferung: alle Bögen)\)$/ }));
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

  it("setzt jede Einheit als Listeneintrag mit dem Namen als Überschrift der Ebene 3", async () => {
    buehne(["Wardenburg", "Ahlhorn"]);
    await userEvent.setup().selectOptions(screen.getByRole("combobox", { name: "Sortierung" }), "Name (A–Z)");
    const liste = screen.getByRole("list");
    const eintraege = within(liste).getAllByRole("listitem");
    expect(eintraege).toHaveLength(2);
    const ueberschriften = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? "");
    expect(ueberschriften).toHaveLength(2);
    expect(ueberschriften[0]).toContain("Ahlhorn");
    expect(ueberschriften[1]).toContain("Wardenburg");
  });

  it("verbindet jeden Knopf einer Karte mit dem Einheitsnamen, ohne den sichtbaren Namen zu ändern", async () => {
    buehne(["Wardenburg", "Ahlhorn"]);
    await userEvent.setup().selectOptions(screen.getByRole("combobox", { name: "Sortierung" }), "Name (A–Z)");
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
    const zurueck = (await within(karte).findByRole("button", { name: "Wieder anwesend" }, { timeout: ORTSSPERRE_MS + 500 })) as HTMLButtonElement;
    await waitFor(() => expect(zurueck.disabled).toBe(false), { timeout: PRELLSCHUTZ_MS + 500 });
  });
});

describe("Verschieben in eine Übung (R3-E6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nennt die Folge für die Lage und bietet danach „Rückgängig“", async () => {
    const nutzer = userEvent.setup();
    const uebung = einsatzAnlegen("Übung Regnitz", EinsatzArt.UEBUNG);
    const { einsatzId } = buehne(["Crailsheim"]);
    await nutzer.click(screen.getByRole("button", { name: "Mehr…" }));
    await nutzer.click(screen.getByRole("button", { name: "Verschieben…" }));
    const wahl = document.querySelector<HTMLDialogElement>("dialog[aria-label='In anderen Einsatz verschieben']")!;
    expect(wahl.textContent).toContain('aus „Hochwasser Wardenburg"');
    expect(wahl.textContent).toContain("als Übung zählt die Einheit in keiner Lage mehr");
    await nutzer.click(within(wahl).getByRole("button", { name: /Übung Regnitz/ }));

    const quittung = await waitFor(() => document.querySelector<HTMLDialogElement>("dialog[aria-label='Verschoben']")!);
    expect(quittung.textContent).toContain("zählt nicht mehr in „Hochwasser Wardenburg");
    expect(einsaetzeLaden().find((x) => x.id === uebung.id)!.eintraege).toHaveLength(1);
    await nutzer.click(within(quittung).getByRole("button", { name: /^Rückgängig — zurück nach/ }));
    await waitFor(() => expect(einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege).toHaveLength(1));
    expect(einsaetzeLaden().find((x) => x.id === uebung.id)!.eintraege).toHaveLength(0);
  });
});

describe("Verschieben in eine Sammlung, die die Einheit schon führt (R4-E6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sagt im Dialog, dass dort schon gemeldet ist, und „Rückgängig“ lässt deren Eintrag stehen", async () => {
    const nutzer = userEvent.setup();
    const uebung = einsatzAnlegen("Übung Iller", EinsatzArt.UEBUNG);
    // Dieselbe Meldung (gleiche Eintrags-ID) steht schon in der Übung, mit eigenem Auftrag.
    const dort = meldungHinzufuegen(uebung.id, bogenMitName("Crailsheim"))!.eintrag;
    notizSetzen(uebung.id, dort.id, "Übungsauftrag Nord");
    const { einsatzId } = buehne(["Crailsheim"]);
    await nutzer.click(screen.getByRole("button", { name: "Mehr…" }));
    await nutzer.click(screen.getByRole("button", { name: "Verschieben…" }));
    const wahl = document.querySelector<HTMLDialogElement>("dialog[aria-label='In anderen Einsatz verschieben']")!;
    expect(wahl.textContent).toContain("dort schon gemeldet, wird zusammengeführt");
    await nutzer.click(within(wahl).getByRole("button", { name: /Übung Iller/ }));
    const quittung = await waitFor(() => document.querySelector<HTMLDialogElement>("dialog[aria-label='Verschoben']")!);
    expect(quittung.textContent).toContain("war sie schon gemeldet");
    await nutzer.click(within(quittung).getByRole("button", { name: /^Rückgängig — zurück nach/ }));
    await waitFor(() => expect(einsaetzeLaden().find((x) => x.id === einsatzId)!.eintraege).toHaveLength(1));
    // Beide Sammlungen führen wieder je einen Eintrag, die Übung mit ihrem Auftrag.
    const ziel = einsaetzeLaden().find((x) => x.id === uebung.id)!;
    expect(ziel.eintraege).toHaveLength(1);
    expect(ziel.eintraege[0]!.notiz).toBe("Übungsauftrag Nord");
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

  // Audit Runde 4, R4-K5: Die erste Karte lag am Telefon vier Bildschirme tief.
  it("Telefon, kurze Liste: Suche und Filter hinter einer Zeile, Zwischensummen zu, Karte bleibt Einzelspalte (R4-K5)", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    for (const n of ["Aalen", "Biberach"]) meldungHinzufuegen(angelegt.id, bogenMitName(n));
    ansicht(angelegt.id);
    const wahl = document.querySelector<HTMLDetailsElement>("details.einheiten-filter-wahl")!;
    expect(wahl).not.toBeNull();
    expect(wahl.open).toBe(false);
    expect(wahl.querySelector("summary")!.textContent).toBe("Suchen, sortieren, filtern");
    // Der Rahmen für die zweispaltige Ansicht ist da; die Liste liegt daneben, nicht darin.
    const seite = document.querySelector(".einsatz-seite")!;
    expect(seite.querySelector(".staerke-leiste")).not.toBeNull();
    expect(seite.querySelector(".einsatz-liste")).toBeNull();
    expect(document.querySelector("main.einsatz-detail > .einsatz-liste")).not.toBeNull();
    // Aufklappen zeigt die Felder und merkt sich das.
    await nutzer.click(within(wahl).getByText("Suchen, sortieren, filtern"));
    expect(wahl.open).toBe(true);
    await nutzer.type(within(wahl).getByLabelText("Suche"), "Aalen");
    expect(wahl.querySelector("summary")!.textContent).toBe("Suchen, sortieren, filtern · Filter aktiv");
    expect(wahl.open).toBe(true);
  });

  // Audit Runde 10, R10-K2: Der Tipp auf „n ohne Auftrag" zeigte das Werkzeug statt der Einheiten.
  it("Telefon: „n ohne Auftrag“ filtert, ohne das Filterfeld aufzuklappen, und rollt zur Liste (R10-K2)", async () => {
    const nutzer = userEvent.setup();
    const rollen = vi.fn();
    const alt = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = rollen;
    try {
      const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
      for (const n of ["Aalen", "Biberach", "Celle"]) meldungHinzufuegen(angelegt.id, bogenMitName(n));
      ansicht(angelegt.id);
      const wahl = document.querySelector<HTMLDetailsElement>("details.einheiten-filter-wahl")!;
      await nutzer.click(screen.getByRole("button", { name: "3 ohne Auftrag" }));
      expect(wahl.open).toBe(false);
      expect(wahl.querySelector("summary")!.textContent).toBe("Suchen, sortieren, filtern · Filter aktiv: ohne Auftrag");
      expect(screen.getByRole("button", { name: "Filter aufheben" })).toBeDefined();
      await vi.waitFor(() => expect(rollen).toHaveBeenCalled());
      expect(rollen.mock.contexts.some((el) => (el as Element).classList.contains("luecken-zaehler"))).toBe(true);
    } finally {
      Element.prototype.scrollIntoView = alt;
    }
  });

  it("Telefon: Zwischensummen bei zwei Zügen zugeklappt (R4-K5)", () => {
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const a = meldungHinzufuegen(angelegt.id, bogenMitName("Aalen"))!.eintrag;
    const b = meldungHinzufuegen(angelegt.id, bogenMitName("Biberach"))!.eintrag;
    zugSetzen(angelegt.id, a.einheitSchluessel, a.id, "1. Zug");
    zugSetzen(angelegt.id, b.einheitSchluessel, b.id, "2. Zug");
    ansicht(angelegt.id);
    const summen = document.querySelector<HTMLDetailsElement>("details.zug-summen")!;
    expect(summen).not.toBeNull();
    expect(summen.open).toBe(false);
  });

  it("Telefon, lange Liste: die Suchleiste steht hinter einer Zeile, damit die erste Karte höchstens zwei Bildschirme tief liegt (R5-K4)", () => {
    const angelegt = einsatzAnlegen("Grosslage", EinsatzArt.EINSATZ);
    for (let i = 0; i < 10; i++) meldungHinzufuegen(angelegt.id, bogenMitName(`Ortsverband ${i + 1}`));
    ansicht(angelegt.id);
    const wahl = document.querySelector<HTMLDetailsElement>("details.einheiten-filter-wahl")!;
    expect(wahl).not.toBeNull();
    expect(wahl.open).toBe(false);
    // Der Bedarf ist am Telefon eine Zeile mit Summen und klappt auf.
    const bedarf = document.querySelector<HTMLDetailsElement>("details.bedarf-block")!;
    expect(bedarf.open).toBe(false);
    expect(bedarf.querySelector("summary")!.textContent).toMatch(/^Bedarf: Verpflegung/);
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

  it("Tipp auf die Hinweise-Marke klappt auf und zeigt die Hinweise gleich im Satz (R4-N4)", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, bogenMitName("Ulm"));
    ansicht(angelegt.id);
    const karte = document.querySelector<HTMLElement>(".einheit-zeile")!;
    const marke = karte.querySelector<HTMLElement>("[data-oeffnet='luecken']")!;
    expect(marke).not.toBeNull();
    // jsdom kennt elementsFromPoint nicht: die Marke liegt „unter dem Finger“.
    const doc = document as unknown as { elementsFromPoint?: (x: number, y: number) => Element[] };
    doc.elementsFromPoint = () => [karte.querySelector(".karte-aufklappen")!, marke];
    try {
      expect(karte.querySelector(".luecken-liste")).toBeNull();
      await nutzer.click(within(karte).getByRole("button", { name: /Aufklappen/ }));
      expect(karte.className).not.toContain("kompakt");
      expect(karte.querySelector(".luecken-liste")!.textContent).toContain("Stärke ist 0");
    } finally {
      delete doc.elementsFromPoint;
    }
  });

  it("ein Tipp neben der Hinweise-Marke klappt nur auf (R4-N4)", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, bogenMitName("Ulm"));
    ansicht(angelegt.id);
    const karte = document.querySelector<HTMLElement>(".einheit-zeile")!;
    const doc = document as unknown as { elementsFromPoint?: (x: number, y: number) => Element[] };
    doc.elementsFromPoint = () => [karte.querySelector(".karte-aufklappen")!];
    try {
      await nutzer.click(within(karte).getByRole("button", { name: /Aufklappen/ }));
      expect(karte.className).not.toContain("kompakt");
      expect(karte.querySelector(".luecken-liste")).toBeNull();
    } finally {
      delete doc.elementsFromPoint;
    }
  });

  it("nennt zugeklappt Folgemeldung mit Stärkeänderung, Auftrag und Lücken als kurze Merkmale (R3-K2)", () => {
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const erst = bogenMitName("Crailsheim");
    erst.personalErfassung = PersonalErfassung.NUR_STAERKE;
    erst.staerkeManuell = { fuehrer: 0, unterfuehrer: 3, mannschaft: 9, gesamt: 12 };
    const e1 = meldungHinzufuegen(angelegt.id, erst)!.eintrag;
    notizSetzen(angelegt.id, e1.id, "Pumpenstandort Kocherbrücke");
    const folge = structuredClone(erst);
    folge.staerkeManuell = { fuehrer: 0, unterfuehrer: 3, mannschaft: 6, gesamt: 9 };
    folge.stand += 5;
    meldungAufnehmen(angelegt.id, folge);
    meldungHinzufuegen(angelegt.id, bogenMitName("Ulm"));
    ansicht(angelegt.id);
    const [crailsheim, ulm] = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")];
    expect(crailsheim!.className).toContain("kompakt");
    const zeile = crailsheim!.querySelector(".kompakt-zeile")!;
    expect(zeile.querySelector(".folge-merkmal")!.textContent).toMatch(/^Folgemeldung \d\d:\d\d · 12 → 9$/);
    expect(zeile.querySelector(".folge-merkmal")!.className).toContain("staerke-verlust");
    // R7-K6: der Inhalt statt eines Hakens.
    expect(zeile.querySelector(".auftrag-merkmal")!.textContent).toBe("Auftrag: Pumpenstandort Kocherbrücke");
    // Die Marke „neue Fassung" bleibt zugeklappt sichtbar (anders als „kürzlich eingetroffen").
    expect(crailsheim!.querySelector(".fassung-badge")).not.toBeNull();
    expect(ulm!.querySelector(".folge-merkmal")).toBeNull();
    expect(ulm!.querySelector(".auftrag-merkmal")).toBeNull();
    expect(ulm!.querySelector(".luecken-merkmal")).not.toBeNull();
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
    expect(quittung.textContent).toMatch(/Neu seit der letzten Kenntnisnahme \(3\): davon 2 Übung, nicht gezählt\./);
    expect([...quittung.querySelectorAll("li")].map((li) => li.textContent)).toEqual([
      "THW Weinsberg — neu gemeldet",
      "THW Albstadt — neu gemeldet",
      "THW Ulm — neu gemeldet",
    ]);
    expect(quittung.textContent).not.toContain("Zeitz");

    // Der Link sortiert UND bringt die Liste ins Bild (R4-K5).
    const spring = vi.fn();
    Element.prototype.scrollIntoView = spring;
    await nutzer.click(within(quittung).getByRole("button", { name: "Zuletzt gemeldete oben zeigen" }));
    expect((screen.getByLabelText("Sortierung") as HTMLSelectElement).value).toBe("zuletzt");
    await waitFor(() => expect(spring).toHaveBeenCalled());
    expect((spring.mock.contexts[0] as HTMLElement).id).toBe("einheiten-liste");

    await nutzer.click(within(quittung).getByRole("button", { name: "Zur Kenntnis genommen" }));
    expect(document.querySelector(".stapel-eingang")).toBeNull();
  });

  // R11-D1: „Zur Kenntnis genommen" hat eine Quittung mit „Rückgängig", die die Liste zurückbringt; die Ziele liegen
  // in einer eigenen Reihe (44-px-Regel im Stylesheet). R11-O4: bei vollem Speicher meldet es das.
  it("quittiert „Zur Kenntnis genommen“ mit „Rückgängig“ und meldet einen vollen Speicher (R11-D1, R11-O4)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = buehne(["Zeitz"]);
    for (const n of ["Weinsberg", "Albstadt"]) meldungHinzufuegen(einsatzId, bogenMitName(n));
    neuLaden();
    const quittung = document.querySelector<HTMLElement>(".stapel-eingang")!;
    expect(quittung.querySelector(".kenntnis-aktionen")).not.toBeNull();
    await nutzer.click(within(quittung).getByRole("button", { name: "Zur Kenntnis genommen" }));
    expect(document.querySelector(".stapel-eingang")).toBeNull();
    const rueck = await screen.findByRole("button", { name: "Zur Kenntnis genommen rückgängig machen" });
    await waitFor(() => expect(rueck.getAttribute("aria-disabled")).toBeNull(), { timeout: PRELLSCHUTZ_MS + 500 });
    await nutzer.click(rueck);
    expect(document.querySelector(".stapel-eingang")).not.toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("voll", "QuotaExceededError");
    });
    await nutzer.click(within(document.querySelector<HTMLElement>(".stapel-eingang")!).getByRole("button", { name: "Zur Kenntnis genommen" }));
    expect(document.querySelector("dialog.abfrage")?.textContent).toContain("Kenntnisnahme nicht gespeichert");
    vi.restoreAllMocks();
  });

  /**
   * R4-K7: „neu" und „neue Fassung" hängen an der Kenntnisnahme, nicht an der
   * Uhr — „Zur Kenntnis genommen" nimmt beide Marken weg, und eine eben
   * eingetroffene Einheit trägt zugeklappt dieselbe Marke wie eine Folgemeldung.
   */
  it("setzt „neu“ und „neue Fassung“ bis zur Kenntnisnahme und nimmt beide dann weg (R4-K7)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = buehne(["Zeitz"]);
    meldungHinzufuegen(einsatzId, bogenMitName("Biberach"));
    const folge = bogenMitName("Zeitz");
    folge.stand += 30;
    folge.einsatz = { ...folge.einsatz, ortAuftrag: "Deich Süd" };
    meldungHinzufuegen(einsatzId, folge);
    neuLaden();
    expect(document.querySelectorAll(".neu-badge")).toHaveLength(1);
    expect(document.querySelector(".neu-badge .neu-kurz")!.textContent).toBe("neu");
    expect(document.querySelectorAll(".fassung-badge")).toHaveLength(1);
    await nutzer.click(screen.getByRole("button", { name: "Zur Kenntnis genommen" }));
    expect(document.querySelectorAll(".neu-badge")).toHaveLength(0);
    expect(document.querySelectorAll(".fassung-badge")).toHaveLength(0);
  });

  it("legt Weitergabe, Lageblatt und Export unter die Liste und verweist von oben darauf (R4-K5)", () => {
    buehne(["Zeitz", "Hatten"], { onWeitergeben: vi.fn(), onLageblatt: vi.fn() });
    const liste = document.getElementById("einheiten-liste")!;
    const ausgabe = document.getElementById("ausgabe-block")!;
    expect(liste.compareDocumentPosition(ausgabe) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(ausgabe).getByRole("button", { name: "Einsatz weitergeben / sichern" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Weitergeben, Lageblatt, Export/ })).toBeTruthy();
  });

  it("zeigt an Karte und Quittung, dass ein Bogen für eine andere Lage ausgefüllt scheint, ohne ihn auszunehmen (R4-K6)", () => {
    // Mit Ort der Sammlung: ohne ihn gäbe es für die ersten Bögen keine Vergleichsbasis (R5-N1).
    const angelegt = einsatzAnlegen("Hochwasser Jagst", EinsatzArt.EINSATZ, "Jagst");
    const passend = bogenMitName("Albstadt");
    passend.einsatz = { ...passend.einsatz, ortAuftrag: "Deichverteidigung Jagst" };
    meldungHinzufuegen(angelegt.id, passend);
    const { neuLaden } = ansicht(angelegt.id);
    const fremd = bogenMitName("Schwabach");
    fremd.einsatz = { ...fremd.einsatz, ortAuftrag: "Waldbrand Gräfenberg – Wasserversorgung" };
    meldungHinzufuegen(angelegt.id, fremd);
    neuLaden();
    const karten = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")];
    const schwabach = karten.find((k) => k.textContent!.includes("Schwabach"))!;
    expect(schwabach.textContent).toContain("Bogen nennt: „Waldbrand Gräfenberg – Wasserversorgung“");
    expect(karten.find((k) => k.textContent!.includes("Albstadt"))!.textContent).not.toContain("Bogen nennt");
    expect(document.querySelector(".stapel-eingang")!.textContent).toContain("Ort im Bogen: „Waldbrand Gräfenberg");
    // Gezählt wird er weiter.
    expect(screen.getByText("Einheiten (2 gemeldet · 2 anwesend)")).toBeTruthy();
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

/**
 * Folgemeldungen fielen nicht auf: Sie erben die Eintreffzeit, bekamen keine
 * Marke, standen in „neueste zuerst" hinten, und nach dem Neuladen war die
 * Quittung weg (Audit Runde 3, R3-K1).
 */
describe("Folgemeldungen als neue Fassung erkennbar (R3-K1)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function staerkeBogen(name: string, gesamt: number): Erfassungsbogen {
    const b = bogenMitName(name);
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 1, mannschaft: gesamt - 1, gesamt };
    return b;
  }

  it("nennt die Folgemeldung mit Stärkeänderung, auch nach dem Neuaufbau, bis zur Kenntnisnahme", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Kocher", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, staerkeBogen("Crailsheim", 12));
    meldungHinzufuegen(angelegt.id, staerkeBogen("Ulm", 6));
    // Erstes Öffnen: alles Vorhandene gilt als gesehen.
    ansicht(angelegt.id);
    expect(document.querySelector(".stapel-eingang")).toBeNull();
    cleanup();

    const folge = staerkeBogen("Crailsheim", 9);
    folge.stand += 5;
    meldungHinzufuegen(angelegt.id, folge);
    // Neu aufgebaut wie nach einem Neuladen: die Quittung steht.
    ansicht(angelegt.id);
    const quittung = document.querySelector<HTMLElement>(".stapel-eingang")!;
    expect(quittung.textContent).toMatch(/Neu seit der letzten Kenntnisnahme \(1\)/);
    expect(quittung.textContent).toMatch(/THW Crailsheim — Folgemeldung \d\d:\d\d: Stärke 12 → 9 \(−3\)/);
    expect(quittung.querySelector(".staerke-verlust")!.textContent).toBe("Stärke 12 → 9 (−3)");

    const karte = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes("Crailsheim"))!;
    expect(karte.querySelector(".fassung-badge")!.textContent).toContain("neue Fassung");
    expect(karte.querySelector(".diff-kurz")!.textContent).toMatch(/^Folgemeldung \d\d\.\d\d\.\d{4}, \d\d:\d\d \(vorher Stand .*\): Stärke 12 → 9 \(−3\)$/);

    await nutzer.click(within(quittung).getByRole("button", { name: "Zur Kenntnis genommen" }));
    expect(document.querySelector(".stapel-eingang")).toBeNull();
    cleanup();
    ansicht(angelegt.id);
    expect(document.querySelector(".stapel-eingang")).toBeNull();
  });

  it("stellt in „Zuletzt gemeldet“ die Folgemeldung nach oben, obwohl sie die alte Eintreffzeit erbt", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Kocher", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, staerkeBogen("Crailsheim", 12));
    const erst = gespeichert(angelegt.id, "Crailsheim");
    eintreffzeitSetzen(angelegt.id, erst.id, Date.now() - 24 * 3600_000);
    meldungHinzufuegen(angelegt.id, staerkeBogen("Ulm", 6));
    eintreffzeitSetzen(angelegt.id, gespeichert(angelegt.id, "Ulm").id, Date.now() - 3600_000);
    const folge = staerkeBogen("Crailsheim", 9);
    folge.stand += 5;
    meldungAufnehmen(angelegt.id, folge);
    ansicht(angelegt.id);
    const reihe = () => [...document.querySelectorAll(".einheit-zeile h3")].map((h) => h.textContent);
    await nutzer.selectOptions(screen.getByLabelText("Sortierung"), "eintreffzeit");
    expect(reihe()[0]).toContain("Ulm");
    await nutzer.selectOptions(screen.getByLabelText("Sortierung"), "zuletzt");
    expect(reihe()[0]).toContain("Crailsheim");
  });
});

describe("Unterbringung: angefordert und alle Anwesenden getrennt (R3-K4)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nennt Einheiten und Personen mit angeforderter Unterbringung und WC/Dusche für alle", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Kocher", EinsatzArt.EINSATZ);
    const mit = bogenMitName("Weinsberg");
    mit.personalErfassung = PersonalErfassung.NUR_STAERKE;
    mit.staerkeManuell = { fuehrer: 0, unterfuehrer: 4, mannschaft: 15, gesamt: 19 };
    mit.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: true, ruhezeitErforderlich: false };
    meldungHinzufuegen(angelegt.id, mit);
    const ohne = structuredClone(mit);
    ohne.einheit.hierarchie[0]!.name = "Ulm";
    ohne.staerkeManuell = { fuehrer: 0, unterfuehrer: 2, mannschaft: 6, gesamt: 8 };
    ohne.sofortbedarf!.unterbringung = false;
    meldungHinzufuegen(angelegt.id, ohne);
    ansicht(angelegt.id);
    const dd = document.querySelector<HTMLElement>(".unterbringung-angefordert")!;
    expect(dd.textContent).toBe("1 Einheit, 19 Personen (0 männl. / 0 weibl. / 0 div. · 19 ohne Angabe zum Geschlecht)");
    expect(screen.getByText("WC/Dusche (alle Anwesenden)").nextElementSibling!.textContent).toBe("0 männl. / 0 weibl. / 0 div. · 27 ohne Angabe zum Geschlecht");
    await nutzer.click(within(dd).getByRole("button", { name: "1 Einheit" }));
    expect(document.querySelectorAll(".einheit-zeile")).toHaveLength(1);
  });
});

describe("Zeitbezug der letzten Meldung (R3-K5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nennt im Kopf und auf der Startseitenkarte die letzte Meldung, dort auch das seit der Kenntnisnahme Neue", () => {
    const angelegt = einsatzAnlegen("Hochwasser Kocher", EinsatzArt.EINSATZ);
    const e = meldungHinzufuegen(angelegt.id, bogenMitName("Crailsheim"))!.eintrag;
    const zeit = zeitLang(e.empfangenAm);
    ansicht(angelegt.id);
    expect(document.querySelector(".letzte-meldung")!.textContent).toBe(` · letzte Meldung ${zeit} (gerade eben)`);
    const s = () => einsaetzeLaden().find((x) => x.id === angelegt.id)!;
    expect(letzteMeldungText(s())).toBe(`Letzte Meldung ${zeit} (gerade eben)`);
    meldungHinzufuegen(angelegt.id, bogenMitName("Ulm"));
    expect(letzteMeldungText(s())).toMatch(/^Letzte Meldung .* · 1 neu seit der letzten Kenntnisnahme$/);
  });
});

describe("Bemerkung der Einheit auf der Karte (R3-K3)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("zeigt „Sonstiges“ ohne „Details“, lange Texte gekürzt mit „ganz zeigen“, eine neue Bemerkung hervorgehoben", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Kocher", EinsatzArt.EINSATZ);
    const lang = bogenMitName("Albstadt");
    lang.sonstiges = "MzKW zusätzlich über StAN-Soll dabei. " + "Weitere Angaben zur Lage. ".repeat(8);
    meldungHinzufuegen(angelegt.id, lang);
    const w = bogenMitName("Weinsberg");
    w.sonstiges = "1 Helfer über StAN-Soll";
    meldungHinzufuegen(angelegt.id, w);
    const w2 = structuredClone(w);
    w2.sonstiges = "Ölsperre 200 m verbraucht, Nachschub nötig";
    w2.stand += 5;
    meldungAufnehmen(angelegt.id, w2);
    ansicht(angelegt.id);
    const [albstadt, weinsberg] = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")];
    const zeile = albstadt!.querySelector<HTMLElement>(".bemerkung")!;
    expect(zeile.textContent).toMatch(/^Bemerkung der Einheit: MzKW zusätzlich über StAN-Soll dabei\..* … ganz zeigen$/);
    await nutzer.click(within(zeile).getByRole("button", { name: "ganz zeigen" }));
    expect(zeile.textContent).toContain("Weitere Angaben zur Lage. Weitere Angaben zur Lage.");
    expect(within(zeile).getByRole("button", { name: "kürzer" })).toBeTruthy();
    const neu = weinsberg!.querySelector<HTMLElement>(".bemerkung")!;
    expect(neu.className).toContain("bemerkung-neu");
    expect(neu.textContent).toBe("Bemerkung der Einheit (neu): Ölsperre 200 m verbraucht, Nachschub nötig");
  });
});

/**
 * Aufteilen quittierte nichts: die neue Karte stand wortlos in der Liste, der
 * Rückweg „Zusammenführen…" war nirgends genannt (Audit Runde 2, R2-D6).
 */
describe("Aufteilen mit Quittung und Rückweg (R2-D6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("quittiert die Aufteilung mit Namen und Rückweg; „Rückgängig“ stellt den Stand davor her", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const b = bogenMitName("Wardenburg");
    b.personal = ["Rudolph", "Lang", "Weber"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
    meldungHinzufuegen(angelegt.id, b);
    const vorher = einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege.map((e) => e.id);
    const { neuLaden } = ansicht(angelegt.id);

    await nutzer.click(screen.getByRole("button", { name: "Mehr…" }));
    await nutzer.click(screen.getByRole("button", { name: "Aufteilen…" }));
    await nutzer.type(screen.getByLabelText("Bezeichnung des abgeteilten Teils"), "Fachberater");
    await nutzer.click(screen.getByRole("checkbox", { name: /Rudolph/ }));
    await nutzer.click(screen.getByRole("button", { name: "Aufteilen" }));
    neuLaden();

    expect(document.querySelectorAll(".einheit-zeile")).toHaveLength(2);
    const quittung = screen.getByRole("status");
    expect(quittung.className).toContain("quittung-daumen");
    // R11-D2: Der Rest des Satzes („abgeteilt", Weg über „Zusammenführen…") wird nicht nach zwei Zeilen abgeschnitten.
    expect(quittung.className).toContain("quittung-mehrzeilig");
    expect(quittung.textContent).toMatch(/„Fachberater" von „.*Wardenburg" abgeteilt\. Später zurück über „Mehr…" › „Zusammenführen…"\./);

    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    neuLaden();
    expect(document.querySelectorAll(".einheit-zeile")).toHaveLength(1);
    expect(einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege.map((e) => e.id)).toEqual(vorher);
    // Zurückgenommen ist quittiert, ohne zweiten Rückweg (R3-G2).
    const zurueck = screen.getByRole("status");
    expect(zurueck.textContent).toMatch(/^Aufteilen zurückgenommen: „Fachberater" ist wieder Teil von „.*Wardenburg"\./);
    expect(within(zurueck).queryByRole("button", { name: "Rückgängig" })).toBeNull();
  });
});

/**
 * „Stärke ändern…" prüfte nichts, zeigte keine Summe, verlor bei Tippfehlern
 * alle Felder und bot nach der Übernahme kein „Rückgängig“ (Audit Runde 4, R4-E4).
 */
describe("Stärke ändern mit Prüfung und Rückweg (R4-E4)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function einsatzMitDreiPersonen() {
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const b = bogenMitName("Wardenburg");
    b.personal = ["Rudolph", "Lang", "Weber"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
    meldungHinzufuegen(angelegt.id, b);
    return ansicht(angelegt.id);
  }

  async function dialogOeffnen(nutzer: ReturnType<typeof userEvent.setup>) {
    await nutzer.click(screen.getByRole("button", { name: "Mehr…" }));
    await nutzer.click(screen.getByRole("button", { name: "Stärke ändern…" }));
    return document.querySelector<HTMLDialogElement>("dialog[aria-label='Stärke ändern']")!;
  }

  async function eintragen(nutzer: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, feld: string, wert: string) {
    const f = within(dialog).getByLabelText(feld);
    await nutzer.clear(f);
    await nutzer.type(f, wert);
  }

  it("warnt bei „66“ statt „6“, nennt alt → neu und nimmt es mit „Rückgängig“ zurück", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = einsatzMitDreiPersonen();
    const dialog = await dialogOeffnen(nutzer);
    await eintragen(nutzer, dialog, "Mannschaft", "66");
    await nutzer.click(within(dialog).getByRole("button", { name: "Stärke übernehmen" }));

    const frage = document.querySelector<HTMLDialogElement>("dialog[aria-label='Stimmt die Stärke?']")!;
    expect(frage.textContent).toContain("0 / 0 / 3 / 3 → 0 / 0 / 66 / 66");
    expect(frage.textContent).toMatch(/Stärke: 66 Mannschaft — stimmt das\?/);
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
    await nutzer.click(within(frage).getByRole("button", { name: "Ja, so übernehmen" }));
    neuLaden();

    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(2);
    const quittung = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(quittung.textContent).toMatch(/^Stärke 3 → 66 geändert: „.*Wardenburg"/);

    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    neuLaden();
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
    expect(document.querySelector(".quittung-daumen")!.textContent).toMatch(/^Stärke zurückgenommen: „.*Wardenburg" gilt wieder mit 3\./);
  });

  // Audit Runde 5, R5-E6: 0 / 0 / 0 nahm eine Einheit ohne Rückfrage aus der Stärke.
  it("fragt bei 0 / 0 / 0 und bei einem Absturz unter ein Viertel nach, bei einer kleinen Korrektur nicht (R5-E6)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId } = einsatzMitDreiPersonen();
    const dialog = await dialogOeffnen(nutzer);
    for (const feld of ["Führer", "Unterführer", "Mannschaft"]) await eintragen(nutzer, dialog, feld, "0");
    await nutzer.click(within(dialog).getByRole("button", { name: "Stärke übernehmen" }));
    const frage = document.querySelector<HTMLDialogElement>("dialog[aria-label='Stimmt die Stärke?']")!;
    expect(frage.textContent).toContain("0 / 0 / 3 / 3 → 0 / 0 / 0 / 0");
    expect(frage.textContent).toMatch(/Gesamt 3 → 0: Die Einheit zählt dann weder in der Stärke noch in der Verpflegung — stimmt das\? Ist die Einheit gar nicht mehr da, bleibt „Abrücken"/);
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
    await nutzer.click(within(frage).getByRole("button", { name: "Zahlen korrigieren" }));

    // Eine kleine Korrektur (3 → 2) fragt nicht.
    const wieder = document.querySelector<HTMLDialogElement>("dialog[aria-label='Stärke ändern']")!;
    await eintragen(nutzer, wieder, "Mannschaft", "2");
    await nutzer.click(within(wieder).getByRole("button", { name: "Stärke übernehmen" }));
    expect(document.querySelector("dialog[aria-label='Stimmt die Stärke?']")).toBeNull();
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(2);
  });

  it("„Zahlen korrigieren“ geht zurück in den Dialog mit den eingegebenen Werten", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId } = einsatzMitDreiPersonen();
    const dialog = await dialogOeffnen(nutzer);
    await eintragen(nutzer, dialog, "Mannschaft", "66");
    await nutzer.click(within(dialog).getByRole("button", { name: "Stärke übernehmen" }));
    await nutzer.click(within(document.querySelector<HTMLDialogElement>("dialog[aria-label='Stimmt die Stärke?']")!).getByRole("button", { name: "Zahlen korrigieren" }));

    const wieder = document.querySelector<HTMLDialogElement>("dialog[aria-label='Stärke ändern']")!;
    expect((within(wieder).getByLabelText("Mannschaft") as HTMLInputElement).value).toBe("66");
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
  });

  it("nennt bei „6o“ das falsche Feld und behält die übrigen Eingaben", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId } = einsatzMitDreiPersonen();
    const dialog = await dialogOeffnen(nutzer);
    await eintragen(nutzer, dialog, "Führer", "1");
    await eintragen(nutzer, dialog, "Mannschaft", "6o");
    await nutzer.click(within(dialog).getByRole("button", { name: "Stärke übernehmen" }));

    const wieder = document.querySelector<HTMLDialogElement>("dialog[aria-label='Stärke ändern']")!;
    expect(within(wieder).getByRole("alert").textContent).toMatch(/nicht lesbar: Mannschaft \(„6o"\)/);
    expect((within(wieder).getByLabelText("Führer") as HTMLInputElement).value).toBe("1");
    expect((within(wieder).getByLabelText("Mannschaft") as HTMLInputElement).value).toBe("6o");
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
  });

  it("nimmt eine falsch aufgenommene Folgemeldung über „Rückgängig“ an der Quittung zurück", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const erste = bogenMitName("Wardenburg");
    erste.personal = ["Rudolph", "Lang", "Weber"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
    meldungHinzufuegen(angelegt.id, erste);
    const folge = { ...structuredClone(erste), stand: erste.stand + 5 };
    folge.personal = [...folge.personal, ...Array.from({ length: 8 }, (_, i) => ({ ...neuePerson(), vorname: "N", nachname: `Neu${i}` }))];
    meldungHinzufuegen(angelegt.id, folge);
    const kopf = gespeichert(angelegt.id, "Wardenburg");
    const { neuLaden } = ansicht(angelegt.id, { eingang: { schluessel: kopf.einheitSchluessel, nonce: 7 } });
    const quittung = document.querySelector<HTMLElement>(".eingang-quittung")!;
    expect(quittung.textContent).toMatch(/Folgemeldung/);

    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    neuLaden();

    expect(einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege).toHaveLength(1);
    expect(document.querySelector(".eingang-quittung")).toBeNull();
    expect(document.querySelector(".quittung-daumen")!.textContent).toMatch(/^Folgemeldung zurückgenommen: „.*Wardenburg" gilt wieder mit Stärke 3\./);
  });

  /** Audit Runde 5, R5-E7: Bei vollem Speicher ist die Eingabe weg — der Hinweis nennt sie. */
  it("nennt bei vollem Speicher die gewünschte Stärke, damit sie sich aufschreiben lässt (R5-E7)", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId } = einsatzMitDreiPersonen();
    const dialog = await dialogOeffnen(nutzer);
    await eintragen(nutzer, dialog, "Mannschaft", "2");
    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === "eeb.einsaetze.v1") throw new DOMException("voll", "QuotaExceededError");
      return echt.call(this, k, v);
    });
    try {
      await nutzer.click(within(dialog).getByRole("button", { name: "Stärke übernehmen" }));
      const hinweis = await screen.findByRole("dialog", { name: "Stärke ändern" });
      expect(hinweis.textContent).toMatch(/Gewünscht war für „.*Wardenburg": Stärke 0 \/ 0 \/ 2 \/ 2 \(bisher 0 \/ 0 \/ 3 \/ 3\)/);
      expect(hinweis.textContent).toMatch(/Meldeblock notieren/);
    } finally {
      vi.restoreAllMocks();
    }
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
  });

  it("übernimmt eine plausible Änderung ohne Rückfrage — mit Rückweg", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, neuLaden } = einsatzMitDreiPersonen();
    const dialog = await dialogOeffnen(nutzer);
    await eintragen(nutzer, dialog, "Mannschaft", "2");
    await nutzer.click(within(dialog).getByRole("button", { name: "Stärke übernehmen" }));
    neuLaden();

    expect(document.querySelector("dialog[aria-label='Stimmt die Stärke?']")).toBeNull();
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(2);
    expect(document.querySelector(".quittung-daumen")!.textContent).toMatch(/3 → 2/);
  });
});

/**
 * Zusammenführen nahm Teile still aus der Lage — ohne Quittung, ohne
 * „Rückgängig“ (Audit Runde 4, R4-D5).
 */
describe("Zusammenführen mit Quittung und Rückweg (R4-D5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("quittiert mit Stärke vorher → nachher; „Rückgängig“ stellt beide Teile wieder her", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const b = bogenMitName("Wardenburg");
    b.personal = ["Rudolph", "Lang", "Weber"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
    meldungHinzufuegen(angelegt.id, b);
    const { neuLaden } = ansicht(angelegt.id);

    await nutzer.click(screen.getByRole("button", { name: "Mehr…" }));
    await nutzer.click(screen.getByRole("button", { name: "Aufteilen…" }));
    await nutzer.type(screen.getByLabelText("Bezeichnung des abgeteilten Teils"), "Fachberater");
    await nutzer.click(screen.getByRole("checkbox", { name: /Rudolph/ }));
    await nutzer.click(screen.getByRole("button", { name: "Aufteilen" }));
    neuLaden();
    const nachAufteilen = einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege.map((e) => `${e.id}:${e.status}`).sort();
    expect(document.querySelectorAll(".einheit-zeile")).toHaveLength(2);

    // Die Karte des Reststamms (3 → 2 Personen) nimmt den Teil wieder auf.
    const rest = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => !k.textContent!.includes("Fachberater"))!;
    // „Mehr…" steht nach dem Aufteilen an dieser Karte noch offen.
    await nutzer.click(within(rest).getByRole("button", { name: "Zusammenführen…" }));
    await nutzer.click(within(rest).getByRole("button", { name: /^Zusammenführen$/ }));
    neuLaden();

    // Der Teil bleibt mit Historie stehen, zählt aber nicht mehr: ein Teil ist aufgegangen.
    expect(einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege.filter((e) => e.status === MeldeStatus.AUFGEGANGEN)).toHaveLength(1);
    const quittung = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(quittung.textContent).toMatch(/^Zusammengeführt: „.*Wardenburg" · Stärke der Meldung 2 → 3/);
    expect(within(quittung).getByRole("button", { name: "Rückgängig" })).toBeTruthy();

    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    neuLaden();

    expect(einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege.map((e) => `${e.id}:${e.status}`).sort()).toEqual(nachAufteilen);
    const zurueck = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(zurueck.textContent).toMatch(/^Zusammenführen zurückgenommen: „.*Wardenburg" steht wieder in zwei Teilen\./);
    expect(within(zurueck).queryByRole("button", { name: "Rückgängig" })).toBeNull();
  });

  // Audit Runde 5, R5-D5: Die Teilzeile zeigte „Stand 061148okt26" (Tag-Stunde-Minute ohne Trenner).
  it("schreibt den Stand der Teile aus, nicht als Zeitgruppe (R5-D5)", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const b = bogenMitName("Wardenburg");
    b.personal = ["Rudolph", "Lang", "Weber"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
    meldungHinzufuegen(angelegt.id, b);
    const { neuLaden } = ansicht(angelegt.id);
    await nutzer.click(screen.getByRole("button", { name: "Mehr…" }));
    await nutzer.click(screen.getByRole("button", { name: "Aufteilen…" }));
    await nutzer.type(screen.getByLabelText("Bezeichnung des abgeteilten Teils"), "Fachberater");
    await nutzer.click(screen.getByRole("checkbox", { name: /Rudolph/ }));
    await nutzer.click(screen.getByRole("button", { name: "Aufteilen" }));
    neuLaden();
    const rest = [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => !k.textContent!.includes("Fachberater"))!;
    await nutzer.click(within(rest).getByRole("button", { name: "Zusammenführen…" }));
    const sub = [...rest.querySelectorAll(".muster-sub")].map((x) => x.textContent!).find((t) => t.includes("Stand"))!;
    expect(sub).toMatch(/Stand der Angaben \d\d\.\d\d\.\d{4}, \d\d:\d\d/);
    expect(sub).not.toMatch(/Stand \d{6}[a-z]{3}\d\d/);
  });
});

/**
 * Nach der Schichtübergabe arbeitete das alte Gerät weiter wie zuvor, ohne
 * Hinweis, dass die Lage weitergegeben wurde (Audit Runde 2, R2-W5).
 */
describe("Übergabevermerk nach „Einsatz weitergeben / sichern“ (R2-W5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("zeigt ohne Weitergabe keinen Vermerk", () => {
    buehne(["Wardenburg"]);
    expect(document.querySelector(".weitergabe-vermerk")).toBeNull();
  });

  it("nennt im Kopf den Zeitpunkt der Weitergabe und was seitdem nur hier dazukam", () => {
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, bogenMitName("Ulm"));
    weitergabeVermerken(einsaetzeLaden().find((s) => s.id === angelegt.id)!);
    const { neuLaden } = ansicht(angelegt.id);
    const vermerk = () => document.querySelector<HTMLElement>(".weitergabe-vermerk")!;
    expect(vermerk().textContent).toMatch(/^Weitergabe-Datei erzeugt .+ — Empfang nicht bestätigt, seitdem hier nichts Neues\.$/);

    meldungHinzufuegen(angelegt.id, bogenMitName("Kulmbach"));
    neuLaden();
    expect(vermerk().textContent).toContain("seitdem hier 1 neue Meldung");
    expect(vermerk().textContent).toContain("erneut weitergeben");
    expect(vermerk().className).toContain("seitdem-neu");
  });
});

/**
 * Funk und Abgleich: eine Nummer je Meldung auf Karte, Tabelle und Lageblatt,
 * eine Zeitform, und „neu" nicht doppelt belegt (Audit Runde 2, R2-A6).
 */
describe("Laufende Nummer, Zeitform und Marke (R2-A6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nummeriert die Karten nach dem Eingang, auch in der Tabelle", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, bogenMitName("Zeitz"));
    const zweite = meldungHinzufuegen(angelegt.id, bogenMitName("Aalen"))!.eintrag;
    // Aalen kam später — sie ist Nr. 2. Die Liste steht nach Nr. (R7-K9), Zeitz also zuerst.
    const liste = einsaetzeLaden();
    liste[0]!.eintraege.find((e) => e.id === zweite.id)!.empfangenAm += 60_000;
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify(liste));
    ansicht(angelegt.id);
    const namen = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? "");
    expect(namen[0]).toMatch(/^Nr\. 1 .*Zeitz/);
    expect(namen[1]).toMatch(/^Nr\. 2 .*Aalen/);
    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));
    const zeilen = within(screen.getByRole("table", { name: /Gemeldete Einheiten/ })).getAllByRole("rowheader");
    expect(zeilen.map((z) => z.textContent)).toEqual([expect.stringMatching(/^Nr\. 1 .*Zeitz/), expect.stringMatching(/^Nr\. 2 .*Aalen/)]);
  });

  it("nennt die Marke für frisch eingetroffene Einheiten nicht „neu“", () => {
    buehne(["Wardenburg"]);
    const marke = document.querySelector(".neu-badge")!;
    // Ausgeschrieben „kürzlich eingetroffen“; das kurze „neu“ steht nur zugeklappt am
    // Telefon (R4-K7) und meint „seit der Kenntnisnahme“, nicht „seit dem Export“.
    expect(marke.querySelector(".neu-lang")!.textContent).toBe("kürzlich eingetroffen");
  });
});

describe("Ungültige Signatur und Abgerückte ohne Aufklappen erkennbar (R3-L2, R3-L3)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("zeigt „⚠ Signatur ungültig“ im Kopf jeder Karte und im Zeilenkopf der Tabelle, abgerückt als Marke", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Test", EinsatzArt.EINSATZ);
    const kaputt = meldungHinzufuegen(angelegt.id, bogenMitName("Haßmersheim"))!.eintrag;
    const gut = meldungHinzufuegen(angelegt.id, bogenMitName("Aalen"))!.eintrag;
    const liste = einsaetzeLaden();
    const eintraege = liste[0]!.eintraege;
    eintraege.find((e) => e.id === kaputt.id)!.signatur = { zustand: "ungueltig" };
    const aalen = eintraege.find((e) => e.id === gut.id)!;
    aalen.signatur = { zustand: "gueltig", pubkey: "ab".repeat(32), kurzform: "AB12-CD34" };
    aalen.status = MeldeStatus.ABGERUECKT;
    aalen.abgerueckAm = Date.now();
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify(liste));
    ansicht(angelegt.id);

    const koepfe = screen.getAllByRole("heading", { level: 3 });
    const kopf = (name: string) => koepfe.find((h) => h.textContent!.includes(name))!;
    expect(kopf("Haßmersheim").textContent).toContain("⚠ Signatur ungültig");
    expect(kopf("Aalen").textContent).not.toContain("Signatur");

    await nutzer.click(screen.getByRole("button", { name: "Tabelle" }));
    const zeilen = within(screen.getByRole("table", { name: /Gemeldete Einheiten/ })).getAllByRole("rowheader");
    const zeile = (name: string) => zeilen.find((z) => z.textContent!.includes(name))!;
    expect(zeile("Haßmersheim").textContent).toContain("⚠ Signatur ungültig");
    // Durchgestrichen ist nur der Name, das Statuswort steht als eigene Marke.
    const aalenKopf = zeile("Aalen");
    expect(aalenKopf.querySelector(".tabelle-name")!.textContent).toContain("Aalen");
    expect(aalenKopf.querySelector(".status-badge")!.textContent).toBe("abgerückt");
    expect(aalenKopf.querySelector(".tabelle-name .status-badge")).toBeNull();
  });
});

describe("Lage vom Papier abgleichen (Audit Runde 3, R3-A2)", () => {
  it("zeigt eingelesene Einheiten mit Marke und übernimmt Status und Zug in einem Schritt", async () => {
    const user = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Neckar", EinsatzArt.EINSATZ);
    const ids = ["Ansbach", "Kirchehrenbach"].map((n) => meldungHinzufuegen(angelegt.id, bogenMitName(n))!.eintrag.id);
    vomPapierMarkieren(angelegt.id, ids);
    const a = ansicht(angelegt.id);
    expect(screen.getAllByText("vom Papier, Zeiten prüfen")).toHaveLength(2);
    expect(screen.getByText(/Lage noch nicht abgeglichen: 2 Einheiten/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    // Die Eintreffzeit steht leer (R5-A1) — vom Blatt eintragen.
    const zeiten = screen.getAllByLabelText(/Eingetroffen am/);
    expect((zeiten[0] as HTMLInputElement).value).toBe("");
    fireEvent.change(zeiten[0]!, { target: { value: "2026-10-06T10:12" } });
    fireEvent.change(zeiten[1]!, { target: { value: "2026-10-06T11:22" } });
    const radios = screen.getAllByRole("radio", { name: "abgerückt" });
    await user.click(radios[0]!);
    const zug = screen.getAllByLabelText("Zug (leer = ohne)");
    await user.type(zug[0]!, "1. TZ");
    await user.type(zug[1]!, "2. TZ");
    await user.click(screen.getByRole("button", { name: "Abgleich übernehmen" }));
    expect(a.geaendert).toHaveBeenCalled();
    const e = einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege;
    const ansbach = e.find((x) => x.id === ids[0])!;
    expect(ansbach.status).toBe(MeldeStatus.ABGERUECKT);
    expect(ansbach.zugEtikett).toBe("1. TZ");
    expect(ansbach.vomPapier).toBeUndefined();
    expect(e.find((x) => x.id === ids[1])!.zugEtikett).toBe("2. TZ");
    a.neuLaden();
    expect(screen.queryByText("vom Papier, Zeiten prüfen")).toBeNull();
    expect(screen.queryByRole("button", { name: "Lage vom Papier abgleichen…" })).toBeNull();
  });

  /**
   * R4-A1, R4-A2: Nr. und Auftrag/Notiz aus dem Kasten „Stand am Meldekopf“
   * gehören in den Abgleich; fehlt die Nr., sagt die App, dass sie neu vergibt.
   */
  it("fragt „Nr. laut Blatt“ und „Auftrag / Notiz“ ab und sagt, wenn Nummern neu vergeben werden", async () => {
    const user = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Neckar", EinsatzArt.EINSATZ);
    const ids = ["Ansbach", "Kirchehrenbach"].map((n) => meldungHinzufuegen(angelegt.id, bogenMitName(n))!.eintrag.id);
    vomPapierMarkieren(angelegt.id, ids);
    ansicht(angelegt.id);
    await user.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    const nr = screen.getAllByLabelText(/Nr\. laut Blatt/);
    const notiz = screen.getAllByLabelText(/Auftrag \/ Notiz/);
    await user.type(nr[0]!, "7");
    await user.type(notiz[0]!, "Pumpe 2 defekt");
    await user.type(nr[1]!, "7");
    for (const z of screen.getAllByLabelText(/Eingetroffen am/)) fireEvent.change(z, { target: { value: "2026-10-06T10:12" } });
    await user.click(screen.getByRole("button", { name: "Abgleich übernehmen" }));
    // Zweimal Nr. 7: nichts übernommen.
    expect(await screen.findByText(/„Nr\. 7“ steht bei .* und /)).toBeTruthy();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Alles klar" }));
    await user.clear(nr[1]!);
    await user.click(screen.getByRole("button", { name: "Abgleich übernehmen" }));
    const hinweis = await screen.findByRole("dialog", { name: "Nummern neu vergeben" });
    expect(within(hinweis).getByText(/Für 1 Einheit stand keine „Nr\. laut Blatt“/)).toBeTruthy();
    const e = einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege;
    expect(e.find((x) => x.id === ids[0])!.nummer).toBe(7);
    expect(e.find((x) => x.id === ids[0])!.notiz).toBe("Pumpe 2 defekt");
    expect(e.find((x) => x.id === ids[1])!.nummer).toBeUndefined();
  });
});

describe("Papier-Abgleich ohne Eintreffzeit (Audit Runde 5, R5-A1)", () => {
  it("belegt die Eintreffzeit nicht vor und lässt die Marke stehen, bis die Zeit vom Blatt eingetragen ist", async () => {
    const user = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Neckar", EinsatzArt.EINSATZ);
    const ids = ["Ansbach", "Kirchehrenbach"].map((n) => meldungHinzufuegen(angelegt.id, bogenMitName(n))!.eintrag.id);
    vomPapierMarkieren(angelegt.id, ids);
    const a = ansicht(angelegt.id);
    await user.click(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" }));
    for (const z of screen.getAllByLabelText(/Eingetroffen am/)) expect((z as HTMLInputElement).value).toBe("");
    await user.type(screen.getAllByLabelText("Zug (leer = ohne)")[0]!, "1. TZ");
    await user.click(screen.getByRole("button", { name: "Abgleich übernehmen" }));
    // R6-N3: ein Fenster für beide Hinweise, mit den Namen der Einheiten.
    const hinweis = await screen.findByRole("dialog", { name: "Abgleich übernommen – zwei Hinweise" });
    expect(within(hinweis).getByText(/Für 2 Einheiten stand keine Eintreffzeit.*Ansbach/)).toBeTruthy();
    expect(within(hinweis).getByText(/Für 2 Einheiten stand keine „Nr\. laut Blatt“/)).toBeTruthy();
    await user.click(within(hinweis).getByRole("button", { name: "Alles klar" }));
    const e = einsaetzeLaden().find((s) => s.id === angelegt.id)!.eintraege;
    expect(e.find((x) => x.id === ids[0])!.zugEtikett).toBe("1. TZ");
    expect(e.every((x) => x.vomPapier != null)).toBe(true);
    a.neuLaden();
    expect(screen.getAllByText("vom Papier, Zeiten prüfen")).toHaveLength(2);
    // R6-N3: Die Karte nennt nur noch das Fehlende.
    expect(screen.getByText(/Abgeglichen bis auf die Eintreffzeit: 2 Einheiten/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eintreffzeiten nachtragen…" })).toBeTruthy();
  });
});

/** Audit Runde 4, R4-L3: Der Moduswechsel steht in der Einsatzansicht auch von unten bereit. */
describe("Moduswechsel von unten in der Einsatzansicht (R4-L3)", () => {
  it("hat einen festen „◐“-Knopf, dessen Wahl mit zwei Tipps erreichbar ist", async () => {
    buehne();
    const nutzer = userEvent.setup();
    const fest = document.querySelector(".anzeige-balken");
    expect(fest).not.toBeNull();
    const knopf = within(fest as HTMLElement).getByRole("button", { name: /Ansicht: .* ändern/ });
    await nutzer.click(knopf);
    const wahl = within(fest as HTMLElement).getByRole("group", { name: "Anzeigemodus" });
    await nutzer.click(within(wahl).getByRole("button", { name: "Nacht" }));
    expect(document.documentElement.classList.contains("nacht-modus")).toBe(true);
    // Die Wahl klappt nach dem zweiten Tipp wieder zu.
    expect(within(fest as HTMLElement).queryByRole("group", { name: "Anzeigemodus" })).toBeNull();
    document.documentElement.classList.remove("nacht-modus");
    localStorage.removeItem("eeb.anzeigemodus.v1");
  });
});

describe("Zug zuordnen: Vorschläge und gleiche Schreibweise (R7-K4)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("bietet vergebene Züge zum Antippen an; „1.Zug“ und „1. zug“ landen im selben Zug", async () => {
    const nutzer = userEvent.setup();
    const b = buehne(["Wardenburg", "Oldenburg", "Aurich"]);
    const { einsatzId } = b;
    zugSetzen(einsatzId, gespeichert(einsatzId, "Wardenburg").einheitSchluessel, gespeichert(einsatzId, "Wardenburg").id, "1. Zug");
    b.neuLaden();

    // Zweite Einheit: Der erste Zug steht als Antippziel da und wird mit einem Tipp gespeichert.
    const karte = (n: string) => screen.getByRole("heading", { level: 3, name: new RegExp(n) }).closest("li, .einheit-zeile")! as HTMLElement;
    await nutzer.click(within(karte("Oldenburg")).getByRole("button", { name: "Zug zuordnen" }));
    const gruppe = screen.getByRole("group", { name: "Schon vergebene Züge" });
    await nutzer.click(within(gruppe).getByRole("button", { name: "1. Zug" }));
    b.neuLaden();
    expect(gespeichert(einsatzId, "Oldenburg").zugEtikett).toBe("1. Zug");

    // Dritte Einheit: anders getippt, gleicher Zug.
    await nutzer.click(within(karte("Aurich")).getByRole("button", { name: "Zug zuordnen" }));
    await nutzer.type(screen.getByLabelText("Zug"), "1.zug");
    await nutzer.click(screen.getByRole("button", { name: "Speichern" }));
    b.neuLaden();
    expect(gespeichert(einsatzId, "Aurich").zugEtikett).toBe("1. Zug");
    const zuege = new Set(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege.map((e) => e.zugEtikett));
    expect(zuege).toEqual(new Set(["1. Zug"]));
  });
});

describe("Auftrag und Zug auf einen Blick (R7-K6, R7-K9)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("zählt Einheiten ohne Auftrag und ohne Zug, filtert mit einem Tipp und zeigt den Auftragstext zugeklappt", async () => {
    const nutzer = userEvent.setup();
    const b = buehne(["Wardenburg", "Oldenburg", "Aurich"]);
    const { einsatzId } = b;
    const w = gespeichert(einsatzId, "Wardenburg");
    notizSetzen(einsatzId, w.id, "Deichabschnitt Nord ab 14:00");
    zugSetzen(einsatzId, w.einheitSchluessel, w.id, "1. Zug");
    b.neuLaden();

    expect(screen.getByRole("button", { name: "2 ohne Auftrag" })).toBeDefined();
    expect(screen.getByRole("button", { name: "2 ohne Zug" })).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "2 ohne Auftrag" }));
    const namen = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? "");
    expect(namen).toHaveLength(2);
    expect(namen.join(" ")).not.toContain("Wardenburg");
    await nutzer.click(screen.getAllByRole("button", { name: "Filter aufheben" })[0]!);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    // Die Legende steht einmal über der Liste.
    expect(screen.getByText(/Stärke auf den Karten: Führer \/ Unterführer \/ Mannschaft \/ Gesamt/)).toBeDefined();
  });

  it("sortiert die Liste standardmäßig nach Nr. wie das Lageblatt und bietet Name als Alternative", async () => {
    const nutzer = userEvent.setup();
    const angelegt = einsatzAnlegen("Hochwasser Nr", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, bogenMitName("Zeitz"));
    const zweite = meldungHinzufuegen(angelegt.id, bogenMitName("Aalen"))!.eintrag;
    // Aalen kam später: Nr. 2, obwohl sie nach Name oben stünde.
    const liste = einsaetzeLaden();
    liste[0]!.eintraege.find((e) => e.id === zweite.id)!.empfangenAm += 60_000;
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify(liste));
    ansicht(angelegt.id);
    const namen = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? "");
    expect(namen()[0]).toMatch(/^Nr\. 1 .*Zeitz/);
    expect(namen()[1]).toMatch(/^Nr\. 2 .*Aalen/);
    await nutzer.selectOptions(screen.getByRole("combobox", { name: "Sortierung" }), "Name (A–Z)");
    expect(namen()[0]).toMatch(/Aalen/);
  });
});

describe("Doppelte Karte erkennen (R7-N1)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("trägt an beiden Karten die Marke „ähnelt“, wenn Ort und Organisation gleich sind und kein Typ widerspricht", () => {
    const angelegt = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const mitTyp = bogenMitName("Albstadt");
    mitTyp.einheit.einheitsTyp = { code: 3 };
    meldungHinzufuegen(angelegt.id, mitTyp);
    const ohneTyp = bogenMitName("Albstadt");
    ohneTyp.einheit.einheitsTyp = {};
    ohneTyp.personal = [{ ...neuePerson(), nachname: "Anders" }];
    meldungHinzufuegen(angelegt.id, ohneTyp);
    meldungHinzufuegen(angelegt.id, bogenMitName("Ulm"));
    ansicht(angelegt.id);
    expect(screen.getAllByText(/ähnelt „THW /)).toHaveLength(2);
    expect(screen.getAllByText(/zählt getrennt/).length).toBeGreaterThanOrEqual(2);
  });
});

describe("Spalten der Einheitentabelle (R10-K3)", () => {
  const namen = (zug: boolean, kompakt: boolean) => tabellenSpaltenFuer(zug, kompakt).map((x) => x.schluessel);

  it("blendet die Spalte Zug aus, solange keine Einheit einen Zug trägt", () => {
    expect(namen(false, false)).not.toContain("zugEtikett");
    expect(namen(true, false).slice(0, 3)).toEqual(["einheit", "zugEtikett", "fuehrer"]);
  });

  it("stellt am Telefon die Gesamtstärke gleich hinter den Namen, Zug hinter die Aufteilung", () => {
    expect(namen(false, true).slice(0, 5)).toEqual(["einheit", "gesamt", "fuehrer", "unterfuehrer", "mannschaft"]);
    expect(namen(true, true).slice(0, 6)).toEqual(["einheit", "gesamt", "fuehrer", "unterfuehrer", "mannschaft", "zugEtikett"]);
    expect(namen(true, true)).toHaveLength(namen(true, false).length);
  });
});
