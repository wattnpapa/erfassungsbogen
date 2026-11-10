/**
 * Durchlauf durch den Assistenten — der Weg, den jeder Nutzer nimmt und den
 * jede Änderung an Schritten, Navigation oder Übersicht berühren kann:
 * Startseite → Schritt 1 → alle Schritte → Übersicht → Bogen übergeben.
 */

import { MELDEKOPF_URL, RUECK_SCHLUESSEL } from "./meldekopf-app";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, type Erfassungsbogen } from "@bos/eeb-format/model";
import { decodePayloadUrl, encodePayload, encodePayloadUrl, encodeVorlagePayloadUrl, fragmentInhalt, segmentPayloadUrls } from "@bos/eeb-format/codec";
import { browserKompressor, neuePerson, neuerBogen } from "./hilfen";
import { geraeteSchluesselLoeschen } from "./geraete-schluessel";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";
import { dialogeZuruecksetzen, frageJaNein } from "./dialoge";
import { vorlageAnlegen, vorlagenLaden } from "./vorlagen";
// `einsatzAnlegen` heißt in diesem Test schon ein Klick-Helfer (Dialog
// ausfüllen); der Speicher-Weg kommt darum unter eigenem Namen herein.
import { EinsatzArt, einsatzAnlegen as einsatzImSpeicherAnlegen } from "@bos/meldekopf/einsaetze";

