/**
 * Fußzeile — die Wege, die den Gerätespeicher unumkehrbar anfassen: „Alle Daten
 * löschen", „Sicherung einspielen" und „Geräteschlüssel neu erzeugen".
 *
 * Alle drei hängen an einer Zustimmung: einmal an einem Kontrollkästchen,
 * zweimal an einer Rückfrage. Geprüft wird darum nicht der Klick, sondern der
 * Speicher danach — und ausdrücklich auch, dass ohne Zustimmung nichts
 * passiert.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht } from "./dialoge";
import { Fusszeile } from "./fusszeile";
import { neuerBogen } from "./hilfen";
import { vorlageAnlegen, vorlagenLaden } from "./vorlagen";
import { sicherungErstellen } from "./sicherung";
import { geraeteSchluesselSicherstellen } from "./geraete-schluessel";
import { zuHex } from "@bos/eeb-format/signatur";
import { EinsatzArt, einsatzAnlegen, einsaetzeLaden, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";

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

/**
 * Wie sicher liegt es hier, und wann gab es zuletzt eine Kopie? (Audit Runde 2,
 * R2-O6) — dauerhafter Speicher, letzte Sicherung, dezente Erinnerung.
 */
describe("Datensicherung: Speicherstatus und Erinnerung", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    Reflect.deleteProperty(navigator, "storage");
  });

  function speicherVorspielen(dauerhaft: boolean) {
    const zustand = { dauerhaft };
    const persist = vi.fn(async () => {
      zustand.dauerhaft = true;
      return true;
    });
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: { persisted: async () => zustand.dauerhaft, persist },
    });
    return persist;
  }

  it("zeigt nicht dauerhaften Speicher an und bittet auf Knopfdruck darum", async () => {
    const persist = speicherVorspielen(false);
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Datensicherung" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Datensicherung']")!;
    expect(await within(dialog).findByText(/Speicher ist nicht dauerhaft/)).toBeDefined();
    expect(within(dialog).getByText("Auf diesem Gerät wurde noch keine Sicherung erstellt.")).toBeDefined();

    await nutzer.click(within(dialog).getByRole("button", { name: "Dauerhaften Speicher anfragen" }));
    expect(persist).toHaveBeenCalled();
    expect(await within(dialog).findByText(/hält den Speicher dieser App dauerhaft vor/)).toBeDefined();
  });

  it("erinnert in der Fußzeile, wenn eine Sammlung mit Meldungen seit Tagen ungesichert ist", async () => {
    const s = einsatzAnlegen("Sturmflut", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, neuerBogen(), { quelle: "manuell" });
    localStorage.setItem("eeb.sicherung.zuletzt.v1", String(Date.now() - 5 * 86_400_000));
    buehne();

    expect(screen.getByText(/Letzte Sicherung vor 5 Tagen/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Jetzt sichern…" })).toBeDefined();
  });

  it("schweigt ohne wertvolle Daten", () => {
    buehne();
    expect(screen.queryByRole("button", { name: "Jetzt sichern…" })).toBeNull();
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
    // Auf dem Gerät liegt eine Vorlage: ohne Haken kein Ersetzen (R4-D2).
    expect(within(dialog).getByRole("button", { name: "Einspielen und ersetzen" })).toHaveProperty("disabled", true);
    await nutzer.click(within(dialog).getByLabelText(/Ja, die Daten dieses Geräts/));
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

  it("nennt laufende Sammlungen und den Datei-Inhalt, bietet die Sicherung vorher an und verlangt den Haken (R2-D3)", async () => {
    const nutzer = userEvent.setup();
    const datei = sicherungsdatei();
    const s = einsatzAnlegen("Heute Nacht Starkregen", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, neuerBogen(), { quelle: "manuell" });
    buehne();

    await nutzer.upload(dateiFeld(), datei);
    const dialog = await screen.findByRole("dialog", { name: "Sicherung einspielen?" });

    expect(within(dialog).getByText(/Sammlung „Heute Nacht Starkregen“ mit 1 Meldung/)).toBeDefined();
    expect(within(dialog).getByText(/In der Datei „eeb-sicherung.json“/)).toBeDefined();
    expect(within(dialog).getByText("1 Vorlage")).toBeDefined(); // aus der Datei
    expect(within(dialog).getByText(/Anders als „Einsatz importieren…“ wird nichts ergänzt/)).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Vorher Sicherung erstellen…" })).toBeDefined();

    const ersetzen = within(dialog).getByRole("button", { name: "Einspielen und ersetzen" });
    expect(ersetzen).toHaveProperty("disabled", true);
    await nutzer.click(within(dialog).getByLabelText(/Ja, die Daten dieses Geräts/));
    await nutzer.click(ersetzen);

    expect(await screen.findByRole("dialog", { name: "Sicherung eingespielt" })).toBeDefined();
    expect(einsaetzeLaden()).toHaveLength(0);
  });

  /**
   * Audit Runde 4, R4-D2: Leerer Arbeitsplatz, belegter Rückholplatz und
   * Absenderkarte — die Liste sagte „kein angefangener Bogen", verlangte
   * keinen Haken und löschte beides.
   */
  it("nennt Rückholplatz, Absenderkarte und Geräteschlüssel mit Kurzform und verlangt dann den Haken (R4-D2)", async () => {
    const nutzer = userEvent.setup();
    const datei = sicherungsdatei();
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Crailsheim";
    localStorage.setItem("eeb.entwurf.ersetzt.v1", JSON.stringify({ gespeichert: Date.now(), bogen: b }));
    localStorage.setItem("eeb.absenderkarte.v1", JSON.stringify({ name: "Zugtrupp Albstadt" }));
    await geraeteSchluesselSicherstellen();
    buehne();

    await nutzer.upload(dateiFeld(), datei);
    const dialog = await screen.findByRole("dialog", { name: "Sicherung einspielen?" });
    expect(within(dialog).getByText(/der zuletzt verdrängte Bogen „THW Crailsheim“/)).toBeDefined();
    expect(within(dialog).getByText("die hinterlegte Absenderkarte")).toBeDefined();
    expect(within(dialog).getByText(/der Signatur-Geräteschlüssel \(Kurzform [0-9a-f]{4} [0-9a-f]{4} [0-9a-f]{4} [0-9a-f]{4}\)/)).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Einspielen und ersetzen" })).toHaveProperty("disabled", true);
  });

  it("erklärt eine abgeschnittene Sicherung ohne Programmtext und fragt gar nicht erst (R2-E5)", async () => {
    const nutzer = userEvent.setup();
    const inhalt = await sicherungsdatei().text();
    vorlageAnlegen("Vorher auf dem Gerät", neuerBogen());
    buehne();

    await nutzer.upload(dateiFeld(), new File([inhalt.slice(0, 40)], "eeb-sicherung.json", { type: "application/json" }));

    const meldung = await screen.findByText(/beschädigt oder unvollständig/);
    expect(meldung.getAttribute("role")).toBe("alert");
    expect(meldung.textContent).toMatch(/Daten auf diesem Gerät sind unverändert/);
    expect(meldung.textContent).not.toMatch(/JSON|Unexpected/);
    expect(screen.queryByRole("dialog", { name: "Sicherung einspielen?" })).toBeNull();
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

/**
 * „Link" in der Beispielbogen-Zeile: Ohne Share-Sheet (jsdom hat keins) geht der
 * Link in die Zwischenablage. Geprüft wird, dass dort wirklich ein App-Link mit
 * Nutzlast landet — nicht die Beispiel-JSON-URL, aus der er entsteht. Die
 * Zwischenablage stellt userEvent selbst, gelesen wird sie darum über ihre
 * eigene API.
 */
describe("Beispielbogen-Link kopieren", () => {
  it("legt den Bogen-Link in die Zwischenablage", async () => {
    const bogenJson = JSON.stringify({ ...neuerBogen(), uebung: true });
    const echtesFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(bogenJson, { headers: { "content-type": "application/json" } });
    const nutzer = userEvent.setup();
    try {
      buehne();
      await nutzer.click(screen.getByRole("button", { name: "Beispielbögen" }));
      const dialog = await screen.findByRole("dialog", { name: "Beispielbögen" });
      await nutzer.click(within(dialog).getByRole("button", { name: /^THW/ }));
      const knoepfe = await within(dialog).findAllByRole("button", { name: "Link" }, { timeout: 15000 });
      await nutzer.click(knoepfe[0]!);

      await screen.findByRole("button", { name: "Kopiert" }, { timeout: 15000 });
      const kopiert = await navigator.clipboard.readText();
      expect(kopiert.startsWith("https://erfassungsbogen.app/#")).toBe(true);
      expect(kopiert.length).toBeGreaterThan("https://erfassungsbogen.app/#".length + 20);
    } finally {
      globalThis.fetch = echtesFetch;
    }
  }, 20000);
});
