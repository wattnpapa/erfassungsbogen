/**
 * Prellschutz der Rückfragen (Audit Runde 2, R2-G1): Die Rückfrage erscheint
 * oft genau unter dem Finger, der den Löschknopf getroffen hat. Ein
 * Doppeltipp bestätigte sie dann gleich mit. Kurz nach dem Öffnen nimmt das
 * Fenster darum keinen Zeiger-Klick an — die Tastatur schon.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Dialogschicht, frageJaNein, frageWahl, prellschutzSetzen } from "./dialoge";
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

    // Mit zerstörender Wahl trägt der Prellschutz bis 800 ms (R8-H5): ein zögernder Zweittipp nach 0,5 s fällt noch.
    vi.setSystemTime(Date.now() + 350);
    fireEvent.click(knopf, { detail: 1 });
    expect(dialog.hasAttribute("open")).toBe(true);

    // Ein bewusster Tipp nach dem Lesen wirkt.
    vi.setSystemTime(Date.now() + 400);
    fireEvent.click(knopf, { detail: 1 });
    await expect(antwort).resolves.toBe(true);
  });

  it("ohne zerstörende Wahl nimmt die Rückfrage den Tipp nach 450 ms an", async () => {
    prellschutzSetzen(450);
    render(<Dialogschicht />);
    const antwort = frageJaNein({ titel: "Weiter?", text: "?", ok: "Weiter" });
    const dialog = await screen.findByRole("dialog", { name: "Weiter?" });
    const knopf = within(dialog).getByRole("button", { name: "Weiter" });
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() });
    vi.setSystemTime(Date.now() + 150);
    fireEvent.click(knopf, { detail: 1 });
    expect(dialog.hasAttribute("open")).toBe(true);
    vi.setSystemTime(Date.now() + 400);
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

  it("sperrt die Stelle des Auslösers hinter dem Dialog, nicht die Knöpfe des Dialogs (R8-H5, R8-S4)", async () => {
    tippSchutzZuruecksetzen();
    prellschutzSetzen(450);
    let antwort: Promise<boolean> | null = null;
    let ausgeloest = 0;
    render(
      <>
        <button
          type="button"
          onClick={() => {
            ausgeloest++;
            antwort = frageJaNein({ titel: "Einsatz löschen?", text: "?", ok: "In den Papierkorb", gefahr: true });
          }}
        >
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
    // Der Prellschutz der Rückfrage fängt den Zweittipp bis 800 ms ab …
    for (const ms of [574, 746]) {
      vi.setSystemTime(start + ms);
      tippAuf(knopf, 182, 404);
      expect(dialog.hasAttribute("open")).toBe(true);
      expect(document.getElementById("tipp-moment")).toBeNull(); // … ohne „Einen Moment …“ über dem Dialogtext
    }
    // … ein bewusster Tipp danach auf dieselbe Stelle wirkt, auch vor Ablauf von 1,5 s.
    vi.setSystemTime(start + 1156);
    tippAuf(knopf, 182, 404);
    await expect(antwort).resolves.toBe(true);
    expect(ausgeloest).toBe(1);
  });

  it("nach „Abbrechen“ bleibt die Stelle des Auslösers 1,5 s gesperrt", async () => {
    tippSchutzZuruecksetzen();
    let ausgeloest = 0;
    render(
      <>
        <button
          type="button"
          onClick={() => {
            ausgeloest++;
            void frageJaNein({ titel: "Verwerfen?", text: "?", ok: "Verwerfen", gefahr: true });
          }}
        >
          Verwerfen…
        </button>
        <Dialogschicht />
      </>,
    );
    const ausloeser = screen.getByRole("button", { name: "Verwerfen…" });
    tippAuf(ausloeser, 180, 400);
    const dialog = await screen.findByRole("dialog", { name: "Verwerfen?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Abbrechen" }), { detail: 0 });
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    tippAuf(ausloeser, 182, 404); // sofort wieder: Doppeltipp, verschluckt
    expect(ausgeloest).toBe(1);
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

  // Audit Runde 7, R7-E4: Auch ohne zerstörende Antwort kann die sichere Wahl den Fokus tragen.
  it("setzt den Fokus auf „Abbrechen“, wenn die Rückfrage es verlangt (R7-E4)", async () => {
    render(<Dialogschicht />);
    void frageJaNein({ titel: "Neuen Bogen anfangen?", text: "Der Bogen wird ersetzt.", ok: "Neu anfangen", fokus: "abbruch" });
    const d = await screen.findByRole("dialog", { name: "Neuen Bogen anfangen?" });
    expect(document.activeElement).toBe(within(d).getByRole("button", { name: "Abbrechen" }));
  });
});

// Audit Runde 7, R7-W1: Frage und Wege rollen im Rumpf, die Antwortzeile am Fuß steht fest und deckt nichts.
describe("Aufbau der Rückfrage", () => {
  it("trennt bei Wegen mit Erklärtext den rollenden Rumpf vom festen Fuß mit „Abbrechen“", async () => {
    render(<Dialogschicht />);
    void frageWahl({
      titel: "Einheit ist bereits gemeldet",
      text: "Was tun?",
      wege: [
        { wert: "fassung", label: "Als neue Fassung anhängen", hinweis: "Normalfall." },
        { wert: "eigene", label: "Als eigene Einheit führen", hinweis: "Zweite Einheit." },
      ],
    });
    const d = await screen.findByRole("dialog", { name: "Einheit ist bereits gemeldet" });
    const rumpf = d.querySelector(".abfrage-rumpf")!;
    const fuss = d.querySelector(".abfrage-fuss")!;
    expect(rumpf.contains(within(d).getByRole("button", { name: "Als neue Fassung anhängen" }))).toBe(true);
    expect(rumpf.contains(within(d).getByRole("button", { name: "Als eigene Einheit führen" }))).toBe(true);
    expect(fuss.contains(within(d).getByRole("button", { name: "Abbrechen" }))).toBe(true);
    expect(rumpf.contains(within(d).getByRole("button", { name: "Abbrechen" }))).toBe(false);
  });

  it("stellt bei einem Weg ohne Erklärtext Antwort und „Abbrechen“ zusammen an den festen Fuß", async () => {
    render(<Dialogschicht />);
    void frageJaNein({ titel: "Weiter?", text: "Nichts geht verloren.", ok: "Weiter" });
    const d = await screen.findByRole("dialog", { name: "Weiter?" });
    const fuss = d.querySelector(".abfrage-fuss")!;
    expect(fuss.contains(within(d).getByRole("button", { name: "Weiter" }))).toBe(true);
    expect(fuss.contains(within(d).getByRole("button", { name: "Abbrechen" }))).toBe(true);
  });
});