// Die PDF-Erzeugung (pdfmake) ist eigenständig getestet und im Test nur teuer;
// hier zählt, dass der Weg dorthin funktioniert und der Bogen ankommt.
const pdfErzeugen = vi.fn<(bogen: Erfassungsbogen, name?: string) => Promise<void>>(async () => {});
const blankoErzeugen = vi.fn<() => Promise<boolean>>(async () => true);
vi.mock("./pdf", () => ({
  pdfErzeugen: (bogen: Erfassungsbogen, name?: string) => pdfErzeugen(bogen, name),
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => {},
  blankoPdfErzeugen: async () => blankoErzeugen(),
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
    vi.useRealTimers();
  });

  it("startet auf der Startseite und öffnet mit „Neuen Bogen erstellen“ Schritt 1", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Digitaler Einheiten-Erfassungsbogen" })).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    expect(screen.getByRole("heading", { name: "1. Einheit" })).toBeDefined();
  });

  /**
   * Audit Runde 4, R4-S2/R4-S3: Nach „Weiter →" liegt dort wieder „Weiter →",
   * nach „Neuen Bogen erstellen" das „◐". Ein zögernder zweiter Tipp an
   * derselben Stelle übersprang Schritt 2 bzw. öffnete das Darstellungsmenü.
   * Nach jedem Ansichtswechsel nimmt die Fingerstelle 1,5 s nichts an.
   */
  it("sperrt nach einem Ansichtswechsel die Fingerstelle — ein Doppeltipp auf „Weiter →“ überspringt keinen Schritt (R4-S2)", async () => {
    tippSchutzZuruecksetzen();
    render(<App />);
    const tipp = (el: HTMLElement) =>
      act(() => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 300, clientY: 600, detail: 1 }));
      });
    // Uhr ab dem ersten Tipp anhalten: Die Sperre rechnet mit Date.now(), und
    // das Nachladen von Schritt 1 dauerte auf dem ausgelasteten CI-Rechner
    // länger als die Sperre selbst — der zweite Tipp kam dann „zu spät" durch.
    // Nur Date ist gefälscht; findByRole wartet weiter mit echten Timern.
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() });
    try {
      tipp(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
      await screen.findByRole("heading", { level: 2, name: "1. Einheit" });
      tipp(screen.getByRole("button", { name: "Weiter →" })); // der zweite Tipp des Doppeltipps
      expect(screen.getByRole("heading", { level: 2, name: "1. Einheit" })).toBeDefined();
      vi.setSystemTime(Date.now() + 1600);
      tipp(screen.getByRole("button", { name: "Weiter →" })); // bewusst, nach der Sperre
      expect(screen.getByRole("heading", { level: 2, name: "2. Einsatz" })).toBeDefined();
      vi.setSystemTime(Date.now() + 200);
      tipp(screen.getByRole("button", { name: "Weiter →" })); // Doppeltipp mit 200 ms
      expect(screen.getByRole("heading", { level: 2, name: "2. Einsatz" })).toBeDefined();
      // R17-G11, R18-G3: Die Sperre nach „Weiter →“ dauert 0,3 s (vorher 0,5 s, davor 0,9 s): Wer im Takt von 0,4 s durch leere
      // Schritte blättert, kommt mit jedem Tipp weiter; der Doppeltipp mit Handschuh (0,1 bis 0,2 s) bleibt gesperrt.
      vi.setSystemTime(Date.now() + 400);
      tipp(screen.getByRole("button", { name: "Weiter →" }));
      expect(screen.getByRole("heading", { level: 2, name: "3. Personal" })).toBeDefined();
    } finally {
      vi.useRealTimers();
      tippSchutzZuruecksetzen();
    }
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
      await nutzer.click(screen.getByRole("button", { name: "Einsatz vorbereiten" }));
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

  /**
   * R4-W8: Wer bei „Einsatz vorbereiten" abgewählt wurde und später doch kommt,
   * wird im Personalschritt mit einem Tipp ergänzt statt neu eingegeben.
   */
  it("ergänzt eine abgewählte Person aus der Vorlage im Personalschritt (R4-W8)", async () => {
    const b = bogenMitName("OV Nachzugshausen");
    b.personal = ["Berger", "Ahlers", "Voss"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
    vorlageAnlegen("FGr Nachzugshausen", b);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz vorbereiten" }));
    await nutzer.click(screen.getByRole("checkbox", { name: /Voss/ }));
    await nutzer.click(screen.getByRole("button", { name: /^Bogen anlegen/ }));
    // Vom Einsatz-Schritt weiter zum Personal.
    await nutzer.click(await screen.findByRole("button", { name: /Weiter →/ }));
    const knopf = await screen.findByRole("button", { name: /^Aus der Vorlage ergänzen… \(1\)$/ });
    expect(screen.queryByDisplayValue("Voss")).toBeNull();
    await nutzer.click(knopf);
    const wahl = await screen.findByRole("dialog", { name: "Aus der Vorlage ergänzen" });
    await nutzer.click(within(wahl).getByRole("button", { name: /Voss/ }));
    expect((await screen.findAllByDisplayValue("Voss")).length).toBeGreaterThan(0);
    // Wer da ist, wird nicht noch einmal angeboten.
    expect(screen.queryByRole("button", { name: /^Aus der Vorlage ergänzen…/ })).toBeNull();
  });

  /**
   * Audit Runde 3, R3-H5: Die Vorlagen standen unter dem Meldekopf-Block,
   * 1,7 Bildschirme tief. Jetzt bietet „Meinen Bogen ausfüllen" sie zuerst
   * an — die Standard-Vorlage vorn.
   */
  it("bietet gespeicherte Vorlagen in „Meinen Bogen ausfüllen“ an, die Standard-Vorlage zuerst (R3-H5)", async () => {
    vorlageAnlegen("B Nebenhausen", bogenMitName("OV Nebenhausen"));
    const standard = vorlageAnlegen("FGr Haupthausen", bogenMitName("OV Haupthausen"));
    const alle = JSON.parse(localStorage.getItem("eeb.vorlagen.v1")!) as { id: string; standard?: boolean }[];
    localStorage.setItem("eeb.vorlagen.v1", JSON.stringify(alle.map((v) => ({ ...v, standard: v.id === standard.id }))));
    const nutzer = userEvent.setup();
    render(<App />);
    const eigener = screen.getByRole("region", { name: "Meinen Bogen ausfüllen" });
    const knoepfe = within(eigener).getAllByRole("button").map((b) => b.textContent);
    expect(knoepfe.slice(0, 3)).toEqual([
      "Einsatz vorbereiten: FGr Haupthausen",
      "Einsatz vorbereiten: B Nebenhausen",
      "Neuen Bogen erstellen",
    ]);
    await nutzer.click(within(eigener).getByRole("button", { name: "Einsatz vorbereiten: FGr Haupthausen" }));
    expect(screen.getByRole("heading", { level: 1, name: "FGr Haupthausen" })).toBeDefined();
  });

  it("bietet den Blanko-Vordruck schon auf der Startseite an, mit einem Tipp (R4-A8)", async () => {
    blankoErzeugen.mockClear();
    const nutzer = userEvent.setup();
    render(<App />);
    const eigener = screen.getByRole("region", { name: "Meinen Bogen ausfüllen" });
    await nutzer.click(within(eigener).getByRole("button", { name: /^Leeren Vordruck drucken \(PDF\)/ }));
    await waitFor(() => expect(blankoErzeugen).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Blanko-Vordruck erzeugt/)).toBeDefined();
  });

  it("springt vom offenen Punkt ins Feld und setzt den Cursor (R2-H2)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Punkthausen");
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

  it("führt Schritt für Schritt bis zur Übersicht und zeigt die erfasste Einheit", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Musterhausen");

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
    await nutzer.click(screen.getByRole("button", { name: /Der Ort der Einheit/ }));

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

    // Erst ein Bild für „wird erstellt…", dann die Arbeit (arbeitet.ts, R5-O3).
    await waitFor(() => expect(pdfErzeugen).toHaveBeenCalledTimes(1));
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

  it("gibt den Bogen an die Meldekopf-App: Link mit demselben Bogen im Fragment", async () => {
    const nutzer = userEvent.setup();
    sessionStorage.removeItem(RUECK_SCHLUESSEL);
    const dialog = await uebergabeDialog(nutzer);
    const link = await within(dialog).findByRole("link", { name: "An Meldekopf-App geben ↗" });
    const href = link.getAttribute("href")!;
    expect(href.startsWith(MELDEKOPF_URL + "#")).toBe(true);
    expect(decodePayloadUrl(href, browserKompressor).einheit.organisation).toBe(OrganisationsTyp.THW);
    expect(link.getAttribute("target")).toBe("_blank");
    // Ohne Rücksprung bleibt der QR-Code der Hauptweg.
    expect(link.className).not.toContain("primaer");
    expect(within(dialog).getByRole("button", { name: "QR-Code im Vollbild zeigen" }).className).toContain("primaer");
  });

  it("stellt den Rückweg vorn als Hauptknopf auf, wenn der Bogen aus der Meldekopf-App kam (?rueck=meldekopf)", async () => {
    const nutzer = userEvent.setup();
    sessionStorage.setItem(RUECK_SCHLUESSEL, "1");
    try {
      const dialog = await uebergabeDialog(nutzer);
      const link = await within(dialog).findByRole("link", { name: "An Meldekopf-App geben ↗" });
      expect(link.className).toContain("primaer");
      const qrKnopf = within(dialog).getByRole("button", { name: "QR-Code im Vollbild zeigen" });
      expect(qrKnopf.className).not.toContain("primaer");
      expect(link.compareDocumentPosition(qrKnopf) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(within(dialog).getByText(/Zurück an den Meldekopf/)).toBeDefined();
    } finally {
      sessionStorage.removeItem(RUECK_SCHLUESSEL);
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
  /** Audit Runde 5, R5-D5: Der Name stand im Satz zweimal hintereinander. */
  it("nennt den Namen in der Rückfrage zu „Verwerfen“ nur einmal (R5-D5)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Doppelhausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" })); // R18-N6: ein Name für „Verwerfen" und „Bogen schließen"
    const text = rueckfrage("Angefangenen Bogen schließen?").textContent!;
    expect(text.split("Doppelhausen")).toHaveLength(2);
    expect(text).toContain('Der Stand bleibt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen" erreichbar');
  });

  it("verwirft den Bogen auf der Übersicht erst nach Rückfrage und beginnt neu", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Wegwerfhausen");
    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));

    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    // Die Rückfrage sagt, was tatsächlich geschieht: geschlossen, nicht
    // gelöscht, und wo der Bogen danach liegt (Audit Runde 2, R2-H9).
    expect(rueckfrage("Bogen schließen?").textContent).toContain("geschlossen, nicht gelöscht");
    expect(rueckfrage("Bogen schließen?").textContent).toContain("Zuletzt geschlossenen Bogen zurückholen");
    expect(rueckfrage("Bogen schließen?").textContent).not.toContain("Entwurf gelöscht");
    await nutzer.click(within(rueckfrage("Bogen schließen?")).getByRole("button", { name: "Abbrechen" }));

    // Abgebrochen: derselbe Bogen steht noch da.
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getAllByText(/Wegwerfhausen/).length).toBeGreaterThan(0);

    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    await nutzer.click(
      within(rueckfrage("Bogen schließen?")).getByRole("button", { name: "Schließen, zur Startseite" }),
    );

    // Verworfen heißt: kein offener Bogen mehr — die App steht wieder am
    // Anfang, der Entwurf ist nicht als „Fortsetzen" übrig. Verloren ist er
    // aber nicht: er liegt in der Rückholung (Audit „Zerstörende
    // Handlungen", D7).
    expect(screen.getByRole("heading", { name: "Digitaler Einheiten-Erfassungsbogen" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Fortsetzen" })).toBeNull();
    expect(screen.getByRole("button", { name: "Zuletzt geschlossenen Bogen zurückholen" })).toBeDefined();
  });

  it("wirft den angefangenen Bogen von der Startseite aus weg — nach Rückfrage", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Entwurfshausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    // Der Entwurf steht auf der Startseite zum Fortsetzen bereit.
    expect(screen.getByText(/Entwurfshausen/)).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    await nutzer.click(within(rueckfrage("Angefangenen Bogen schließen?")).getByRole("button", { name: "Abbrechen" }));

    expect(screen.getByText(/Entwurfshausen/)).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    await nutzer.click(within(rueckfrage("Angefangenen Bogen schließen?")).getByRole("button", { name: "Bogen schließen" }));

    expect(screen.getByText("Angefangener Bogen geschlossen — Rückholung oben auf der Startseite.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Fortsetzen" })).toBeNull();

    // Die Rückholung bringt ihn zurück (D7).
    await nutzer.click(screen.getByRole("button", { name: "Zuletzt geschlossenen Bogen zurückholen" }));
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getAllByText(/Entwurfshausen/).length).toBeGreaterThan(0);
  });

  it("fragt vor dem Ersetzen des angefangenen Bogens und holt ihn danach zurück", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Verdrängthausen");
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
    const zurueck = screen.getByRole("button", { name: "Zuletzt geschlossenen Bogen zurückholen" });
    expect(screen.getByText(/Verdrängthausen/)).toBeDefined();

    await nutzer.click(zurueck);
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getAllByText(/Verdrängthausen/).length).toBeGreaterThan(0);
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
    // R7-G2: erst die Rückfrage mit den Feldern, die zurückgesetzt werden; „Abbrechen" ändert nichts.
    const frage = await screen.findByRole("dialog", { name: "Für neuen Einsatz vorbereiten?" });
    expect(frage.textContent).toContain("Gebäudeschaden Ulm");
    expect(frage.textContent).toContain("Personal und Fahrzeuge bleiben");
    await nutzer.click(within(frage).getByRole("button", { name: "Zurücksetzen" }));
    expect(await screen.findByRole("heading", { level: 2, name: "2. Einsatz" })).toBeDefined();
    expect(screen.getByText(/Einsatzdaten für den neuen Einsatz zurückgesetzt/)).toBeDefined();
    expect(screen.queryByText(/ist vorbei — gilt dieser Bogen noch/)).toBeNull();
    // R16-E2: Quittung mit „Rückgängig", das den Ort/Auftrag wiederbringt und auch das Neuladen übersteht.
    expect(screen.queryByDisplayValue("Gebäudeschaden Ulm")).toBeNull();
    expect(sessionStorage.getItem("eeb.einsatz.rueckweg")).toContain("Gebäudeschaden Ulm");
    await nutzer.click(await screen.findByRole("button", { name: /Rückgängig — Zeitraum, Ort\/Auftrag und Sofortbedarf/ }));
    expect(await screen.findByDisplayValue("Gebäudeschaden Ulm")).toBeDefined();
    expect(sessionStorage.getItem("eeb.einsatz.rueckweg")).toBeNull();
    expect(screen.queryByRole("button", { name: /Rückgängig — Zeitraum, Ort\/Auftrag/ })).toBeNull();
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
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "TabB");

    expect(localStorage.getItem("eeb.entwurf.v1")).toContain("TabB");
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("TabA");
  }, 20000);

  // Audit Runde 7, R7-D1: „Alle Daten löschen" im anderen Fenster – dieses zeigte die Entwurfskarte weiter
  // und schrieb den gelöschten Bogen über „Neu anfangen" auf den Rückholplatz zurück.
  it("legt einen im anderen Fenster gelöschten Bogen nicht auf den Rückholplatz zurück (R7-D1)", async () => {
    const nutzer = userEvent.setup();
    const { entwurfZuJson } = await import("./entwurf");
    localStorage.setItem("eeb.entwurf.v1", entwurfZuJson(bogenMitName("Geloescht"), Date.now() - 60_000));
    vi.resetModules();
    const { App: AppNeu } = await import("./app");
    render(<AppNeu />);
    await screen.findByRole("button", { name: "Fortsetzen" });
    // Das andere Fenster löscht alles.
    localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    const frage = await screen.findByRole("dialog", { name: "Neuen Bogen anfangen?" });
    // Die Frage verspricht keinen Rückholplatz, den es nicht geben wird.
    expect(frage.textContent).toContain("in einem anderen Fenster gelöscht");
    expect(frage.textContent).not.toContain("Zuletzt geschlossenen Bogen zurückholen");
    await nutzer.click(within(frage).getByRole("button", { name: "Neu anfangen" }));

    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toBeNull();
    expect(JSON.stringify(Object.values(localStorage))).not.toContain("Geloescht");
  }, 20000);

  // Audit Runde 7, R7-D3: Es gibt nur einen Rückholplatz — die Frage nennt den Verlust vor der Zusage.
  it("nennt in der Rückfrage zuerst, dass der beiseitegelegte Bogen wegfällt (R7-D3)", async () => {
    const nutzer = userEvent.setup();
    const { entwurfZuJson } = await import("./entwurf");
    localStorage.setItem("eeb.entwurf.v1", entwurfZuJson(bogenMitName("Zweiter"), Date.now() - 60_000));
    localStorage.setItem("eeb.entwurf.ersetzt.v1", entwurfZuJson(bogenMitName("Eigener"), Date.now() - 120_000));
    vi.resetModules();
    const { App: AppNeu } = await import("./app");
    render(<AppNeu />);
    await nutzer.click(await screen.findByRole("button", { name: "Neuen Bogen erstellen" }));
    const frage = await screen.findByRole("dialog", { name: "Neuen Bogen anfangen?" });
    const text = frage.textContent!;
    expect(text).toContain("fasst nur einen Bogen");
    expect(text.indexOf("THW Eigener")).toBeLessThan(text.indexOf("Zuletzt geschlossenen Bogen zurückholen"));
    expect(text).toContain("endgültig gelöscht");
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Eigener");
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
    expect(screen.getByLabelText("Ort der Einheit (Pflicht)")).toBeDefined();
  }, 20000);

  // Audit Runde 2, R2-H5: „Neuen Bogen erstellen" legte keinen
  // Verlaufseintrag an — Zurück aus Schritt 1 verließ die App.
  it("führt mit Zurück aus Schritt 1 auf die Startseite", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    const laenge = history.length;
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    expect(screen.getByLabelText("Ort der Einheit (Pflicht)")).toBeDefined();
    expect(history.length).toBe(laenge + 1);
    act(() => { history.back(); });
    await waitFor(() => expect(screen.queryByLabelText("Ort der Einheit (Pflicht)")).toBeNull());
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
  });

  // Audit Runde 11, R11-E8: Nach dem Neuladen trägt der Verlauf die Schritte der Zeit davor weiter;
  // Zurück von der Startseite zeigte zweimal dieselbe Startseite. Einträge fremder Kennung werden übersprungen.
  it("überspringt beim Zurück den Verlaufsrest vor dem Neuladen (R11-E8)", async () => {
    const alt = (schritt: number) => ({ eeb: { schritt, zeigeStart: false, einsatz: null, scanner: false, lauf: "alter-aufruf" } });
    history.replaceState(alt(1), "");
    history.pushState(alt(2), "");
    render(<App />);
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
    const zurueck = vi.spyOn(history, "back");
    try {
      act(() => { history.back(); });
      // Das eigene Zurück (1) trifft den fremden Eintrag; die App löst ein weiteres aus (2).
      await waitFor(() => expect(zurueck.mock.calls.length).toBeGreaterThanOrEqual(2));
      expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
    } finally {
      zurueck.mockRestore();
    }
  });

  // Audit Runde 4, R4-S1: Zurück bei offener Rückfrage wechselte die Ansicht
  // dahinter, die Rückfrage blieb über der Startseite stehen und wirkte von
  // dort. Jetzt ist Zurück ihr „Abbrechen", die Ansicht bleibt.
  it("schließt mit Zurück eine offene Rückfrage als „Abbrechen“ und bleibt in der Ansicht (R4-S1)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    const laenge = history.length;
    let antwort: Promise<boolean> | null = null;
    act(() => {
      antwort = frageJaNein({ titel: "Person entfernen?", text: "?", ok: "Person entfernen", gefahr: true });
    });
    await screen.findByRole("dialog", { name: "Person entfernen?" });
    act(() => { history.back(); });
    await expect(antwort).resolves.toBe(false);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Person entfernen?" })).toBeNull());
    expect(screen.getByRole("heading", { level: 2, name: "1. Einheit" })).toBeDefined();
    // Der verbrauchte Eintrag ist neu angelegt: Das nächste Zurück führt zur Startseite.
    expect(history.length).toBe(laenge);
    act(() => { history.back(); });
    await waitFor(() => expect(screen.queryByLabelText("Ort der Einheit (Pflicht)")).toBeNull());
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
    expect(within(vollbild).getByText(/\(F \/ UF \/ M \/\/ Ges\) · Stand \d\d:\d\d Uhr/)).toBeDefined();
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
    // Seit R3-H3 fragt Schließen, ob gescannt wurde.
    await nutzer.click(within(vollbild).getByRole("button", { name: "Nicht sicher" }));
    await waitFor(() => expect((history.state as { eebEbene?: string } | null)?.eebEbene).toBeUndefined());
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    // Vermerkt ist, was die App weiß — nicht „Übergeben" (R3-H3).
    expect(screen.getByText(/^QR-Code gezeigt .* — Empfang nicht bestätigt\.$/)).toBeDefined();
    expect(screen.queryByText(/^Übergeben/)).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "Gegenstelle hat ihn — als übergeben vermerken" }));
    expect(screen.getByText(/^✓ Übergeben .* \(bestätigt\) — seitdem unverändert\.$/)).toBeDefined();
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

    // Scheitert ein Schritt, muss fetch trotzdem zurück — sonst liefert die
    // Attrappe auch den folgenden Tests nur noch diesen Bogen.
    try {
      render(<App />);
      await neuerBogenBis(nutzer, 0);
      await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Eigenhausen");
      await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

      // Über den Einstieg auf der Startseite unter „So funktioniert's". Der Dialog
      // ist ein eigener, nachgeladener Baustein (beispiele-dialog.tsx), daher die Frist.
      await nutzer.click(screen.getByRole("button", { name: "Beispielbögen ansehen" }));
      const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" }, { timeout: 15000 });
      // Erst den Ordner der eigenen Organisation, dann stehen die Bögen da. Die
      // Angaben je Bogen laden nach — die Frist deckt das mit ab.
      await nutzer.click(within(dialog).getByRole("button", { name: /^THW/ }));
      const anzeigen = await within(dialog).findAllByRole("button", { name: "Anzeigen" }, { timeout: 15000 });
      await nutzer.click(anzeigen[0]!);

      // Die Rückfrage zeichnet die Dialogschicht einen Tick später.
      const frage = await screen.findByRole("dialog", { name: "Beispielbogen öffnen?" });
      return { dialog, frage, fetchZurueck };
    } catch (e) {
      fetchZurueck();
      throw e;
    }
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

  /**
   * Prüfrunde Beispielbögen (BB-D1, BB-W1, BB-E2, BB-H1, BB-N1): Ein zweites
   * „Anzeigen" schob das unveränderte erste Beispiel auf den einzigen
   * Rückholplatz und bot an, den eigenen Bogen „endgültig" zu löschen.
   */
  it("ersetzt ein unverändertes Beispiel ohne Rückfrage — der eigene Bogen bleibt zurückholbar", async () => {
    const nutzer = userEvent.setup();
    const { frage, fetchZurueck } = await beispielAnzeigen(nutzer);
    try {
      await nutzer.click(within(frage).getByRole("button", { name: "Beispielbogen öffnen" }));
      expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();

      await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
      await nutzer.click(screen.getByRole("button", { name: "Beispielbögen ansehen" }));
      const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" }, { timeout: 15000 });
      // Der Dialog steht wieder im zuletzt offenen Ordner (BB-S3, BB-W3) — kein zweites „THW".
      expect(within(dialog).getByText("THW", { selector: "[aria-current]" })).toBeDefined();
      const anzeigen = await within(dialog).findAllByRole("button", { name: "Anzeigen" }, { timeout: 15000 });
      await nutzer.click(anzeigen[1]!);

      expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
      expect(screen.queryByRole("dialog", { name: "Beispielbogen öffnen?" })).toBeNull();
      // Der eigene Bogen liegt weiter auf dem Rückholplatz.
      expect(screen.getAllByText(/Dein eigener Bogen .*Eigenhausen.* liegt auf der Startseite/).length).toBeGreaterThan(0);
    } finally {
      fetchZurueck();
    }
  }, 30000);

  /** Prüfrunde Beispielbögen, Runde 2 (BB2-D2): Auch nach dem Neuladen bleibt ein unverändertes Beispiel „nichts wert“. */
  it("ersetzt ein unverändertes Beispiel auch nach dem Neuladen ohne Rückfrage", async () => {
    const nutzer = userEvent.setup();
    const { frage, fetchZurueck } = await beispielAnzeigen(nutzer);
    try {
      await nutzer.click(within(frage).getByRole("button", { name: "Beispielbogen öffnen" }));
      expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();

      // „Neuladen": App neu aufbauen, Speicher bleibt.
      cleanup();
      dialogeZuruecksetzen();
      render(<App />);
      await nutzer.click(await screen.findByRole("button", { name: "Beispielbögen ansehen" }));
      const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" }, { timeout: 15000 });
      const anzeigen = await within(dialog).findAllByRole("button", { name: "Anzeigen" }, { timeout: 15000 });
      await nutzer.click(anzeigen[1]!);

      expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
      expect(screen.queryByRole("dialog", { name: "Beispielbogen öffnen?" })).toBeNull();
      expect(screen.getAllByText(/Dein eigener Bogen .*Eigenhausen.* liegt auf der Startseite/).length).toBeGreaterThan(0);
    } finally {
      fetchZurueck();
    }
  }, 40000);

  /** Prüfrunde Beispielbögen (BB-E1): Schließen während des Ladens bricht „Anzeigen" ab. */
  it("öffnet keinen Beispielbogen mehr, wenn der Dialog während des Ladens geschlossen wurde", async () => {
    const bogenJson = JSON.stringify({ ...bogenMitName("Spaethausen"), uebung: true });
    const echtesFetch = globalThis.fetch;
    const wartend: (() => void)[] = [];
    globalThis.fetch = () =>
      new Promise<Response>((fertig) => wartend.push(() => fertig(new Response(bogenJson, { headers: { "content-type": "application/json" } }))));
    try {
      const nutzer = userEvent.setup();
      render(<App />);
      await nutzer.click(screen.getByRole("button", { name: "Beispielbögen ansehen" }));
      const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" }, { timeout: 15000 });
      await nutzer.click(within(dialog).getByRole("button", { name: /^ASB/ }));
      const anzeigen = await within(dialog).findAllByRole("button", { name: "Anzeigen" });
      await nutzer.click(anzeigen[0]!);
      await nutzer.click(within(dialog).getByRole("button", { name: "Schließen" }));
      expect(dialog.hasAttribute("open")).toBe(false);

      for (const f of wartend.splice(0)) f();
      await new Promise((r) => setTimeout(r, 50));

      expect(screen.queryByRole("heading", { name: "Gesamtübersicht" })).toBeNull();
      expect(screen.queryByRole("dialog", { name: "Beispielbogen öffnen?" })).toBeNull();
    } finally {
      globalThis.fetch = echtesFetch;
    }
  }, 20000);

  /** Prüfrunde Beispielbögen (BB-S2, BB-K4): Suche findet einen Ordner ohne LV › RSt › OV. */
  it("findet Beispiel-Ordner über die Suche und öffnet sie", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Beispielbögen ansehen" }));
    const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" }, { timeout: 15000 });
    await nutzer.type(within(dialog).getByRole("searchbox", { name: "Suchen" }), "hannover");
    const treffer = within(dialog).getByRole("list", { name: "Gefundene Ordner" });
    await nutzer.click(within(treffer).getByRole("button", { name: /^Einlagen Kräfte Hannover/ }));
    expect(within(dialog).getByText("Einlagen Kräfte Hannover", { selector: "[aria-current]" })).toBeDefined();
    expect((within(dialog).getByRole("searchbox", { name: "Suchen" }) as HTMLInputElement).value).toBe("");
  });

  /** Prüfrunde Beispielbögen (BB-E4, BB-H2, BB-N2): Escape/Zurück-Geste geht eine Ebene hoch. */
  it("geht mit Escape im Beispiel-Dialog eine Ebene hoch statt zu schließen", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Beispielbögen ansehen" }));
    const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" }, { timeout: 15000 });
    await nutzer.click(within(dialog).getByRole("button", { name: /^Katastrophenschutz/ }));
    expect(within(dialog).getByText("Katastrophenschutz", { selector: "[aria-current]" })).toBeDefined();

    const abbruch = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(abbruch);
    });
    expect(abbruch.defaultPrevented).toBe(true);
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(within(dialog).queryByRole("navigation", { name: "Ordner" })).toBeNull();
  });

  /** Runde 2 (BB2-E5, BB2-S3): Wiederholtes Escape geht Ebene für Ebene hoch und schließt erst ganz oben. */
  it("geht mit mehrfachem Escape Ebene für Ebene hoch", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Beispielbögen ansehen" }));
    const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" }, { timeout: 15000 });
    await nutzer.click(within(dialog).getByRole("button", { name: /^Katastrophenschutz/ }));
    await new Promise((r) => setTimeout(r, 450)); // Doppeltipp-Sperre
    await nutzer.click(within(dialog).getByRole("button", { name: /^Niedersachsen/ }));
    expect(within(dialog).getByText("Niedersachsen", { selector: "[aria-current]" })).toBeDefined();

    const esc = () => {
      const e = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      act(() => {
        dialog.dispatchEvent(e);
      });
      return e.defaultPrevented;
    };
    expect(esc()).toBe(true);
    expect(within(dialog).getByText("Katastrophenschutz", { selector: "[aria-current]" })).toBeDefined();
    expect(esc()).toBe(true);
    expect(within(dialog).queryByRole("navigation", { name: "Ordner" })).toBeNull();
    // Ganz oben bleibt Escape dem Browser: Der Dialog darf zugehen.
    expect(esc()).toBe(false);
  });

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

      // Der Knopf ist gesperrt, bis der QR-Code (und damit der Link) berechnet
      // ist. Auf einem langsamen Runner käme der Klick sonst zu früh und verpuffte.
      const knopf = within(dialog).getByRole<HTMLButtonElement>("button", { name: NAHBEREICH });
      await waitFor(() => expect(knopf.disabled).toBe(false));
      await nutzer.click(knopf);

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

  it("nimmt einen USB-Handscanner auch ohne offenes Scanner-Fenster an (Probelauf Meldekopf)", async () => {
    // Am Meldekopf lösten Helfer den Scanner aus, ohne „Bogen scannen…" zu
    // drücken — wie an der Kasse. Ein Scan auf der Seite wirkt jetzt wie ein
    // angetippter Bogen-Link.
    render(<App />);
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
    // Uhr-Attrappe: der Scanner tippt mit 5 ms Abstand.
    let t = 1000;
    const now = vi.spyOn(performance, "now").mockImplementation(() => (t += 5));
    try {
      const url = encodePayloadUrl(bogenMitName("Scannerhausen"), browserKompressor);
      for (const z of url) window.dispatchEvent(new KeyboardEvent("keydown", { key: z, cancelable: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
    } finally {
      now.mockRestore();
    }

    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    const einheit = screen.getByRole("heading", { name: "Einheit" }).closest("section")!;
    expect(within(einheit).getByText(/Scannerhausen/)).toBeDefined();
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
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Eigenstadt");

    fragmentSetzen(encodePayloadUrl(bogenMitName("Bamberg"), browserKompressor));
    const frage = await screen.findByRole("dialog", { name: "Empfangenen Bogen öffnen?" });
    expect(frage.textContent).toContain("THW Eigenstadt");
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect((screen.getByLabelText("Ort der Einheit (Pflicht)") as HTMLInputElement).value).toBe("Eigenstadt");
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toBeNull();

    // Weitertippen, dann derselbe Weg mit „Meldung öffnen": zurückholbar ist der aktuelle Stand.
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "-Nord");
    fragmentSetzen(encodePayloadUrl(bogenMitName("Bamberg"), browserKompressor));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Empfangenen Bogen öffnen?" })).getByRole("button", { name: "Meldung öffnen" }));
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Eigenstadt-Nord");
    expect(screen.getByText(/Dein eigener Bogen „THW Eigenstadt-Nord" liegt auf der Startseite/)).toBeDefined();
  }, 20000);

  /** Audit Runde 4, R4-E2: derselbe Link zweimal — der eigene Bogen bleibt auf dem Rückholplatz. */
  it("öffnet denselben Link ein zweites Mal ohne Rückfrage und lässt den Rückholplatz, wie er ist (R4-E2)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Biberach");
    const link = encodePayloadUrl(bogenMitName("Ulm"), browserKompressor);
    fragmentSetzen(link);
    const frage = await screen.findByRole("dialog", { name: "Empfangenen Bogen öffnen?" });
    await nutzer.click(within(frage).getByRole("button", { name: "Meldung öffnen" }));
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Biberach");

    fragmentSetzen(link);
    expect(await screen.findByText(/Dieser Bogen ist schon offen: „THW Ulm"/)).toBeDefined();
    expect(screen.queryByRole("dialog", { name: "Empfangenen Bogen öffnen?" })).toBeNull();
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Biberach");
    expect(screen.getByText(/Dein eigener Bogen „THW Biberach" liegt auf der Startseite/)).toBeDefined();
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

  it("bleibt nach „‹ Startseite“ und Neuladen auf der Startseite, die Erfassung wartet dort (R5-N3)", async () => {
    const { entwurfZuJson } = await import("./entwurf");
    const sammlung = einsatzImSpeicherAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    localStorage.setItem(
      "eeb.entwurf.v1",
      entwurfZuJson(bogenMitName("Ulm"), Date.now(), { schritt: 0, fremd: { einsatzId: sammlung.id, beginn: Date.now(), startseite: true } }),
    );
    vi.resetModules();
    (await import("./speicher-browser")).speicherVerdrahten();
    const { App: AppKalt } = await import("./app");
    render(<AppKalt />);
    expect(await screen.findByRole("heading", { name: "Digitaler Einheiten-Erfassungsbogen" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "In Einsatz übernehmen" })).toBeNull();
  }, 20000);

  it("beginnt nach dem Neuladen mit dem eigenen Bogen weiter auf der Startseite", async () => {
    const { entwurfZuJson } = await import("./entwurf");
    localStorage.setItem("eeb.entwurf.v1", entwurfZuJson(bogenMitName("Eigenstadt"), Date.now(), { schritt: 0 }));
    vi.resetModules();
    const { App: AppKalt } = await import("./app");
    render(<AppKalt />);
    expect(await screen.findByRole("button", { name: "Fortsetzen" })).toBeDefined();
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

    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));

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

    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    const rueckfrage = await screen.findByRole("dialog", { name: "Bogen schließen?" });
    await nutzer.click(within(rueckfrage).getByRole("button", { name: "Abbrechen" }));

    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
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

  /** Audit Runde 4, R4-M7: Die Zeile nennt das Wichtige („nur auf diesem Gerät") hinten und kurz. */
  it("meldet den Speicherstand kurz: gespeichert, Uhrzeit, nur auf diesem Gerät", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "V");
    expect(await screen.findByText(/^✓ gespeichert · .* Uhr · nur auf diesem Gerät$/)).toBeDefined();
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
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "V");

    expect(await screen.findByText(/Nicht gespeichert — der Speicher dieses Geräts ist voll/)).toBeDefined();
    expect(screen.queryByText(/✓ gespeichert/)).toBeNull();
  });

  /** Audit Runde 4, R4-E5: Die Startkarte darf den ungespeicherten Stand nicht als „gespeichert" beschriften. */
  it("sagt auch auf der Startkarte, dass nicht gespeichert wurde, und nennt den letzten gesicherten Stand", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "V");
    expect(await screen.findByText(/^✓ gespeichert · .* Uhr · nur auf diesem Gerät$/)).toBeDefined();
    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === "eeb.entwurf.v1") throw new DOMException("voll", "QuotaExceededError");
      return echt.call(this, k, v);
    });
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "W");
    await screen.findByText(/Nicht gespeichert — der Speicher dieses Geräts ist voll/);

    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    const karte = document.querySelector<HTMLElement>(".entwurf-karte")!;
    expect(karte.textContent).not.toMatch(/· gespeichert \d/);
    const warnung = karte.querySelector<HTMLElement>(".speicher-fehler")!;
    expect(warnung.getAttribute("role")).toBe("alert");
    expect(warnung.textContent).toMatch(/Nicht gespeichert — der Speicher dieses Geräts ist voll\. Letzter gesicherter Stand: .* Uhr\./);
    expect(warnung.textContent).toMatch(/Bogen übergeben/);
  });

  /** Audit Runde 5, R5-O1: Die Warnung sitzt fest am Bildrand, nicht im Kopf, der mit der Seite wegrollt. */
  it("zeigt „Nicht gespeichert“ als feste Leiste mit „Was tun?“ statt im Kopf (R5-O1)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === "eeb.entwurf.v1") throw new DOMException("voll", "QuotaExceededError");
      return echt.call(this, k, v);
    });
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "V");
    await screen.findByText(/Nicht gespeichert/);
    const fest = document.querySelector<HTMLElement>(".fest-warnung.speicher-fehler")!;
    expect(fest).not.toBeNull();
    expect(fest.textContent).toMatch(/Jetzt „Bogen übergeben“ \(PDF\)/);
    expect(fest.textContent).not.toMatch(/Papierkorb leeren/);
    await nutzer.click(within(fest).getByRole("button", { name: "Was tun?" }));
    expect(fest.textContent).toMatch(/Papierkorb leeren/);
    expect(fest.textContent).toMatch(/Letzter gesicherter Stand/);
    expect(document.documentElement.style.getPropertyValue("--fest-warnung-hoehe")).toMatch(/px$/);
  });

  /** Audit Runde 3, R3-O4: gesperrt ist nicht voll; Schließen fragt nach. */
  it("nennt einen gesperrten Speicher beim Namen und fragt vor dem Schließen", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 0);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("gesperrt", "QuotaExceededError");
    });
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "G");
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
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "G");
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
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Bamberg");
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

  /**
   * Audit Runde 4, R4-E2: Dieselbe Datei ein zweites Mal geöffnet fragte,
   * ob „Ulm" durch „Ulm" ersetzt werden darf — und löschte dabei den eigenen
   * Bogen vom Rückholplatz. Jetzt: keine Rückfrage, der eigene Bogen bleibt.
   */
  it("öffnet dieselbe Datei ein zweites Mal ohne Rückfrage, der eigene Bogen bleibt auf dem Rückholplatz (R4-E2)", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Biberach");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    const ulm = bogenMitName("Ulm");
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), pdfDatei(ulm));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Bogen aus Datei öffnen?" })).getByRole("button", { name: "Datei öffnen" }));
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Biberach");

    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), pdfDatei(ulm));
    expect(await screen.findByText(/Dieser Bogen ist schon offen: „THW Ulm"\. Nichts ersetzt\./)).toBeDefined();
    expect(screen.queryByRole("dialog", { name: "Bogen aus Datei öffnen?" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Biberach");
    expect(localStorage.getItem("eeb.entwurf.v1")).toContain("Ulm");
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
    const name = screen.getByLabelText("Ort der Einheit (Pflicht)") as HTMLInputElement;
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
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Angefangenhausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    await nutzer.click(screen.getByRole("button", { name: "Bearbeiten" }));
    await nutzer.click(within(rueckfrage("Vorlage bearbeiten?")).getByRole("button", { name: "Vorlage bearbeiten" }));
    expect((screen.getByLabelText("Ort der Einheit (Pflicht)") as HTMLInputElement).value).toBe("OV Vorlage");

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
  it("beendet mit „Bearbeitung beenden“ nur die Vorlagen-Bearbeitung; der eigene Bogen bleibt zurückholbar (R3-D1)", async () => {
    const v = vorlageAnlegen("OV Ulm B", bogenMitName("Ulm"));
    const vorlageVorher = JSON.stringify(vorlagenLaden().find((x) => x.id === v.id)!.bogen);
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Ulm");
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    await nutzer.type(document.getElementById("feld-ort-auftrag")!, "ECHTER EINSATZ Deichsicherung");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    await nutzer.click(screen.getByRole("button", { name: "Bearbeiten" }));
    await nutzer.click(within(rueckfrage("Vorlage bearbeiten?")).getByRole("button", { name: "Vorlage bearbeiten" }));
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    // Die Karte ist als Vorlagen-Bearbeitung erkennbar.
    expect(screen.getByText(/Bearbeitung der Vorlage „OV Ulm B"/)).toBeDefined();

    // R4-D5: Der Knopf heißt wie die Handlung, nicht „Verwerfen".
    expect(screen.queryByRole("button", { name: "Verwerfen" })).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "Bearbeitung beenden" }));
    const frage = rueckfrage("Bearbeitung der Vorlage beenden?");
    expect(frage.textContent).toContain("bleibt unverändert gespeichert");
    expect(frage.textContent).toContain("ECHTER EINSATZ Deichsicherung");
    await nutzer.click(within(frage).getByRole("button", { name: "Bearbeitung beenden" }));

    const rueck = localStorage.getItem("eeb.entwurf.ersetzt.v1") ?? "";
    expect(rueck).toContain("ECHTER EINSATZ Deichsicherung");
    expect(JSON.stringify(vorlagenLaden().find((x) => x.id === v.id)!.bogen)).toBe(vorlageVorher);
    await nutzer.click(screen.getByRole("button", { name: "Zuletzt geschlossenen Bogen zurückholen" }));
    expect((await screen.findAllByText(/ECHTER EINSATZ Deichsicherung/)).length).toBeGreaterThan(0);
  }, 20000);
});

describe("Musterung bei offenem Bogen: eine Rückfrage statt zwei (R4-S5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fragt „Alle dabei?“ und „Bogen ersetzen?“ in einem Dialog", async () => {
    const v = vorlageAnlegen("OV Ulm B", { ...bogenMitName("Ulm"), personal: ["Berger", "Ahlers"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname })) });
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Eigenhausen");
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));

    await nutzer.click(screen.getByRole("button", { name: `Einsatz vorbereiten: ${v.name}` }));
    await nutzer.click(screen.getByRole("button", { name: /^Bogen anlegen/ }));

    expect(document.querySelector("dialog[aria-label='Alle aus der Vorlage dabei?']")).toBeNull();
    const frage = await screen.findByRole("dialog", { name: "Bogen aus Vorlage anlegen?" });
    expect(frage.textContent).toMatch(/Gemeldet werden alle 2 Personen der Vorlage\. Fehlt jemand, vorher in der Liste abwählen\./);
    expect(frage.textContent).toMatch(/Eigenhausen.* wird durch den Bogen aus der Vorlage ersetzt/);
    await nutzer.click(within(frage).getByRole("button", { name: "Ja, alle sind da — anlegen" }));
    expect(document.querySelector("dialog[open]")).toBeNull();
  });
});

