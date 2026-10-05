/**
 * Durchlauf durch den Assistenten — der Weg, den jeder Nutzer nimmt und den
 * jede Änderung an Schritten, Navigation oder Übersicht berühren kann:
 * Startseite → Schritt 1 → alle Schritte → Übersicht → Bogen übergeben.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, type Erfassungsbogen } from "@bos/eeb-format/model";
import { encodePayload, encodePayloadUrl, encodeVorlagePayloadUrl, fragmentInhalt, segmentPayloadUrls } from "@bos/eeb-format/codec";
import { encodeSigniertPayloadUrl, schluesselpaarErzeugen } from "@bos/eeb-format/signatur";
import { browserKompressor, neuerBogen } from "./hilfen";
import { geraeteSchluesselLoeschen } from "./geraete-schluessel";
import { vorlageAnlegen, vorlagenLaden } from "./vorlagen";
import { einsatzDateiInhalt } from "./einsatz-transport";
import { einheitEntfernen, eintreffzeitSetzen, zeitLang } from "./eintrag-zeiten";
// `einsatzAnlegen` heißt in diesem Test schon ein Klick-Helfer (Dialog
// ausfüllen); der Speicher-Weg kommt darum unter eigenem Namen herein.
import {
  EinsatzArt,
  einsaetzeLaden,
  einsatzAnlegen as einsatzImSpeicherAnlegen,
  einsatzLoeschen,
  meldungHinzufuegen,
  neuesteJeEinheit,
} from "@bos/meldekopf/einsaetze";

// Die PDF-Erzeugung (pdfmake) ist eigenständig getestet und im Test nur teuer;
// hier zählt, dass der Weg dorthin funktioniert und der Bogen ankommt.
const pdfErzeugen = vi.fn<(bogen: Erfassungsbogen, name?: string) => Promise<void>>(async () => {});
vi.mock("./pdf", () => ({
  pdfErzeugen: (bogen: Erfassungsbogen, name?: string) => pdfErzeugen(bogen, name),
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => {},
}));

// Ohne Capacitor: die Tests fahren die Browser-Variante der App. Das
// Share-Sheet richtet sich damit nach navigator.share — jsdom hat keins, die
// Nahbereichs-Übergabe ist also standardmäßig aus (wie im Desktop-Browser).
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
    shareSheetVerfuegbar: () => typeof navigator.share === "function",
    nahbereichDienst: echt.nahbereichDienst,
    pdfEinbettbar: () => true,
  };
});

// QR-Auswertung einer PDF: im Test steuerbar, damit der Rückfallweg prüfbar
// ist, ohne einen echten QR-Code zu rendern und zu dekodieren (eigene Tests:
// pdf-bilder.test.ts).
const qrTexteAusPdf = vi.fn<(bytes: Uint8Array) => Promise<string[]>>(async () => []);
vi.mock("./pdf-qr", () => ({ qrTexteAusPdfBytes: (bytes: Uint8Array) => qrTexteAusPdf(bytes) }));

const { App, scanFehlertext } = await import("./app");

/**
 * Datei, die sich wie eine PDF anfasst: Name, MIME-Typ und — wo Inhalt
 * mitgegeben wird — ein unkomprimierter Datenstrom, wie ihn unsere PDFs für
 * den eingebetteten Bogen tragen (pdf-dokument.ts).
 */
function pdfDatei(eingebettet?: unknown): File {
  const strom = eingebettet === undefined ? "" : `1 0 obj\n<< /Type /EmbeddedFile >>\nstream\n${JSON.stringify(eingebettet)}\nendstream\nendobj\n`;
  return new File([`%PDF-1.4\n${strom}%%EOF\n`], "bogen.pdf", { type: "application/pdf" });
}

/** Vom Startbildschirm bis zum angegebenen Schritt klicken (0 = Einheit). */
async function neuerBogenBis(nutzer: ReturnType<typeof userEvent.setup>, bisSchritt: number) {
  await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
  for (let i = 0; i < bisSchritt; i++) {
    await nutzer.click(screen.getByRole("button", { name: /(Weiter|Zur Übersicht) →/ }));
  }
}

/** Bogen mit sprechendem Einheitsnamen — er macht den Import in der UI sichtbar. */
function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

/**
 * Einen Bogen-Link auf die schon geladene Seite legen: Fragment setzen und
 * `hashchange` auslösen — genau das, was der Browser tut, wenn ein Link im
 * bereits offenen Tab landet.
 */
/**
 * Downloads mitschneiden. jsdom kennt keine Blob-URLs und keinen echten
 * Download — also die URL-Vergabe und den Ankerklick abfangen. Was der Browser
 * gespeichert hätte, steht danach als `{name, blob}` da.
 *
 * Der Grund für die Mühe: Ein Ausgabeknopf kann heil aussehen und trotzdem keine
 * Datei liefern (Modul lädt nicht, Blob-URL schon widerrufen, Anker ohne Klick).
 * Nur die Datei selbst beweist, dass der Weg trägt.
 */
function downloadsMitschneiden() {
  const dateien: { name: string; blob: Blob }[] = [];
  const blobs = new Map<string, Blob>();
  const alt = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  URL.createObjectURL = (o: Blob | MediaSource) => {
    const url = `blob:test/${blobs.size + 1}`;
    blobs.set(url, o as Blob);
    return url;
  };
  URL.revokeObjectURL = () => {};
  const beiKlick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a[download]") as HTMLAnchorElement | null;
    if (!a) return;
    e.preventDefault(); // jsdom würde dem Link folgen wollen
    dateien.push({ name: a.download, blob: blobs.get(a.href)! });
  };
  document.addEventListener("click", beiKlick, true);
  return {
    dateien,
    aufraeumen: () => {
      document.removeEventListener("click", beiKlick, true);
      URL.createObjectURL = alt.create;
      URL.revokeObjectURL = alt.revoke;
    },
  };
}

function fragmentSetzen(qrUrl: string): void {
  window.location.hash = fragmentInhalt(qrUrl);
  window.dispatchEvent(new Event("hashchange"));
}

