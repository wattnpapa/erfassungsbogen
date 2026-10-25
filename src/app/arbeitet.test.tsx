/** Audit Runde 5, R5-O3/R5-H4/R5-L4: eine Sperre für alle PDF-Wege, mit sichtbarem Zustand. */
import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { arbeitetGerade, arbeitetZuruecksetzen, arbeiten, useArbeitet } from "./arbeitet";

afterEach(() => arbeitetZuruecksetzen());

function Anzeige() {
  const a = useArbeitet();
  return <p>{a ?? "frei"}</p>;
}

describe("arbeiten()", () => {
  it("führt die Aktion aus und gibt die Sperre danach frei", async () => {
    let lief = 0;
    const r = await arbeiten("pdf", async () => ++lief);
    expect(r).toEqual({ lief: true, wert: 1 });
    expect(arbeitetGerade()).toBeNull();
  });

  it("lässt einen zweiten Tipp in der Zeit nichts tun — eine Datei statt zwei", async () => {
    let aufrufe = 0;
    let fertig!: () => void;
    const erster = arbeiten("weitergeben", () => {
      aufrufe++;
      return new Promise<void>((r) => (fertig = r));
    });
    // Das Bild kommt vor der Arbeit; erst dann läuft die Aktion.
    await new Promise((r) => setTimeout(r, 30));
    expect(arbeitetGerade()).toBe("weitergeben");
    const zweiter = await arbeiten("weitergeben", async () => {
      aufrufe++;
    });
    expect(zweiter).toEqual({ lief: false });
    // Auch eine andere PDF-Aktion wartet nicht im Hintergrund, sondern tut nichts.
    expect(await arbeiten("blanko", async () => aufrufe++)).toEqual({ lief: false });
    fertig();
    await erster;
    expect(aufrufe).toBe(1);
    expect(arbeitetGerade()).toBeNull();
  });

  it("gibt die Sperre auch bei einem Fehler frei", async () => {
    await expect(arbeiten("pdf", async () => Promise.reject(new Error("kaputt")))).rejects.toThrow("kaputt");
    expect(arbeitetGerade()).toBeNull();
  });

  it("zeigt den Zustand allen Lesern und lässt ihm ein Bild, bevor die schwere Arbeit beginnt", async () => {
    render(<Anzeige />);
    expect(screen.getByText("frei")).toBeTruthy();
    let sichtbarBeiStart = "";
    let fertig!: () => void;
    let lauf!: Promise<unknown>;
    await act(async () => {
      lauf = arbeiten("lageblatt", () => {
        sichtbarBeiStart = document.body.textContent ?? "";
        return new Promise<void>((r) => (fertig = r));
      });
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(sichtbarBeiStart).toContain("lageblatt");
    expect(screen.getByText("lageblatt")).toBeTruthy();
    await act(async () => {
      fertig();
      await lauf;
    });
    expect(screen.getByText("frei")).toBeTruthy();
  });
});
