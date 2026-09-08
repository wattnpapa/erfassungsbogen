/**
 * Der Abgang darf die Löschung nur verzögern, nie verhindern: läuft keine
 * Animation (reduzierte Bewegung, kein Stylesheet, alte Umgebung), muss der
 * Eintrag sofort verschwinden. Genau daran hing die Löschfunktion.
 */
import { describe, expect, it, vi } from "vitest";
import { mitAbgang } from "./eintrag-bewegung";

/** Karte im Dokument, wahlweise mit laufender Abgangs-Animation. Die Langform
 *  ist Absicht: jsdom zerlegt die Kurzform `animation:` nicht in ihre Teile. */
function karte(dauer: string | null) {
  const el = document.createElement("div");
  if (dauer) {
    el.style.animationName = "eintrag-geht";
    el.style.animationDuration = dauer;
  }
  document.body.appendChild(el);
  return el;
}

describe("mitAbgang", () => {
  it("nimmt den Eintrag sofort weg, wenn gar kein Element da ist", () => {
    const wegnehmen = vi.fn();
    mitAbgang(null, wegnehmen);
    expect(wegnehmen).toHaveBeenCalledTimes(1);
  });

  it("nimmt den Eintrag sofort weg, wenn keine Animation läuft", () => {
    const el = karte(null);
    const wegnehmen = vi.fn();
    mitAbgang(el, wegnehmen);
    expect(wegnehmen).toHaveBeenCalledTimes(1);
    expect(el.classList.contains("geht")).toBe(false);
  });

  it("nimmt den Eintrag sofort weg, wenn die Animation auf 0 ms steht (reduzierte Bewegung)", () => {
    const el = karte("0s");
    const wegnehmen = vi.fn();
    mitAbgang(el, wegnehmen);
    expect(wegnehmen).toHaveBeenCalledTimes(1);
  });

  it("wartet die Animation ab und räumt danach die Klasse weg", () => {
    const el = karte("0.16s");
    const wegnehmen = vi.fn();
    mitAbgang(el, wegnehmen);

    // Solange die Animation läuft, steht die Liste unverändert — nichts rutscht
    // unter der Karte weg, die gerade geht.
    expect(wegnehmen).not.toHaveBeenCalled();
    expect(el.classList.contains("geht")).toBe(true);

    el.dispatchEvent(new Event("animationend"));
    expect(wegnehmen).toHaveBeenCalledTimes(1);
    // Die Listen sind über den Index verschlüsselt: der Knoten trägt danach den
    // nachrückenden Eintrag und darf nicht unsichtbar stehen bleiben.
    expect(el.classList.contains("geht")).toBe(false);
  });

  it("nimmt den Eintrag auch weg, wenn die Animation nie zu Ende geht", async () => {
    vi.useFakeTimers();
    try {
      const el = karte("0.16s");
      const wegnehmen = vi.fn();
      mitAbgang(el, wegnehmen);
      vi.advanceTimersByTime(400);
      expect(wegnehmen).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("nimmt den Eintrag sofort weg, wenn der Tab verdeckt ist", () => {
    const el = karte("0.16s");
    const wegnehmen = vi.fn();
    const sicht = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    try {
      mitAbgang(el, wegnehmen);
      expect(wegnehmen).toHaveBeenCalledTimes(1);
    } finally {
      sicht.mockRestore();
    }
  });

  it("nimmt den Eintrag genau einmal weg, wenn Ereignis und Notbremse zusammenfallen", () => {
    vi.useFakeTimers();
    try {
      const el = karte("0.16s");
      const wegnehmen = vi.fn();
      mitAbgang(el, wegnehmen);
      el.dispatchEvent(new Event("animationend"));
      vi.advanceTimersByTime(400);
      expect(wegnehmen).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