describe("Assistenten-Durchlauf", () => {
  beforeEach(() => {
    pdfErzeugen.mockClear();
  });

  afterEach(() => {
    // Ein hängengebliebenes Fragment würde den nächsten Test verfälschen.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    localStorage.clear();
  });

  it("startet auf der Startseite und öffnet mit „Neuen Bogen erstellen“ Schritt 1", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Digitaler Einheiten-Erfassungsbogen" })).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    expect(screen.getByRole("heading", { name: "1. Einheit" })).toBeDefined();
  });

  /**
   * Der Schnell-Einstieg „Einheit schnell erfassen (nur Stärke)" landet im
   * gleichen sechsschrittigen Assistenten wie der volle Bogen. Dass Personal
   * hier nur als Zahl erfasst wird, stand vorher erst auf Schritt 3 — der
   * Meldekopf-Bediener, der eine eintreffende Einheit in zwanzig Sekunden
   * aufnehmen will, sah bis dahin sechs Schritte und dieselbe Überschrift.
   */
  it("benennt die Meldekopf-Schnellerfassung im Kopf jedes Schrittes", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));

    const kopf = screen.getByRole("banner");
    expect(within(kopf).getByText("Schnellerfassung")).toBeDefined();

    // Auch zwei Schritte weiter, nicht nur auf Schritt 1.
    await nutzer.click(screen.getByRole("button", { name: /^3\. Personal/ }));
    expect(within(screen.getByRole("banner")).getByText("Schnellerfassung")).toBeDefined();
  });

  it("beginnt jeden Schritt oben und setzt den Fokus auf die Schrittüberschrift (R2-H1)", async () => {
    const nutzer = userEvent.setup();
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    try {
      render(<App />);
      await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
      scroll.mockClear();
      await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
      expect(scroll).toHaveBeenCalledWith(0, 0);
      expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2, name: "2. Einsatz" }));
      await nutzer.click(screen.getByRole("button", { name: "← Zurück" }));
      expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2, name: "1. Einheit" }));
    } finally {
      scroll.mockRestore();
    }
  });

  /**
   * Audit Runde 3, R3-H1: Von der Startseite aus übernahm die neue Ansicht
   * deren Scrollposition — Musterung bei 819 px, Assistent ohne „1. Einheit".
   */
  it("beginnt beim Wechsel von der Startseite in Assistent und Musterung oben (R3-H1)", async () => {
    vorlageAnlegen("FGr Obenhausen", bogenMitName("OV Obenhausen"));
    const nutzer = userEvent.setup();
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    try {
      render(<App />);
      await nutzer.click(screen.getByRole("button", { name: /Einsatz vorbereiten/ }));
      expect(scroll).toHaveBeenCalledWith(0, 0);
      expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1, name: "FGr Obenhausen" }));
      await nutzer.click(screen.getByRole("button", { name: "‹ Abbrechen" }));
      scroll.mockClear();
      await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
      expect(scroll).toHaveBeenCalledWith(0, 0);
      expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2, name: "1. Einheit" }));
      // Zurück zur Startseite: auch die beginnt oben.
      scroll.mockClear();
      await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
      expect(scroll).toHaveBeenCalledWith(0, 0);
    } finally {
      scroll.mockRestore();
    }
  });

  it("springt vom offenen Punkt ins Feld und setzt den Cursor (R2-H2)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Punkthausen");
    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));
    await nutzer.click(screen.getAllByRole("button", { name: "Ort/Auftrag ist noch leer." })[0]!);
    expect(document.activeElement?.id).toBe("feld-ort-auftrag");
    await nutzer.keyboard("Deich Nord");
    expect((document.getElementById("feld-ort-auftrag") as HTMLInputElement).value).toBe("Deich Nord");
   }, 20000);

  it("zeigt die Modus-Marke beim vollen Bogen nicht", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    expect(within(screen.getByRole("banner")).queryByText("Schnellerfassung")).toBeNull();
  });

  /**
   * Der erklärende Text ist Prospekt, nicht Arbeitsfläche: Er beantwortet den
   * ersten Besuch im Browser. Wer schon Daten auf dem Gerät hat, hat die
   * Antwort — dann darf er die Startseite nicht mehr verlängern. (Die zweite
   * Bedingung, „nur im Browser", steckt in imWebBrowser(); oben mitgemockt.)
   */
  it("zeigt den erklärenden Text nur beim Erststart", async () => {
    const leer = render(<App />);
    expect(screen.getByRole("region", { name: "Über den digitalen Erfassungsbogen" })).toBeDefined();
    leer.unmount();

    einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    render(<App />);
    await screen.findByRole("heading", { name: "Einsatz-Sammlung (Meldekopf)" });
    expect(screen.queryByRole("region", { name: "Über den digitalen Erfassungsbogen" })).toBeNull();
  });

  it("führt Schritt für Schritt bis zur Übersicht und zeigt die erfasste Einheit", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Musterhausen");

    // Ein Klick je Schritt: Einheit → Einsatz → Personal → Fahrzeuge →
    // Sofortbedarf → Übersicht. Jede Zwischenüberschrift bestätigt, dass der
    // Schritt gerendert hat (und nicht nur der Zähler weitergelaufen ist).
    for (const titel of ["2. Einsatz", "3. Personal", "4. Fahrzeuge", "5. Sofortbedarf & Sonstiges"]) {
      await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
      expect(screen.getByRole("heading", { name: titel })).toBeDefined();
    }
    await nutzer.click(screen.getByRole("button", { name: "Zur Übersicht →" }));

    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    // Die Übersicht fasst Schritt 1 zusammen — der Name muss dort ankommen.
    const einheit = screen.getByRole("heading", { name: "Einheit" }).closest("section")!;
    expect(within(einheit).getByText(/Musterhausen/)).toBeDefined();
  });

  it("merkt sich die Richtung des Schrittwechsels", async () => {
    // Rein für die Bewegung: der Inhalt kommt aus der Richtung, in die gegangen
    // wurde. Getestet, weil die Richtung an einem beim Rendern beschriebenen
    // Ref hing und im StrictMode jeden Rücksprung als Vorwärtsschritt meldete.
    const nutzer = userEvent.setup();
    const { container } = render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    const richtung = () => container.querySelector(".schritt-inhalt")?.className;

    await nutzer.click(screen.getByRole("button", { name: /^4\. Fahrzeuge/ }));
    expect(richtung()).toBe("schritt-inhalt vor");

    await nutzer.click(screen.getByRole("button", { name: /^2\. Einsatz/ }));
    expect(richtung()).toBe("schritt-inhalt zurueck");

    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));
    expect(richtung()).toBe("schritt-inhalt vor");
  });

  it("erreicht die Übersicht auch über die Schrittleiste im Kopf", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));

    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
  });

  it("bietet auf der Übersicht die offenen Punkte zum Beheben an", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 5);

    // Frischer Bogen: der Einheitsname fehlt, also meldet die Checkliste ihn —
    // und der Punkt führt per Klick auf den Schritt, der ihn behebt.
    await nutzer.click(screen.getByRole("button", { name: /Der Name der eigenen Einheit/ }));

    expect(screen.getByRole("heading", { name: "1. Einheit" })).toBeDefined();
  });

  it("übergibt den Bogen als PDF — Knopf im Übergabedialog löst die Erzeugung aus", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 5);

    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Bogen übergeben']")!;
    expect(dialog.hasAttribute("open")).toBe(false);

    await nutzer.click(screen.getByRole("button", { name: "Bogen übergeben…" }));
    expect(dialog.hasAttribute("open")).toBe(true);

    const pdfKnopf = within(dialog).getByRole("button", { name: "PDF erzeugen" });
    expect(pdfKnopf.hasAttribute("disabled")).toBe(false);

    await nutzer.click(pdfKnopf);

    expect(pdfErzeugen).toHaveBeenCalledTimes(1);
    expect(pdfErzeugen.mock.calls[0]![0].einheit.organisation).toBe(OrganisationsTyp.THW);
  });

  /** Übergabe-Dialog auf der Übersicht öffnen und zurückgeben. */
  async function uebergabeDialog(nutzer: ReturnType<typeof userEvent.setup>): Promise<HTMLDialogElement> {
    render(<App />);
    await neuerBogenBis(nutzer, 5);
    await nutzer.click(screen.getByRole("button", { name: "Bogen übergeben…" }));
    return document.querySelector<HTMLDialogElement>("dialog[aria-label='Bogen übergeben']")!;
  }

  it("gibt den Bogen als CSV heraus — mit Kopfzeile und einer Zeile je Erfassung", async () => {
    const nutzer = userEvent.setup();
    const mitschnitt = downloadsMitschneiden();
    try {
      const dialog = await uebergabeDialog(nutzer);

      await nutzer.click(within(dialog).getByRole("button", { name: "Als CSV (Tabelle)" }));

      expect(mitschnitt.dateien).toHaveLength(1);
      const [datei] = mitschnitt.dateien;
      expect(datei!.name).toMatch(/^eeb-.*\.csv$/);
      const text = await datei!.blob.text();
      expect(text.split("\n")[0]).toContain("Einheit");
      expect(text.split("\n").length).toBeGreaterThan(1);
    } finally {
      mitschnitt.aufraeumen();
    }
  });

  /**
   * Der Weg, der zweimal als „Knopf geht nicht" gemeldet wurde: Der Schreiber
   * wird erst beim Klick nachgeladen, danach muss trotzdem eine gültige Mappe
   * herauskommen. „PK" ist die Signatur jedes ZIP — und ein XLSX ist eins.
   */
  it("gibt den Bogen als Excel-Mappe heraus (Format „Oldenburg“)", async () => {
    const nutzer = userEvent.setup();
    const mitschnitt = downloadsMitschneiden();
    try {
      const dialog = await uebergabeDialog(nutzer);

      await nutzer.click(within(dialog).getByRole("button", { name: /^Als Excel/ }));

      // Der XLSX-Schreiber wird erst beim Klick nachgeladen — die Datei kommt
      // also einen Tick später als bei CSV.
      await waitFor(() => expect(mitschnitt.dateien).toHaveLength(1));
      expect(within(dialog).queryByText(/^Excel:/)).toBeNull(); // keine Fehlerzeile
      const [datei] = mitschnitt.dateien;
      expect(datei!.name).toMatch(/^eeb-.*-oldenburg\.xlsx$/);
      expect(datei!.blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      const bytes = new Uint8Array(await datei!.blob.arrayBuffer());
      expect(String.fromCharCode(bytes[0]!, bytes[1]!)).toBe("PK");
      expect(bytes.length).toBeGreaterThan(1000);
    } finally {
      mitschnitt.aufraeumen();
    }
  });

  it("legt den Bogen-Link in die Zwischenablage und sagt es", async () => {
    // Reihenfolge zählt: `userEvent.setup()` hängt selbst eine Zwischenablage
    // ein und würde einen vorher gesetzten Spion überschreiben.
    const nutzer = userEvent.setup();
    const schreiben = vi.fn<(text: string) => Promise<void>>(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText: schreiben }, configurable: true });
    try {
      const dialog = await uebergabeDialog(nutzer);

      // Der Knopf hängt am fertigen QR-Satz (er trägt denselben Inhalt) und ist
      // bis dahin gesperrt.
      const knopf = within(dialog).getByRole("button", { name: "Link teilen" });
      await waitFor(() => expect(knopf).toHaveProperty("disabled", false));
      await nutzer.click(knopf);

      await waitFor(() => expect(schreiben).toHaveBeenCalledTimes(1));
      expect(schreiben.mock.calls[0]![0]).toContain("erfassungsbogen.app/#");
      expect(within(dialog).getByRole("button", { name: "Link kopiert ✓" })).toBeDefined();
    } finally {
      Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  /** Rückfrage-Fenster zum Titel holen — die Dialogschicht zeichnet eines zur Zeit. */
  function rueckfrage(titel: string): HTMLDialogElement {
    return document.querySelector<HTMLDialogElement>(`dialog[aria-label='${titel}']`)!;
  }

  /**
   * Rückfragen mit Wirkung sind die zweite Stelle, an der ein Knopf „nichts
   * tut": Der Dialog geht zu, die Zusage wird aber nie eingelöst. Geprüft wird
   * darum immer beides — der bejahende Weg wirkt, der Abbruch wirkt nicht.
   */
  it("verwirft den Bogen auf der Übersicht erst nach Rückfrage und beginnt neu", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Wegwerfhausen");
    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));

    await nutzer.click(screen.getByRole("button", { name: "Neuer Bogen" }));
    // Die Rückfrage sagt, was tatsächlich geschieht: geschlossen, nicht
    // gelöscht, und wo der Bogen danach liegt (Audit Runde 2, R2-H9).
    expect(rueckfrage("Bogen schließen?").textContent).toContain("geschlossen, nicht gelöscht");
    expect(rueckfrage("Bogen schließen?").textContent).toContain("Zuletzt verdrängten Bogen zurückholen");
    expect(rueckfrage("Bogen schließen?").textContent).not.toContain("Entwurf gelöscht");
    await nutzer.click(within(rueckfrage("Bogen schließen?")).getByRole("button", { name: "Abbrechen" }));

    // Abgebrochen: derselbe Bogen steht noch da.
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getAllByText(/Wegwerfhausen/).length).toBeGreaterThan(0);

    await nutzer.click(screen.getByRole("button", { name: "Neuer Bogen" }));
    await nutzer.click(
      within(rueckfrage("Bogen schließen?")).getByRole("button", { name: "Schließen, zur Startseite" }),
    );

    // Verworfen heißt: kein offener Bogen mehr — die App steht wieder am
    // Anfang, der Entwurf ist nicht als „Fortsetzen" übrig. Verloren ist er
    // aber nicht: er liegt in der Rückholung (Audit „Zerstörende
    // Handlungen", D7).
    expect(screen.getByRole("heading", { name: "Digitaler Einheiten-Erfassungsbogen" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Fortsetzen" })).toBeNull();
    expect(screen.getByRole("button", { name: "Zuletzt verdrängten Bogen zurückholen" })).toBeDefined();
  });

  it("wirft den angefangenen Bogen von der Startseite aus weg — nach Rückfrage", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Entwurfshausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    // Der Entwurf steht auf der Startseite zum Fortsetzen bereit.
    expect(screen.getByText(/Entwurfshausen/)).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "Verwerfen" }));
    await nutzer.click(within(rueckfrage("Angefangenen Bogen verwerfen?")).getByRole("button", { name: "Abbrechen" }));

    expect(screen.getByText(/Entwurfshausen/)).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "Verwerfen" }));
    await nutzer.click(within(rueckfrage("Angefangenen Bogen verwerfen?")).getByRole("button", { name: "Verwerfen" }));

    expect(screen.getByText("Angefangener Bogen verworfen — Rückholung unten auf der Startseite.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Fortsetzen" })).toBeNull();

    // Die Rückholung bringt ihn zurück (D7).
    await nutzer.click(screen.getByRole("button", { name: "Zuletzt verdrängten Bogen zurückholen" }));
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getAllByText(/Entwurfshausen/).length).toBeGreaterThan(0);
  });

  it("fragt vor dem Ersetzen des angefangenen Bogens und holt ihn danach zurück", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Verdrängthausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    // Abbruch: der angefangene Bogen bleibt im Arbeitsplatz.
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.click(within(rueckfrage("Neuen Bogen anfangen?")).getByRole("button", { name: "Abbrechen" }));
    expect(screen.getByText(/Verdrängthausen/)).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.click(within(rueckfrage("Neuen Bogen anfangen?")).getByRole("button", { name: "Neu anfangen" }));

    // Der leere Bogen steht jetzt im Assistenten; der verdrängte liegt nicht
    // im Nichts, sondern wartet auf der Startseite.
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    const zurueck = screen.getByRole("button", { name: "Zuletzt verdrängten Bogen zurückholen" });
    expect(screen.getByText(/Verdrängthausen/)).toBeDefined();

    await nutzer.click(zurueck);
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getAllByText(/Verdrängthausen/).length).toBeGreaterThan(0);
  }, 20000);

  /**
   * Audit Runde 2, R2-N1: Zwei Schnellerfassungen nacheinander — oder eine
   * abgebrochene und eine neue — schoben die erste fremde Einheit auf den
   * einzigen Rückholplatz, und der eigene Bogen dort war endgültig weg,
   * während die Rückfrage „bleibt erreichbar" versprach.
   */
  it("lässt fremde Schnellerfassungen den eigenen Bogen nicht aus der Rückholung verdrängen", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Eigenhausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    await nutzer.click(within(rueckfrage("Einheit schnell erfassen?")).getByRole("button", { name: "Schnell erfassen" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Fremdstadt");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    // Die Karte sagt, dass das nicht der eigene Bogen ist.
    expect(screen.getByText(/Angefangene Erfassung einer fremden Einheit/)).toBeDefined();

    // Zweite Schnellerfassung: die Rückfrage sagt jetzt ehrlich, dass die
    // angefangene Erfassung verworfen wird — und der eigene Bogen bleibt.
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    const frage = rueckfrage("Einheit schnell erfassen?");
    expect(frage.textContent).toMatch(/wird verworfen/);
    expect(frage.textContent).toMatch(/Dein eigener Bogen „THW Eigenhausen"/);
    await nutzer.click(within(frage).getByRole("button", { name: "Schnell erfassen" }));
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    expect(screen.getByText("THW Eigenhausen")).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Zuletzt verdrängten Bogen zurückholen" }));
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getAllByText(/Eigenhausen/).length).toBeGreaterThan(0);
  }, 20000);

  it("schließt eine abgelegte Schnellerfassung, statt sie als eigenen Bogen offen zu lassen", async () => {
    const einsatz = einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Eigenhausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    for (const name of ["Aalen", "Biberach"]) {
      await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
      // Ziel ohne Sammlung: geprüft wird hier der Weg über „In Einsatz-Sammlung ablegen…".
      await nutzer.click(within(rueckfrage("Einheit schnell erfassen — für welche Sammlung?")).getByRole("button", { name: "Ohne Sammlung erfassen" }));
      const frage = document.querySelector<HTMLDialogElement>("dialog[aria-label='Einheit schnell erfassen?']");
      if (frage) await nutzer.click(within(frage).getByRole("button", { name: "Schnell erfassen" }));
      await nutzer.type(screen.getByLabelText("Name (Pflicht)"), name);
      await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));
      await nutzer.click(screen.getByRole("button", { name: "In Einsatz-Sammlung ablegen…" }));
      expect(screen.getByText(/Die Erfassung wird in der Sammlung abgelegt und hier geschlossen/)).toBeDefined();
      await nutzer.click(screen.getByRole("button", { name: "Sammelhausen" }));
      await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
      expect(screen.getByText(/Dein eigener Bogen „THW Eigenhausen" liegt auf der Startseite/)).toBeDefined();
      await nutzer.click(screen.getByRole("button", { name: /‹ Einsätze|‹ Startseite/ }));
    }

    const s = einsaetzeLaden().find((x) => x.id === einsatz.id)!;
    expect(s.eintraege).toHaveLength(2);
    expect(localStorage.getItem("eeb.entwurf.v1")).toBeNull();
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Eigenhausen");
  }, 30000);

  it("führt die Schnellerfassung von der Startseite in die gewählte Sammlung (R2-N6, R2-S2)", async () => {
    const einsatz = einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    await nutzer.click(within(rueckfrage("Einheit schnell erfassen — für welche Sammlung?")).getByRole("button", { name: /Für „Sammelhausen" erfassen/ }));
    expect(within(screen.getByRole("banner")).getByText(/Aufnahme für: Sammelhausen/)).toBeDefined();
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Schnellhausen");
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    // Direkt zur Stärke, ohne Umweg über „2. Einsatz".
    expect(screen.getByRole("heading", { level: 2, name: "3. Personal" })).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
    // Stärke 0: die App fragt nach (R3-N1).
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Stärke fehlt" })).getByRole("button", { name: "Trotzdem mit Stärke 0 übernehmen" }));
    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
    expect(einsaetzeLaden().find((x) => x.id === einsatz.id)!.eintraege).toHaveLength(1);
    expect(localStorage.getItem("eeb.entwurf.v1")).toBeNull();
    expect(screen.getAllByText("Stärke fehlt").length).toBeGreaterThan(0);

    // Die nächste Erfassung in dieser Sammlung beginnt wieder mit „nur Stärke".
    await nutzer.click(screen.getByRole("button", { name: "Einheit manuell erfassen…" }));
    expect(within(screen.getByRole("banner")).getByText("Schnellerfassung")).toBeDefined();
  }, 30000);

  /**
   * Audit Runde 3, R3-K5: Auf dem Telefon lag die Karte der laufenden
   * Sammlung erst bei rund 1 850 px. Die Weiche bietet sie direkt an.
   */
  it("öffnet eine laufende Sammlung direkt aus der Weiche „Bögen sammeln“", async () => {
    einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    const weg = screen.getByRole("region", { name: "Bögen sammeln (Meldekopf)" });
    const knopf = within(weg).getByRole("button", { name: /^„Sammelhausen" öffnen/ });
    expect(knopf.className).toContain("primaer");
    expect(within(weg).getByRole("button", { name: "Neue Einsatz-Sammlung…" }).className).not.toContain("primaer");
    await nutzer.click(knopf);
    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
  });

  /**
   * Audit Runde 2, R2-E1: Eine über „‹ Einsatz" abgebrochene Erfassung lag
   * beim nächsten „Einheit manuell erfassen…" auf dem Rückholplatz — und der
   * eigene Bogen war weg. Jetzt fragt die App: fortsetzen oder verwerfen.
   */
  it("bietet eine abgebrochene Einsatz-Erfassung zum Fortsetzen an und schützt den eigenen Bogen", async () => {
    einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Eigenhausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });

    await nutzer.click(screen.getByRole("button", { name: "Einheit manuell erfassen…" }));
    await nutzer.click(within(rueckfrage("Einheit für den Einsatz erfassen?")).getByRole("button", { name: "Einheit erfassen" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Falschstadt");
    await nutzer.click(screen.getByRole("button", { name: /‹ Einsatz „Sammelhausen"/ }));

    // Fortsetzen führt zurück in dieselbe Erfassung.
    await nutzer.click(screen.getByRole("button", { name: "Einheit manuell erfassen…" }));
    await nutzer.click(within(rueckfrage("Angefangene Erfassung")).getByRole("button", { name: "Diese Erfassung fortsetzen" }));
    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("Falschstadt");
    await nutzer.click(screen.getByRole("button", { name: /‹ Einsatz „Sammelhausen"/ }));

    // Verwerfen: Die falsche Erfassung geht, der eigene Bogen bleibt.
    await nutzer.click(screen.getByRole("button", { name: "Einheit manuell erfassen…" }));
    const frage = rueckfrage("Angefangene Erfassung");
    expect(frage.textContent).toMatch(/Dein eigener Bogen „THW Eigenhausen" bleibt/);
    await nutzer.click(within(frage).getByRole("button", { name: "Verwerfen und neue Einheit erfassen" }));
    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("");

    const rueck = localStorage.getItem("eeb.entwurf.ersetzt.v1") ?? "";
    expect(rueck).toContain("Eigenhausen");
    expect(rueck).not.toContain("Falschstadt");
  }, 30000);

  /**
   * Audit Runde 3, R3-S2: Nach einer abgebrochenen Einsatz-Erfassung erbte
   * „Neuen Bogen erstellen" den Aufnahme-Kontext — Kopf „‹ Einsatz", Marke
   * „Aufnahme für" und „In Einsatz übernehmen" legten den eigenen Bogen in
   * die fremde Sammlung.
   */
  it("beendet mit „Neuen Bogen erstellen“ den Aufnahme-Kontext einer abgebrochenen Erfassung (R3-S2)", async () => {
    einsatzImSpeicherAnlegen("Hochwasser Deich", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await nutzer.click(await screen.findByRole("button", { name: "Einheit manuell erfassen…" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Aalen");
    await nutzer.click(screen.getByRole("button", { name: /‹ Einsatz „Hochwasser Deich"/ }));
    await nutzer.click(screen.getByRole("button", { name: /‹ Einsätze|‹ Startseite/ }));

    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.click(within(rueckfrage("Neuen Bogen anfangen?")).getByRole("button", { name: "Neu anfangen" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Eigenstadt");

    expect(screen.getByRole("button", { name: "‹ Startseite" })).toBeDefined();
    expect(within(screen.getByRole("banner")).queryByText(/Aufnahme für/)).toBeNull();
    expect(screen.queryByRole("button", { name: "In Einsatz übernehmen" })).toBeNull();
    expect(localStorage.getItem("eeb.entwurf.v1")).not.toContain('"fremd"');
  }, 20000);

  /**
   * Audit Runde 2, R2-E2: Eine Erfassung mit nur Name und Typ legte die
   * StAN-Sollstärke ungefragt als gemeldete Stärke in die Lage.
   */
  it("fragt vor dem Ablegen reiner Sollstärke und kennzeichnet sie auf der Karte", async () => {
    const einsatz = einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await nutzer.click(await screen.findByRole("button", { name: "Einheit manuell erfassen…" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Sollhausen");
    const feld = screen.getByRole("combobox", { name: "Einheitstyp" });
    await nutzer.type(feld, "Bergungsgruppe");
    const liste = screen.getByRole("listbox", { name: "Vorschläge zu Einheitstyp" });
    await nutzer.click(within(liste).getAllByText(/Bergungsgruppe/)[0]!);

    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
    const frage = rueckfrage("Stärke nicht gezählt");
    expect(frage.textContent).toMatch(/nur die Sollplätze nach StAN/);
    await nutzer.click(within(frage).getByRole("button", { name: "Als Sollstärke ablegen" }));

    expect(await screen.findByText("Sollstärke, nicht gemeldet")).toBeDefined();
    expect(einsaetzeLaden().find((x) => x.id === einsatz.id)!.eintraege).toHaveLength(1);
  }, 20000);

  /**
   * Audit Runde 3, R3-E3/R3-G3: Ein Tipp auf „In Einsatz übernehmen" direkt
   * nach dem Öffnen legte eine namenlose Einheit „THW" mit Stärke 0 ab.
   */
  it("legt eine Erfassung ohne Namen nicht ab, sondern führt zum Namensfeld (R3-E3)", async () => {
    const einsatz = einsatzImSpeicherAnlegen("Hochwasser Jagst", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await nutzer.click(await screen.findByRole("button", { name: "Einheit manuell erfassen…" }));
    await nutzer.click(screen.getByRole("button", { name: /^3\. Personal/ }));
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));

    const hinweis = await screen.findByRole("dialog", { name: "Name der Einheit fehlt" });
    await nutzer.click(within(hinweis).getByRole("button", { name: "Zum Namensfeld" }));
    expect(einsaetzeLaden().find((x) => x.id === einsatz.id)!.eintraege).toHaveLength(0);
    expect(await screen.findByRole("heading", { level: 2, name: "1. Einheit" })).toBeDefined();
    await waitFor(() => expect(document.activeElement?.id).toBe("feld-einheit-name"));
  }, 20000);

  /**
   * Audit Runde 3, R3-N1: Name eingetragen, Stärke 0 — die Einheit lag ohne
   * Rückfrage in der Lage. „Stärke eintragen" führt zu den Zählern.
   */
  it("fragt vor dem Ablegen mit Stärke 0 und führt mit „Stärke eintragen“ zu den Zählern (R3-N1)", async () => {
    const einsatz = einsatzImSpeicherAnlegen("Hochwasser Neckar", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await nutzer.click(await screen.findByRole("button", { name: "Einheit manuell erfassen…" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Rottweil");
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));

    const frage = await screen.findByRole("dialog", { name: "Stärke fehlt" });
    expect(frage.textContent).toContain("THW Rottweil");
    await nutzer.click(within(frage).getByRole("button", { name: "Stärke eintragen" }));
    expect(await screen.findByRole("heading", { level: 2, name: "3. Personal" })).toBeDefined();
    expect(within(screen.getByRole("banner")).getByText("Schnellerfassung")).toBeDefined();
    expect(einsaetzeLaden().find((x) => x.id === einsatz.id)!.eintraege).toHaveLength(0);
  }, 20000);

  /**
   * Audit Runde 2, R2-A5: Vom Papier abgetippt heißt die Einheit „OV
   * Papierhausen", im Einsatz steht sie als „Papierhausen" — die Rückfrage
   * schwieg, die Einheit zählte doppelt. Die Uhrzeit vom Meldeblock geht im
   * selben Weg mit.
   */
  it("fragt bei „OV …“ ohne Einheitstyp nach und übernimmt die Eintreffzeit vom Blatt", async () => {
    const einsatz = einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    meldungHinzufuegen(einsatz.id, bogenMitName("Papierhausen"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await nutzer.click(await screen.findByRole("button", { name: "Einheit manuell erfassen…" }));
    await nutzer.type(screen.getByLabelText("Eingetroffen um (vom Meldeblock)"), "09:40");
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "OV Papierhausen");
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Stärke fehlt" })).getByRole("button", { name: "Trotzdem mit Stärke 0 übernehmen" }));

    const frage = await screen.findByRole("dialog", { name: "Ist das dieselbe Einheit?" });
    await nutzer.click(within(frage).getByRole("button", { name: "Nein — als eigene Einheit führen" }));

    const eintraege = einsaetzeLaden().find((s) => s.id === einsatz.id)!.eintraege;
    const neu = eintraege.find((e) => e.bogen.einheit.hierarchie[0]!.name === "OV Papierhausen")!;
    expect(new Date(neu.eingetroffenAm!).toTimeString().slice(0, 5)).toBe("09:40");
    // Die vorhandene Einheit behält ihre Zeit.
    expect(eintraege.find((e) => e.bogen.einheit.hierarchie[0]!.name === "Papierhausen")!.eingetroffenAm).toBeUndefined();
  }, 20000);

  /**
   * Audit Runde 3, R3-S6: „Eingetroffen um" leer, 25 Minuten Unterbrechung —
   * gespeichert war die Uhrzeit des Übernehmens.
   */
  it("fragt nach einer Unterbrechung, ob der Beginn der Erfassung als Eintreffzeit gilt (R3-S6)", async () => {
    const einsatz = einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    const beginn = Date.now();
    await nutzer.click(await screen.findByRole("button", { name: "Einheit manuell erfassen…" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Pausenhausen");
    const echt = Date.now.bind(Date);
    const uhr = vi.spyOn(Date, "now").mockImplementation(() => echt() + 25 * 60_000);
    try {
      await nutzer.click(screen.getByRole("button", { name: "In Einsatz übernehmen" }));
      await nutzer.click(within(await screen.findByRole("dialog", { name: "Stärke fehlt" })).getByRole("button", { name: "Trotzdem mit Stärke 0 übernehmen" }));
      const frage = await screen.findByRole("dialog", { name: "Wann ist die Einheit eingetroffen?" });
      await nutzer.click(within(frage).getByRole("button", { name: /Beginn der Erfassung/ }));
      await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
    } finally {
      uhr.mockRestore();
    }
    const neu = einsaetzeLaden().find((x) => x.id === einsatz.id)!.eintraege[0]!;
    expect(Math.abs(neu.eingetroffenAm! - beginn)).toBeLessThan(60_000);
  }, 20000);

  it("fragt bei einem alten Bogen vor der Übergabe nach und bereitet ihn für den neuen Einsatz vor (R2-S1)", async () => {
    const nutzer = userEvent.setup();
    const alt = bogenMitName("Althausen");
    alt.einsatz = { zeitraumVon: 2350, zeitraumBis: 2354, ortAuftrag: "Gebäudeschaden Ulm" };
    render(<App />);
    fragmentSetzen(encodePayloadUrl(alt, browserKompressor));
    await screen.findByRole("heading", { name: "Gesamtübersicht" });
    expect(screen.queryByText("✓ Alle Angaben vollständig und plausibel.")).toBeNull();
    expect(screen.getAllByText(/ist vorbei — gilt dieser Bogen noch/).length).toBeGreaterThan(0);

    await nutzer.click(screen.getByRole("button", { name: /^Bogen übergeben/ }));
    await nutzer.click(screen.getByRole("button", { name: "Für neuen Einsatz vorbereiten" }));
    expect(await screen.findByRole("heading", { level: 2, name: "2. Einsatz" })).toBeDefined();
    expect(screen.getByText(/Einsatzdaten für den neuen Einsatz zurückgesetzt/)).toBeDefined();
    expect(screen.queryByText(/ist vorbei — gilt dieser Bogen noch/)).toBeNull();
  }, 20000);

  /**
   * Audit Runde 3, R3-S3: Ein früher geöffneter Tab ohne Bogen legte einen
   * neuen an und überschrieb den Entwurf des anderen Tabs ohne Frage.
   */
  it("legt den Entwurf eines anderen Fensters vor dem Anlegen auf den Rückholplatz — nach Rückfrage (R3-S3)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    const { entwurfZuJson } = await import("./entwurf");
    // Das andere Fenster schreibt seinen Bogen, dieses Fenster zeigt weiter die Startseite.
    localStorage.setItem("eeb.entwurf.v1", entwurfZuJson(bogenMitName("TabA")));

    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    const frage = await screen.findByRole("dialog", { name: "Neuen Bogen anfangen?" });
    expect(frage.textContent).toContain("In einem anderen Fenster ist „THW TabA\" angefangen");
    await nutzer.click(within(frage).getByRole("button", { name: "Neu anfangen" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "TabB");

    expect(localStorage.getItem("eeb.entwurf.v1")).toContain("TabB");
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("TabA");
  }, 20000);

  it("lässt einen unberührten Bogen ohne Rückfrage ersetzen", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    // Nichts eingetragen: eine Rückfrage schützte hier nichts und würde nur
    // zum Wegtippen erziehen.
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    expect(screen.queryByRole("dialog", { name: "Neuen Bogen anfangen?" })).toBeNull();
    expect(screen.getByLabelText("Name (Pflicht)")).toBeDefined();
  }, 20000);

  // Audit Runde 2, R2-H5: „Neuen Bogen erstellen" legte keinen
  // Verlaufseintrag an — Zurück aus Schritt 1 verließ die App.
  it("führt mit Zurück aus Schritt 1 auf die Startseite", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    const laenge = history.length;
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    expect(screen.getByLabelText("Name (Pflicht)")).toBeDefined();
    expect(history.length).toBe(laenge + 1);
    act(() => { history.back(); });
    await waitFor(() => expect(screen.queryByLabelText("Name (Pflicht)")).toBeNull());
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
  });

  it("zeigt den QR-Code im Vollbild — mit Bild, nicht nur mit Rahmen", async () => {
    const nutzer = userEvent.setup();
    const dialog = await uebergabeDialog(nutzer);

    const knopf = within(dialog).getByRole("button", { name: /QR-Code im Vollbild/ });
    await waitFor(() => expect(knopf).toHaveProperty("disabled", false));
    await nutzer.click(knopf);

    const vollbild = await screen.findByRole("dialog", { name: "QR-Code im Vollbild" });
    // Der Knopf gilt nur als heil, wenn wirklich ein Code dasteht.
    const bild = within(vollbild).getByRole("img") as HTMLImageElement;
    expect(bild.src.startsWith("data:image/")).toBe(true);
    // R2-W6/N9/O7: vor dem Scan sichtbar, wer gezeigt wird.
    expect(within(vollbild).getByText(/\(F \/ UF \/ M \/ Ges\) · Stand \d\d:\d\d Uhr/)).toBeDefined();
    expect(vollbild.querySelector(".qr-vollbild-kopf strong")?.textContent).toMatch(/ · /);
  });

  // Audit Runde 2, R2-H5: Zurück im QR-Vollbild sprang von der Übersicht auf
  // Schritt 5, statt nur das Vollbild zu schließen.
  it("schließt das QR-Vollbild mit Zurück und bleibt auf der Übersicht", async () => {
    const nutzer = userEvent.setup();
    const dialog = await uebergabeDialog(nutzer);
    const knopf = within(dialog).getByRole("button", { name: /QR-Code im Vollbild/ });
    await waitFor(() => expect(knopf).toHaveProperty("disabled", false));
    await nutzer.click(knopf);
    await screen.findByRole("dialog", { name: "QR-Code im Vollbild" });
    act(() => { history.back(); });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "QR-Code im Vollbild" })).toBeNull());
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
  });

  it("verbraucht den Verlaufseintrag des QR-Vollbilds beim Schließen per Knopf", async () => {
    const nutzer = userEvent.setup();
    const dialog = await uebergabeDialog(nutzer);
    const knopf = within(dialog).getByRole("button", { name: /QR-Code im Vollbild/ });
    await waitFor(() => expect(knopf).toHaveProperty("disabled", false));
    const laenge = history.length;
    await nutzer.click(knopf);
    const vollbild = await screen.findByRole("dialog", { name: "QR-Code im Vollbild" });
    expect(history.length).toBe(laenge + 1);
    await nutzer.click(within(vollbild).getByRole("button", { name: "Schließen" }));
    await waitFor(() => expect((history.state as { eebEbene?: string } | null)?.eebEbene).toBeUndefined());
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
  });

  // Audit Runde 2, R2-M2: Escape schloss das QR-Vollbild nicht — am
  // Meldekopf-Laptop blieb nur „Schließen", das bei großer Schrift außerhalb lag.
  it("schließt das QR-Vollbild mit Escape (cancel des modalen Dialogs)", async () => {
    const nutzer = userEvent.setup();
    const dialog = await uebergabeDialog(nutzer);
    const knopf = within(dialog).getByRole("button", { name: /QR-Code im Vollbild/ });
    await waitFor(() => expect(knopf).toHaveProperty("disabled", false));
    await nutzer.click(knopf);
    const vollbild = (await screen.findByRole("dialog", { name: "QR-Code im Vollbild" })) as HTMLDialogElement;
    expect(vollbild.tagName).toBe("DIALOG");
    act(() => { vollbild.dispatchEvent(new Event("cancel", { cancelable: true })); });
    expect(screen.queryByRole("dialog", { name: "QR-Code im Vollbild" })).toBeNull();
    // Die Übersicht dahinter steht noch da.
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
  });

  /**
   * Ein Beispielbogen ersetzt den offenen Bogen samt Entwurfssicherung — der
   * teuerste stille Verlust, den die App anbieten kann. Deshalb die Rückfrage,
   * und deshalb hier beide Richtungen: Abbrechen muss den eigenen Bogen
   * behalten, Bestätigen muss den Beispielbogen wirklich bringen.
   */
  async function beispielAnzeigen(nutzer: ReturnType<typeof userEvent.setup>) {
    // Die Beispielbögen liegen als Dateien neben der App und werden geholt —
    // in jsdom gibt es keinen Server dafür. Geliefert wird hier ein Bogen mit
    // Übungs-Flag, wie ihn examples/ enthält; geprüft wird die Rückfrage, nicht
    // das Laden.
    const bogenJson = JSON.stringify({ ...bogenMitName("Beispielhausen"), uebung: true });
    const echtesFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(bogenJson, { headers: { "content-type": "application/json" } });
    const fetchZurueck = () => {
      globalThis.fetch = echtesFetch;
    };

    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Eigenhausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    await nutzer.click(screen.getByRole("button", { name: "Beispielbögen" }));
    const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" });
    // Erst den Ordner der eigenen Organisation, dann stehen die Bögen da. Die
    // Angaben je Bogen laden nach — die Frist deckt das mit ab.
    await nutzer.click(within(dialog).getByRole("button", { name: /^THW/ }));
    const anzeigen = await within(dialog).findAllByRole("button", { name: "Anzeigen" }, { timeout: 15000 });
    await nutzer.click(anzeigen[0]!);

    // Die Rückfrage zeichnet die Dialogschicht einen Tick später.
    const frage = await screen.findByRole("dialog", { name: "Beispielbogen öffnen?" });
    return { dialog, frage, fetchZurueck };
  }

  it("behält beim Abbruch der Rückfrage den eigenen Bogen", async () => {
    const nutzer = userEvent.setup();
    const { dialog, frage, fetchZurueck } = await beispielAnzeigen(nutzer);
    try {
      await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));

      // Die Auswahl bleibt stehen, damit man einen anderen Bogen nehmen kann.
      expect(dialog.hasAttribute("open")).toBe(true);
      expect(screen.queryByRole("heading", { name: "Gesamtübersicht" })).toBeNull();
    } finally {
      fetchZurueck();
    }
  }, 20000);

  it("öffnet den Beispielbogen nach Bestätigung — als Übungsbogen", async () => {
    const nutzer = userEvent.setup();
    const { dialog, frage, fetchZurueck } = await beispielAnzeigen(nutzer);
    try {
      await nutzer.click(within(frage).getByRole("button", { name: "Beispielbogen öffnen" }));

      expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
      expect(dialog.hasAttribute("open")).toBe(false);
      // Beispielbögen sind ausnahmslos Übungsbögen — der Störer muss stehen.
      expect(screen.getByText(/als Übung gekennzeichnet/)).toBeDefined();
    } finally {
      fetchZurueck();
    }
  }, 20000);

  const NAHBEREICH = /Gerät in der Nähe|AirDrop|Quick Share/;

  it("bietet die Übergabe ans Nachbargerät nicht an, wo es kein Share-Sheet gibt", async () => {
    // Desktop-Browser ohne Web Share API (wie hier jsdom): der Knopf bliebe
    // wirkungslos, also steht er gar nicht erst da.
    const dialog = await uebergabeDialog(userEvent.setup());

    expect(within(dialog).queryByRole("button", { name: NAHBEREICH })).toBeNull();
  });

  it("gibt den vollen Bogen-Link ans Share-Sheet, wenn eines da ist (AirDrop/Quick Share)", async () => {
    const geteilt = vi.fn<(daten: ShareData) => Promise<void>>(async () => {});
    Object.defineProperty(navigator, "share", { value: geteilt, configurable: true });
    try {
      const nutzer = userEvent.setup();
      const dialog = await uebergabeDialog(nutzer);

      await nutzer.click(within(dialog).getByRole("button", { name: NAHBEREICH }));

      expect(geteilt).toHaveBeenCalledTimes(1);
      // Der Link trägt den kompletten Payload — nicht nur einen QR-Teil.
      expect(geteilt.mock.calls[0]![0].url).toContain("erfassungsbogen.app/#");
    } finally {
      Reflect.deleteProperty(navigator, "share");
    }
  });

  it("öffnet einen Bogen-Link auch bei bereits geladener Seite (nur Fragmentwechsel)", async () => {
    // Der Fall vom Telefon: Der Browser benutzt den offenen Tab weiter, lädt das
    // Dokument also NICHT neu — es feuert nur `hashchange`. Ohne Listener bliebe
    // die App auf der Startseite stehen (und das Fragment in der Adresszeile).
    render(<App />);
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();

    fragmentSetzen(encodePayloadUrl(bogenMitName("Fragmenthausen"), browserKompressor));

    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    const einheit = screen.getByRole("heading", { name: "Einheit" }).closest("section")!;
    expect(within(einheit).getByText(/Fragmenthausen/)).toBeDefined();
    // Die Nutzdaten dürfen nicht im Verlauf zurückbleiben.
    expect(window.location.hash).toBe("");
  });

  /**
   * Audit Runde 3, R3-S1: Der Listener lief mit dem Zustand des ersten
   * Renders. App ohne Entwurf geöffnet, eigenen Bogen angelegt, dann ein Link
   * — der eigene Bogen war ohne Frage und ohne Rückholung weg.
   */
  it("fragt bei einem Link nach dem AKTUELLEN eigenen Bogen und legt ihn auf den Rückholplatz (R3-S1)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Eigenstadt");

    fragmentSetzen(encodePayloadUrl(bogenMitName("Bamberg"), browserKompressor));
    const frage = await screen.findByRole("dialog", { name: "Empfangenen Bogen öffnen?" });
    expect(frage.textContent).toContain("THW Eigenstadt");
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("Eigenstadt");
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toBeNull();

    // Weitertippen, dann derselbe Weg mit „Meldung öffnen": zurückholbar ist der aktuelle Stand.
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "-Nord");
    fragmentSetzen(encodePayloadUrl(bogenMitName("Bamberg"), browserKompressor));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Empfangenen Bogen öffnen?" })).getByRole("button", { name: "Meldung öffnen" }));
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Eigenstadt-Nord");
    expect(screen.getByText(/Dein eigener Bogen „THW Eigenstadt-Nord" liegt auf der Startseite/)).toBeDefined();
  }, 20000);

  /**
   * Audit Runde 3, R3-D2: Beim Kaltstart über einen Link wanderte der eigene
   * Bogen schon beim Laden auf den Rückholplatz — der dort liegende Bogen war
   * weg, bevor ein Dialog erschien, und „Abbrechen" stellte nichts wieder her.
   */
  it("fragt beim Kaltstart über einen Link erst und lässt bei „Abbrechen“ beide Plätze, wie sie waren (R3-D2)", async () => {
    const { entwurfZuJson } = await import("./entwurf");
    localStorage.setItem("eeb.entwurf.v1", entwurfZuJson(bogenMitName("Ulm"), Date.now(), { schritt: 5 }));
    localStorage.setItem("eeb.entwurf.ersetzt.v1", entwurfZuJson(bogenMitName("Albstadt"), Date.now() - 60_000));
    window.location.hash = fragmentInhalt(encodePayloadUrl(bogenMitName("Lüneburg"), browserKompressor));
    vi.resetModules();
    const { App: AppKalt } = await import("./app");
    const nutzer = userEvent.setup();
    render(<AppKalt />);

    const frage = await screen.findByRole("dialog", { name: "Empfangenen Bogen öffnen?" });
    // Solange gefragt wird, ist noch nichts verdrängt — und die Frage nennt, was vom Rückholplatz fiele.
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Albstadt");
    expect(frage.textContent).toContain("THW Albstadt");
    expect(frage.textContent).toContain("endgültig gelöscht");
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));

    expect(localStorage.getItem("eeb.entwurf.v1")).toContain("Ulm");
    expect(localStorage.getItem("eeb.entwurf.v1")).not.toContain("Lüneburg");
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Albstadt");
  }, 20000);

  it("importiert auch eine geteilte Vorlage über den Fragmentwechsel", async () => {
    render(<App />);

    fragmentSetzen(encodeVorlagePayloadUrl(bogenMitName("Vorlagenhausen"), browserKompressor));

    expect(await screen.findByText(/Vorlage .*Vorlagenhausen.* importiert/)).toBeDefined();
    expect(window.location.hash).toBe("");
  });

  it("meldet einen kaputten Link, statt still auf der Startseite zu bleiben", async () => {
    render(<App />);

    fragmentSetzen("#DasIstKeinBogen");

    expect(await screen.findByText(/keinen gültigen Erfassungsbogen/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
  });

  it("öffnet bei einem Segment-Teil per Link den Scanner und setzt den Bogen mit den übrigen Teilen zusammen", async () => {
    // Mehrteiliger Bogen: Der erste Teil kommt als Link (Handy-Kamera hat den
    // QR-Code gescannt) — der Scanner muss sich öffnen, damit die restlichen
    // Teile direkt folgen können. Der Link-Teil darf dabei nicht verloren gehen.
    const teile = segmentPayloadUrls(encodePayload(bogenMitName("Segmenthausen"), browserKompressor), 2);
    render(<App />);

    fragmentSetzen(teile[0]!);
    expect(await screen.findByRole("dialog", { name: "QR-Code scannen" })).toBeDefined();

    // Der zweite (letzte) Teil vervollständigt den Bogen — nur wenn Teil 1 aus
    // dem Link im Sammelstand liegt, öffnet sich jetzt die Übersicht.
    fragmentSetzen(teile[1]!);
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    const einheit = screen.getByRole("heading", { name: "Einheit" }).closest("section")!;
    expect(within(einheit).getByText(/Segmenthausen/)).toBeDefined();
  });

  it("übernimmt einen Segment-Teil auch beim Kaltstart (App noch nie geöffnet) und öffnet den Scanner", async () => {
    // Der Weg des allerersten Kontakts: QR-Code mit der Handy-Kamera gescannt,
    // die Web-App lädt KALT mit dem Segment-Fragment in der URL. Der Teil muss
    // in den Sammelstand und der Scanner direkt angehen — sonst wäre der Teil
    // weg (das Fragment wird beim Start aus der Adresszeile entfernt).
    const teile = segmentPayloadUrls(encodePayload(bogenMitName("Kaltstarthausen"), browserKompressor), 2);
    window.location.hash = fragmentInhalt(teile[0]!);
    vi.resetModules();
    const { App: AppKalt } = await import("./app");
    render(<AppKalt />);

    expect(await screen.findByRole("dialog", { name: "QR-Code scannen" })).toBeDefined();
    expect(window.location.hash).toBe("");

    fragmentSetzen(teile[1]!);
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    const einheit = screen.getByRole("heading", { name: "Einheit" }).closest("section")!;
    expect(within(einheit).getByText(/Kaltstarthausen/)).toBeDefined();
  });

  it("verwirft den Bogen erst nach der Rückfrage und kehrt zur Startseite zurück", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 5);

    await nutzer.click(screen.getByRole("button", { name: "Neuer Bogen" }));

    // Die Rückfrage ist ein eigener Dialog, kein window.confirm: in der iOS-App
    // (WKWebView) bliebe ein Systemdialog unbeantwortet.
    const rueckfrage = await screen.findByRole("dialog", { name: "Bogen schließen?" });
    // Solange nicht bestätigt ist, bleibt der Bogen offen.
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();

    await nutzer.click(within(rueckfrage).getByRole("button", { name: "Schließen, zur Startseite" }));

    expect(await screen.findByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
  });

  it("behält den Bogen, wenn die Verwerfen-Rückfrage abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 5);

    await nutzer.click(screen.getByRole("button", { name: "Neuer Bogen" }));
    const rueckfrage = await screen.findByRole("dialog", { name: "Bogen schließen?" });
    await nutzer.click(within(rueckfrage).getByRole("button", { name: "Abbrechen" }));

    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
  });
});

/**
 * Einsatz-Sammlung anlegen — der Weg, der mit `window.prompt` auf dem iPhone
 * gar nicht funktionierte: das System beantwortet die eingebauten
 * JavaScript-Dialoge dort nicht, der Knopf tat also scheinbar nichts. Geprüft
 * werden beide Einstiege (Startseite und offener Bogen) samt Abbruch.
 */
describe("Neuen Einsatz anlegen", () => {
  afterEach(() => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    localStorage.clear();
  });

  /** Anlege-Dialog ausfüllen und abschicken. */
  async function einsatzAnlegen(
    nutzer: ReturnType<typeof userEvent.setup>,
    name: string,
    art?: string,
    ort?: string,
  ) {
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    const anlegen = within(dialog).getByRole("button", { name: "Einsatz anlegen" });
    // Ohne Namen ist der Einsatz nicht anzulegen — die Pflichtangabe sperrt den Knopf.
    expect(anlegen.hasAttribute("disabled")).toBe(true);

    await nutzer.type(within(dialog).getByLabelText("Name"), name);
    if (art) await nutzer.selectOptions(within(dialog).getByLabelText("Art"), art);
    if (ort) await nutzer.type(within(dialog).getByLabelText("Ort / Auftrag (optional)"), ort);
    await nutzer.click(anlegen);
  }

  it("zeigt die Einsatzansicht in neutraler Akzentfarbe, auch wenn ein Feuerwehr-Bogen offen ist (R2-K8)", async () => {
    einsatzImSpeicherAnlegen("Übungslage", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.selectOptions(screen.getByLabelText("Organisation"), String(OrganisationsTyp.FEUERWEHR));
    const akzent = () => document.documentElement.style.getPropertyValue("--org-akzent");
    await waitFor(() => expect(akzent()).not.toBe(""));
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Übungslage" });
    expect(akzent()).toBe("");
    // Zurück beim eigenen Bogen gilt wieder dessen Farbe.
    await nutzer.click(screen.getByRole("button", { name: "‹ Einsätze" }));
    await waitFor(() => expect(akzent()).not.toBe(""));
  }, 20000);

  it("legt von der Startseite aus einen Einsatz an und öffnet ihn", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    await einsatzAnlegen(nutzer, "Hochwasser Weser", "Übung", "Deichabschnitt Nord");

    // Die Einsatzansicht übernimmt — mit Name, gewählter Art und Ort im Kopf.
    expect(await screen.findByRole("heading", { level: 1, name: "Hochwasser Weser" })).toBeDefined();
    expect(screen.getByText("Übung · Deichabschnitt Nord")).toBeDefined();
  });

  /**
   * Der Meldekopf gibt seine Einheitenliste im Fremdformat der Führungsstelle
   * heraus. Derselbe Weg wie beim einzelnen Bogen: Schreiber wird beim Klick
   * nachgeladen, danach muss eine gültige Mappe herauskommen.
   */
  it("gibt die Einheitenliste des Einsatzes als Excel-Mappe heraus", async () => {
    const nutzer = userEvent.setup();
    const mitschnitt = downloadsMitschneiden();
    try {
      render(<App />);
      await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
      await einsatzAnlegen(nutzer, "Hochwasser Weser", "Einsatz");
      await screen.findByRole("heading", { level: 1, name: "Hochwasser Weser" });

      await nutzer.click(screen.getByRole("button", { name: /^Excel-Liste/ }));

      await waitFor(() => expect(mitschnitt.dateien).toHaveLength(1));
      const [datei] = mitschnitt.dateien;
      expect(datei!.name).toBe("eeb-einsatz-Hochwasser_Weser-oldenburg.xlsx");
      const bytes = new Uint8Array(await datei!.blob.arrayBuffer());
      expect(String.fromCharCode(bytes[0]!, bytes[1]!)).toBe("PK");
    } finally {
      mitschnitt.aufraeumen();
    }
  });

  /**
   * Nachlieferung an den Stab: Nach dem ersten Export merkt sich die App den
   * Stand; ein danach eingelesener Bogen zählt als neu, und der Teilexport
   * enthält nur ihn. Der ganze Weg über die Oberfläche, weil der Stand in
   * app.tsx verbucht und in der Einsatzansicht abgelesen wird.
   */
  it("gibt nach dem ersten Export auf Wunsch nur die seitdem neuen Bögen heraus", async () => {
    const angelegt = einsatzImSpeicherAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(angelegt.id, bogenMitName("OV Erster"));
    const nutzer = userEvent.setup();
    const mitschnitt = downloadsMitschneiden();
    try {
      render(<App />);
      await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
      await screen.findByRole("heading", { level: 1, name: "Hochwasser Weser" });
      expect(screen.getByText(/Noch kein Export aus diesem Einsatz/)).toBeDefined();

      await nutzer.click(screen.getByRole("button", { name: "Übersicht als CSV" }));
      await waitFor(() => expect(mitschnitt.dateien).toHaveLength(1));
      expect(await mitschnitt.dateien[0]!.blob.text()).toContain("OV Erster");
      expect(await screen.findByText(/seitdem keine neuen Bögen/)).toBeDefined();

      // Ein Bogen kommt nach dem Export herein — der ist für den Stab neu.
      const datei = new File([JSON.stringify(bogenMitName("OV Zweiter"))], "zweiter.json", { type: "application/json" });
      await nutzer.upload(screen.getByLabelText("Dateien wählen…"), datei);
      expect(await screen.findByText(/seitdem 1 neuer Bogen/)).toBeDefined();

      await nutzer.click(screen.getByRole("checkbox", { name: /Nur neue Bögen seit dem letzten Export/ }));
      await nutzer.click(screen.getByRole("button", { name: "Übersicht als CSV" }));
      await waitFor(() => expect(mitschnitt.dateien).toHaveLength(2));
      const nachlieferung = await mitschnitt.dateien[1]!.blob.text();
      expect(nachlieferung).toContain("OV Zweiter");
      expect(nachlieferung).not.toContain("OV Erster");
      // Der Teilexport zählt als Übergabe: danach ist wieder nichts neu.
      expect(await screen.findByText(/seitdem keine neuen Bögen/)).toBeDefined();
    } finally {
      mitschnitt.aufraeumen();
    }
  });

  it("legt nichts an, wenn der Dialog abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    await nutzer.type(within(dialog).getByLabelText("Name"), "Verworfen");
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    // Die Startseite bleibt stehen, die Einsatzliste leer.
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Verworfen" })).toBeNull();
  });

  it("nimmt einen geöffneten Bogen in einen neu angelegten Einsatz auf", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    // Wie nach einem Scan: der Bogen kommt über einen Link herein und liegt offen.
    fragmentSetzen(encodePayloadUrl(bogenMitName("Scanhausen"), browserKompressor));
    await screen.findByRole("heading", { name: "Gesamtübersicht" });

    await nutzer.click(screen.getByRole("button", { name: "In Einsatz-Sammlung ablegen…" }));
    // Der Anlege-Dialog erscheint über der schon offenen Einsatz-Auswahl.
    await nutzer.click(screen.getByRole("button", { name: "Neue Sammlung anlegen…" }));
    await einsatzAnlegen(nutzer, "Sammelhausen");

    // Der Bogen ist als Meldung abgelegt: Einsatzansicht mit einer Einheit.
    expect(await screen.findByRole("heading", { level: 1, name: "Sammelhausen" })).toBeDefined();
    const liste = screen.getByRole("heading", { name: "Einheiten (1 gemeldet · 1 zählend)" }).closest("section")!;
    expect(within(liste).getByText("THW Scanhausen")).toBeDefined();
  });

  /**
   * Am Meldekopf liegt nach dem Scan der Blick auf der Liste, nicht auf der
   * Rückmeldezeile darüber: Zwischen dreißig gleich gebauten Zeilen ist ohne
   * Quittung nicht zu sehen, welche zum gerade aufgenommenen Bogen gehört.
   * Genau eine Zeile darf sie tragen — quittierten alle, quittierte keine.
   */
  it("quittiert die Zeile der gerade aufgenommenen Meldung — und nur sie", async () => {
    const nutzer = userEvent.setup();
    const einsatz = einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    meldungHinzufuegen(einsatz.id, bogenMitName("Althausen"));
    meldungHinzufuegen(einsatz.id, bogenMitName("Bestandshausen"));
    render(<App />);

    // Mit vorhandener Sammlung bietet der Empfang die Aufnahme direkt an —
    // ohne Umweg über den eigenen Arbeitsbogen (Audit „Arbeitsablauf", W1).
    fragmentSetzen(encodePayloadUrl(bogenMitName("Neuhausen"), browserKompressor));
    const empfang = await screen.findByRole("dialog", { name: /Meldung von „THW Neuhausen" empfangen/ });
    await nutzer.click(within(empfang).getByRole("button", { name: /In „Sammelhausen" aufnehmen/ }));

    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
    const quittiert = await waitFor(() => {
      const treffer = document.querySelectorAll(".einheit-zeile.eingegangen");
      expect(treffer).toHaveLength(1);
      return treffer[0] as HTMLElement;
    });
    expect(quittiert.textContent).toContain("Neuhausen");
    expect(quittiert.textContent).not.toContain("Althausen");
  });

  /**
   * Dieselbe Einheit ein zweites Mal: Die Frage hat zwei gleichwertige
   * Antworten, und beide müssen wirklich unterschiedlich wirken — sonst
   * verschwindet entweder eine Folgemeldung in der Historie einer fremden
   * Einheit oder eine echte zweite Einheit zählt nie mit.
   */
  async function zweiteMeldungDerselbenEinheit(nutzer: ReturnType<typeof userEvent.setup>) {
    const einsatz = einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    meldungHinzufuegen(einsatz.id, bogenMitName("Doppelhausen"));
    render(<App />);

    fragmentSetzen(encodePayloadUrl(bogenMitName("Doppelhausen"), browserKompressor));
    const empfang = await screen.findByRole("dialog", { name: /Meldung von „THW Doppelhausen" empfangen/ });
    await nutzer.click(within(empfang).getByRole("button", { name: /In „Sammelhausen" aufnehmen/ }));
    // Die Rückfrage zur bekannten Einheit erscheint als eigener Dialog — er braucht einen Tick.
    await screen.findByRole("dialog", { name: "Einheit ist bereits gemeldet" });

    return {
      einsatzId: einsatz.id,
      dialog: document.querySelector<HTMLDialogElement>("dialog[aria-label='Einheit ist bereits gemeldet']")!,
    };
  }

  it("hängt eine zweite Meldung derselben Einheit als neue Fassung an", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, dialog } = await zweiteMeldungDerselbenEinheit(nutzer);

    await nutzer.click(within(dialog).getByRole("button", { name: "Als neue Fassung anhängen" }));

    const eintraege = einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege;
    expect(eintraege).toHaveLength(2); // die alte Meldung wandert in die Historie
    expect(neuesteJeEinheit(eintraege)).toHaveLength(1); // gezählt wird eine Einheit
  });

  /** R2-W6: Die Karte zeigte direkt danach die Zeit der Folgemeldung, erst nach dem Neuladen die richtige. */
  it("zeigt nach dem Anhängen sofort die Eintreffzeit der ersten Meldung", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, dialog } = await zweiteMeldungDerselbenEinheit(nutzer);
    const erste = einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege[0]!;
    const frueher = Date.now() - 3 * 60 * 60 * 1000;
    eintreffzeitSetzen(einsatzId, erste.id, frueher);

    await nutzer.click(within(dialog).getByRole("button", { name: "Als neue Fassung anhängen" }));

    // Karte in der Einsatzansicht: volle Zeitform seit R2-A6.
    const erwartet = `eingetroffen ${zeitLang(frueher)}`;
    await waitFor(() => expect(document.body.textContent).toContain(erwartet));
    expect(document.body.textContent).not.toContain(`eingetroffen ${zeitLang(Date.now())}`);
  });

  it("führt die zweite Meldung auf Wunsch als eigene Einheit", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, dialog } = await zweiteMeldungDerselbenEinheit(nutzer);

    await nutzer.click(within(dialog).getByRole("button", { name: "Als eigene Einheit führen" }));

    const eintraege = einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege;
    expect(neuesteJeEinheit(eintraege)).toHaveLength(2); // beide zählen getrennt
  });

  /**
   * Nach einer Papierphase: dieselbe Einheit, einmal ohne Einheitstyp
   * abgetippt, jetzt mit Typ gescannt — der Schlüssel unterscheidet sich,
   * der Ort nicht. Die App fragt, statt doppelt zu zählen (Audit „Analog
   * first", A5).
   */
  it("fragt bei gleichem Ort und anderem Einheitstyp, ob es dieselbe Einheit ist", async () => {
    const nutzer = userEvent.setup();
    const einsatz = einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    meldungHinzufuegen(einsatz.id, bogenMitName("Papierhausen"));
    render(<App />);

    const mitTyp = bogenMitName("Papierhausen");
    mitTyp.einheit.einheitsTyp = { code: 3 };
    fragmentSetzen(encodePayloadUrl(mitTyp, browserKompressor));
    const empfang = await screen.findByRole("dialog", { name: /empfangen/ });
    await nutzer.click(within(empfang).getByRole("button", { name: /In „Sammelhausen" aufnehmen/ }));
    const frage = await screen.findByRole("dialog", { name: "Ist das dieselbe Einheit?" });
    await nutzer.click(within(frage).getByRole("button", { name: /^Ja — als neue Fassung/ }));

    const eintraege = einsaetzeLaden().find((s) => s.id === einsatz.id)!.eintraege;
    expect(eintraege).toHaveLength(2);
    expect(neuesteJeEinheit(eintraege)).toHaveLength(1);
  });

  it("nimmt bei Abbruch der Rückfrage gar nichts auf", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, dialog } = await zweiteMeldungDerselbenEinheit(nutzer);

    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
  });
});

/**
 * Meldekopf-Dauerscan: Der Scanner bleibt offen, jeder gelesene Bogen liegt
 * sofort im Einsatz. Der Schließen-Knopf beendet dort nur den Durchgang — er
 * darf deshalb nicht „Abbrechen" heißen. Ausnahme: Von einem mehrteiligen Bogen
 * liegen erst einzelne Teile im Sammelstand; die gehen beim Schließen verloren,
 * dann ist „Abbrechen" die ehrliche Beschriftung.
 */
describe("Meldekopf-Scan: Beschriftung des Schließen-Knopfes", () => {
  afterEach(() => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    localStorage.clear();
  });

  /** Einsatz anlegen und den Kiosk-Scanner darin öffnen. */
  async function scannerImEinsatz(nutzer: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    const anlegen = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    await nutzer.type(within(anlegen).getByLabelText("Name"), "Meldekopfhausen");
    await nutzer.click(within(anlegen).getByRole("button", { name: "Einsatz anlegen" }));

    await nutzer.click(await screen.findByRole("button", { name: "Bogen scannen…" }));
    return screen.findByRole("dialog", { name: "QR-Code scannen" });
  }

  it("zeigt „Fertig“, solange kein angefangener Bogen im Sammelstand liegt", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    const scanner = await scannerImEinsatz(nutzer);

    expect(within(scanner).getByRole("button", { name: "Fertig" })).toBeDefined();
    expect(within(scanner).queryByRole("button", { name: "Abbrechen" })).toBeNull();
  });

  it("wird zu „Abbrechen“, solange Teile eines unvollständigen Bogens im Sammelstand liegen", async () => {
    const nutzer = userEvent.setup();
    const teile = segmentPayloadUrls(encodePayload(bogenMitName("Teilhausen"), browserKompressor), 2);
    render(<App />);

    const scanner = await scannerImEinsatz(nutzer);

    // Teil 1 von 2 — der Rest fehlt, Schließen würde ihn wegwerfen.
    fragmentSetzen(teile[0]!);
    expect(await within(scanner).findByRole("button", { name: "Abbrechen" })).toBeDefined();

    // Teil 2 vervollständigt den Bogen: Er liegt jetzt im Einsatz, der Scanner
    // bleibt für den nächsten offen — und der Knopf beendet wieder nur den Durchgang.
    fragmentSetzen(teile[1]!);
    expect(await within(scanner).findByRole("button", { name: "Fertig" })).toBeDefined();
    expect(within(scanner).queryByRole("button", { name: "Abbrechen" })).toBeNull();
  });
});

/**
 * Stapelscan am Meldekopf: Eine Folgemeldung derselben Einheit wird ohne
 * Rückfrage als neue Fassung angehängt — die Frage „neue Fassung oder eigene
 * Einheit?" hielt den Stapel an, während die nächste Einheit den Code hinhielt
 * (Audit „Stress und Unterbrechung", S1).
 */
describe("Meldekopf-Scan: Folgemeldung ohne Rückfrage", () => {
  afterEach(() => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    localStorage.clear();
  });

  it("hängt eine veränderte Fassung derselben Einheit ohne Dialog an und quittiert sie als Folgemeldung", async () => {
    const nutzer = userEvent.setup();
    const einsatz = einsatzImSpeicherAnlegen("Stapelhausen", EinsatzArt.EINSATZ);
    const erste = bogenMitName("Folgehausen");
    meldungHinzufuegen(einsatz.id, erste);
    render(<App />);

    await nutzer.click(await screen.findByRole("button", { name: "Öffnen" }));
    await nutzer.click(await screen.findByRole("button", { name: "Bogen scannen…" }));
    const scanner = await screen.findByRole("dialog", { name: "QR-Code scannen" });

    const zweite = { ...erste, sonstiges: "Nachzügler eingetroffen" };
    fragmentSetzen(encodePayloadUrl(zweite, browserKompressor));

    expect(await within(scanner).findByText(/Folgemeldung/)).toBeDefined();
    expect(document.querySelector("dialog[aria-label='Einheit ist bereits gemeldet']")).toBeNull();
    const eintraege = einsaetzeLaden().find((s) => s.id === einsatz.id)!.eintraege;
    expect(eintraege).toHaveLength(2);
    expect(neuesteJeEinheit(eintraege)).toHaveLength(1);
  });
});

/**
 * Speicher voll: Die Anzeige „automatisch gespeichert" darf nicht lügen
 * (Audit „Offline und Speicher", O1).
 */
describe("Speicher voll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("meldet im Assistenten, dass nicht gespeichert wurde", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === "eeb.entwurf.v1") throw new DOMException("voll", "QuotaExceededError");
      return echt.call(this, k, v);
    });
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "V");

    expect(await screen.findByText(/Nicht gespeichert — der Speicher dieses Geräts ist voll/)).toBeDefined();
    expect(screen.queryByText(/✓ automatisch gespeichert/)).toBeNull();
  });

  /** Audit Runde 3, R3-O4: gesperrt ist nicht voll; Schließen fragt nach. */
  it("nennt einen gesperrten Speicher beim Namen und fragt vor dem Schließen", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("gesperrt", "QuotaExceededError");
    });
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "G");
    expect(await screen.findByText(/dieser Browser lässt die App nichts speichern/)).toBeDefined();
    expect(screen.queryByText(/Speicher dieses Geräts ist voll/)).toBeNull();

    const schliessen = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(schliessen);
    expect(schliessen.defaultPrevented).toBe(true);
  });

  it("fragt vor dem Schließen nicht, wenn gespeichert ist", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "G");
    const schliessen = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(schliessen);
    expect(schliessen.defaultPrevented).toBe(false);
  });

  /** Audit Runde 2, R2-O2: das Scheitern steht dort, wo getippt wurde. */
  function sammlungenVoll() {
    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      // Wie ein echter voller Speicher: was wächst, scheitert; Gleiches oder Kürzeres geht.
      if (k === "eeb.einsaetze.v1" && v.length > (this.getItem(k)?.length ?? 0)) {
        throw new DOMException("voll", "QuotaExceededError");
      }
      return echt.call(this, k, v);
    });
  }

  it("meldet eine nicht angelegte Sammlung im Dialog", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    sammlungenVoll();
    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    await nutzer.type(within(dialog).getByLabelText("Name"), "Vollhausen");
    await nutzer.click(within(dialog).getByRole("button", { name: "Einsatz anlegen" }));
    const hinweis = await screen.findByRole("dialog", { name: "Sammlung nicht angelegt" });
    expect(hinweis.textContent).toMatch(/Speicher dieses Geräts ist voll/);
  });

  it("lässt die Auswahl beim Ablegen des eigenen Bogens offen und zeigt den Grund darin", async () => {
    einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Eigenhausen");
    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));
    sammlungenVoll();
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz-Sammlung ablegen…" }));
    const auswahl = document.querySelector<HTMLDialogElement>("dialog[aria-label='In Einsatz-Sammlung ablegen']")!;
    await nutzer.click(within(auswahl).getByRole("button", { name: "Sammelhausen" }));
    expect(auswahl.hasAttribute("open")).toBe(true);
    expect(within(auswahl).getByRole("alert").textContent).toMatch(/Speicher dieses Geräts ist voll/);
  }, 20000);

  /**
   * Audit Runde 3, R3-O2: Lesen braucht keinen Schreibzugriff. Auch wenn der
   * Kern beim Lesen bereinigen will (Papierkorb-Frist abgelaufen) und der
   * Speicher nichts annimmt, erscheinen Startseite und Sammlung samt Meldung.
   */
  it("zeigt Startseite und Sammlung, wenn der Speicher beim Lesen nichts annimmt", async () => {
    const alt = einsatzImSpeicherAnlegen("Altlast", EinsatzArt.EINSATZ);
    einsatzImSpeicherAnlegen("Lesehausen", EinsatzArt.EINSATZ);
    einsatzLoeschen(alt.id);
    const roh = JSON.parse(localStorage.getItem("eeb.einsaetze.v1")!) as { id: string; geloeschtAm?: number }[];
    roh.find((x) => x.id === alt.id)!.geloeschtAm = Date.now() - 40 * 86_400_000;
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify(roh));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("voll", "QuotaExceededError");
    });

    const nutzer = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
    expect(screen.getByText(/lässt die App gerade nichts speichern/)).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: /Öffnen/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Lesehausen" })).toBeDefined();
    expect(screen.getByText(/lässt die App gerade nichts speichern/)).toBeDefined();
  }, 20000);

  /**
   * Audit Runde 3, R3-E1: Frisches Gerät ohne Geräteschlüssel, Speicher voll.
   * QR-Code und PDF entstehen trotzdem (Siegel nur für diese Sitzung), und
   * nirgends steht Programmtext.
   */
  it("übergibt bei vollem Speicher ohne gespeicherten Geräteschlüssel mit Sitzungs-Siegel", async () => {
    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.startsWith("eeb.") && v.length > (this.getItem(k)?.length ?? 0)) {
        throw new DOMException(
          `Failed to execute 'setItem' on 'Storage': Setting the value of '${k}' exceeded the quota.`,
          "QuotaExceededError",
        );
      }
      return echt.call(this, k, v);
    });
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 5);
    expect(await screen.findByText(/Das Siegel gilt nur, solange diese Seite offen ist/)).toBeDefined();
    expect(localStorage.getItem("eeb.geraeteschluessel.v1")).toBeNull();

    await nutzer.click(screen.getByRole("button", { name: "Bogen übergeben…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Bogen übergeben']")!;
    const knopf = within(dialog).getByRole("button", { name: /QR-Code im Vollbild/ });
    await waitFor(() => expect(knopf).toHaveProperty("disabled", false));
    await nutzer.click(within(dialog).getByRole("button", { name: "PDF erzeugen" }));
    await waitFor(() => expect(pdfErzeugen).toHaveBeenCalled());
    expect(document.body.textContent).not.toMatch(/Failed to execute|quota/i);
    geraeteSchluesselLoeschen();
  }, 20000);

  /** Audit Runde 3, R3-O1: „Bögen einlesen…" nennt den vollen Speicher, nicht „nichts gefunden". */
  it("„Bögen einlesen…“ meldet den vollen Speicher statt „Keine Bögen gefunden“", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    await nutzer.type(within(dialog).getByLabelText("Name"), "Vollprobe");
    await nutzer.click(within(dialog).getByRole("button", { name: "Einsatz anlegen" }));
    await screen.findByRole("heading", { level: 1, name: "Vollprobe" });

    sammlungenVoll();
    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), [
      pdfDatei(bogenMitName("OV Voll A")),
      pdfDatei(bogenMitName("OV Voll B")),
    ]);
    const meldung = await screen.findByText(/Nicht aufgenommen: 2 Bögen — der Speicher dieses Geräts ist voll/);
    expect(meldung.textContent).toMatch(/die Datei selbst ist in Ordnung/);
    expect(screen.queryByText(/Keine Bögen in der Datei gefunden/)).toBeNull();
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(0);

    // Gegenprobe mit freiem Speicher: dieselbe Datei wird aufgenommen.
    vi.restoreAllMocks();
    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), [pdfDatei(bogenMitName("OV Voll A"))]);
    expect(await screen.findByText(/1 Bogen aufgenommen|1 Bögen aufgenommen|aufgenommen/)).toBeDefined();
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1);
    expect(screen.queryByText(/Nicht aufgenommen/)).toBeNull();
  }, 20000);

  it("öffnet einen empfangenen Bogen, der nicht abgelegt werden konnte, statt ihn zu verwerfen", async () => {
    einsatzImSpeicherAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    sammlungenVoll();
    fragmentSetzen(encodePayloadUrl(bogenMitName("Crailsheim"), browserKompressor));
    const empfang = await screen.findByRole("dialog", { name: /Meldung von „THW Crailsheim" empfangen/ });
    await nutzer.click(within(empfang).getByRole("button", { name: /In „Sammelhausen" aufnehmen/ }));

    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getByRole("alert").textContent).toMatch(/Nicht in die Sammlung aufgenommen/);
    expect(screen.getAllByText(/Crailsheim/).length).toBeGreaterThan(0);
  }, 20000);
});

/**
 * Was ein Scan meldet, der nicht lesbar war. Beim USB-Handscanner ist die
 * häufigste Ursache nicht der Bogen, sondern eine falsch eingestellte
 * Tastaturbelegung — dann muss die Meldung dorthin zeigen, nicht auf den Code.
 */
describe("Fehlertext eines nicht lesbaren Scans", () => {
  it("nennt die Tastaturbelegung, wenn unser Link ohne Raute ankommt", () => {
    const verstuemmelt = "https:--erfassungsbogen.app§EEBS.1.4.37766926.B.LMAD3A";

    const text = scanFehlertext(verstuemmelt);

    expect(text).toMatch(/Tastaturbelegung/);
    expect(text).toMatch(/Empfangen: „https:--erfassungsbogen/);
  });

  it("bleibt bei fremdem Inhalt bei der schlichten Meldung, zeigt aber das Empfangene", () => {
    const text = scanFehlertext("WIFI:S=Gastnetz;T=WPA;P=geheim;;");

    expect(text).toMatch(/keinen gültigen Erfassungsbogen/);
    expect(text).toMatch(/WIFI:S=Gastnetz/);
  });
});

/**
 * Der Handscanner am PC: Er tippt den Code als Tastenfolge. Steht er auf
 * US-Belegung (Werkseinstellung vieler Geräte), kommt der Code verdreht an —
 * die App muss ihn trotzdem lesen und sagen, woran es lag.
 */
describe("Handscanner in falscher Tastaturbelegung", () => {
  afterEach(() => localStorage.clear());

  it("liest einen verdreht getippten Bogen und nennt die Ursache", async () => {
    const nutzer = userEvent.setup();
    const bogen = neuerBogen();
    bogen.einheit.hierarchie[0]!.name = "Belegungshausen";
    const verdreht = [...encodePayloadUrl(bogen, browserKompressor)]
      .map((z) => (({ ":": "Ö", "/": "-", "#": "§", "-": "ß", "*": "(", y: "z", z: "y", Y: "Z", Z: "Y" }) as Record<string, string>)[z] ?? z)
      .join("");
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "QR-Code scannen…" }));
    await screen.findByRole("dialog", { name: "QR-Code scannen" });

    for (const zeichen of verdreht) fireEvent.keyDown(window, { key: zeichen });
    fireEvent.keyDown(window, { key: "Enter" });

    // Der Bogen ist da (Übersicht offen) — und die Meldung nennt die Ursache,
    // damit die Einstellung am Scanner nicht dauerhaft falsch bleibt.
    expect(await screen.findByText(/Tastaturbelegung \(US\)/)).toBeDefined();
    expect(screen.getByText("Gesamtübersicht")).toBeDefined();
  });
});

