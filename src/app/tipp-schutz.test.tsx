/**
 * Ortssperre gegen den zögernden zweiten Tipp (Audit Runde 3, R3-S5, R3-G2):
 * Nach einem Austausch unter dem Finger nimmt die Stelle eine Weile nichts an,
 * gleich welcher Knopf dort inzwischen liegt.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ORTSSPERRE_MS, ORTSSPERRE_RADIUS_PX, ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";

function tipp(el: HTMLElement, x: number, y: number, detail = 1) {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail }));
}

describe("Ortssperre nach einem Austausch unter dem Finger", () => {
  let knopf: HTMLButtonElement;
  let getroffen: ReturnType<typeof vi.fn<(e: Event) => void>>;
  beforeEach(() => {
    tippSchutzZuruecksetzen();
    knopf = document.createElement("button");
    getroffen = vi.fn<(e: Event) => void>();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
  });
  afterEach(() => {
    knopf.remove();
    vi.restoreAllMocks();
  });

  it("schluckt den zweiten Tipp an derselben Stelle nach 700 und 1 000 ms", () => {
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 100, 300); // „Abrücken"
    ortSperren();
    expect(getroffen).toHaveBeenCalledTimes(1);
    uhr.mockReturnValue(echt + 700);
    tipp(knopf, 104, 296); // „Wieder anwesend" oder „Rückgängig" am selben Platz
    uhr.mockReturnValue(echt + 1000);
    tipp(knopf, 98, 305);
    expect(getroffen).toHaveBeenCalledTimes(1);
  });

  it("lässt einen Tipp daneben sofort durch und gibt die Stelle nach der Sperre frei", () => {
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 100, 300);
    ortSperren();
    uhr.mockReturnValue(echt + 200);
    tipp(knopf, 100, 300 + ORTSSPERRE_RADIUS_PX + 20);
    expect(getroffen).toHaveBeenCalledTimes(2);
    uhr.mockReturnValue(echt + ORTSSPERRE_MS + 10);
    tipp(knopf, 100, 300);
    expect(getroffen).toHaveBeenCalledTimes(3);
  });

  it("sperrt weder Tastatur-Klicks noch Klicks ohne Ort, und ohne Sperre nichts", () => {
    tipp(knopf, 100, 300);
    tipp(knopf, 100, 300); // keine Handlung hat gesperrt
    ortSperren();
    tipp(knopf, 100, 300, 0); // Enter/Leertaste
    tipp(knopf, 0, 0); // Testumgebung ohne Layout
    expect(getroffen).toHaveBeenCalledTimes(4);
  });

  it("sperrt nicht, wenn der letzte Tipp schon über eine Sekunde zurückliegt", () => {
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 100, 300);
    uhr.mockReturnValue(echt + 1500);
    ortSperren(); // etwa eine Rückfrage, die lange offen stand — deren Tipp zählt
    uhr.mockReturnValue(echt + 1600);
    tipp(knopf, 100, 300);
    expect(getroffen).toHaveBeenCalledTimes(2);
  });
});

describe("Ortssperre beim Drücken und mit mitgegebener Stelle", () => {
  afterEach(() => vi.restoreAllMocks());

  it("verhindert an der gesperrten Stelle auch das Drücken (Fokus eines Felds), daneben nicht", () => {
    tippSchutzZuruecksetzen();
    ortSperren(undefined, { x: 100, y: 300 });
    const feld = document.createElement("input");
    document.body.appendChild(feld);
    const druck = (x: number, y: number) => {
      const e = new MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1 });
      feld.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(druck(105, 310)).toBe(true);
    expect(druck(100, 300 + ORTSSPERRE_RADIUS_PX + 20)).toBe(false);
    feld.remove();
  });

  it("sperrt eine mitgegebene Stelle auch ohne frischen Tipp (Rückfrage dazwischen)", () => {
    tippSchutzZuruecksetzen();
    const getroffen = vi.fn<(e: Event) => void>();
    const knopf = document.createElement("button");
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    tipp(knopf, 180, 500); // „Person entfernen" im Dialog
    ortSperren(undefined, { x: 100, y: 250 }); // Stelle des Knopfs an der Karte
    tipp(knopf, 102, 252);
    expect(getroffen).toHaveBeenCalledTimes(1);
    knopf.remove();
  });
});
