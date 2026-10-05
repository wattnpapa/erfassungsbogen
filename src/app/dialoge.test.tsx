/**
 * Prellschutz der Rückfragen (Audit Runde 2, R2-G1): Die Rückfrage erscheint
 * oft genau unter dem Finger, der den Löschknopf getroffen hat. Ein
 * Doppeltipp bestätigte sie dann gleich mit. Kurz nach dem Öffnen nimmt das
 * Fenster darum keinen Zeiger-Klick an — die Tastatur schon.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Dialogschicht, frageJaNein, prellschutzSetzen } from "./dialoge";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";

describe("Prellschutz der Rückfrage", () => {
  afterEach(() => {
    prellschutzSetzen(0);
    vi.useRealTimers();
  });

  it("verschluckt einen Tipp direkt nach dem Öffnen und nimmt ihn danach an", async () => {
    prellschutzSetzen(450);
    render(<Dialogschicht />);
    const antwort = frageJaNein({ titel: "Person entfernen?", text: "Weg damit?", ok: "Person entfernen", gefahr: true });
    const dialog = await screen.findByRole("dialog", { name: "Person entfernen?" });
    const knopf = within(dialog).getByRole("button", { name: "Person entfernen" });
    // Erst jetzt die Uhr anhalten: das Warten auf den Dialog braucht die echte.
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() });

    // Zweiter Tipp des Doppeltipps: 150 ms nach dem Öffnen.
    vi.setSystemTime(Date.now() + 150);
    fireEvent.click(knopf, { detail: 1 });
    expect(dialog.hasAttribute("open")).toBe(true);

    // Ein bewusster Tipp eine halbe Sekunde später wirkt.
    vi.setSystemTime(Date.now() + 500);
    fireEvent.click(knopf, { detail: 1 });
    await expect(antwort).resolves.toBe(true);
  });

  it("lässt die Tastatur sofort durch", async () => {
    prellschutzSetzen(450);
    render(<Dialogschicht />);
    const antwort = frageJaNein({ titel: "Verwerfen?", text: "?", ok: "Verwerfen" });
    const dialog = await screen.findByRole("dialog", { name: "Verwerfen?" });
    // Enter auf dem Knopf löst einen Klick mit detail 0 aus.
    fireEvent.click(within(dialog).getByRole("button", { name: "Verwerfen" }), { detail: 0 });
    await expect(antwort).resolves.toBe(true);
  });
});

/**
 * Ortssperre an der Stelle des Auslösers (Audit Runde 4, R4-G1): Der
 * Prellschutz deckte nur 450 ms. Ein zögernder zweiter Tipp nach 551 ms
 * bestätigte „Person entfernen". Jetzt nimmt die Stelle des auslösenden
 * Tipps 1,5 s lang nichts an; daneben wirkt ein Tipp sofort.
 */
describe("Ortssperre der Rückfrage", () => {
  afterEach(() => {
    prellschutzSetzen(0);
    tippSchutzZuruecksetzen();
    vi.useRealTimers();
  });

  function tippAuf(el: Element, x: number, y: number) {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1 }));
  }

  it("verschluckt den zweiten Tipp an der Stelle des Auslösers bis 1,5 s, daneben nicht", async () => {
    tippSchutzZuruecksetzen();
    let antwort: Promise<boolean> | null = null;
    render(
      <>
        <button type="button" onClick={() => (antwort = frageJaNein({ titel: "Einsatz löschen?", text: "?", ok: "In den Papierkorb", gefahr: true }))}>
          Einsatz löschen…
        </button>
        <Dialogschicht />
      </>,
    );
    tippAuf(screen.getByRole("button", { name: "Einsatz löschen…" }), 180, 400);
    const dialog = await screen.findByRole("dialog", { name: "Einsatz löschen?" });
    const knopf = within(dialog).getByRole("button", { name: "In den Papierkorb" });
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() });
    const start = Date.now();
    for (const ms of [574, 746, 1156, 1400]) {
      vi.setSystemTime(start + ms);
      tippAuf(knopf, 182, 404);
      expect(dialog.hasAttribute("open")).toBe(true);
    }
    // Bewusst getippt, eine Fingerbreite tiefer: wirkt.
    tippAuf(knopf, 180, 470);
    await expect(antwort).resolves.toBe(true);
  });

  it("gibt die Stelle nach der Sperre frei", async () => {
    tippSchutzZuruecksetzen();
    let antwort: Promise<boolean> | null = null;
    render(
      <>
        <button type="button" onClick={() => (antwort = frageJaNein({ titel: "Verwerfen?", text: "?", ok: "Verwerfen" }))}>
          Verwerfen
        </button>
        <Dialogschicht />
      </>,
    );
    tippAuf(screen.getByRole("button", { name: "Verwerfen" }), 100, 410);
    const dialog = await screen.findByRole("dialog", { name: "Verwerfen?" });
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() });
    vi.setSystemTime(Date.now() + 1600);
    tippAuf(within(dialog).getByRole("button", { name: "Verwerfen" }), 100, 410);
    await expect(antwort).resolves.toBe(true);
  });
});

/** Audit Runde 4, R4-E2: In einer Rückfrage mit Verlust hat „Abbrechen" den Fokus, nicht der rote Knopf. */
describe("Fokus in Rückfragen", () => {
  it("setzt den Fokus bei einer zerstörenden Antwort auf „Abbrechen“, sonst auf die erste Antwort", async () => {
    render(<Dialogschicht />);
    void frageJaNein({ titel: "Meldung öffnen?", text: "Der Bogen dort wird gelöscht.", ok: "Meldung öffnen", gefahr: true });
    const gefahr = await screen.findByRole("dialog", { name: "Meldung öffnen?" });
    expect(document.activeElement).toBe(within(gefahr).getByRole("button", { name: "Abbrechen" }));
    fireEvent.click(within(gefahr).getByRole("button", { name: "Abbrechen" }), { detail: 0 });

    void frageJaNein({ titel: "Weiter?", text: "Nichts geht verloren.", ok: "Weiter" });
    const harmlos = await screen.findByRole("dialog", { name: "Weiter?" });
    expect(document.activeElement).not.toBe(within(harmlos).getByRole("button", { name: "Abbrechen" }));
  });
});