describe("Bogen aus einer PDF laden (Startseite, „Aus Datei laden“)", () => {
  beforeEach(() => {
    localStorage.clear();
    qrTexteAusPdf.mockReset();
    qrTexteAusPdf.mockResolvedValue([]);
  });

  it("öffnet den Bogen aus den eingebetteten Daten der PDF", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), pdfDatei(bogenMitName("OV Papier-PDF")));
    expect((await screen.findAllByText(/OV Papier-PDF/)).length).toBeGreaterThan(0);
    // Ohne eingebettete Daten wäre der QR-Weg dran gewesen — hier nicht nötig.
    expect(qrTexteAusPdf).not.toHaveBeenCalled();
  });

  it("wertet den QR-Code aus, wenn die PDF keine eingebetteten Daten trägt", async () => {
    qrTexteAusPdf.mockResolvedValue([encodePayloadUrl(bogenMitName("OV Nur-QR"), browserKompressor)]);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), pdfDatei());
    expect((await screen.findAllByText(/OV Nur-QR/)).length).toBeGreaterThan(0);
  });

  it("setzt einen mehrteiligen QR-Code aus derselben PDF wieder zusammen", async () => {
    const b = bogenMitName("OV Dreiteilig");
    qrTexteAusPdf.mockResolvedValue(segmentPayloadUrls(encodePayload(b, browserKompressor), 3));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), pdfDatei());
    expect((await screen.findAllByText(/OV Dreiteilig/)).length).toBeGreaterThan(0);
  });

  /**
   * Audit Runde 3, R3-E2: Die Rückfrage kam vor dem Lesen. Nach „Datei
   * öffnen" scheiterte die Datei, auf dem Rückholplatz lag eine Kopie des
   * offenen Bogens, der dort liegende war gelöscht.
   */
  it("liest die Datei vor der Rückfrage; eine unbrauchbare Datei lässt Arbeitsplatz und Rückholplatz unberührt (R3-E2)", async () => {
    const { entwurfZuJson } = await import("./entwurf");
    localStorage.setItem("eeb.entwurf.ersetzt.v1", entwurfZuJson(bogenMitName("Haßmersheim"), Date.now() - 60_000));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Bamberg");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    const kaputt = new File(['{"schemaVersion": 9, "einheit": {'], "abgeschnitten.json", { type: "application/json" });
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), kaputt);
    expect(await screen.findByText(/abgeschnitten\.json/)).toBeDefined();
    expect(document.querySelector("dialog[aria-label='Bogen aus Datei öffnen?']")).toBeNull();
    expect(localStorage.getItem("eeb.entwurf.v1")).toContain("Bamberg");
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Haßmersheim");

    // Eine lesbare Datei fragt danach wie gewohnt.
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), pdfDatei(bogenMitName("OV Papier-PDF")));
    const frage = await screen.findByRole("dialog", { name: "Bogen aus Datei öffnen?" });
    expect(frage.textContent).toContain("THW Haßmersheim");
  });

  it("erklärt verständlich, wenn in der PDF weder Daten noch ein QR-Code stecken", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), pdfDatei());
    expect(await screen.findByText(/kein Erfassungsbogen/i)).toBeTruthy();
  });
});

