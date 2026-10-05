/**
 * Zwei Fenster, ein Bogen (Audit Runde 2, R2-O4): Keine Eingabe darf ohne
 * Hinweis verloren gehen, und eine offene Sammlungsansicht frischt sich bei
 * Änderungen aus dem anderen Fenster selbst auf.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useEffect, useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuerBogen } from "./hilfen";
import { ENTWURF_SCHLUESSEL, entwurfAusAnderemFenster, entwurfSpeichern, entwurfVerwerfen, entwurfZuJson } from "./entwurf";
import { FensterKonflikt, useFensterAbgleich } from "./fenster-abgleich";

/** Nachbau des Autosave aus app.tsx: speichert bei jeder Änderung und bei jeder Entscheidung. */
function Buehne({ onEinsaetze = () => {} }: { onEinsaetze?: () => void }) {
  const [ort, setOrt] = useState("Ort A");
  const fenster = useFensterAbgleich(true, onEinsaetze);
  useEffect(() => {
    const b = neuerBogen();
    b.einsatz.ortAuftrag = ort;
    entwurfSpeichern(b);
  }, [ort, fenster.runde]);
  return (
    <>
      {fenster.konflikt && <FensterKonflikt abgleich={fenster} />}
      <input aria-label="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
    </>
  );
}

/** Was das andere Fenster tut: schreiben — und der Browser meldet es hier. */
function anderesFensterSchreibt(schluessel: string, wert: string) {
  localStorage.setItem(schluessel, wert);
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: schluessel, newValue: wert }));
  });
}

function gespeicherterOrt(): string {
  return JSON.parse(localStorage.getItem(ENTWURF_SCHLUESSEL)!).bogen.einsatz.ortAuftrag;
}

describe("Fensterabgleich", () => {
  beforeEach(() => {
    entwurfVerwerfen();
    localStorage.clear();
  });

  it("warnt sichtbar, sobald das andere Fenster den Bogen ändert, und überschreibt nicht still", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    expect(gespeicherterOrt()).toBe("Ort A");

    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Ort aus Fenster B";
    anderesFensterSchreibt(ENTWURF_SCHLUESSEL, entwurfZuJson(b));

    expect(screen.getByRole("alert").textContent).toMatch(/in einem anderen Fenster geändert/);
    // Weitertippen hier: B bleibt im Speicher, bis entschieden ist.
    await nutzer.type(screen.getByLabelText("Ort"), " zweite");
    expect(gespeicherterOrt()).toBe("Ort aus Fenster B");
  });

  it("„Meine Fassung behalten“ schreibt die eigene Fassung bewusst darüber", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Ort aus Fenster B";
    anderesFensterSchreibt(ENTWURF_SCHLUESSEL, entwurfZuJson(b));

    await nutzer.click(screen.getByRole("button", { name: "Meine Fassung behalten" }));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(gespeicherterOrt()).toBe("Ort A");
  });

  it("bemerkt die fremde Änderung auch ohne Ereignis beim nächsten Speichern", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Ort aus Fenster B";
    localStorage.setItem(ENTWURF_SCHLUESSEL, entwurfZuJson(b)); // Ereignis verpasst (Tab im Hintergrund)

    await nutzer.type(screen.getByLabelText("Ort"), "!");

    expect(screen.getByRole("alert")).toBeDefined();
    expect(gespeicherterOrt()).toBe("Ort aus Fenster B");
  });

  it("liest die Sammlungen neu ein, wenn das andere Fenster sie ändert", () => {
    const neuLaden = vi.fn();
    render(<Buehne onEinsaetze={neuLaden} />);
    anderesFensterSchreibt("eeb.einsaetze.v1", "[]");
    expect(neuLaden).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).toBeNull();
  });
  // Audit Runde 3, R3-S3: Ein Tab ohne eigenen Bogen kannte den Entwurf des
  // anderen Fensters nicht und überschrieb ihn beim Anlegen still.
  it("erkennt einen Entwurf, den nur ein anderes Fenster geschrieben hat", () => {
    expect(entwurfAusAnderemFenster()).toBeNull();
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Ort aus Fenster A";
    localStorage.setItem(ENTWURF_SCHLUESSEL, entwurfZuJson(b));
    expect(entwurfAusAnderemFenster()?.bogen.einsatz.ortAuftrag).toBe("Ort aus Fenster A");
    // Den eigenen Stand erkennt das Fenster als eigenen.
    entwurfVerwerfen();
    localStorage.clear();
    entwurfSpeichern(b);
    expect(entwurfAusAnderemFenster()).toBeNull();
  });
});
