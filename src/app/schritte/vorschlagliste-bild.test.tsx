/**
 * Audit Runde 7, R7-E8: Die offene Vorschlagsliste liegt nicht unter der festen Fußleiste. Die Seite rollt
 * so weit, wie das Feld oben im Bild bleibt, und die Liste wird auf den Rest begrenzt.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VorschlagFeld } from "./bausteine";

function rechteck(oben: number, hoehe: number): DOMRect {
  return { top: oben, bottom: oben + hoehe, left: 0, right: 300, width: 300, height: hoehe, x: 0, y: oben, toJSON: () => ({}) } as DOMRect;
}

function Feld() {
  return (
    <VorschlagFeld
      wert=""
      beschriftung="Typ"
      treffer={["FGr W (A)", "FGr W (B)"]}
      schluessel={(t) => t}
      zeile={(t) => t}
      tippen={() => {}}
      waehlen={() => {}}
    />
  );
}

describe("Vorschlagsliste über der Fußleiste (R7-E8)", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("rollt die Seite und begrenzt die Liste, wenn die Fußleiste sie sonst verdeckt", async () => {
    const fuss = document.createElement("footer");
    fuss.className = "nav";
    document.body.appendChild(fuss);
    const scrollBy = vi.fn();
    window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this === fuss) return rechteck(500, 70);
      if (this.tagName === "UL") return rechteck(this.style.maxHeight ? 300 : 440, this.style.maxHeight ? parseFloat(this.style.maxHeight) : 160);
      if (this.tagName === "INPUT") return rechteck(400, 44);
      return rechteck(0, 0);
    });
    const nutzer = userEvent.setup();
    render(<Feld />);
    await nutzer.click(screen.getByRole("combobox"));
    const liste = screen.getByRole("listbox");
    // Unterkante der Liste 600 px, Fußleiste ab 500: Es wird gerollt (höchstens bis das Feld bei 8 px steht).
    expect(scrollBy).toHaveBeenCalled();
    expect(scrollBy.mock.calls[0]![1]).toBeGreaterThan(0);
    // Nach dem Rollen bleibt eine Höhe, die die Fußleiste nicht schneidet.
    expect(liste.style.maxHeight).not.toBe("");
  });

  it("lässt eine Liste in Ruhe, die ganz im Bild steht", async () => {
    const scrollBy = vi.fn();
    window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return this.tagName === "UL" ? rechteck(100, 100) : rechteck(0, 0);
    });
    const nutzer = userEvent.setup();
    render(<Feld />);
    await nutzer.click(screen.getByRole("combobox"));
    expect(scrollBy).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox").style.maxHeight).toBe("");
  });
});