/**
 * Eine abgeschnittene Bogen-Datei auf allen drei Wegen: Jede Meldung kommt
 * ohne Programmtext aus und nennt den nächsten Schritt (Audit Runde 2, R2-E5).
 */
describe("Kaputte Datei auf allen Datei-Wegen", () => {
  beforeEach(() => {
    localStorage.clear();
    qrTexteAusPdf.mockReset();
    qrTexteAusPdf.mockResolvedValue([]);
  });

  function halbeDatei(): File {
    const text = JSON.stringify(bogenMitName("OV Abgeschnitten"));
    return new File([text.slice(0, Math.floor(text.length / 2))], "kaputt.json", { type: "application/json" });
  }

  it("„Aus Datei laden…“", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), halbeDatei());
    const meldung = await screen.findByText(/beschädigt oder unvollständig/);
    expect(meldung.textContent).toMatch(/neu anfordern oder den QR-Code/);
    expect(meldung.textContent).not.toMatch(/JSON|Unexpected/);
  });

  it("„Einsatz importieren…“", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.upload(screen.getByLabelText("Einsatz importieren…"), halbeDatei());
    const meldung = await screen.findByText(/beschädigt oder unvollständig/);
    expect(meldung.textContent).not.toMatch(/JSON|Unexpected/);
  });

  it("„Bögen einlesen…“ mit Liste und kaputter Datei zugleich", async () => {
    // Die Liste kommt am Dateifilter vorbei („Alle Dateien" im Auswahldialog).
    const nutzer = userEvent.setup({ applyAccept: false });
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    await nutzer.type(within(dialog).getByLabelText("Name"), "Dateiprobe");
    await nutzer.click(within(dialog).getByRole("button", { name: "Einsatz anlegen" }));
    await screen.findByRole("heading", { level: 1, name: "Dateiprobe" });

    const liste = new File(["Name;Vorname\nMüller;Anna\n"], "liste.csv", { type: "text/csv" });
    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), [halbeDatei(), liste]);

    const meldung = await screen.findByText(/beschädigt oder unvollständig/);
    expect(meldung.textContent).toMatch(/„liste.csv“ ist eine Tabelle oder Liste/);
    expect(meldung.textContent).not.toMatch(/JSON|Unexpected|token/);
  });
});

