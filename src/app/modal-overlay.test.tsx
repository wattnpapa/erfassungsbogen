/**
 * QR-Vollbild und Scanner waren nicht modal: Fokus blieb dahinter, die Seite
 * rollte mit, nach dem Schließen stand der Fokus auf <body> (Audit Runde 2,
 * R2-M3). Geprüft wird der gemeinsame Baustein.
 */
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { dialogVerlaufVerdrahten, ebeneBetreten, ebeneVerlassen, eigenesZurueckVerbrauchen, ersteEbeneBetreten, ersteEbeneVerlassen, useModalesOverlay } from "./modal-overlay";

function Overlay(props: { onSchliessen: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useModalesOverlay(ref, { onSchliessen: props.onSchliessen });
  return (
    <dialog ref={ref} aria-label="Testoverlay" tabIndex={-1}>
      <button type="button" onClick={props.onSchliessen}>Schließen</button>
    </dialog>
  );
}

function Seite(props: { beiEscape?: () => void }) {
  const [offen, setOffen] = useState(false);
  const schliessen = () => {
    props.beiEscape?.();
    setOffen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOffen(true)}>Öffnen</button>
      {offen && <Overlay onSchliessen={schliessen} />}
    </>
  );
}

describe("useModalesOverlay", () => {
  it("öffnet modal, nimmt den Fokus und hält die Seite fest", () => {
    render(<Seite />);
    const ausloeser = screen.getByRole("button", { name: "Öffnen" });
    ausloeser.focus();
    fireEvent.click(ausloeser);
    const dialog = screen.getByRole("dialog", { name: "Testoverlay" }) as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(dialog);
    expect(document.documentElement.style.overflow).toBe("hidden");
  });

  it("gibt beim Schließen Fokus und Seite zurück", () => {
    document.documentElement.style.overflow = "";
    render(<Seite />);
    const ausloeser = screen.getByRole("button", { name: "Öffnen" });
    ausloeser.focus();
    fireEvent.click(ausloeser);
    fireEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(ausloeser);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("schließt über `cancel` (Escape) über den Aufrufer, nicht am React-Zustand vorbei", () => {
    const beiEscape = vi.fn();
    render(<Seite beiEscape={beiEscape} />);
    fireEvent.click(screen.getByRole("button", { name: "Öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Testoverlay" });
    const ereignis = new Event("cancel", { cancelable: true });
    act(() => { dialog.dispatchEvent(ereignis); });
    expect(ereignis.defaultPrevented).toBe(true);
    expect(beiEscape).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

// Audit Runde 5, R5-S5: Auf dem ersten Verlaufseintrag der App verließ Zurück
// bei offener Rückfrage die Seite.
describe("Rückfrage auf dem ersten Verlaufseintrag (R5-S5)", () => {
  it("legt nur auf dem markierten ersten Eintrag einen eigenen an und verbraucht ihn wieder", async () => {
    vi.useFakeTimers();
    try {
      history.replaceState({ eeb: { schritt: 0 } }, "");
      expect(ersteEbeneBetreten()).toBe(false); // später Eintrag: Zurück bleibt in der App
      history.replaceState({ eeb: { schritt: 0 }, eebErste: true }, "");
      const vorher = history.length;
      expect(ersteEbeneBetreten()).toBe(true);
      expect(history.length).toBe(vorher + 1);
      const zustand = history.state as Record<string, unknown>;
      expect(zustand.eebEbene).toBe("rueckfrage");
      expect(zustand.eebErste).toBeUndefined(); // die Marke wandert nicht mit
      expect(zustand.eeb).toEqual({ schritt: 0 });
      expect(ersteEbeneBetreten()).toBe(false); // nicht doppelt
      const zurueck = vi.spyOn(history, "back").mockImplementation(() => {});
      ersteEbeneVerlassen();
      expect(zurueck).not.toHaveBeenCalled(); // verzögert: erst die Antwort wirken lassen
      vi.advanceTimersByTime(100);
      expect(zurueck).toHaveBeenCalledTimes(1);
      zurueck.mockRestore();
    } finally {
      vi.useRealTimers();
      history.replaceState(null, "");
    }
  });
});

// Audit Runde 6, R6-N1: Eine Rückfrage, die direkt auf die vorige folgt, wurde
// von deren verzögerter Rückkehr geschlossen.
describe("Folgerückfrage übernimmt den Eintrag der vorigen (R6-N1)", () => {
  it("verbraucht den Eintrag nicht, solange die nächste Rückfrage offen ist", () => {
    vi.useFakeTimers();
    try {
      history.replaceState({ eeb: { schritt: 0 }, eebErste: true }, "");
      expect(ersteEbeneBetreten()).toBe(true);
      const zurueck = vi.spyOn(history, "back").mockImplementation(() => {});
      ersteEbeneVerlassen(); // erste Rückfrage zu
      expect(ersteEbeneBetreten()).toBe(true); // zweite übernimmt den Eintrag
      vi.advanceTimersByTime(200);
      expect(zurueck).not.toHaveBeenCalled();
      ersteEbeneVerlassen(); // zweite zu: jetzt wird er verbraucht
      vi.advanceTimersByTime(200);
      expect(zurueck).toHaveBeenCalledTimes(1);
      zurueck.mockRestore();
    } finally {
      vi.useRealTimers();
      history.replaceState(null, "");
    }
  });
});

// Audit Runde 6, R6-S3: Zurück schloss die Fenster der Startseite nicht, sondern verließ die App.
describe("Fenster der Startseite tragen einen Verlaufseintrag (R6-S3)", () => {
  it("legt beim Öffnen eines beliebigen Dialogs einen Eintrag an und verbraucht ihn beim Schließen", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      history.replaceState({ eeb: { schritt: 0 }, eebErste: true }, "");
      dialogVerlaufVerdrahten();
      const d = document.createElement("dialog");
      document.body.appendChild(d);
      const zurueck = vi.spyOn(history, "back").mockImplementation(() => {});
      d.setAttribute("open", "");
      await Promise.resolve();
      expect((history.state as Record<string, unknown>).eebEbene).toBe("rueckfrage");
      d.removeAttribute("open");
      await Promise.resolve();
      vi.advanceTimersByTime(200);
      expect(zurueck).toHaveBeenCalledTimes(1);
      zurueck.mockRestore();
      d.remove();
    } finally {
      vi.useRealTimers();
      history.replaceState(null, "");
    }
  });
});


describe("Späte Rückkehr eines eigenen back() (Runde 7)", () => {
  it("erkennt den Pop des eigenen back() einmal und danach nicht mehr", () => {
    eigenesZurueckVerbrauchen();
    ebeneBetreten("probe");
    ebeneVerlassen("probe", () => {});
    expect(eigenesZurueckVerbrauchen()).toBe(true);
    expect(eigenesZurueckVerbrauchen()).toBe(false);
  });

  it("setzt keine Marke, wenn kein Eintrag des Fensters obenauf liegt", () => {
    eigenesZurueckVerbrauchen();
    ebeneVerlassen("nie-betreten", () => {});
    expect(eigenesZurueckVerbrauchen()).toBe(false);
  });
});
