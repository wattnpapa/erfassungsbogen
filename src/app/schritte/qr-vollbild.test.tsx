/**
 * QR-Vollbild: „Teil x von n" über dem Code, und vermerkt wird erst beim
 * Schließen — „gezeigt" nur, wenn alle Teile auf dem Bildschirm standen,
 * „übergeben" nur nach ausdrücklicher Bestätigung (Audit Runde 3, R3-H2,
 * R3-H3).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { QrSatz } from "../hilfen";
import { mindestzeigeSetzen, ORTSSPERRE_MS } from "../tipp-schutz";

vi.mock("../pdf", () => ({ pdfErzeugen: async () => {}, pdfBlobUrl: async () => "blob:x", einsatzPdfErzeugen: async () => {} }));

const { QrVollbild } = await import("./uebersicht");

function satz(n: number): QrSatz {
  return {
    teile: Array.from({ length: n }, (_, i) => ({ datenUrl: `data:image/png;base64,T${i}`, url: `u${i}`, teilNr: i + 1, anzahl: n, version: 13 })),
    segmentiert: n > 1,
    zeichen: 1,
    version: 13,
    vollUrl: "v",
    stufen: 1,
    weitergeleitet: false,
  };
}

function Rahmen(props: { n: number; onSchliessen: (e: unknown) => void; onZurueck?: (e: unknown) => void }) {
  const [teil, setTeil] = useState(0);
  return (
    <QrVollbild
      qr={satz(props.n)}
      einheit="THW · FGr WP (A) · Freiburg"
      staerke="1 / 2 / 7 / 10"
      teilIndex={teil}
      onTeil={setTeil}
      onSchliessen={props.onSchliessen}
      onZurueck={props.onZurueck ?? (() => {})}
    />
  );
}

// Die Mindestanzeigedauer (R5-S1) ist hier aus: Die Tests dieser Gruppe prüfen
// Wortlaut und Ablauf, nicht die Zeit. Die Zeit prüft die Gruppe darunter.
let mindestAlt = 0;
beforeEach(() => {
  mindestAlt = mindestzeigeSetzen(0);
});
afterEach(() => {
  mindestzeigeSetzen(mindestAlt);
});

describe("QR-Vollbild: Stärke nach Soll (R7-N7)", () => {
  it("nennt die Plätze ohne Namen, solange es welche gibt", () => {
    render(<QrVollbild qr={satz(1)} einheit="THW" staerke="0 / 3 / 9 / 12" ohneNamen={9} teilIndex={0} onTeil={() => {}} onSchliessen={() => {}} onZurueck={() => {}} />);
    expect(screen.getByRole("dialog", { name: "QR-Code im Vollbild" }).textContent).toContain("9 Plätze ohne Namen — Stärke nach Soll");
  });

  it("schweigt, wenn alle Plätze Namen tragen", () => {
    render(<QrVollbild qr={satz(1)} einheit="THW" staerke="0 / 3 / 9 / 12" ohneNamen={0} teilIndex={0} onTeil={() => {}} onSchliessen={() => {}} onZurueck={() => {}} />);
    expect(screen.getByRole("dialog", { name: "QR-Code im Vollbild" }).textContent).not.toContain("ohne Namen");
  });
});

describe("QR-Vollbild (R3-H2, R3-H3)", () => {
  it("nennt den Teil über dem Code und im Knopf", async () => {
    render(<Rahmen n={2} onSchliessen={() => {}} />);
    const d = screen.getByRole("dialog", { name: "QR-Code im Vollbild" });
    const teil = d.querySelector(".qr-vollbild-teil")!;
    expect(teil.textContent).toContain("Teil 1 von 2");
    // „Teil 1 von 2" steht VOR dem Code, nicht dahinter unter der Knopfleiste.
    expect(teil.compareDocumentPosition(d.querySelector("img")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(d).getByRole("button", { name: "Nächster Teil (2 von 2)" }).textContent).toBe("Weiter zu Teil 2 →");
  });

  // Audit Runde 4, R4-H5: Die Blickführung zeigte auf „Schließen", obwohl Teile fehlten.
  it("macht „Weiter zu Teil n →“ zum Hauptknopf, solange Teile fehlen, und „Schließen“ nach dem letzten (R4-H5)", async () => {
    const nutzer = userEvent.setup();
    render(<Rahmen n={2} onSchliessen={() => {}} />);
    const weiter = () => screen.getByRole("button", { name: /Nächster Teil/ });
    const schliessen = () => screen.getByRole("button", { name: "Schließen" });
    expect(weiter().className).toContain("haupt");
    expect(schliessen().className).toContain("zurueck");
    // Der Platz bleibt: „primaer" hält die Zeile unter dem Blättern.
    expect(schliessen().className).toContain("primaer");

    await nutzer.click(weiter());

    // Teil 2 von 2: alle gezeigt, „Schließen" ist wieder der Hauptknopf.
    expect(weiter().className).not.toContain("haupt");
    expect(schliessen().className).not.toContain("zurueck");
  });

  it("nur Teil 1 von 2 gezeigt: Schließen warnt, „Trotzdem schließen“ vermerkt nichts", async () => {
    const nutzer = userEvent.setup();
    const schliessen = vi.fn();
    render(<Rahmen n={2} onSchliessen={schliessen} />);
    await nutzer.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.getByText(/Teil 2 von 2 wurde noch nicht gezeigt/)).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Teil 2 von 2 zeigen" }));
    expect(screen.getByRole("dialog").querySelector(".qr-vollbild-teil")!.textContent).toContain("Teil 2 von 2");
    // Jetzt sind alle gezeigt — Schließen fragt nach dem Scan.
    await nutzer.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.getByText("Hat die Gegenstelle alle 2 Teile gescannt?")).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Nicht sicher" }));
    expect(schliessen).toHaveBeenLastCalledWith("gezeigt");
  });

  it("„Trotzdem schließen“ bei fehlendem Teil: kein Vermerk", async () => {
    const nutzer = userEvent.setup();
    const schliessen = vi.fn();
    render(<Rahmen n={3} onSchliessen={schliessen} />);
    await nutzer.click(screen.getByRole("button", { name: /Nächster Teil \(2 von 3\)/ }));
    await nutzer.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.getByText(/Teil 3 von 3 wurde noch nicht gezeigt/)).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Trotzdem schließen" }));
    expect(schliessen).toHaveBeenLastCalledWith(undefined);
  });

  it("einteilig: „Ja, gescannt“ bestätigt die Übergabe", async () => {
    const nutzer = userEvent.setup();
    const schliessen = vi.fn();
    render(<Rahmen n={1} onSchliessen={schliessen} />);
    expect(screen.getByRole("dialog").querySelector(".qr-vollbild-teil")).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.getByText("Hat die Gegenstelle den Code gescannt?")).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Ja, gescannt — übergeben" }));
    expect(schliessen).toHaveBeenLastCalledWith("bestaetigt");
  });

  // Audit Runde 4, R4-M5: Escape und Zurück schlossen ohne Hinweis auf die
  // fehlenden Teile. Jetzt fragen sie wie „Schließen"; erst das zweite Mal
  // schließt (wie „Trotzdem schließen") und vermerkt nichts.
  it("Escape vor dem letzten Teil fragt erst nach dem fehlenden Teil, das zweite schließt ohne Vermerk", () => {
    const schliessen = vi.fn();
    render(<Rahmen n={2} onSchliessen={schliessen} />);
    act(() => {
      screen.getByRole("dialog").dispatchEvent(new Event("cancel", { cancelable: true }));
    });
    expect(schliessen).not.toHaveBeenCalled();
    expect(screen.getByText(/Teil 2 von 2 wurde noch nicht gezeigt/)).toBeDefined();
    act(() => {
      screen.getByRole("dialog").dispatchEvent(new Event("cancel", { cancelable: true }));
    });
    expect(schliessen).toHaveBeenLastCalledWith(undefined);
  });

  it("Zurück vor dem letzten Teil fängt die Geste einmal ab und legt den Verlaufseintrag neu an", () => {
    const zurueck = vi.fn();
    const vorher = history.length;
    render(<Rahmen n={7} onSchliessen={() => {}} onZurueck={zurueck} />);
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    });
    expect(zurueck).not.toHaveBeenCalled();
    expect(screen.getByText(/Teil 2 von 7 wurde noch nicht gezeigt/)).toBeDefined();
    expect((history.state as { eebEbene?: string } | null)?.eebEbene).toBe("qr-vollbild");
    expect(history.length).toBe(vorher + 1);
    history.replaceState(null, "");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    });
    expect(zurueck).toHaveBeenLastCalledWith(undefined);
  });

  it("beginnt beim Wiederöffnen mit dem ersten noch nicht gezeigten Teil", () => {
    const gemeldet = vi.fn();
    render(
      <QrVollbild
        qr={satz(7)}
        einheit="THW"
        staerke="0 / 1 / 2 / 3"
        teilIndex={3}
        onTeil={() => {}}
        bereitsGezeigt={new Set([0, 1, 2])}
        onGezeigt={gemeldet}
        onSchliessen={() => {}}
        onZurueck={() => {}}
      />,
    );
    expect(screen.getByRole("dialog").querySelector(".qr-vollbild-teil")!.textContent).toContain("Teil 4 von 7");
    expect([...(gemeldet.mock.lastCall![0] as Set<number>)].sort()).toEqual([0, 1, 2, 3]);
  });
});

// Audit Runde 5, R5-S1: Ein Doppeltipp auf „Weiter zu Teil n →" ließ Teil n
// 150 ms aufblitzen, und er zählte als gezeigt. Am Ende fragte die App ohne
// Warnung „alle 7 Teile gescannt?".
describe("QR-Vollbild: ein Teil zählt erst nach der Mindestzeit (R5-S1)", () => {
  beforeEach(() => {
    mindestzeigeSetzen(1500);
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const tippen = () => ({ click: async (el: HTMLElement) => { fireEvent.click(el); } });

  it("ein Teil, der nur kurz im Bild stand, gilt nicht als gezeigt: Schließen nennt ihn", async () => {
    const nutzer = tippen();
    render(<Rahmen n={3} onSchliessen={() => {}} />);
    await act(async () => { vi.advanceTimersByTime(ORTSSPERRE_MS + 10); });
    // Teil 1 stand lange genug. Zwei schnelle Tipps: Teil 2 blitzt nur auf.
    await nutzer.click(screen.getByRole("button", { name: /Nächster Teil \(2 von 3\)/ }));
    await act(async () => { vi.advanceTimersByTime(150); });
    await nutzer.click(screen.getByRole("button", { name: /Nächster Teil \(3 von 3\)/ }));
    await act(async () => { vi.advanceTimersByTime(ORTSSPERRE_MS + 10); });
    await nutzer.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.getByText(/Teil 2 von 3 wurde noch nicht gezeigt/)).toBeDefined();
  });

  it("alle Teile je 1,5 s im Bild: Schließen fragt nach dem Scan", async () => {
    const nutzer = tippen();
    render(<Rahmen n={3} onSchliessen={() => {}} />);
    for (let i = 0; i < 2; i++) {
      await act(async () => { vi.advanceTimersByTime(ORTSSPERRE_MS + 10); });
      await nutzer.click(screen.getByRole("button", { name: /Nächster Teil/ }));
    }
    await act(async () => { vi.advanceTimersByTime(ORTSSPERRE_MS + 10); });
    await nutzer.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.getByText("Hat die Gegenstelle alle 3 Teile gescannt?")).toBeDefined();
  });

  it("ein einzelner Code zählt sofort", async () => {
    const nutzer = tippen();
    render(<Rahmen n={1} onSchliessen={() => {}} />);
    await nutzer.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.getByText("Hat die Gegenstelle den Code gescannt?")).toBeDefined();
  });

  it("ein Nachtipp an derselben Stelle (150 bis 1 400 ms) überspringt keinen Teil, ab 1,6 s darf er weiter", async () => {
    const { tippSchutzZuruecksetzen } = await import("../tipp-schutz");
    tippSchutzZuruecksetzen();
    render(<Rahmen n={7} onSchliessen={() => {}} />);
    const teilNr = () => /Teil (\d) von 7/.exec(screen.getByRole("dialog").querySelector(".qr-vollbild-teil")!.textContent!)![1];
    const tipp = () => {
      const knopf = screen.getByRole("button", { name: /Nächster Teil/ });
      act(() => {
        knopf.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 300, clientY: 500, detail: 1 }));
      });
    };
    for (const abstand of [150, 600, 1200, 1400]) {
      tippSchutzZuruecksetzen();
      cleanup();
      render(<Rahmen n={7} onSchliessen={() => {}} />);
      tipp();
      expect(teilNr()).toBe("2");
      act(() => { vi.advanceTimersByTime(abstand); });
      tipp();
      expect(teilNr()).toBe("2");
      // Der verworfene Tipp zeigt sich.
      expect(document.getElementById("tipp-moment")?.hidden).toBe(false);
    }
    cleanup();
    tippSchutzZuruecksetzen();
    render(<Rahmen n={7} onSchliessen={() => {}} />);
    tipp();
    act(() => { vi.advanceTimersByTime(1600); });
    tipp();
    expect(teilNr()).toBe("3");
  });
});