/**
 * Schichtübergabe in Gegenrichtung: Die Sammel-Datei von vor dem Entfernen
 * kommt zurück. Die vor Ort entfernte Einheit darf nicht still wieder in der
 * Lage stehen (Audit Runde 2, R2-D4).
 */
describe("Einsatz importieren: vor Ort entfernte Meldungen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function vorbereiten() {
    const s = einsatzImSpeicherAnlegen("Hochwasser Ulm", EinsatzArt.EINSATZ);
    const alb = meldungHinzufuegen(s.id, bogenMitName("OV Albstadt"))!;
    meldungHinzufuegen(s.id, bogenMitName("OV Crailsheim"));
    const datei = new File([einsatzDateiInhalt(einsaetzeLaden()[0]!)], "hochwasser.json", { type: "application/json" });
    einheitEntfernen(s.id, alb.eintrag.einheitSchluessel);
    return { id: s.id, albId: alb.eintrag.id, datei };
  }

  it("fragt, lässt die Meldung ohne Zustimmung draußen und sagt das", async () => {
    const { albId, datei } = vorbereiten();
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.upload(screen.getByLabelText("Einsatz importieren…"), datei);
    const frage = await screen.findByRole("dialog", { name: "Hier entfernte Meldungen in der Datei" });
    expect(within(frage).getByText(/„THW OV Albstadt“/)).toBeDefined();
    await nutzer.click(within(frage).getByRole("button", { name: "Draußen lassen" }));

    expect(await screen.findByText(/Hier entfernt und nicht wieder aufgenommen: „THW OV Albstadt“/)).toBeDefined();
    expect(einsaetzeLaden()[0]!.eintraege.map((e) => e.id)).not.toContain(albId);
  });

  it("nimmt sie auf ausdrücklichen Wunsch wieder auf", async () => {
    const { albId, datei } = vorbereiten();
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.upload(screen.getByLabelText("Einsatz importieren…"), datei);
    const frage = await screen.findByRole("dialog", { name: "Hier entfernte Meldungen in der Datei" });
    await nutzer.click(within(frage).getByRole("button", { name: "Wieder aufnehmen" }));

    expect(await screen.findByText(/Zuvor entfernt, wieder aufgenommen: „THW OV Albstadt“/)).toBeDefined();
    expect(einsaetzeLaden()[0]!.eintraege.map((e) => e.id)).toContain(albId);
  });
});

