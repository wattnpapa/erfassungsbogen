/**
 * Runde 14, Block Zustand: Verhalten in der Oberfläche (jsdom) — Zug für mehrere Einheiten mit Quittung und Rückgängig
 * (D3/G2/H2), Verschieben mit Quittung (D4), Übung ↔ Einsatzmeldung (E1), Entfernen eines Trupps (D1), Marke „neu" (S3),
 * Kontaktzeilen (S4), Altersangaben im Minutentakt (O1), Datensicherung (H4), Telefon der Absenderkarte (E5),
 * Beispieldaten beim Abwählen von „Übung" (E6), Handscanner mit kurzem Code (E3).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht } from "./dialoge";
import { neuePerson, neuerBogen } from "./hilfen";
import { Fusszeile } from "./fusszeile";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import { absenderkarteLaden } from "./absenderkarte";
import { beispielMerken } from "./beispiel-herkunft";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittEinsatz } from "./schritte/einsatz";
import { QrScannerWeb } from "./qr-scanner-web";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});

describe("R14-H4 Datensicherung: Fehlermeldung und Quittung widersprechen sich nicht", () => {
  it("nach einer falschen Datei und einer erfolgreichen Sicherung steht nur die Quittung, direkt unter den Knöpfen", async () => {
    const nutzer = userEvent.setup();
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    render(
      <>
        <Fusszeile onBogenOeffnen={async () => true} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Datensicherung" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Datensicherung']")!;
    const feld = dialog.querySelector<HTMLInputElement>('input[type="file"]')!;
    await nutzer.upload(feld, new File(["{}"], "junk.json", { type: "application/json" }));
    expect(await within(dialog).findByRole("alert")).toBeTruthy();

    await nutzer.click(within(dialog).getByRole("button", { name: "Sicherung erstellen…" }));
    await waitFor(() => expect(within(dialog).queryByRole("alert")).toBeNull());
    const quittung = dialog.querySelector(".sicherung-quittung")!;
    expect(quittung.textContent).toContain("erzeugt");
    // Direkt hinter den Knöpfen, vor dem Hinweis „Einspielen ersetzt …“.
    const knoepfe = dialog.querySelector(".aktionen")!;
    expect(knoepfe.nextElementSibling).toBe(quittung);
  });
});

describe("R14-E5 Telefon der Absenderkarte: Rückfrage wie bei der E-Mail", () => {
  function karte(onGespeichert = vi.fn()) {
    render(
      <>
        <AbsenderkarteFeld karte={absenderkarteLaden()} onGespeichert={onGespeichert} startOffen />
        <Dialogschicht />
      </>,
    );
    return onGespeichert;
  }

  it("„0170 abc“ fragt nach; „Nummer prüfen“ speichert nichts, „Trotzdem übernehmen“ speichert die bereinigte Nummer", async () => {
    const nutzer = userEvent.setup();
    const gespeichert = karte();
    await nutzer.type(screen.getByLabelText("Name"), "Max Muster");
    await nutzer.type(screen.getByLabelText("Telefon"), "0170 abc");
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    const frage = await screen.findByRole("dialog", { name: "Telefonnummer übernehmen?" });
    expect(frage.textContent).toContain("abc");
    expect(frage.textContent).toContain('Gespeichert würde: „0170"');
    await nutzer.click(within(frage).getByRole("button", { name: "Nummer prüfen" }));
    expect(gespeichert).not.toHaveBeenCalled();
    expect(absenderkarteLaden().telefon).toBeUndefined();

    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    const zweite = await screen.findByRole("dialog", { name: "Telefonnummer übernehmen?" });
    await nutzer.click(within(zweite).getByRole("button", { name: "Trotzdem übernehmen" }));
    expect(gespeichert).toHaveBeenCalledTimes(1);
    expect(absenderkarteLaden().telefon).toBe("0170");
  });

  it("zwei Nummern in einem Feld: die zweite wird genannt; eine saubere Nummer fragt nicht", async () => {
    const nutzer = userEvent.setup();
    const gespeichert = karte();
    await nutzer.type(screen.getByLabelText("Name"), "Max Muster");
    await nutzer.type(screen.getByLabelText("Telefon"), "0171 1234567 / 0441 99887");
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    const frage = await screen.findByRole("dialog", { name: "Telefonnummer übernehmen?" });
    expect(frage.textContent).toContain("Zweite Nummer");
    await nutzer.click(within(frage).getByRole("button", { name: "Nummer prüfen" }));
    await nutzer.clear(screen.getByLabelText("Telefon"));
    await nutzer.type(screen.getByLabelText("Telefon"), "0171 1234567");
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    expect(screen.queryByRole("dialog", { name: "Telefonnummer übernehmen?" })).toBeNull();
    expect(gespeichert).toHaveBeenCalledTimes(1);
    expect(absenderkarteLaden().telefon).toBe("0171 1234567");
  });
});

describe("R14-E6 „Dies ist eine Übung“ abwählen, solange Namen aus dem Beispiel im Bogen stehen", () => {
  function bogenAusBeispiel() {
    const b = neuerBogen();
    b.uebung = true;
    b.personal = [
      { ...neuePerson(), nachname: "Lang", vorname: "Sabine" },
      { ...neuePerson(), nachname: "Sommer", vorname: "Sandra" },
    ];
    return b;
  }

  it("fragt nach; „Übung beibehalten“ lässt den Haken, „Trotzdem als Einsatz“ nimmt ihn heraus", async () => {
    const nutzer = userEvent.setup();
    const b = bogenAusBeispiel();
    beispielMerken(b);
    render(<SchrittBuehne komponente={SchrittEinsatz} bogen={b} />);
    const haken = screen.getByLabelText("Dies ist eine Übung") as HTMLInputElement;
    expect(haken.checked).toBe(true);
    await nutzer.click(haken);
    const frage = await screen.findByRole("dialog", { name: "Beispieldaten im Bogen" });
    expect(frage.textContent).toContain("2 Personen („Lang, Sabine“, „Sommer, Sandra“)");
    await nutzer.click(within(frage).getByRole("button", { name: "Übung beibehalten" }));
    expect((screen.getByLabelText("Dies ist eine Übung") as HTMLInputElement).checked).toBe(true);

    await nutzer.click(screen.getByLabelText("Dies ist eine Übung"));
    const zweite = await screen.findByRole("dialog", { name: "Beispieldaten im Bogen" });
    await nutzer.click(within(zweite).getByRole("button", { name: "Trotzdem als Einsatz" }));
    await waitFor(() => expect((screen.getByLabelText("Dies ist eine Übung") as HTMLInputElement).checked).toBe(false));
  });

  it("ein Bogen mit eigenen Namen fragt nicht", async () => {
    const nutzer = userEvent.setup();
    const b = bogenAusBeispiel();
    beispielMerken(b);
    b.personal = [{ ...neuePerson(), nachname: "Echt", vorname: "Erika" }];
    render(<SchrittBuehne komponente={SchrittEinsatz} bogen={b} />);
    await nutzer.click(screen.getByLabelText("Dies ist eine Übung"));
    expect(screen.queryByRole("dialog", { name: "Beispieldaten im Bogen" })).toBeNull();
    expect((screen.getByLabelText("Dies ist eine Übung") as HTMLInputElement).checked).toBe(false);
  });
});

describe("R14-E3 Handscanner: ein kurzer Code endet mit einem Ergebnis", () => {
  it("„ab“ + Enter meldet den Scan, statt bei „2 Zeichen …“ stehen zu bleiben", async () => {
    const ergebnis = vi.fn();
    render(<QrScannerWeb onErgebnis={ergebnis} onAbbruch={() => {}} fortschritt="" />);
    // Ohne Kamera steht der Handscanner-Weg da; die Lauscher hängen unabhängig davon am Fenster.
    fireEvent.keyDown(window, { key: "a" });
    fireEvent.keyDown(window, { key: "b" });
    await waitFor(() => expect(document.body.textContent).toMatch(/Handscanner erkannt — 2 Zeichen/));
    fireEvent.keyDown(window, { key: "Enter" });
    expect(ergebnis).toHaveBeenCalledWith("ab");
    await waitFor(() => expect(document.body.textContent).not.toMatch(/Handscanner erkannt/));
  });

  it("Enter ohne Zeichen tut nichts, ein langer Code geht wie bisher durch", () => {
    const ergebnis = vi.fn();
    render(<QrScannerWeb onErgebnis={ergebnis} onAbbruch={() => {}} fortschritt="" />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(ergebnis).not.toHaveBeenCalled();
    for (const z of "https://example.org/x") fireEvent.keyDown(window, { key: z });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(ergebnis).toHaveBeenCalledWith("https://example.org/x");
  });
});
