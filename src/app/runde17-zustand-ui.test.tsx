/**
 * Runde 17, Block Zustand: Verhalten in der Oberfläche (jsdom) — Handscanner-Echo (E7), Zurück nach dem Neuladen (S2),
 * Fokus im Feld „Ort" (S4), „Rückgängig" bei „Zahlen stimmen, so gezählt" (S1), Papierkorb für entfernte Meldungen (E2, D6),
 * aufgeklappte Karte nach dem Neuladen (E5, O2, S10, W5), „Anderer Einsatz?" entscheiden (E4), Quittung mit Zeitablauf (S8),
 * StAN-Vorbelegung mit Rückgängig (D1), Ansprechperson (D2, S5), „Namen einfügen…" (E1, N1, H5, S7), Weitergabe-Datei (E3).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp } from "@bos/eeb-format/model";
import { stanFahrzeugVorbelegung } from "@bos/vokabulare/thw-stan-fahrzeuge";
import { Dialogschicht, frageFelder, fokusIndex } from "./dialoge";
import { neuePerson, neuerBogen, neuesFahrzeug, vokabularFuer } from "./hilfen";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittFahrzeuge, eigeneAngaben } from "./schritte/fahrzeuge";
import { SchrittPersonal } from "./schritte/personal";
import { handscannerLauscher } from "./handscanner";

vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => true,
  einsatzLageblattErzeugen: async () => true,
  blankoPdfErzeugen: async () => true,
  meldungPdfAnzeigen: async () => {},
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

// ------------------------------------------------------------------------------------------------ E7

describe("R17-E7 Handscanner: das Echo bleibt unverändert", () => {
  it("nimmt Leerzeichen mitten im Scan mit, am Anfang nicht", () => {
    vi.useFakeTimers();
    let t = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => (t += 5));
    const gescannt: string[] = [];
    const aus = handscannerLauscher(window, { onScan: (s) => gescannt.push(s), streng: true });
    const taste = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true, bubbles: true }));
    taste(" "); // vor dem ersten Zeichen: gehört der Seite (Knopf bedienen)
    for (const z of "hallo welt") taste(z);
    taste("Enter");
    aus();
    vi.restoreAllMocks();
    expect(gescannt).toEqual(["hallo welt"]);
  });
});

// ------------------------------------------------------------------------------------------------ S4

describe("R17-S4 „Ort eintragen…“ setzt den Cursor in das Feld „Ort“", () => {
  it("fokusIndex wählt das markierte Feld, sonst das erste", () => {
    expect(fokusIndex([{ name: "a", label: "A" }, { name: "b", label: "B", fokus: true }])).toBe(1);
    expect(fokusIndex([{ name: "a", label: "A" }, { name: "b", label: "B" }])).toBe(0);
  });

  it("der Dialog fokussiert das markierte Feld", async () => {
    render(<Dialogschicht />);
    let antwort: Promise<Record<string, string> | null> | undefined;
    act(() => {
      antwort = frageFelder({
        titel: "Einsatz bearbeiten",
        felder: [
          { name: "name", label: "Name", vorgabe: "Hochwasser Test" },
          { name: "ort", label: "Ort / Auftrag (optional)", optional: true, fokus: true },
        ],
      });
    });
    const ort = await screen.findByLabelText("Ort / Auftrag (optional)");
    await waitFor(() => expect(document.activeElement).toBe(ort));
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    await expect(antwort).resolves.toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ D1

describe("R17-D1 „StAN-Vorbelegung laden“ nennt die Folgen und hat ein Rückgängig", () => {
  function stanStart() {
    const typ = vokabularFuer(OrganisationsTyp.THW, "einheitstyp").find((e) => stanFahrzeugVorbelegung(OrganisationsTyp.THW, { code: e.code }).length > 0)!;
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: typ.code };
    start.fahrzeuge = [
      { ...neuesFahrzeug(), kennzeichen: "THW-80125" },
      { ...neuesFahrzeug(), kennzeichen: "THW-80126", aenderungen: "Tauchpumpe" },
    ];
    return start;
  }

  it("eigeneAngaben zählt Kennzeichen, Sondergerät und mehr", () => {
    expect(eigeneAngaben([])).toBe("");
    expect(eigeneAngaben([neuesFahrzeug()])).toBe("");
    expect(eigeneAngaben(stanStart().fahrzeuge)).toBe("Kennzeichen THW-80125, THW-80126; 1 Sondergerät/Änderung");
  });

  it("die Rückfrage nennt die Kennzeichen; „Rückgängig“ stellt die Liste mit Kennzeichen wieder her", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={stanStart()} />);
    await nutzer.click(screen.getByRole("button", { name: /^StAN-Vorbelegung laden/ }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='StAN-Vorbelegung laden?']")!;
    expect(dialog.textContent).toMatch(/Verloren gehen dabei deine Eingaben: Kennzeichen THW-80125, THW-80126; 1 Sondergerät\/Änderung\./);
    expect(dialog.textContent).toMatch(/„Rückgängig“ in der Leiste unten stellt die bisherige Liste wieder her/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Ersetzen" }));
    expect((screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[]).some((f) => f.value === "THW-80125")).toBe(false);
    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/^StAN-Vorbelegung geladen: 2 bisherige Fahrzeuge ersetzt/);
    const rueck = within(leiste).getByRole("button", { name: "Rückgängig" });
    await waitFor(() => expect(rueck.getAttribute("aria-disabled")).toBeNull(), { timeout: 2500 });
    await nutzer.click(rueck);
    await waitFor(() => expect((screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[]).map((f) => f.value)).toEqual(["THW-80125", "THW-80126"]));
    expect(document.body.textContent).toMatch(/Zurückgeholt: die 2 bisherigen Fahrzeuge samt Kennzeichen/);
  });

  it("eine Liste ohne eigene Eingaben wird ohne Rückweg ersetzt", async () => {
    const nutzer = userEvent.setup();
    const start = stanStart();
    start.fahrzeuge = [neuesFahrzeug()];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);
    await nutzer.click(screen.getByRole("button", { name: /^StAN-Vorbelegung laden/ }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='StAN-Vorbelegung laden?']")!;
    expect(dialog.textContent).not.toMatch(/Verloren gehen/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Ersetzen" }));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ D2 / S5

describe("R17-D2/S5 „⇑“ sagt, wer jetzt Ansprechperson ist", () => {
  function startMitPersonen() {
    const b = neuerBogen();
    b.personal = ["Lehmann", "Krause", "Schulz", "Brandt"].map((n) => ({ ...neuePerson(), nachname: n, vorname: "X" }));
    return b;
  }

  it("meldet die neue Ansprechperson mit Rückgängig; ▲ weiter unten in der Liste schweigt", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={startMitPersonen()} />);
    const namen = () => (screen.getAllByLabelText("Nachname") as HTMLInputElement[]).map((f) => f.value);
    expect(namen()).toEqual(["Lehmann", "Krause", "Schulz", "Brandt"]);
    // Platz 3 nach oben auf Platz 2: Ansprechperson bleibt.
    await nutzer.click(screen.getByRole("button", { name: "Person 3 nach oben" }));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: /^Person 4 an die erste Stelle/ }));
    expect(namen()[0]).toBe("Brandt");
    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/^Neue Ansprechperson: .*Brandt/);
    const rueck = within(leiste).getByRole("button", { name: "Wechsel der Ansprechperson rückgängig machen" });
    await waitFor(() => expect(rueck.getAttribute("aria-disabled")).toBeNull(), { timeout: 2500 });
    await nutzer.click(rueck);
    await waitFor(() => expect(namen()).toEqual(["Lehmann", "Schulz", "Krause", "Brandt"]));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ E1 / N1 / H5 / S7

describe("R17-E1/N1/H5/S7 „Namen einfügen…“ in der Oberfläche", () => {
  async function dialogOeffnen(nutzer: ReturnType<typeof userEvent.setup>) {
    render(<SchrittBuehne komponente={SchrittPersonal} />);
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    return document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
  }

  it("Zeilen ohne Komma tragen die Prüfmarke, bis die Reihenfolge gewählt ist; die Wahl dreht die Lesart", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Schmidt Anna Maria\nMeier Karl\nMüller, Hans");
    expect(within(dialog).getAllByText("Reihenfolge prüfen")).toHaveLength(2);
    expect(within(dialog).getByText(/2 Zeilen ohne Komma lese ich als \(bitte bestätigen\)/)).toBeDefined();
    // R18-S7: keine Vorauswahl, „Übernehmen" gesperrt und mit Grund; die Vorschau zeigt „Vorname Nachname" wie eingegeben.
    expect((within(dialog).getByRole("radio", { name: "Vorname Nachname" }) as HTMLInputElement).checked).toBe(false);
    expect((within(dialog).getByRole("radio", { name: "Nachname Vorname" }) as HTMLInputElement).checked).toBe(false);
    expect(within(dialog).getByRole("button", { name: "3 Personen übernehmen" }).hasAttribute("disabled")).toBe(true);
    expect(dialog.textContent).toContain("„Übernehmen“ geht erst, wenn oben gewählt ist");
    expect(dialog.textContent).toContain("Schmidt Anna Maria");
    await nutzer.click(within(dialog).getByRole("radio", { name: "Nachname Vorname" }));
    expect(within(dialog).queryAllByText("Reihenfolge prüfen")).toHaveLength(0);
    expect(dialog.textContent).toContain("Anna Maria Schmidt");
    expect(dialog.textContent).toContain("Karl Meier");
    expect(dialog.textContent).toContain("Hans Müller");
    expect(dialog.textContent).not.toContain("„Übernehmen“ geht erst");
    await nutzer.click(within(dialog).getByRole("button", { name: "3 Personen übernehmen" }));
    const nachnamen = (screen.getAllByLabelText("Nachname") as HTMLInputElement[]).map((f) => f.value);
    expect(nachnamen).toEqual(expect.arrayContaining(["Schmidt", "Meier", "Müller"]));
  });

  it("auch die Bestätigung der Vorgabe nimmt die Marke weg", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Karl Meier");
    expect(within(dialog).getAllByText("Reihenfolge prüfen")).toHaveLength(1);
    await nutzer.click(within(dialog).getByRole("radio", { name: "Vorname Nachname" }));
    expect(within(dialog).queryAllByText("Reihenfolge prüfen")).toHaveLength(0);
  });

  it("Rufnummer am Zeilenende: „Kevin Meier“ wird übernommen, die Nummer wird sein Kontakt", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Kevin Meier 0171 1234567");
    expect(dialog.textContent).toContain("Kevin Meier");
    expect(dialog.textContent).toContain("Tel. 0171 1234567");
    expect(within(dialog).queryByText("kein Name?")).toBeNull();
    await nutzer.click(within(dialog).getByRole("radio", { name: "Vorname Nachname" })); // R18-S7
    await nutzer.click(within(dialog).getByRole("button", { name: "1 Person übernehmen" }));
    expect((screen.getAllByLabelText("Nachname") as HTMLInputElement[]).map((f) => f.value)).toContain("Meier");
  });

  it("„Lisa Meier, Fahrer“ → Vorname Lisa, Nachname Meier, Funktion Fahrer", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Lisa Meier, Fahrer");
    expect(dialog.textContent).toContain("Lisa Meier · Fahrer");
  });

  it("R18-H6: „Jürgen Weber +49 171 9876543 ZTrFü“ → Name, Funktion und Nummer getrennt, die Funktion nicht als Nachname", async () => {
    const nutzer = userEvent.setup();
    const dialog = await dialogOeffnen(nutzer);
    await nutzer.type(within(dialog).getByRole("textbox"), "Jürgen Weber +49 171 9876543 ZTrFü");
    expect(dialog.textContent).toContain("Jürgen Weber · ZTrFü · Tel. +49 171 9876543");
    expect(within(dialog).queryByText("kein Name?")).toBeNull();
    await nutzer.click(within(dialog).getByRole("radio", { name: "Vorname Nachname" }));
    await nutzer.click(within(dialog).getByRole("button", { name: "1 Person übernehmen" }));
    expect((screen.getAllByLabelText("Nachname") as HTMLInputElement[]).map((f) => f.value)).toContain("Weber");
  });
});