/** Audit Runde 4, R4-H5: Nach „Bogen anlegen" geht es mit einem Tipp zur Übergabe. */
describe("Nach der Musterung: „Zur Übergabe →“ in Schritt 2 (R4-H5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("bietet den Sprung zur Übersicht nur nach einer Musterung an", async () => {
    const v = vorlageAnlegen("OV Ulm B", { ...bogenMitName("Ulm"), personal: ["Berger", "Ahlers"].map((nachname) => ({ ...neuePerson(), vorname: "T", nachname })) });
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.click(screen.getByRole("button", { name: `Einsatz vorbereiten: ${v.name}` }));
    await nutzer.click(screen.getByRole("checkbox", { name: /Ahlers/ }));
    await nutzer.click(screen.getByRole("button", { name: /^Bogen anlegen/ }));

    const sprung = await screen.findByRole("button", { name: "Zur Übergabe →" });
    await nutzer.click(sprung);
    expect(await screen.findByRole("button", { name: "Bogen übergeben…" })).toBeDefined();

    // Ein anderer neuer Bogen kommt nicht aus der Musterung.
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.click(await screen.findByRole("button", { name: "Neu anfangen" }));
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    expect(screen.queryByRole("button", { name: "Zur Übergabe →" })).toBeNull();
  }, 20000);
});

describe("Meldekopf-App statt Einsatz-Sammlung (2026-11-09)", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    localStorage.clear();
  });

  it("die Startseite verweist auf die Meldekopf-App und bietet keine Sammlung mehr an", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Bögen sammeln (Meldekopf)" })).toBeDefined();
    expect(screen.getByRole("link", { name: /Meldekopf-App öffnen/ }).getAttribute("href")).toBe("https://meldekopf.erfassungsbogen.app/");
    expect(screen.queryByRole("button", { name: "Neue Einsatz-Sammlung…" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Einsatz-Sammlung (Meldekopf)" })).toBeNull();
  });

  it("ein Bogen aus der Datei öffnet sich ohne „Wohin damit?“, auch wenn noch eine alte Sammlung auf dem Gerät liegt", async () => {
    einsatzImSpeicherAnlegen("Alte Sammlung", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/Auf diesem Gerät liegen noch 1 Einsatz-Sammlung/)).toBeDefined();
    await nutzer.upload(screen.getByLabelText("Aus Datei laden…"), pdfDatei(bogenMitName("OV Direkt")));
    expect(await screen.findByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(document.querySelector("dialog[open]")).toBeNull();
  });
});
