/**
 * Zwei Fenster, ein Bogen (Audit Runde 2, R2-O4): Keine Eingabe darf ohne
 * Hinweis verloren gehen, und eine offene Sammlungsansicht frischt sich bei
 * Änderungen aus dem anderen Fenster selbst auf.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useEffect, useState } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuerBogen } from "./hilfen";
import { ENTWURF_SCHLUESSEL, entwurfAusAnderemFenster, entwurfSpeichern, entwurfVerwerfen, entwurfZuJson, ersetztenEntwurfLaden } from "./entwurf";
import { Dialogschicht } from "./dialoge";
import { FensterKonflikt, useFensterAbgleich } from "./fenster-abgleich";

/** Nachbau des Autosave aus app.tsx: speichert bei jeder Änderung und bei jeder Entscheidung. */
function Buehne({ onEinsaetze = () => {} }: { onEinsaetze?: () => void }) {
  const [ort, setOrt] = useState("Ort A");
  const eigener = () => {
    const b = neuerBogen();
    b.einsatz.ortAuftrag = ort;
    return b;
  };
  const fenster = useFensterAbgleich(true, onEinsaetze, { eigenerBogen: eigener });
  useEffect(() => {
    entwurfSpeichern(eigener());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wie app.tsx: nur bei Änderung und Entscheidung
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

    expect(screen.getByRole("alert").textContent).toMatch(/andere Fenster hat den Bogen geändert/);
    // Weitertippen hier: B bleibt im Speicher, bis entschieden ist.
    await nutzer.type(screen.getByLabelText("Ort"), " zweite");
    expect(gespeicherterOrt()).toBe("Ort aus Fenster B");
  });

  it("„Meine Fassung behalten“ schreibt die eigene Fassung bewusst darüber, nach Rückfrage", async () => {
    const nutzer = userEvent.setup();
    render(
      <>
        <Buehne />
        <Dialogschicht />
      </>,
    );
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Ort aus Fenster B";
    anderesFensterSchreibt(ENTWURF_SCHLUESSEL, entwurfZuJson(b));

    await nutzer.click(screen.getByRole("button", { name: "Meine Fassung behalten" }));
    // R5-S4: Wohin der andere Stand kommt, steht in der Rückfrage, nicht in der Daueranzeige.
    const frage = await screen.findByRole("dialog", { name: "Meine Fassung behalten?" });
    expect(frage.textContent).toContain("Zuletzt geschlossener Bogen");
    expect(frage.textContent).not.toContain("Rückholplatz"); // R7-N4: so heißt es auf der Startseite
    // R7-O2: Die Rückfrage nennt, was im anderen Fenster anders ist.
    expect(frage.textContent).toContain("Ort / Auftrag");
    // R7-E4: Der Fokus liegt auf der sicheren Wahl.
    expect(document.activeElement).toBe(within(frage).getByRole("button", { name: "Abbrechen" }));
    await nutzer.click(within(frage).getByRole("button", { name: "Meine Fassung behalten" }));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(gespeicherterOrt()).toBe("Ort A");
    // Audit Runde 4, R4-S4: Der Stand des anderen Fensters ist nicht weg — er liegt auf dem Rückholplatz.
    expect(ersetztenEntwurfLaden()?.bogen.einsatz.ortAuftrag).toBe("Ort aus Fenster B");
    // R7-S3: Die Karte auf der Startseite nennt den Anlass.
    expect(ersetztenEntwurfLaden()?.ersetztGrund).toBe("fenster-behalten");
  });

  it("nennt in der Warnung den anderen Stand mit Sekunden, kurz und mit festem Platz (R4-S4, R5-S4, R7-O2)", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Fensterhausen";
    b.personal = [];
    anderesFensterSchreibt(ENTWURF_SCHLUESSEL, entwurfZuJson(b));
    const warnung = screen.getByRole("alert");
    // Der erste Satz sagt, dass hier nichts gespeichert wird (R7-O1); beide Knöpfe stehen ohne Aufklappen da (R7-M2).
    expect(warnung.textContent).toMatch(/^⚠ Hier wird nichts gespeichert\./);
    expect(within(warnung).getByRole("button", { name: "Anderen Stand laden" })).toBeDefined();
    expect(within(warnung).getByRole("button", { name: "Meine Fassung behalten" })).toBeDefined();
    expect(warnung.textContent).toMatch(/hat den Bogen geändert: /);
    await nutzer.click(within(warnung).getByRole("button", { name: "Genauer" }));
    expect(warnung.textContent).toMatch(/Dort: „THW Fensterhausen“, gespeichert \d\d:\d\d:\d\d Uhr/);
    // Der Hinweis auf den Ablageort steht in den Einzelheiten und heißt wie auf der Startseite.
    expect(warnung.textContent).not.toContain("Rückholplatz");
    expect(warnung.className).toContain("fest-warnung");
  });

  // Audit Runde 7, R7-E3: Ein zweites Fenster, das den Entwurf nur öffnet und neu schreibt, ist kein Konflikt.
  it("warnt nicht, wenn das andere Fenster den Entwurf nur neu schreibt, ohne am Bogen etwas zu ändern (R7-E3)", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    const roh = JSON.parse(localStorage.getItem(ENTWURF_SCHLUESSEL)!);
    roh.gespeichert += 5000;
    roh.schritt = 3;
    anderesFensterSchreibt(ENTWURF_SCHLUESSEL, JSON.stringify(roh));
    expect(screen.queryByRole("alert")).toBeNull();
    // Hier wird weiter gespeichert.
    await nutzer.type(screen.getByLabelText("Ort"), "1");
    expect(gespeicherterOrt()).toBe("Ort A1");
  });

  it("fragt vor „behalten“, wenn dabei ein anderer Bogen vom Rückholplatz fiele (R4-S4)", async () => {
    const nutzer = userEvent.setup();
    const dritter = neuerBogen();
    dritter.einheit.hierarchie[0]!.name = "Drittort";
    dritter.einsatz.ortAuftrag = "Ort Dritt";
    localStorage.setItem("eeb.entwurf.ersetzt.v1", entwurfZuJson(dritter, Date.now() - 60_000));
    render(
      <>
        <Buehne />
        <Dialogschicht />
      </>,
    );
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Ort aus Fenster B";
    anderesFensterSchreibt(ENTWURF_SCHLUESSEL, entwurfZuJson(b));
    await nutzer.click(screen.getByRole("button", { name: "Meine Fassung behalten" }));
    const frage = await screen.findByRole("dialog", { name: "Meine Fassung behalten?" });
    expect(frage.textContent).toContain("„THW Drittort\"");
    expect(frage.textContent).toContain("endgültig gelöscht");
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    // Abgebrochen: nichts verändert, die Warnung steht weiter.
    expect(screen.getByRole("alert")).toBeDefined();
    expect(gespeicherterOrt()).toBe("Ort aus Fenster B");
    expect(ersetztenEntwurfLaden()?.bogen.einsatz.ortAuftrag).toBe("Ort Dritt");
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

  // Audit Runde 5, R5-D3: „Alle Daten löschen" im anderen Fenster wurde vom
  // Autosave dieses Fensters still zurückgeschrieben.
  it("schreibt einen im anderen Fenster gelöschten Entwurf nicht zurück und warnt (R5-D3)", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    expect(gespeicherterOrt()).toBe("Ort A");

    // Das andere Fenster löscht alles („Alle Daten löschen"), dieses bekommt das Ereignis.
    localStorage.removeItem(ENTWURF_SCHLUESSEL);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: ENTWURF_SCHLUESSEL, newValue: null }));
    });
    expect(screen.getByRole("alert").textContent).toMatch(/gelöscht oder geschlossen/);
    expect(screen.getByRole("alert").textContent).toMatch(/Hier wird nichts gespeichert/);

    await nutzer.type(screen.getByLabelText("Ort"), " zweite");
    expect(localStorage.getItem(ENTWURF_SCHLUESSEL)).toBeNull();
  });

  it("bemerkt einen entfernten Entwurf auch ohne Ereignis beim nächsten Speichern (R5-D3)", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    localStorage.removeItem(ENTWURF_SCHLUESSEL); // Ereignis verpasst
    await nutzer.type(screen.getByLabelText("Ort"), "!");
    expect(screen.getByRole("alert")).toBeDefined();
    expect(localStorage.getItem(ENTWURF_SCHLUESSEL)).toBeNull();
  });

  it("„Bogen hier wieder speichern“ ist die bewusste Gegenentscheidung (R5-D3)", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    localStorage.removeItem(ENTWURF_SCHLUESSEL);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: ENTWURF_SCHLUESSEL, newValue: null }));
    });
    await nutzer.click(screen.getByRole("button", { name: "Bogen hier wieder speichern" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(gespeicherterOrt()).toBe("Ort A");
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

  // Audit Runde 6, R6-S2: Die Warnung nennt beide Stände.
  it("nennt in der Warnung auch den eigenen Stand und die Personenzahl beider Fenster (R6-S2)", async () => {
    const nutzer = userEvent.setup();
    render(<Buehne />);
    const b = neuerBogen();
    b.personal = [];
    anderesFensterSchreibt(ENTWURF_SCHLUESSEL, entwurfZuJson(b));
    const warnung = screen.getByRole("alert");
    expect(warnung.textContent).toMatch(/hat den Bogen geändert: /);
    await nutzer.click(within(warnung).getByRole("button", { name: "Genauer" }));
    expect(warnung.textContent).toMatch(/Dort: .*gespeichert .* Uhr, \d+ Personen?\.\s*Hier: Stand .* Uhr, \d+ Personen?/);
  });

  // Audit Runde 6, R6-S1: „Stand laden" verwarf die eigene, nicht gespeicherte Arbeit still.
  it("fragt vor „Stand aus dem anderen Fenster laden“ und legt die eigene Fassung auf den Rückholplatz (R6-S1)", async () => {
    const nutzer = userEvent.setup();
    const neuladen = vi.fn();
    Object.defineProperty(window, "location", { value: { ...window.location, reload: neuladen }, configurable: true });
    render(
      <>
        <Buehne />
        <Dialogschicht />
      </>,
    );
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Ort aus Fenster B";
    anderesFensterSchreibt(ENTWURF_SCHLUESSEL, entwurfZuJson(b));
    await nutzer.type(screen.getByLabelText("Ort"), " viel Arbeit");

    await nutzer.click(screen.getByRole("button", { name: "Anderen Stand laden" }));
    const frage = await screen.findByRole("dialog", { name: "Stand aus dem anderen Fenster laden?" });
    expect(frage.textContent).toContain("Zuletzt geschlossener Bogen");
    // R7-S2: Auch der Stand, der geladen wird, ist benannt.
    expect(frage.textContent).toContain("Geladen wird der Stand des anderen Fensters");
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect(neuladen).not.toHaveBeenCalled();
    expect(ersetztenEntwurfLaden()).toBeNull();

    await nutzer.click(screen.getByRole("button", { name: "Anderen Stand laden" }));
    const nochmal = await screen.findByRole("dialog", { name: "Stand aus dem anderen Fenster laden?" });
    await nutzer.click(within(nochmal).getByRole("button", { name: "Stand laden" }));
    expect(ersetztenEntwurfLaden()?.bogen.einsatz.ortAuftrag).toBe("Ort A viel Arbeit");
    expect(ersetztenEntwurfLaden()?.ersetztGrund).toBe("fenster-geladen"); // R7-S3
    expect(neuladen).toHaveBeenCalledOnce();
  });

  // Audit Runde 6, R6-D1: Die Startseite des zweiten Fensters arbeitete nach „Alle Daten löschen" mit den alten Karten weiter.
  it("baut die Seite neu auf, wenn das andere Fenster alles löscht und hier kein Bogen offen ist (R6-D1)", () => {
    const neu = vi.fn();
    function Start() {
      useFensterAbgleich(false, () => {}, { beiAllesGeloescht: neu });
      return null;
    }
    render(<Start />);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(neu).toHaveBeenCalledOnce();
  });
});
