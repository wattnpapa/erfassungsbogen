/**
 * Prellschutz der Rückfragen (Audit Runde 2, R2-G1): Die Rückfrage erscheint
 * oft genau unter dem Finger, der den Löschknopf getroffen hat. Ein
 * Doppeltipp bestätigte sie dann gleich mit. Kurz nach dem Öffnen nimmt das
 * Fenster darum keinen Zeiger-Klick an — die Tastatur schon.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Dialogschicht, frageJaNein, prellschutzSetzen } from "./dialoge";

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
