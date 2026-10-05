/**
 * Daumenleiste: Ein Kartenkopf, den die Leiste nach dem Aufgehen anschneidet,
 * wird mit über die Leiste gerollt (Audit Runde 3, R3-G2, Rest). jsdom kennt
 * kein Layout — die Lagen werden über getBoundingClientRect vorgegeben.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { DaumenQuittung } from "./daumen-quittung";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";

function rechteck(top: number, hoehe: number): DOMRect {
  return { top, bottom: top + hoehe, height: hoehe, left: 0, right: 320, width: 320, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
}

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  vi.restoreAllMocks();
});

describe("DaumenQuittung rollt angeschnittene Kartenköpfe frei (R3-G2)", () => {
  it("rollt den Kopf der nächsten Karte über die Leiste, die getippte Stelle bleibt im Bild", () => {
    document.body.innerHTML = '<main><h3 id="getippt">Karte 2</h3><h3 id="naechste">Karte 3</h3></main><div id="leiste"></div>';
    const lagen: Record<string, DOMRect> = { getippt: rechteck(300, 48), naechste: rechteck(546, 48) };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("quittung-daumen")) return rechteck(491, 65);
      return lagen[this.id] ?? rechteck(0, 0);
    });
    const rollen = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    // Getippt wurde bei y = 478 — knapp über der Leiste, nicht in ihr.
    window.dispatchEvent(new MouseEvent("click", { clientX: 160, clientY: 478, detail: 1 }));
    render(<DaumenQuittung onSchliessen={() => {}}>Abgerückt 20:39</DaumenQuittung>, { container: document.getElementById("leiste")! });
    // Kopf 546–594 unter der Leiste ab 491: 594 − 491 + 8 = 111 px.
    expect(rollen).toHaveBeenCalledWith(0, 111);
  });
});
