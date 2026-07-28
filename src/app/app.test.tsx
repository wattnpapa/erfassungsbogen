/**
 * Durchlauf durch den Assistenten — der Weg, den jeder Nutzer nimmt und den
 * jede Änderung an Schritten, Navigation oder Übersicht berühren kann:
 * Startseite → Schritt 1 → alle Schritte → Übersicht → Bogen übergeben.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, type Erfassungsbogen } from "../model";
import { encodePayload, encodePayloadUrl, encodeVorlagePayloadUrl, fragmentInhalt, segmentPayloadUrls } from "../codec";
import { browserKompressor, neuerBogen } from "./hilfen";

// Die PDF-Erzeugung (pdfmake) ist eigenständig getestet und im Test nur teuer;
// hier zählt, dass der Weg dorthin funktioniert und der Bogen ankommt.
const pdfErzeugen = vi.fn<(bogen: Erfassungsbogen, name?: string) => Promise<void>>(async () => {});
vi.mock("./pdf", () => ({
  pdfErzeugen: (bogen: Erfassungsbogen, name?: string) => pdfErzeugen(bogen, name),
  pdfDatenUrl: async () => "data:application/pdf;base64,",
  einsatzPdfErzeugen: async () => {},
}));

// Ohne Capacitor: die Tests fahren die Browser-Variante der App.
vi.mock("./nativ", () => ({
  istNativ: () => false,
  plattform: () => "web",
  bogenLinksEmpfangen: () => () => {},
  qrScannen: async () => "",
  pdfTeilen: async () => {},
  linkTeilen: async () => {},
  textTeilen: async () => {},
}));

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

    expect(screen.getByRole("heading", { name: "Einheiten-Erfassungsbogen" })).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    expect(screen.getByRole("heading", { name: "1. Einheit" })).toBeDefined();
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
});
