/**
 * Runde 13, Block Zustand: reine Logik der Behebungen (O1, O3, O4, D3, D4, E1, G1).
 * Die Oberflächen-Fälle stehen in runde13-zustand-app.test.tsx und runde13-zustand-ui.test.tsx.
 */
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { neuePerson, neuerBogen } from "./hilfen";
import { sicherungEinspielen, sicherungEinspielFehlerText, sicherungInhalt } from "./sicherung";
import { mitGeltendemWert, zahlLesen } from "./zahl-eingabe";
import { restLeer } from "./aufteilen-ui";
import { unterschiedSatz, vorlageUnterschiede } from "./vorlagen-unterschied";
import { NEULADEN_RUECKFALL_MS, neuLadenMitRueckfall } from "./aktualisierung";
import { arbeiten, arbeitetZuruecksetzen, tippWaehrendLauf } from "./arbeitet";
import { ausgabeFreiBeiTipp, ausgabeSperreZuruecksetzen } from "./ausgabe-sperre";
import { PAPIERKORB_LEER_RAT } from "./speicher-fehler-text";

const voll = () => new DOMException("The quota has been exceeded.", "QuotaExceededError");

/** Speicher im Arbeitsspeicher (die Logik-Umgebung hat kein localStorage); `schreibFehler` simuliert einen vollen Speicher. */
class MemSpeicher {
  private m = new Map<string, string>();
  schreibFehler: ((k: string, v: string) => boolean) | null = null;
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.schreibFehler?.(k, String(v))) throw voll();
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

