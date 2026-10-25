/**
 * Die Fehlerzeile der Startseite wird angesagt und holt sich ins Bild, wenn
 * sie außerhalb steht (Audit Runde 2, R2-L2).
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FehlerImBild } from "./fehler-im-bild";

function lage(top: number, bottom: number) {
  return vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    bottom,
    left: 0,
    right: 100,
    width: 100,
    height: bottom - top,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
}

describe("FehlerImBild", () => {
  const rollen = vi.fn();
  afterEach(() => {
    vi.restoreAllMocks();
    rollen.mockReset();
  });

  it("ist eine Ansage (role=alert)", () => {
    render(<FehlerImBild text="Datei beschädigt." />);
    expect(screen.getByRole("alert").textContent).toBe("Datei beschädigt.");
  });

  it("rollt zur Zeile, wenn sie oben aus dem Bild ragt", () => {
    lage(-36, 7);
    HTMLElement.prototype.scrollIntoView = rollen;
    render(<FehlerImBild text="Datei beschädigt." />);
    expect(rollen).toHaveBeenCalledWith({ block: "center" });
  });

  it("lässt die Ansicht stehen, wenn die Zeile schon ganz im Bild ist", () => {
    lage(100, 140);
    HTMLElement.prototype.scrollIntoView = rollen;
    render(<FehlerImBild text="Datei beschädigt." />);
    expect(rollen).not.toHaveBeenCalled();
  });
});
