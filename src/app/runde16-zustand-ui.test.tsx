/**
 * Runde 16, Block Zustand: Oberfläche — verworfene Tipps zeigen sich (D1).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DaumenQuittung, QUITTUNG_ENDE_NACH_MS } from "./daumen-quittung";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
});

describe("R16-W1 → R18-S2 Die Quittungsleiste bleibt vollständig und verschwindet nach QUITTUNG_ENDE_NACH_MS", () => {
  it("schrumpft nicht mehr auf eine Zeile, zeigt bis zum Ende den vollen Text und ruft dann onSchliessen", () => {
    vi.useFakeTimers();
    try {
      const zu = vi.fn();
      render(
        <DaumenQuittung onRueckgaengig={() => {}} onSchliessen={zu} mehrzeilig>
          Abgerückt 15:47: Nr. 2 „THW Albstadt"
        </DaumenQuittung>,
      );
      const leiste = screen.getByRole("status");
      act(() => {
        vi.advanceTimersByTime(QUITTUNG_ENDE_NACH_MS - 1);
      });
      expect(leiste.className).not.toContain("quittung-kompakt");
      expect(leiste.textContent).toContain("Abgerückt 15:47: Nr. 2 „THW Albstadt");
      expect(zu).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Rückgängig" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Quittung schließen" })).toBeDefined();
      act(() => {
        vi.advanceTimersByTime(2);
      });
      expect(zu).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("R16-D1 → R18-G3 „Rückgängig“ und „✕“ sind nie gesperrt", () => {
  it("wirkt beim allerersten Tipp, ohne „Einen Moment …“ und ohne Sperrmarke", async () => {
    const nutzer = userEvent.setup();
    const zurueck = vi.fn();
    const zu = vi.fn();
    render(
      <DaumenQuittung prellschutz onRueckgaengig={zurueck} onSchliessen={zu}>
        Zur Kenntnis genommen: 3 Einheiten
      </DaumenQuittung>,
    );
    const knopf = screen.getByRole("button", { name: "Rückgängig" });
    expect(knopf.getAttribute("aria-disabled")).toBeNull();
    await nutzer.click(knopf);
    expect(zurueck).toHaveBeenCalledTimes(1);
    expect(document.getElementById("tipp-moment")).toBeNull();
    expect(knopf.hasAttribute("data-tipp-gesperrt")).toBe(false);
    await nutzer.click(screen.getByRole("button", { name: "Quittung schließen" }));
    expect(zu).toHaveBeenCalledTimes(1);
  });
});