describe("R13-O1 Sicherung einspielen: bei Fehlschlag bleibt der Bestand", () => {
  let localStorage: MemSpeicher;
  beforeEach(() => {
    localStorage = new MemSpeicher();
    vi.stubGlobal("localStorage", localStorage);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("schreibt die Datei und ersetzt den Bestand, wenn alles passt", () => {
    localStorage.setItem("eeb.alt.v1", "ALT");
    const text = sicherungInhalt({ "eeb.einsaetze.v1": "NEU", "eeb.vorlagen.v1": "V" });
    expect(sicherungEinspielen(text)).toBe(2);
    expect(localStorage.getItem("eeb.alt.v1")).toBeNull();
    expect(localStorage.getItem("eeb.einsaetze.v1")).toBe("NEU");
  });

  it("stellt bei vollem Speicher den alten Stand her und meldet auf Deutsch, dass er unverändert ist", () => {
    localStorage.setItem("eeb.einsaetze.v1", "ALT-EINSAETZE");
    localStorage.setItem("eeb.vorlagen.v1", "ALT-VORLAGEN");
    const text = sicherungInhalt({ "eeb.vorlagen.v1": "NEU-VORLAGEN", "eeb.einsaetze.v1": "RIESIG", "eeb.zusatz.v1": "Z" });
    localStorage.schreibFehler = (_k, v) => v === "RIESIG"; // die Datei passt nicht in den Speicher

    let fehler: unknown;
    try {
      sicherungEinspielen(text);
    } catch (e) {
      fehler = e;
    }
    expect(fehler).toBeInstanceOf(Error);
    const satz = (fehler as Error).message;
    expect(satz).toMatch(/^Nicht eingespielt: Der Speicher dieses Geräts reicht für diese Sicherung nicht\./);
    expect(satz).toContain("Deine bisherigen Daten auf diesem Gerät sind unverändert.");
    expect(satz).not.toMatch(/Failed to execute|quota/i);
    // Der Bestand ist wie vorher, halb geschriebene Schlüssel der Datei sind weg.
    expect(localStorage.getItem("eeb.einsaetze.v1")).toBe("ALT-EINSAETZE");
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBe("ALT-VORLAGEN");
    expect(localStorage.getItem("eeb.zusatz.v1")).toBeNull();
  });

  it("sagt ehrlich, wenn auch das Zurückschreiben scheitert", () => {
    expect(sicherungEinspielFehlerText(false, voll())).toContain("ließen sich nicht vollständig zurückschreiben");
    expect(sicherungEinspielFehlerText(true)).toContain("sind unverändert");
  });
});

describe("R13-O3 Rat bei vollem Speicher und leerem Papierkorb", () => {
  it("nennt Wege, die es gibt, und keinen Papierkorb zum Leeren", () => {
    expect(PAPIERKORB_LEER_RAT).toContain("Papierkorb leer");
    expect(PAPIERKORB_LEER_RAT).toContain("entfernen");
    expect(PAPIERKORB_LEER_RAT).not.toMatch(/Papierkorb leeren/);
    expect(PAPIERKORB_LEER_RAT).not.toContain("endgültig löschen");
  });
});

describe("R13-O4 „Neu laden“ im Update-Hinweis", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("lädt die Seite selbst neu, wenn der Service Worker nichts auslöst", async () => {
    const neuladen = vi.fn();
    neuLadenMitRueckfall(async () => {}, neuladen);
    await vi.advanceTimersByTimeAsync(NEULADEN_RUECKFALL_MS - 100);
    expect(neuladen).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(neuladen).toHaveBeenCalledTimes(1);
  });

  it("lädt sofort neu, wenn das Aktivieren scheitert, und nur einmal", async () => {
    const neuladen = vi.fn();
    neuLadenMitRueckfall(() => Promise.reject(new Error("kein Service Worker")), neuladen);
    await vi.advanceTimersByTimeAsync(0);
    expect(neuladen).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(NEULADEN_RUECKFALL_MS * 2);
    expect(neuladen).toHaveBeenCalledTimes(1);
  });
});

describe("R13-D3 Aufteilen ohne Rest", () => {
  it("erkennt eine Restmeldung ohne Personen, auch wenn noch Fahrzeuge bleiben", () => {
    const leer = neuerBogen();
    expect(restLeer(leer)).toBe(true);
    const nurFahrzeug = neuerBogen();
    nurFahrzeug.fahrzeuge = [{ typ: { code: 3 } }];
    expect(restLeer(nurFahrzeug)).toBe(true);
    const mitPerson = neuerBogen();
    mitPerson.personal = [{ ...neuePerson(), nachname: "Muster", vorname: "Max" }];
    expect(restLeer(mitPerson)).toBe(false);
  });
});

describe("R13-D4 Gegenüberstellung beim Ersetzen einer Vorlage", () => {
  it("nennt Ort/Auftrag, Einheitstyp und Sofortbedarf, wenn sie sich unterscheiden", () => {
    const alt = neuerBogen();
    alt.einsatz.ortAuftrag = "Auftrag ALT wichtig";
    alt.sofortbedarf = { verpflegungPersonen: 4, dieselLiter: 80, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    alt.einheit.einheitsTyp = { freitext: "Fachgruppe Alt" };
    const neu = neuerBogen();
    neu.einsatz.ortAuftrag = "";
    neu.einheit.einheitsTyp = { freitext: "Fachgruppe Neu" };
    const u = vorlageUnterschiede(alt, neu);
    expect(u.join(" | ")).toContain("Einheitstyp: „Fachgruppe Alt\" → „Fachgruppe Neu\"");
    expect(u.join(" | ")).toContain("Ort/Auftrag: „Auftrag ALT wichtig\" → „leer\"");
    expect(u.join(" | ")).toMatch(/Sofortbedarf: 80 l Diesel.* → /);
    expect(unterschiedSatz(u)).toContain("Weitere Unterschiede");
  });

  it("schweigt, wenn sich nichts weiter unterscheidet", () => {
    const b = neuerBogen();
    expect(vorlageUnterschiede(b, structuredClone(b))).toEqual([]);
    expect(unterschiedSatz([])).toBe("");
  });
});

describe("R13-E1 Zahlfelder: Satz und gespeicherter Wert passen zusammen", () => {
  it("nennt beim Tippen den Wert, der weitergilt", () => {
    // Tippen: „5" ist schon gespeichert, dann kommt das „O".
    const r = mitGeltendemWert(zahlLesen("5O"), 5);
    expect(r.wert).toBeNull();
    expect(r.meldung).toBe("„5O“ ist keine Zahl — nicht übernommen. Es gilt weiter 5.");
  });

  it("lässt übernommene Eingaben und unbekannte Vorwerte unverändert", () => {
    expect(mitGeltendemWert(zahlLesen("12"), 5)).toEqual({ wert: 12, meldung: "" });
    expect(mitGeltendemWert(zahlLesen("x"), undefined).meldung).toBe("„x“ ist keine Zahl — nicht übernommen.");
  });
});

describe("R13-G1 Doppeltipp während der Erzeugung", () => {
  afterEach(() => {
    arbeitetZuruecksetzen();
    ausgabeSperreZuruecksetzen();
  });

  it("ein Tipp, der in den Lauf fiel, tut nichts — auch wenn er erst nach dem Lauf bearbeitet wird", async () => {
    const erster = { timeStamp: performance.now() - 1 };
    // Kurze Sperrzeit: Allein die Zeit zwischen den Tipps (≥ 30 ms) würde den zweiten durchlassen — das Zeitfenster des Laufs hält ihn auf.
    expect(ausgabeFreiBeiTipp("weitergeben", erster, tippWaehrendLauf, 10)).toBe(true);
    let fertig!: () => void;
    const lauf = arbeiten("weitergeben", () => new Promise<void>((r) => (fertig = r)));
    await new Promise((r) => setTimeout(r, 30));
    const zweiter = { timeStamp: performance.now() }; // 150 ms nach dem ersten, während die Erzeugung läuft
    fertig();
    await lauf;
    // Bearbeitet wird er erst jetzt, lange nach der Sperrzeit gemessen an der Uhr — aber die Ereigniszeit verrät ihn.
    expect(zweiter.timeStamp - erster.timeStamp).toBeGreaterThan(10);
    expect(ausgabeFreiBeiTipp("weitergeben", zweiter, tippWaehrendLauf, 10)).toBe(false);
    // Ein bewusster neuer Tipp nach dem Lauf geht durch.
    ausgabeSperreZuruecksetzen();
    expect(ausgabeFreiBeiTipp("weitergeben", { timeStamp: performance.now() + 5000 }, tippWaehrendLauf, 10)).toBe(true);
  });

  it("ohne Sperrzeit (Prüfstand) ändert sich nichts", () => {
    expect(ausgabeFreiBeiTipp("x", { timeStamp: 10 }, () => true, 0)).toBe(true);
    expect(ausgabeFreiBeiTipp("x", { timeStamp: 11 }, () => true, 0)).toBe(true);
  });
});

describe("R13-O2 Beispielbögen: Fehler im Bild", () => {
  it("der Beispielbögen-Dialog zeigt den Fehler der Beispielliste mit FehlerImBild (Ansage und Scrollen)", () => {
    // Seit 2026-11-09 eigener, nachgeladener Baustein (vorher in fusszeile.tsx).
    const quelle = readFileSync(new URL("./beispiele-dialog.tsx", import.meta.url), "utf8");
    expect(quelle).toMatch(/\{beispielFehler && <FehlerImBild text=\{beispielFehler\} \/>\}/);
    expect(quelle).not.toMatch(/<p className="fehler">\{beispielFehler\}<\/p>/);
  });
});
