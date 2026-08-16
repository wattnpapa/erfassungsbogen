/**
 * Durchlauf durch den Assistenten — der Weg, den jeder Nutzer nimmt und den
 * jede Änderung an Schritten, Navigation oder Übersicht berühren kann:
 * Startseite → Schritt 1 → alle Schritte → Übersicht → Bogen übergeben.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, type Erfassungsbogen } from "../model";
import { encodePayload, encodePayloadUrl, encodeVorlagePayloadUrl, fragmentInhalt, segmentPayloadUrls } from "../codec";
import { browserKompressor, neuerBogen } from "./hilfen";
// `einsatzAnlegen` heißt in diesem Test schon ein Klick-Helfer (Dialog
// ausfüllen); der Speicher-Weg kommt darum unter eigenem Namen herein.
import {
  EinsatzArt,
  einsaetzeLaden,
  einsatzAnlegen as einsatzImSpeicherAnlegen,
  meldungHinzufuegen,
  neuesteJeEinheit,
} from "./einsaetze";

// Die PDF-Erzeugung (pdfmake) ist eigenständig getestet und im Test nur teuer;
// hier zählt, dass der Weg dorthin funktioniert und der Bogen ankommt.
const pdfErzeugen = vi.fn<(bogen: Erfassungsbogen, name?: string) => Promise<void>>(async () => {});
vi.mock("./pdf", () => ({
  pdfErzeugen: (bogen: Erfassungsbogen, name?: string) => pdfErzeugen(bogen, name),
  pdfDatenUrl: async () => "data:application/pdf;base64,",
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
  };
});

const { App } = await import("./app");

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
    await nutzer.click(within(rueckfrage("Aktuellen Bogen verwerfen?")).getByRole("button", { name: "Abbrechen" }));

    // Abgebrochen: derselbe Bogen steht noch da.
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    expect(screen.getAllByText(/Wegwerfhausen/).length).toBeGreaterThan(0);

    await nutzer.click(screen.getByRole("button", { name: "Neuer Bogen" }));
    await nutzer.click(
      within(rueckfrage("Aktuellen Bogen verwerfen?")).getByRole("button", { name: "Verwerfen und neu beginnen" }),
    );

    // Verworfen heißt: kein Bogen mehr — die App steht wieder am Anfang, und
    // der Entwurf ist auch nicht als „Fortsetzen" übrig.
    expect(screen.getByRole("heading", { name: "Digitaler Einheiten-Erfassungsbogen" })).toBeDefined();
    expect(screen.queryByText(/Wegwerfhausen/)).toBeNull();
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

    expect(screen.getByText("Angefangener Bogen verworfen.")).toBeDefined();
    expect(screen.queryByText(/Entwurfshausen/)).toBeNull();
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
    const rueckfrage = await screen.findByRole("dialog", { name: "Aktuellen Bogen verwerfen?" });
    // Solange nicht bestätigt ist, bleibt der Bogen offen.
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();

    await nutzer.click(within(rueckfrage).getByRole("button", { name: "Verwerfen und neu beginnen" }));

    expect(await screen.findByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
  });

  it("behält den Bogen, wenn die Verwerfen-Rückfrage abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 5);

    await nutzer.click(screen.getByRole("button", { name: "Neuer Bogen" }));
    const rueckfrage = await screen.findByRole("dialog", { name: "Aktuellen Bogen verwerfen?" });
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
    const dialog = await screen.findByRole("dialog", { name: "Neuen Einsatz anlegen" });
    const anlegen = within(dialog).getByRole("button", { name: "Einsatz anlegen" });
    // Ohne Namen ist der Einsatz nicht anzulegen — die Pflichtangabe sperrt den Knopf.
    expect(anlegen.hasAttribute("disabled")).toBe(true);

    await nutzer.type(within(dialog).getByLabelText("Name"), name);
    if (art) await nutzer.selectOptions(within(dialog).getByLabelText("Art"), art);
    if (ort) await nutzer.type(within(dialog).getByLabelText("Ort / Auftrag (optional)"), ort);
    await nutzer.click(anlegen);
  }

  it("legt von der Startseite aus einen Einsatz an und öffnet ihn", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.click(screen.getByRole("button", { name: "Neuer Einsatz…" }));
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
      await nutzer.click(screen.getByRole("button", { name: "Neuer Einsatz…" }));
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

  it("legt nichts an, wenn der Dialog abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    await nutzer.click(screen.getByRole("button", { name: "Neuer Einsatz…" }));
    const dialog = await screen.findByRole("dialog", { name: "Neuen Einsatz anlegen" });
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

    await nutzer.click(screen.getByRole("button", { name: "In Einsatz aufnehmen…" }));
    // Der Anlege-Dialog erscheint über der schon offenen Einsatz-Auswahl.
    await nutzer.click(screen.getByRole("button", { name: "Neuen Einsatz anlegen…" }));
    await einsatzAnlegen(nutzer, "Sammelhausen");

    // Der Bogen ist als Meldung abgelegt: Einsatzansicht mit einer Einheit.
    expect(await screen.findByRole("heading", { level: 1, name: "Sammelhausen" })).toBeDefined();
    const liste = screen.getByRole("heading", { name: "Einheiten (1)" }).closest("section")!;
    expect(within(liste).getByText("THW Scanhausen")).toBeDefined();
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
    await screen.findByRole("heading", { name: "Gesamtübersicht" });
    await nutzer.click(screen.getByRole("button", { name: "In Einsatz aufnehmen…" }));
    // Die Einsatz-Auswahl erscheint als eigener Dialog — er braucht einen Tick.
    await nutzer.click(await screen.findByRole("button", { name: /^Sammelhausen/ }));

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

  it("führt die zweite Meldung auf Wunsch als eigene Einheit", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, dialog } = await zweiteMeldungDerselbenEinheit(nutzer);

    await nutzer.click(within(dialog).getByRole("button", { name: "Als eigene Einheit führen" }));

    const eintraege = einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege;
    expect(neuesteJeEinheit(eintraege)).toHaveLength(2); // beide zählen getrennt
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
    await nutzer.click(screen.getByRole("button", { name: "Neuer Einsatz…" }));
    const anlegen = await screen.findByRole("dialog", { name: "Neuen Einsatz anlegen" });
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