describe("Vorlage teilen (Karte in „Gespeicherte Vorlagen“)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("speichert die Vorlage als Datei, die sich auf der Startseite wieder einlesen lässt", async () => {
    vorlageAnlegen("FGr K Dateihausen", bogenMitName("OV Dateihausen"));
    const mitschnitt = downloadsMitschneiden();
    try {
      const nutzer = userEvent.setup();
      render(<App />);
      await nutzer.click(screen.getByRole("button", { name: "Teilen…" }));
      const dialog = await screen.findByRole("dialog", { name: "Vorlage teilen" });
      await nutzer.click(within(dialog).getByRole("button", { name: "Als Datei speichern" }));

      expect(mitschnitt.dateien.map((d) => d.name)).toEqual(["eeb-vorlage-FGr_K_Dateihausen.json"]);
      const datei = new File([await mitschnitt.dateien[0]!.blob.text()], "vorlage.json", { type: "application/json" });

      // Anderes Gerät: dort gibt es die Vorlage noch nicht.
      localStorage.clear();
      await nutzer.click(within(dialog).getByRole("button", { name: "Schließen" }));
      await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), datei);

      expect(await screen.findByText(/Vorlage „FGr K Dateihausen" importiert/)).toBeDefined();
      expect(vorlagenLaden().map((v) => v.name)).toEqual(["FGr K Dateihausen"]);
      // Eine Vorlage ersetzt keinen Arbeitsbogen — die Startseite bleibt stehen.
      expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
    } finally {
      mitschnitt.aufraeumen();
    }
  });

  it("gibt einen Link weiter, der auf dem Empfängergerät eine Vorlage anlegt", async () => {
    vorlageAnlegen("FGr K Linkhausen", bogenMitName("OV Linkhausen"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Teilen…" }));
    const dialog = await screen.findByRole("dialog", { name: "Vorlage teilen" });
    // Der QR-Code steht direkt im Dialog — der Nachbar scannt ihn ohne Umweg.
    expect(await within(dialog).findByRole("img", { name: /Vorlagen-QR-Code/ })).toBeDefined();

    await nutzer.click(within(dialog).getByRole("button", { name: "Link teilen" }));
    expect(await within(dialog).findByRole("button", { name: "Link kopiert ✓" })).toBeDefined();
    const link = await navigator.clipboard.readText();
    expect(fragmentInhalt(link).startsWith("V.")).toBe(true);

    localStorage.clear();
    await nutzer.click(within(dialog).getByRole("button", { name: "Schließen" }));
    fragmentSetzen(link);

    expect(await screen.findByText(/Vorlage .*OV Linkhausen.* importiert/)).toBeDefined();
    expect(vorlagenLaden()).toHaveLength(1);
  });
});

