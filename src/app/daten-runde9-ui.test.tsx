/**
 * Runde 9, Block Daten: Hinweiskasten für Beiseitegelegtes (R9-A1, R9-N4, R9-H4, R9-E4), Rückwege im
 * Assistenten, die Schrittwechsel und Neuladen überleben (R9-D3), Lagemonitor bei unlesbarem Text (R9-O2)
 * und Sollstärke an Monitor und Kachel (R9-K1).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentType } from "react";
import { Dialogschicht } from "./dialoge";
import { neuerBogen, neuesFahrzeug } from "./hilfen";
import { UnlesbarHinweis } from "./unlesbar-hinweis";
import { sammlungenRetteZuruecksetzen, sammlungenRetten, unlesbarBestand } from "./unlesbar";
import { einsaetzeLesenZuruecksetzen } from "./einsaetze-lesen";
import { SchrittFahrzeuge } from "./schritte/fahrzeuge";
import { SchrittEinheit } from "./schritte/einheit";
import { entwurfAusJson, entwurfZuJson } from "./entwurf";
import { FAHRZEUG_WEG_SCHLUESSEL, rueckwegHolen, rueckwegMerken } from "./rueckweg-sitzung";
import type { SchrittProps } from "./schritte";
import type { Erfassungsbogen } from "@bos/eeb-format/model";

const ABGESCHNITTEN = '[{"id":"s1","name":"Hochwasser Musterstadt","art":0,"eintraege":[{"id":"e1","einheitSchluessel":"a","bogen":{"personal":[{"vorname":"An';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  einsaetzeLesenZuruecksetzen();
  sammlungenRetteZuruecksetzen();
});
afterEach(cleanup);

describe("Kasten für Beiseitegelegtes (R9-A1, R9-N4, R9-H4)", () => {
  it("nennt die Sammlung beim Namen, sagt, dass erst „Daten sichern…“ eine Datei anlegt, und nennt den Papier-Rückweg", () => {
    sammlungenRetten(ABGESCHNITTEN);
    render(<UnlesbarHinweis />);
    const kasten = document.querySelector(".unlesbar-hinweis")!;
    const text = kasten.textContent!;
    expect(text).toContain("Hochwasser Musterstadt");
    expect(text).not.toMatch(/Gesamttext/);
    expect(text).toMatch(/erst „Daten sichern…“ legt eine\s+Datei an/);
    expect(text).toMatch(/Sammel-PDF gilt weiter/);
    expect(text).toMatch(/Bögen einlesen/);
    expect(text).not.toMatch(/stecken in der Datensicherung/);
  });

  it("zeigt zugeklappt nur die Kopfzeile: Die Knöpfe stehen hinter dem Antippen (kompakt, R9-M6, R9-S4)", () => {
    sammlungenRetten(ABGESCHNITTEN);
    render(<UnlesbarHinweis />);
    const details = document.querySelector<HTMLDetailsElement>(".unlesbar-hinweis details")!;
    expect(details.open).toBe(false);
    expect(details.querySelector("summary")!.textContent!.length).toBeLessThan(200);
  });

  it("„Beiseitegelegtes entfernen…“ räumt auch den beschädigten Vorlagentext am Ursprungsort (R9-E4)", async () => {
    const nutzer = userEvent.setup();
    localStorage.setItem("eeb.unlesbar.v1", JSON.stringify({ am: Date.now(), sammlungen: [], meldungen: [], vorlagen: [], texte: [{ art: "vorlagen", text: '[{"id":"v1"' }] }));
    localStorage.setItem("eeb.vorlagen.v1", '[{"id":"v1"');
    render(
      <>
        <UnlesbarHinweis />
        <Dialogschicht />
      </>,
    );
    const details = document.querySelector<HTMLDetailsElement>(".unlesbar-hinweis details")!;
    await nutzer.click(details.querySelector("summary")!);
    await nutzer.click(screen.getByRole("button", { name: "Beiseitegelegtes entfernen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Endgültig entfernen" }));
    await waitFor(() => expect(unlesbarBestand()).toBeNull());
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBe("[]");
    expect(document.querySelector(".unlesbar-hinweis")).toBeNull();
  });
});

describe("Voller Speicher: der Kasten nennt das Scheitern (R9-O1, R9-E5)", () => {
  it("sagt „Speicher voll – beschädigte Daten nicht gesichert“, wenn das Beiseitelegen nicht ging", () => {
    const echt = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (k === "eeb.unlesbar.v1") throw new DOMException("quota", "QuotaExceededError");
      return echt.call(this, k, v);
    };
    try {
      localStorage.setItem("eeb.einsaetze.v1", ABGESCHNITTEN);
      sammlungenRetten(ABGESCHNITTEN);
      render(<UnlesbarHinweis />);
      const text = document.querySelector(".unlesbar-hinweis")!.textContent!;
      expect(text).toContain("Speicher voll – beschädigte Daten nicht gesichert");
      expect(text).toContain("Hochwasser Musterstadt");
      expect(text).toMatch(/Daten sichern/);
      expect(localStorage.getItem("eeb.einsaetze.v1")).toBe(ABGESCHNITTEN);
    } finally {
      Storage.prototype.setItem = echt;
    }
  });
});

describe("Voller Speicher: Wortlaut und Rat passen zum Zustand (R10-O1, R10-O2, R10-H2)", () => {
  it("beugt Verb und Satzende in der Mehrzahl und nennt nur erreichbare Wege", () => {
    const echt = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (k === "eeb.unlesbar.v1") throw new DOMException("quota", "QuotaExceededError");
      return echt.call(this, k, v);
    };
    try {
      localStorage.setItem("eeb.einsaetze.v1", "[[[");
      sammlungenRetten("[[[");
      render(<UnlesbarHinweis />);
      const text = document.querySelector(".unlesbar-hinweis")!.textContent!;
      expect(text).toContain("gespeicherte Einsatz-Sammlungen sind nicht lesbar und konnten nicht beiseitegelegt werden");
      // Eine unlesbare Sammlung: kein Rat, Papierkorb oder gesicherte Einsätze zu löschen.
      expect(text).not.toContain("Papierkorb leeren oder gesicherte Einsätze löschen");
      expect(text).toContain("Beschädigten Text verwerfen…");
    } finally {
      Storage.prototype.setItem = echt;
    }
  });

  it("nennt in der Rückfrage zum Entfernen, was entfernt wird (R10-H2)", async () => {
    const nutzer = userEvent.setup();
    localStorage.setItem("eeb.unlesbar.v1", JSON.stringify({ am: Date.now(), sammlungen: [], meldungen: [], vorlagen: [], texte: [{ art: "vorlagen", text: '[{"id":"v1"' }] }));
    localStorage.setItem("eeb.vorlagen.v1", '[{"id":"v1"');
    render(
      <>
        <UnlesbarHinweis />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(document.querySelector<HTMLElement>(".unlesbar-hinweis summary")!);
    await nutzer.click(screen.getByRole("button", { name: "Beiseitegelegtes entfernen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(dialog.textContent).toContain("Endgültig gelöscht wird, was beiseitegelegt liegt: gespeicherte Vorlagen");
  });
});

describe("Rückwege im Assistenten überleben Schrittwechsel und Neuladen (R9-D3)", () => {
  function Wechsel({ start, Schritt }: { start: Erfassungsbogen; Schritt: ComponentType<SchrittProps> }) {
    const [bogen, setBogen] = useState(start);
    const [da, setDa] = useState(true);
    return (
      <>
        <button onClick={() => setDa((d) => !d)}>wechsel</button>
        {da && <Schritt bogen={bogen} aendern={(p) => setBogen((b) => ({ ...b, ...p }))} />}
        <Dialogschicht />
      </>
    );
  }

  it("Fahrzeug: „Rückgängig“ steht nach „Weiter“ und Zurück wieder da", async () => {
    const nutzer = userEvent.setup();
    const start = neuerBogen();
    start.fahrzeuge = [
      { ...neuesFahrzeug(), kennzeichen: "THW-80125" },
      { ...neuesFahrzeug(), kennzeichen: "THW-80126" },
    ];
    render(<Wechsel start={start} Schritt={SchrittFahrzeuge} />);
    const knopf = screen.getAllByRole("button", { name: /entfernen$/ }).find((b) => b.className.includes("entfernen"))!;
    await nutzer.click(knopf);
    const frage = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(frage.textContent).toMatch(/auch nach „Weiter“ oder Neuladen/);
    await nutzer.click(within(frage).getByRole("button", { name: "Fahrzeug entfernen" }));
    await waitFor(() => expect(document.querySelector(".quittung-daumen")).not.toBeNull());

    await nutzer.click(screen.getByRole("button", { name: "wechsel" }));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "wechsel" }));
    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/^Entfernt: .*THW-80125/);
    await nutzer.click(within(leiste).getByRole("button", { name: "Rückgängig" }));
    expect((screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[]).map((f) => f.value)).toEqual(["THW-80125", "THW-80126"]);
  });

  it("Ebene: „Ebene entfernen“ hat jetzt ein „Rückgängig“, auch nach dem Schrittwechsel", async () => {
    const nutzer = userEvent.setup();
    const b = neuerBogen();
    b.einheit.hierarchie = [
      { bezeichnung: { code: 1 }, name: "Wardenburg" },
      { bezeichnung: { code: 2 }, name: "Tübingen", telefon: "07071123" },
    ];
    render(<Wechsel start={b} Schritt={SchrittEinheit} />);
    await nutzer.click(screen.getByRole("button", { name: "Ebene RB Tübingen entfernen" }));
    const frage = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    await nutzer.click(within(frage).getByRole("button", { name: "Ebene entfernen" }));
    expect(screen.getAllByLabelText(/^(Name|Ort der Einheit)/)).toHaveLength(1);
    await nutzer.click(screen.getByRole("button", { name: "wechsel" }));
    await nutzer.click(screen.getByRole("button", { name: "wechsel" }));
    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/Entfernt: RB Tübingen/);
    await nutzer.click(within(leiste).getByRole("button", { name: "Rückgängig" }));
    expect(screen.getAllByLabelText(/^(Name|Ort der Einheit)/)).toHaveLength(2);
    expect(screen.getByDisplayValue("07071123")).toBeTruthy();
  });

  it("der gemerkte Rückweg gilt nur kurz und nur für dieselbe Liste", () => {
    rueckwegMerken(FAHRZEUG_WEG_SCHLUESSEL, { x: 1 }, "liste-a", 1000);
    expect(rueckwegHolen(FAHRZEUG_WEG_SCHLUESSEL, "liste-a", 2000)).toEqual({ x: 1 });
    expect(rueckwegHolen(FAHRZEUG_WEG_SCHLUESSEL, "liste-b", 2000)).toBeNull();
    rueckwegMerken(FAHRZEUG_WEG_SCHLUESSEL, { x: 1 }, "liste-a", 1000);
    expect(rueckwegHolen(FAHRZEUG_WEG_SCHLUESSEL, "liste-a", 1000 + 16 * 60 * 1000)).toBeNull();
    expect(sessionStorage.getItem(FAHRZEUG_WEG_SCHLUESSEL)).toBeNull();
  });
});

describe("Zettelangaben der manuellen Aufnahme bleiben im Entwurf (R9-S1)", () => {
  it("Eingetroffen um, Nr. und Zug überleben Speichern und Laden; Müll fällt weg", () => {
    const b = neuerBogen();
    const text = entwurfZuJson(b, 5, { fremd: { einsatzId: "s1", beginn: 7, zettel: { zeit: "06:55", nr: "7", zug: "2. Zug" } } });
    expect(entwurfAusJson(text)?.fremd?.zettel).toEqual({ zeit: "06:55", nr: "7", zug: "2. Zug" });
    const bose = JSON.parse(text);
    bose.fremd.zettel = { zeit: "morgen", nr: 5, zug: "x".repeat(500), anderes: true };
    expect(entwurfAusJson(JSON.stringify(bose))?.fremd?.zettel).toEqual({ zug: "x".repeat(80) });
    bose.fremd.zettel = { zeit: "", nr: " " };
    expect(entwurfAusJson(JSON.stringify(bose))?.fremd?.zettel).toBeUndefined();
  });
});
