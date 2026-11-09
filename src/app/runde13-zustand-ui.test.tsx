/**
 * Runde 13, Block Zustand: Verhalten in der Oberfläche (jsdom) — Einsatzbeginn entfernen (D1), Absenderkarte leeren (D2),
 * Aufteilen ohne Rest (D3), Schnellerfassung (S2), Eingabe beim Verlassen der Karte (S3), Doppeltipp beim
 * Sammel-PDF (G1), „Neu laden“ im Update-Hinweis (O4), Ersetzen einer Vorlage (D4).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { neuerBogen } from "./hilfen";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import { absenderkarteLaden, absenderkarteSpeichern } from "./absenderkarte";
import { Uebersicht } from "./schritte/uebersicht";
import { vorlageAnlegen, vorlagenLaden } from "./vorlagen";
import { WebUpdateBanner } from "./aktualisierung";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittSofortbedarf } from "./schritte/sofortbedarf";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}


describe("R13-D2 Absenderkarte mit leeren Feldern übernehmen", () => {
  beforeEach(() => localStorage.clear());

  it("fragt wie „Angaben entfernen…“ nach, statt still zu löschen", async () => {
    const nutzer = userEvent.setup();
    absenderkarteSpeichern({ name: "Max Muster", telefon: "01711234567" });
    const gespeichert = vi.fn();
    render(
      <>
        <AbsenderkarteFeld karte={absenderkarteLaden()} onGespeichert={gespeichert} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "ändern" }));
    await nutzer.clear(screen.getByLabelText("Name"));
    await nutzer.clear(screen.getByLabelText("Telefon"));
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));

    const frage = await screen.findByRole("dialog", { name: "Absenderangaben entfernen?" });
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect(gespeichert).not.toHaveBeenCalled();
    expect(absenderkarteLaden().name).toBe("Max Muster");

    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Absenderangaben entfernen?" })).getByRole("button", { name: "Angaben entfernen" }));
    expect(gespeichert).toHaveBeenCalledTimes(1);
    expect(absenderkarteLaden()).toEqual({});
  });

  it("ohne gespeicherte Karte schließt „Übernehmen“ mit leeren Feldern ohne Frage", async () => {
    const nutzer = userEvent.setup();
    const gespeichert = vi.fn();
    render(
      <>
        <AbsenderkarteFeld karte={{}} startOffen onGespeichert={gespeichert} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(gespeichert).not.toHaveBeenCalled();
  });
});

describe("R13-D4 Ersetzen einer Vorlage nennt auch Ort/Auftrag und Sofortbedarf", () => {
  beforeEach(() => localStorage.clear());

  it("die Rückfrage führt den Unterschied beim Auftrag auf", async () => {
    const nutzer = userEvent.setup();
    const alt = bogenMitName("OV Test");
    const v = vorlageAnlegen("OV Test", alt);
    // Die gespeicherte Vorlage trägt einen Auftrag (ältere Vorlagen oder von Hand eingespielt).
    const roh = JSON.parse(localStorage.getItem("eeb.vorlagen.v1")!) as Array<{ id: string; bogen: Erfassungsbogen }>;
    roh.find((x) => x.id === v.id)!.bogen.einsatz.ortAuftrag = "Auftrag ALT wichtig";
    localStorage.setItem("eeb.vorlagen.v1", JSON.stringify(roh));
    expect(vorlagenLaden()[0]!.bogen.einsatz.ortAuftrag).toBe("Auftrag ALT wichtig");

    render(
      <>
        <Uebersicht bogen={bogenMitName("OV Test")} geheZu={() => {}} neu={() => {}} onVorlageGespeichert={() => {}} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Als Vorlage speichern" }));
    const frage = await screen.findByRole("dialog", { name: "Als Vorlage speichern" });
    const feld = within(frage).getByRole("textbox");
    await nutzer.clear(feld);
    await nutzer.type(feld, "OV Test");
    await nutzer.click(within(frage).getByRole("button", { name: "Vorlage speichern" }));
    const gleich = await screen.findByRole("dialog", { name: "Vorlage mit diesem Namen vorhanden" });
    expect(gleich.textContent).toContain("Weitere Unterschiede");
    expect(gleich.textContent).toContain("Ort/Auftrag: „Auftrag ALT wichtig\" → „leer\"");
  });
});

describe("R13-E1 Sofortbedarf: Satz und gespeicherter Wert passen zusammen", () => {
  function bedarf() {
    const b = neuerBogen();
    b.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    render(<SchrittBuehne komponente={SchrittSofortbedarf} bogen={b} />);
    return screen.getByLabelText("Diesel (l)") as HTMLInputElement;
  }

  it("beim Tippen von „5O“ nennt der Satz, dass 5 weitergilt", async () => {
    const nutzer = userEvent.setup();
    const diesel = bedarf();
    await nutzer.type(diesel, "5O");
    const meldungen = document.querySelector(".zahl-meldungen")!;
    expect(meldungen.textContent).toContain("„5O“ ist keine Zahl — nicht übernommen. Es gilt weiter 5.");
    await nutzer.tab();
    expect(diesel.value).toBe("5"); // das Feld zeigt, was gespeichert ist — wie der Satz sagt
  });

  it("beim Einfügen von „5O“ in ein leeres Feld gilt weiter 0", async () => {
    const nutzer = userEvent.setup();
    const diesel = bedarf();
    await nutzer.click(diesel);
    await nutzer.paste("5O");
    expect(document.querySelector(".zahl-meldungen")!.textContent).toContain("Es gilt weiter 0.");
    await nutzer.tab();
    expect(diesel.value).toBe("0");
  });
});

describe("R13-O4 „Neu laden“ im Update-Hinweis", () => {
  it("rendert nichts, solange keine neue Version wartet (Banner erscheint erst auf Meldung des Service Workers)", () => {
    render(<WebUpdateBanner />);
    expect(document.querySelector(".update-banner")).toBeNull();
  });
});
