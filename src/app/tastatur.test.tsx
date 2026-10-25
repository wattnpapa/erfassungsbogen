import { afterEach, describe, expect, it, vi } from "vitest";
import { TASTATUR_KLASSE, istTexteingabe, tastaturOffen, tastaturWaechterStarten } from "./tastatur";

describe("tastaturOffen (R4-G3)", () => {
  it("braucht Fokus in einer Texteingabe UND eine deutlich kleinere sichtbare Höhe", () => {
    expect(tastaturOffen(true, 640, 360)).toBe(true);
    expect(tastaturOffen(false, 640, 360)).toBe(false); // Fenster verkleinert, kein Fokus
    expect(tastaturOffen(true, 640, 640)).toBe(false); // Fokus am Rechner, keine Tastatur
  });

  it("eine eingefahrene Browserleiste (rund 56 px) ist keine Tastatur", () => {
    expect(tastaturOffen(true, 640, 584)).toBe(false);
    expect(tastaturOffen(true, 844, 790)).toBe(false);
  });

  it("quer (360 px Höhe) reicht eine Tastatur von rund 190 px", () => {
    expect(tastaturOffen(true, 360, 170)).toBe(true);
  });

  it("Pinch-Zoom verkleinert die sichtbare Höhe, ohne dass eine Tastatur da ist", () => {
    expect(tastaturOffen(true, 640, 320, 2)).toBe(false);
  });
});

describe("istTexteingabe", () => {
  const el = (html: string) => {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.firstElementChild as HTMLElement;
  };
  it("erkennt Textfelder, Zahlenfelder und Textbereiche", () => {
    expect(istTexteingabe(el('<input type="text">'))).toBe(true);
    expect(istTexteingabe(el("<input>"))).toBe(true);
    expect(istTexteingabe(el('<input type="number">'))).toBe(true);
    expect(istTexteingabe(el("<textarea></textarea>"))).toBe(true);
  });
  it("Kästchen, Optionen, Knöpfe, Datum und schreibgeschützte Felder öffnen keine Tastatur", () => {
    expect(istTexteingabe(el('<input type="checkbox">'))).toBe(false);
    expect(istTexteingabe(el('<input type="radio">'))).toBe(false);
    expect(istTexteingabe(el('<input type="date">'))).toBe(false);
    expect(istTexteingabe(el('<input type="text" readonly>'))).toBe(false);
    expect(istTexteingabe(el("<button>x</button>"))).toBe(false);
    expect(istTexteingabe(null)).toBe(false);
  });
});

describe("tastaturWaechterStarten", () => {
  let stop: (() => void) | undefined;
  afterEach(() => {
    stop?.();
    stop = undefined;
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  /** Ein Fenster mit veränderlicher Höhe; `resize` löst der Test selbst aus. */
  function fenster() {
    const f = window;
    Object.defineProperty(f, "innerHeight", { value: 640, configurable: true, writable: true });
    Object.defineProperty(f, "innerWidth", { value: 360, configurable: true, writable: true });
    return f;
  }

  it("setzt die Klasse bei Fokus im Feld und geschrumpftem Fenster, nimmt sie beim Verlassen zurück", () => {
    vi.useFakeTimers();
    const f = fenster();
    document.body.innerHTML = '<input id="a" type="text"><button id="b">x</button>';
    stop = tastaturWaechterStarten(f, document);
    const feld = document.getElementById("a") as HTMLInputElement;
    const html = document.documentElement;

    feld.focus();
    vi.runAllTimers();
    expect(html.classList.contains(TASTATUR_KLASSE)).toBe(false); // Fenster noch groß

    (f as unknown as { innerHeight: number }).innerHeight = 360; // Tastatur geht auf
    f.dispatchEvent(new Event("resize"));
    expect(html.classList.contains(TASTATUR_KLASSE)).toBe(true);

    (f as unknown as { innerHeight: number }).innerHeight = 640; // Tastatur zu
    f.dispatchEvent(new Event("resize"));
    expect(html.classList.contains(TASTATUR_KLASSE)).toBe(false);
  });

  it("ohne Fokus in einer Texteingabe bleibt die Leiste, auch wenn das Fenster schrumpft", () => {
    vi.useFakeTimers();
    const f = fenster();
    document.body.innerHTML = '<button id="b">x</button>';
    stop = tastaturWaechterStarten(f, document);
    (document.getElementById("b") as HTMLButtonElement).focus();
    (f as unknown as { innerHeight: number }).innerHeight = 360;
    f.dispatchEvent(new Event("resize"));
    expect(document.documentElement.classList.contains(TASTATUR_KLASSE)).toBe(false);
  });

  it("eine neue Breite (Drehen) setzt den Maßstab neu", () => {
    vi.useFakeTimers();
    const f = fenster();
    document.body.innerHTML = '<input id="a" type="text">';
    stop = tastaturWaechterStarten(f, document);
    (document.getElementById("a") as HTMLInputElement).focus();
    vi.runAllTimers();
    const g = f as unknown as { innerHeight: number; innerWidth: number };
    g.innerWidth = 640;
    g.innerHeight = 360; // quer: kleiner, aber keine Tastatur
    f.dispatchEvent(new Event("resize"));
    expect(document.documentElement.classList.contains(TASTATUR_KLASSE)).toBe(false);
  });

  it("beim Beenden verschwindet die Klasse", () => {
    vi.useFakeTimers();
    const f = fenster();
    document.body.innerHTML = '<input id="a" type="text">';
    stop = tastaturWaechterStarten(f, document);
    (document.getElementById("a") as HTMLInputElement).focus();
    (f as unknown as { innerHeight: number }).innerHeight = 360;
    f.dispatchEvent(new Event("resize"));
    expect(document.documentElement.classList.contains(TASTATUR_KLASSE)).toBe(true);
    stop();
    stop = undefined;
    expect(document.documentElement.classList.contains(TASTATUR_KLASSE)).toBe(false);
  });
});
