/**
 * Fußzeile — die Wege, die den Gerätespeicher unumkehrbar anfassen: „Alle Daten
 * löschen", „Sicherung einspielen" und „Geräteschlüssel neu erzeugen".
 *
 * Alle drei hängen an einer Zustimmung: einmal an einem Kontrollkästchen,
 * zweimal an einer Rückfrage. Geprüft wird darum nicht der Klick, sondern der
 * Speicher danach — und ausdrücklich auch, dass ohne Zustimmung nichts
 * passiert.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht } from "./dialoge";
import { Fusszeile } from "./fusszeile";
import { neuerBogen } from "./hilfen";
import { vorlageAnlegen, vorlagenLaden } from "./vorlagen";
import { sicherungErstellen } from "./sicherung";
import { geraeteSchluesselSicherstellen } from "./geraete-schluessel";
import { zuHex } from "@bos/eeb-format/signatur";

/**
 * Alle Wege starten am Ende die App neu. Das ist hier bewusst nicht geprüft:
 * `location.reload` lässt sich in jsdom nicht ersetzen, und der Neustart ist
 * nur die Aufräumhilfe für den laufenden React-Stand. Geprüft wird, was vor dem
 * Neustart passiert — der Speicher — und die Tests klicken den letzten Knopf
 * („Neu starten"/„Neu laden") darum nicht.
 */
function buehne() {
  render(
    <>
      <Fusszeile onBogenOeffnen={async () => true} />
      <Dialogschicht />
    </>,
  );
}

describe("Alle Daten löschen", () => {
  beforeEach(() => {
    localStorage.clear();
    vorlageAnlegen("Bergungsgruppe Standard", neuerBogen());
  });

  const loeschDialog = () =>
    document.querySelector<HTMLDialogElement>("dialog[aria-label='Alle lokalen Daten löschen']")!;

  it("löscht erst, wenn das Kästchen gesetzt ist — und dann wirklich", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "Alle Daten löschen" }));
    const dialog = loeschDialog();

    // Ohne Zustimmung ist der Knopf gesperrt: kein Weg zum Unfall.
    const loeschen = within(dialog).getByRole("button", { name: "Endgültig löschen" });
    expect(loeschen).toHaveProperty("disabled", true);
    expect(vorlagenLaden()).toHaveLength(1);

    await nutzer.click(within(dialog).getByLabelText(/Ja, alle lokalen Daten/));
    await nutzer.click(loeschen);

    expect(vorlagenLaden()).toHaveLength(0);
    expect(localStorage.length).toBe(0);
    // Die Bestätigung steht da — erst ihr Knopf startet die App neu.
    expect(await screen.findByRole("dialog", { name: "Alle lokalen Daten gelöscht" })).toBeDefined();
  });

  it("lässt beim Schließen des Dialogs alles stehen", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Alle Daten löschen" }));
    await nutzer.click(within(loeschDialog()).getByRole("button", { name: "Abbrechen" }));

    expect(vorlagenLaden()).toHaveLength(1);
  });
});

describe("Sicherung einspielen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /** Sicherungsdatei aus einem Stand mit genau einer Vorlage. */
  function sicherungsdatei(): File {
    vorlageAnlegen("Aus der Sicherung", neuerBogen());
    const inhalt = sicherungErstellen();
    localStorage.clear();
    return new File([inhalt], "eeb-sicherung.json", { type: "application/json" });
  }

  const dateiFeld = () => document.querySelector<HTMLInputElement>('input[type="file"][accept*="json"]')!;

  it("ersetzt die Daten des Geräts, wenn die Rückfrage bejaht wird", async () => {
    const nutzer = userEvent.setup();
    const datei = sicherungsdatei();
    vorlageAnlegen("Vorher auf dem Gerät", neuerBogen());
    buehne();

    await nutzer.upload(dateiFeld(), datei);
    const dialog = await screen.findByRole("dialog", { name: "Sicherung einspielen?" });
    await nutzer.click(within(dialog).getByRole("button", { name: "Einspielen und ersetzen" }));

    // Der eigene Stand ist weg, der Stand aus der Datei steht da.
    expect(await screen.findByRole("dialog", { name: "Sicherung eingespielt" })).toBeDefined();
    expect(vorlagenLaden().map((v) => v.name)).toEqual(["Aus der Sicherung"]);
  });

  it("lässt bei „Abbrechen“ den Stand des Geräts unberührt", async () => {
    const nutzer = userEvent.setup();
    const datei = sicherungsdatei();
    vorlageAnlegen("Vorher auf dem Gerät", neuerBogen());
    buehne();

    await nutzer.upload(dateiFeld(), datei);
    const dialog = await screen.findByRole("dialog", { name: "Sicherung einspielen?" });
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect(vorlagenLaden().map((v) => v.name)).toEqual(["Vorher auf dem Gerät"]);
  });
});

/**
 * Geräteschlüssel neu erzeugen (Maßnahme M3 im Informationssicherheitskonzept):
 * Der Weg hat keinen eigenen Dialog, sondern hängt an der Rückfrage. Geprüft
 * wird darum auch hier der Speicher — und vor allem, dass der neue Schlüssel
 * ein anderer ist als der alte. Ein Weg, der nur löscht und nichts Neues setzt,
 * fiele beim Klick nicht auf.
 */
describe("Geräteschlüssel neu erzeugen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const schluessel = () => localStorage.getItem("eeb.geraeteschluessel.v1");

  it("ersetzt den Schlüssel, wenn die Rückfrage bejaht wird", async () => {
    const nutzer = userEvent.setup();
    const alt = zuHex(await geraeteSchluesselSicherstellen());
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Geräteschlüssel neu erzeugen" }));
    const dialog = await screen.findByRole("dialog", { name: "Geräteschlüssel neu erzeugen?" });
    await nutzer.click(within(dialog).getByRole("button", { name: "Neu erzeugen" }));

    // Die Bestätigung steht da — erst ihr Knopf lädt die App neu.
    expect(await screen.findByRole("dialog", { name: "Geräteschlüssel neu erzeugt" })).toBeDefined();
    expect(schluessel()).not.toBeNull();
    expect(schluessel()).not.toBe(alt);
  });

  it("lässt bei „Abbrechen“ den bisherigen Schlüssel stehen", async () => {
    const nutzer = userEvent.setup();
    const alt = zuHex(await geraeteSchluesselSicherstellen());
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Geräteschlüssel neu erzeugen" }));
    const dialog = await screen.findByRole("dialog", { name: "Geräteschlüssel neu erzeugen?" });
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect(schluessel()).toBe(alt);
  });
});