describe("Vorlage bearbeiten (Karte in „Gespeicherte Vorlagen“)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function rueckfrage(titel: string): HTMLDialogElement {
    return document.querySelector<HTMLDialogElement>(`dialog[aria-label='${titel}']`)!;
  }

  it("öffnet die Vorlage im Assistenten und schreibt „Vorlage aktualisieren“ in dieselbe Vorlage zurück", async () => {
    const v = vorlageAnlegen("FGr K Bearbeithausen", bogenMitName("OV Alt"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Bearbeiten" }));

    // Schritt 1 mit dem Stand der Vorlage; die Marke sagt, was hier geändert wird.
    const name = screen.getByLabelText("Name (Pflicht)") as HTMLInputElement;
    expect(name.value).toBe("OV Alt");
    expect(screen.getByText("Vorlage", { selector: ".modus-marke" })).toBeDefined();
    // Der Entwurf kennt die Vorlage — nach einem Neustart findet die App zu ihr zurück.
    await waitFor(() => expect(JSON.parse(localStorage.getItem("eeb.entwurf.v1")!).vorlageId).toBe(v.id));

    await nutzer.clear(name);
    await nutzer.type(name, "OV Neu");
    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));

    // Hauptaktion ist das Zurückschreiben; eine Kopie bleibt als Nebenweg möglich.
    expect(screen.getByRole("button", { name: "Als neue Vorlage speichern" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Als Vorlage speichern" })).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "Vorlage aktualisieren" }));
    // Rückfrage nennt die Änderung (R2-D2).
    const frage = rueckfrage('Vorlage „FGr K Bearbeithausen" überschreiben?');
    await nutzer.click(within(frage).getByRole("button", { name: "Vorlage aktualisieren" }));

    expect(await screen.findByText(/Vorlage „FGr K Bearbeithausen" aktualisiert/)).toBeDefined();
    const vorlagen = vorlagenLaden();
    expect(vorlagen).toHaveLength(1); // geändert, nicht verdoppelt
    expect(vorlagen[0]!.id).toBe(v.id);
    expect(vorlagen[0]!.bogen.einheit.hierarchie[0]!.name).toBe("OV Neu");
    // Der Arbeitsplatz ist geräumt: kein liegengebliebener Entwurf der Vorlage.
    expect(localStorage.getItem("eeb.entwurf.v1")).toBeNull();
    expect(screen.getByRole("heading", { name: "Gespeicherte Vorlagen" })).toBeDefined();

    // „Rückgängig" holt die vorige Fassung zurück.
    await nutzer.click(screen.getByRole("button", { name: "Rückgängig" }));
    expect(vorlagenLaden()[0]!.bogen.einheit.hierarchie[0]!.name).toBe("OV Alt");
  });

  it("fragt vor dem Bearbeiten, wenn ein angefangener Bogen offen ist, und löst danach die Verbindung zur Vorlage", async () => {
    vorlageAnlegen("FGr K Wächterhausen", bogenMitName("OV Vorlage"));
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Angefangenhausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    await nutzer.click(screen.getByRole("button", { name: "Bearbeiten" }));
    await nutzer.click(within(rueckfrage("Vorlage bearbeiten?")).getByRole("button", { name: "Vorlage bearbeiten" }));
    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("OV Vorlage");

    // Ein neuer Bogen an dieser Stelle ist kein Vorlagen-Bogen mehr.
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.click(within(rueckfrage("Neuen Bogen anfangen?")).getByRole("button", { name: "Neu anfangen" }));
    expect(screen.queryByText("Vorlage", { selector: ".modus-marke" })).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));
    expect(screen.getByRole("button", { name: "Als Vorlage speichern" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Vorlage aktualisieren" })).toBeNull();
    // Die unveränderte Vorlagen-Kopie hat den eigenen Bogen nicht vom Rückholplatz geschoben (R3-D1).
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Angefangenhausen");
  });

  /**
   * Audit Runde 3, R3-D1: Vorlage bearbeiten, zurück zur Startseite,
   * „Verwerfen" — auf dem Rückholplatz lag danach die unveränderte
   * Vorlagen-Kopie, der echte Einsatzbogen war gelöscht.
   */
  it("beendet mit „Verwerfen“ nur die Vorlagen-Bearbeitung; der eigene Bogen bleibt zurückholbar (R3-D1)", async () => {
    const v = vorlageAnlegen("OV Ulm B", bogenMitName("Ulm"));
    const vorlageVorher = JSON.stringify(vorlagenLaden().find((x) => x.id === v.id)!.bogen);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Ulm");
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    await nutzer.type(document.getElementById("feld-ort-auftrag")!, "ECHTER EINSATZ Deichsicherung");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    await nutzer.click(screen.getByRole("button", { name: "Bearbeiten" }));
    await nutzer.click(within(rueckfrage("Vorlage bearbeiten?")).getByRole("button", { name: "Vorlage bearbeiten" }));
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    // Die Karte ist als Vorlagen-Bearbeitung erkennbar.
    expect(screen.getByText(/Bearbeitung der Vorlage „OV Ulm B"/)).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "Verwerfen" }));
    const frage = rueckfrage("Bearbeitung der Vorlage beenden?");
    expect(frage.textContent).toContain("bleibt unverändert gespeichert");
    expect(frage.textContent).toContain("ECHTER EINSATZ Deichsicherung");
    await nutzer.click(within(frage).getByRole("button", { name: "Bearbeitung beenden" }));

    const rueck = localStorage.getItem("eeb.entwurf.ersetzt.v1") ?? "";
    expect(rueck).toContain("ECHTER EINSATZ Deichsicherung");
    expect(JSON.stringify(vorlagenLaden().find((x) => x.id === v.id)!.bogen)).toBe(vorlageVorher);
    await nutzer.click(screen.getByRole("button", { name: "Zuletzt verdrängten Bogen zurückholen" }));
    expect((await screen.findAllByText(/ECHTER EINSATZ Deichsicherung/)).length).toBeGreaterThan(0);
  }, 20000);
});

describe("Bögen aus einer PDF in einen Einsatz übernehmen", () => {
  beforeEach(() => {
    localStorage.clear();
    qrTexteAusPdf.mockReset();
    qrTexteAusPdf.mockResolvedValue([]);
  });

  /** Anlege-Dialog des Einsatzes ausfüllen (dieselben Felder wie „Neue Einsatz-Sammlung…"). */
  async function einsatzAnlegen(nutzer: ReturnType<typeof userEvent.setup>, name: string) {
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    await nutzer.type(within(dialog).getByLabelText("Name"), name);
    await nutzer.click(within(dialog).getByRole("button", { name: "Einsatz anlegen" }));
  }

  it("legt aus den QR-Codes einer PDF ohne Sammlung einen neuen Einsatz an", async () => {
    qrTexteAusPdf.mockResolvedValue([
      encodePayloadUrl(bogenMitName("OV Erster"), browserKompressor),
      encodePayloadUrl(bogenMitName("OV Zweiter"), browserKompressor),
    ]);
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.upload(screen.getByLabelText("Einsatz importieren…"), pdfDatei());
    // Erst die Rückfrage („keine Sammlung — neuen Einsatz anlegen?"), dann der
    // gewohnte Anlege-Dialog.
    const frage = await screen.findByRole("dialog", { name: "Keine Einsatz-Sammlung in der Datei" });
    expect(within(frage).getByText(/2 Bogen\/Bögen/)).toBeTruthy();
    await nutzer.click(within(frage).getByRole("button", { name: "Einsatz anlegen" }));
    await einsatzAnlegen(nutzer, "Hochwasser Weser");

    expect(await screen.findByRole("heading", { level: 1, name: "Hochwasser Weser" })).toBeTruthy();
    expect((await screen.findAllByText(/OV Erster/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/OV Zweiter/)).length).toBeGreaterThan(0);
  });

  it("nimmt eine PDF ohne eingebettete Daten über ihren QR-Code in den offenen Einsatz auf", async () => {
    qrTexteAusPdf.mockResolvedValue([encodePayloadUrl(bogenMitName("OV Nachzügler"), browserKompressor)]);
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    await einsatzAnlegen(nutzer, "Sturmflut");
    await screen.findByRole("heading", { level: 1, name: "Sturmflut" });

    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), pdfDatei());

    expect((await screen.findAllByText(/OV Nachzügler/)).length).toBeGreaterThan(0);
  });

  /**
   * R2-W6: Derselbe Bogen kam per Link „✓ signiert" an, als PDF nur ohne
   * Signatur. Das Siegel steht im QR-Code auf der letzten Seite der PDF.
   */
  it("liest beim PDF-Import das Siegel aus dem QR-Code der PDF mit", async () => {
    const b = bogenMitName("OV Signiert");
    const paar = await schluesselpaarErzeugen();
    qrTexteAusPdf.mockResolvedValue([await encodeSigniertPayloadUrl(b, browserKompressor, paar.privat)]);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    await einsatzAnlegen(nutzer, "Siegelprobe");
    await screen.findByRole("heading", { level: 1, name: "Siegelprobe" });

    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), pdfDatei(b));

    expect((await screen.findAllByText(/OV Signiert/)).length).toBeGreaterThan(0);
    const eintrag = einsaetzeLaden().find((e) => e.name === "Siegelprobe")!.eintraege[0]!;
    expect(eintrag.signatur?.zustand).toBe("gueltig");
    expect(eintrag.herkunft).toBeTruthy();
  });

  it("bleibt beim eingebetteten Bogen ohne Siegel, wenn der QR zu einer anderen Fassung gehört", async () => {
    const b = bogenMitName("OV Fassung");
    const anders = { ...b, stand: b.stand - 60 };
    const paar = await schluesselpaarErzeugen();
    qrTexteAusPdf.mockResolvedValue([await encodeSigniertPayloadUrl(anders, browserKompressor, paar.privat)]);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neue Einsatz-Sammlung…" }));
    await einsatzAnlegen(nutzer, "Fassungsprobe");
    await screen.findByRole("heading", { level: 1, name: "Fassungsprobe" });

    await nutzer.upload(screen.getByLabelText("Dateien wählen…"), pdfDatei(b));

    expect((await screen.findAllByText(/OV Fassung/)).length).toBeGreaterThan(0);
    const eintrag = einsaetzeLaden().find((e) => e.name === "Fassungsprobe")!.eintraege[0]!;
    expect(eintrag.signatur?.zustand ?? "unsigniert").toBe("unsigniert");
    expect(eintrag.bogen.stand).toBe(b.stand);
  });

  it("meldet verständlich, wenn in der PDF gar nichts Lesbares steckt", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.upload(screen.getByLabelText("Einsatz importieren…"), pdfDatei());
    expect(await screen.findByText(/weder eine Einsatz-Sammlung noch ein einzelner Bogen/)).toBeTruthy();
  });
});
