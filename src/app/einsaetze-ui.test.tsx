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
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { EinsatzArt, MeldeStatus, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";

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

/** Die Detailansicht auf dem aktuellen Speicherstand — die App lädt nach jeder Änderung neu. */
function ansicht(einsatzId: string, extra: Partial<Parameters<typeof EinsatzDetail>[0]> = {}) {
  const einsatz = einsaetzeLaden().find((s) => s.id === einsatzId)!;
  const geaendert = vi.fn();
  const bilderImport = vi.fn<(dateien: File[]) => void>();
  const dateiImport = vi.fn<(dateien: File[]) => void>();
  const r = render(
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={geaendert}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={dateiImport}
        onBilderImport={bilderImport}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onGeloescht={() => {}}
        {...extra}
      />
      <Dialogschicht />
    </>,
  );
  /** Ansicht mit dem neuen Speicherstand neu aufbauen (Rolle von onGeaendert in der App). */
  function neuLaden() {
    r.rerender(
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
          onCsvExport={() => {}}
          onCsvDetailExport={() => {}}
          onOldenburgExport={() => {}}
          onSammelPdf={() => {}}
          onGeloescht={() => {}}
          {...extra}
        />
        <Dialogschicht />
      </>,
    );
  }
  return { einsatzId, geaendert, bilderImport, dateiImport, neuLaden };
}

/** Einsatz mit den genannten Einheiten (Vorgabe: eine), Detailansicht offen. */
function buehne(namen: string[] = ["Wardenburg"], extra: Partial<Parameters<typeof EinsatzDetail>[0]> = {}) {
  const angelegt = einsatzAnlegen("Hochwasser Wardenburg", EinsatzArt.EINSATZ);
  for (const n of namen) meldungHinzufuegen(angelegt.id, bogenMitName(n));
  return ansicht(angelegt.id, extra);
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
    // Die Quittung steht in der Ansicht — nicht nur der Zustand der Karte.
    const quittung = screen.getByRole("status");
    expect(quittung.textContent).toMatch(/„.*Crailsheim.*" abgerückt \d\d:\d\d/);

    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    const zurueck = gespeichert(einsatzId, "Crailsheim");
    expect(zurueck.status).toBe(MeldeStatus.ANWESEND);
    expect(zurueck.abgerueckAm).toBeUndefined();
    neuLaden();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("stellt den Gegenknopf nicht an dieselbe Stelle, sondern abgesetzt vor „Entfernen“", async () => {
    const nutzer = userEvent.setup();
    const { neuLaden } = buehne(["Crailsheim"]);
    await nutzer.click(screen.getByRole("button", { name: "Abrücken" }));
    neuLaden();

    expect(screen.queryByRole("button", { name: "Abrücken" })).toBeNull();
    const knoepfe = screen.getAllByRole("button").map((b) => b.textContent);
    const anwesend = knoepfe.indexOf("Als anwesend");
    // Direkt vor „Entfernen" — und damit nicht dort, wo eben „Abrücken" stand
    // (das war vor „Zug zuordnen").
    expect(knoepfe[anwesend + 1]).toBe("Entfernen");
    expect(knoepfe.indexOf("Zug zuordnen")).toBeLessThan(anwesend);
    expect(screen.getByRole("button", { name: "Als anwesend" }).className).toContain("knopf-abgesetzt");
    // Die Karte nennt die Abrückzeit ohne weiteren Tipp.
    expect(document.querySelector(".zeiten-zeile")!.textContent).toMatch(/abgerückt \d\d:\d\d/);
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

    await nutzer.click(screen.getByLabelText("nur mit Sofortbedarf"));
    const namen = [...document.querySelectorAll(".muster-name")].map((n) => n.textContent ?? "");
    expect(namen).toHaveLength(1);
    expect(namen[0]).toContain("Crailsheim");
    expect(screen.getByRole("heading", { name: /Einheiten \(1 von 2 gemeldet · 2 zählend\)/ })).not.toBeNull();
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
    await nutzer.click(screen.getByRole("button", { name: "Lageblatt (1 Seite)" }));
    await nutzer.click(screen.getByRole("button", { name: "Alle Bögen als PDF" }));
    expect(weitergeben).toHaveBeenCalledTimes(1);
    expect(lageblatt).toHaveBeenCalledTimes(1);
    expect(sammelPdf).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Sammel-PDF/ })).toBeNull();
  });

  it("zeigt die Herkunft als „Empfangen“ statt „Scan“", () => {
    buehne(["Wardenburg"]);
    expect(document.querySelector(".zeiten-zeile")!.textContent).toContain("Empfangen");
  });
});
