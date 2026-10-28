/**
 * Ortssperre gegen den zögernden zweiten Tipp (Audit Runde 3, R3-S5, R3-G2):
 * Nach einem Austausch unter dem Finger nimmt die Stelle eine Weile nichts an,
 * gleich welcher Knopf dort inzwischen liegt.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ORTSSPERRE_MS,
  ORTSSPERRE_RADIUS_PX,
  QUITTUNG_SPERRE_MS,
  SCHRITTWECHSEL_SPERRE_MS,
  SEITENWECHSEL_SPERRE_MS,
  ortSperren,
  tippSchutzZuruecksetzen,
} from "./tipp-schutz";

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

// Audit Runde 5, R5-S3: Nach der bestätigten Rückfrage lag der Knopf der
// nächsten Karte unter der Bestätigung; ein Tipp-Rhythmus von 0,5 bis 1 s
// bestätigte sie. Beide Stellen sind gesperrt, und jeder dort verworfene Tipp
// verlängert die Sperre (bis zur Kappe).
describe("Mehrere gesperrte Stellen und verlängerte Sperre (R5-S3)", () => {
  afterEach(() => vi.restoreAllMocks());

  function aufbau() {
    tippSchutzZuruecksetzen();
    const getroffen = vi.fn<(e: Event) => void>();
    const knopf = document.createElement("button");
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    return { knopf, getroffen };
  }

  it("sperrt die Stelle des auslösenden Knopfs und die der Bestätigung gleichzeitig", () => {
    const { knopf, getroffen } = aufbau();
    ortSperren(undefined, { x: 100, y: 250 });
    tipp(knopf, 180, 500); // Bestätigung
    ortSperren();
    tipp(knopf, 102, 252);
    tipp(knopf, 182, 498);
    expect(getroffen).toHaveBeenCalledTimes(1);
    knopf.remove();
  });

  it("ein Tipp-Rhythmus von 0,7 s gegen die verlängerte Sperre wird bis zur Kappe verworfen, danach nicht mehr", () => {
    const { knopf, getroffen } = aufbau();
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 180, 500);
    ortSperren(undefined, undefined, { verlaengern: true });
    for (let t = 700; t <= 3500; t += 700) {
      uhr.mockReturnValue(echt + t);
      tipp(knopf, 180, 500);
    }
    expect(getroffen).toHaveBeenCalledTimes(1);
    // Nach der Kappe von 4 s kommt der Tipp wieder durch.
    uhr.mockReturnValue(echt + 4200);
    tipp(knopf, 180, 500);
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });

  it("eine gewöhnliche Sperre verlängert sich nicht (R5-S2: zügiges Durchgehen bleibt möglich)", () => {
    const { knopf, getroffen } = aufbau();
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 180, 500);
    ortSperren();
    uhr.mockReturnValue(echt + 700);
    tipp(knopf, 180, 500); // verworfen
    uhr.mockReturnValue(echt + ORTSSPERRE_MS + 50);
    tipp(knopf, 180, 500);
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });
});

describe("Ein verworfener Tipp zeigt sich (R5-S2, R5-G5)", () => {
  afterEach(() => {
    tippSchutzZuruecksetzen();
    vi.useRealTimers();
  });

  it("der Knopf trägt kurz eine Marke, über dem Finger steht „Einen Moment …“, beides verschwindet wieder", () => {
    vi.useFakeTimers();
    tippSchutzZuruecksetzen();
    const knopf = document.createElement("button");
    document.body.appendChild(knopf);
    tipp(knopf, 100, 300);
    ortSperren();
    tipp(knopf, 102, 302);
    expect(knopf.hasAttribute("data-tipp-gesperrt")).toBe(true);
    const pille = document.getElementById("tipp-moment")!;
    expect(pille.textContent).toBe("Einen Moment …");
    expect(pille.hidden).toBe(false);
    expect(pille.getAttribute("role")).toBe("status");
    // Über dem Finger, nicht darunter.
    expect(parseInt(pille.style.top)).toBeLessThan(300);
    vi.advanceTimersByTime(1000);
    expect(knopf.hasAttribute("data-tipp-gesperrt")).toBe(false);
    expect(pille.hidden).toBe(true);
    knopf.remove();
  });

  // Audit Runde 6, R6-H1: Im modalen Fenster (QR-Vollbild) verdeckte die oberste Ebene den Hinweis.
  it("hängt den Hinweis in das oberste offene Fenster, damit er nicht verdeckt bleibt (R6-H1)", () => {
    vi.useFakeTimers();
    tippSchutzZuruecksetzen();
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    const knopf = document.createElement("button");
    dialog.appendChild(knopf);
    document.body.appendChild(dialog);
    tipp(knopf, 100, 300);
    ortSperren();
    tipp(knopf, 102, 302);
    const pille = document.getElementById("tipp-moment")!;
    expect(pille.parentElement).toBe(dialog);
    vi.advanceTimersByTime(1000);
    dialog.remove();
  });
});

// Audit Runde 7, R7-H5: Bei Browser-Zoom liegen die Reiter der Schrittleiste nur 25 bis 35 CSS-px auseinander;
// der feste Radius von 40 px sperrte den Nachbarreiter mit.
describe("Radius der Ortssperre folgt der Breite des Ziels (R7-H5)", () => {
  function reiter(links: number, breite: number): HTMLButtonElement {
    const b = document.createElement("button");
    b.getBoundingClientRect = () =>
      ({ left: links, right: links + breite, width: breite, top: 0, bottom: 44, height: 44, x: links, y: 0, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(b);
    return b;
  }
  beforeEach(() => tippSchutzZuruecksetzen());
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("der Nachbarreiter in 25 px Abstand bleibt bei 25 px breiten Reitern bedienbar, derselbe Reiter ist gesperrt", () => {
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    const fuenf = reiter(100, 25);
    const vier = reiter(75, 25);
    const treffer = vi.fn();
    vier.addEventListener("click", treffer);
    tipp(fuenf, 112, 20); // Reiter 5
    ortSperren();
    uhr.mockReturnValue(echt + 600);
    tipp(vier, 87, 20); // Reiter 4, 25 px daneben: darf zählen
    expect(treffer).toHaveBeenCalledTimes(1);
    const nochmal = vi.fn();
    fuenf.addEventListener("click", nochmal);
    tipp(fuenf, 113, 22); // derselbe Reiter, zögernder zweiter Tipp: gesperrt
    expect(nochmal).not.toHaveBeenCalled();
  });

  it("ein Ziel ohne Maß (Testumgebung) behält den festen Radius", () => {
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    const b = document.createElement("button");
    document.body.appendChild(b);
    const treffer = vi.fn();
    b.addEventListener("click", treffer);
    tipp(b, 100, 300);
    ortSperren();
    uhr.mockReturnValue(echt + 600);
    tipp(b, 100 + ORTSSPERRE_RADIUS_PX - 5, 300);
    expect(treffer).toHaveBeenCalledTimes(1);
  });
});

// Audit Runde 7, R7-H4: Im QR-Vollbild quer lag die Pille über „Teil n von m".
describe("Hinweis im QR-Vollbild (R7-H4)", () => {
  it("trägt dort die Klasse, die ihn fest in die Spalte setzt; außerhalb nicht", () => {
    vi.useFakeTimers();
    tippSchutzZuruecksetzen();
    const dialog = document.createElement("dialog");
    dialog.className = "qr-vollbild";
    dialog.setAttribute("open", "");
    const knopf = document.createElement("button");
    dialog.appendChild(knopf);
    document.body.appendChild(dialog);
    tipp(knopf, 100, 300);
    ortSperren();
    tipp(knopf, 102, 302);
    expect(document.getElementById("tipp-moment")!.classList.contains("im-vollbild")).toBe(true);
    vi.advanceTimersByTime(1000);
    dialog.remove();
    tippSchutzZuruecksetzen();
    const b2 = document.createElement("button");
    document.body.appendChild(b2);
    tipp(b2, 100, 300);
    ortSperren();
    tipp(b2, 102, 302);
    expect(document.getElementById("tipp-moment")!.classList.contains("im-vollbild")).toBe(false);
    vi.advanceTimersByTime(1000);
    b2.remove();
    tippSchutzZuruecksetzen();
    vi.useRealTimers();
  });
});

describe("Sperre hinter der Rückfrage (R8-H5, R8-S4, R8-D5)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    tippSchutzZuruecksetzen();
    vi.restoreAllMocks();
  });

  it("gilt nicht für Tipps in einer offenen Rückfrage, wohl aber dahinter", () => {
    tippSchutzZuruecksetzen();
    const dahinter = document.createElement("button");
    const dialog = document.createElement("dialog");
    dialog.className = "abfrage";
    dialog.setAttribute("open", "");
    const imDialog = document.createElement("button");
    dialog.appendChild(imDialog);
    document.body.append(dahinter, dialog);
    const dahinterGetroffen = vi.fn();
    const imDialogGetroffen = vi.fn();
    dahinter.addEventListener("click", dahinterGetroffen);
    imDialog.addEventListener("click", imDialogGetroffen);
    tipp(dahinter, 100, 300); // Auslöser
    ortSperren(undefined, undefined, { nurAusserhalbRueckfrage: true });
    tipp(imDialog, 102, 302); // bewusster Tipp auf den Dialogknopf an derselben Stelle
    expect(imDialogGetroffen).toHaveBeenCalledTimes(1);
    expect(document.getElementById("tipp-moment")).toBeNull();
    tipp(dahinter, 101, 301); // Doppeltipp auf den Auslöser nach dem Schließen: gesperrt
    expect(dahinterGetroffen).toHaveBeenCalledTimes(1);
  });

  it("die Sperre unter einer schwebenden Quittung dauert so lang wie die Ortssperre; „Rückgängig“ selbst ist nie gesperrt (R8-D5, R18-G3)", () => {
    expect(QUITTUNG_SPERRE_MS).toBe(ORTSSPERRE_MS);
  });
});


// Audit Runde 9, R9-H5: Nach einem Wechsel der Ansicht gilt die Sperre 600 ms und nur an der Stelle des Tipps.
describe("Sperre nach einem Wechsel der Ansicht (R9-H5)", () => {
  it("ist höchstens 600 ms lang und kürzer als die normale Ortssperre", () => {
    expect(SEITENWECHSEL_SPERRE_MS).toBeGreaterThan(0);
    expect(SEITENWECHSEL_SPERRE_MS).toBeLessThanOrEqual(600);
    expect(SEITENWECHSEL_SPERRE_MS).toBeLessThan(ORTSSPERRE_MS);
  });

  it("schluckt nach 700 ms nichts mehr, und 255 px weiter unten schon gar nicht", () => {
    tippSchutzZuruecksetzen();
    const knopf = document.createElement("button");
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    const t0 = Date.now();
    vi.useFakeTimers({ toFake: ["Date"], now: t0 });
    try {
      tipp(knopf, 180, 272);
      ortSperren(SEITENWECHSEL_SPERRE_MS);
      vi.setSystemTime(t0 + 300);
      tipp(knopf, 180, 527); // andere Stelle, 255 px entfernt
      expect(getroffen).toHaveBeenCalledTimes(2);
      vi.setSystemTime(t0 + 700);
      tipp(knopf, 180, 272); // dieselbe Stelle, nach 700 ms
      expect(getroffen).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
      knopf.remove();
      tippSchutzZuruecksetzen();
    }
  });
});

describe("Sperre nach einem Schrittwechsel (R10-S2)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("dauert 0,6 s (R18): Doppeltipp (bis 500 ms) gesperrt, gleichmäßiges Weitertippen ab 1 s angenommen", () => {
    expect(SCHRITTWECHSEL_SPERRE_MS).toBe(600);
    expect(SCHRITTWECHSEL_SPERRE_MS).toBeLessThan(ORTSSPERRE_MS);
    tippSchutzZuruecksetzen();
    const knopf = document.createElement("button");
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 200, 580);
    ortSperren(SCHRITTWECHSEL_SPERRE_MS);
    uhr.mockReturnValue(echt + 500);
    tipp(knopf, 200, 580); // Doppeltipp: gesperrt
    expect(getroffen).toHaveBeenCalledTimes(1);
    uhr.mockReturnValue(echt + 1000);
    tipp(knopf, 200, 580); // im Takt von einer Sekunde: kommt an
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });
});
