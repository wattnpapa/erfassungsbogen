import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { cleanup, render, screen, within } from "@testing-library/react";
import { EinsatzArt, MeldeStatus, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { statusMitZeitSetzen } from "./eintrag-zeiten";
import { neuerBogen, neuesFahrzeug } from "./hilfen";
import { Lagemonitor, lagemonitorKennung, ortImFunkruf, STUFE_SCHLUESSEL, STUFEN_SPERRE_MS } from "./lagemonitor-ui";
import { fireEvent } from "@testing-library/react";
import { einsaetzeLaden } from "./einsaetze-lesen";
import { einsaetzeSpeichern } from "@bos/meldekopf/einsaetze";
import {
  BEGINN_SCHLUESSEL,
  FUNKRUF_MAX,
  FUNKRUF_SCHLUESSEL,
  einsatzFunkrufLaden,
  einsatzFunkrufSetzen,
  einsatzbeginnLaden,
  einsatzbeginnSetzen,
} from "./lagemonitor-beginn";

describe("lagemonitorKennung", () => {
  it("liest die Einsatz-Kennung aus der Adresse", () => {
    expect(lagemonitorKennung("?lagemonitor=abc")).toBe("abc");
    expect(lagemonitorKennung("")).toBeNull();
    expect(lagemonitorKennung("?lagemonitor=")).toBeNull();
  });
});

describe("Lagemonitor", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("meldet einen unbekannten Einsatz, statt leer zu bleiben", () => {
    render(<Lagemonitor einsatzId="gibt-es-nicht" />);
    expect(screen.getByText(/nicht \(mehr\) vorhanden/)).toBeTruthy();
  });

  it("zeigt Summen und Einheitsnamen, ohne Beginn den Hinweis darauf", () => {
    const e = einsatzAnlegen("Hochwasser Süd", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "OV Musterstadt";
    meldungHinzufuegen(e.id, b);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.getByRole("heading", { name: "Hochwasser Süd" })).toBeTruthy();
    // R6-K4: Ohne gesetzten Beginn gilt die erste Meldung als Vorschlag, kein Fehler auf dem Fernseher.
    expect(screen.queryByText("Einsatzbeginn nicht gesetzt")).toBeNull();
    expect(screen.getByText(/seit erster Meldung/)).toBeTruthy();
    expect(screen.getAllByText(/OV Musterstadt/).length).toBeGreaterThan(0);
  });

  // Audit Runde 6, R6-K1: Der Fernseher sagt, was sich bewegt, und unterscheidet „leer" von „alle abgerückt".
  it("unterscheidet eine leere Lage von einer, in der alle abgerückt sind (R6-K1)", () => {
    const leer = einsatzAnlegen("Leer", EinsatzArt.EINSATZ);
    render(<Lagemonitor einsatzId={leer.id} />);
    expect(screen.getByText("Noch nichts gemeldet", { selector: ".lm-stand" })).toBeTruthy();
    cleanup();
    const e = einsatzAnlegen("Alle fort", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "OV Fort";
    const r = meldungHinzufuegen(e.id, b);
    statusMitZeitSetzen(e.id, r!.eintrag.id, MeldeStatus.ABGERUECKT);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelector(".lm-stand")!.textContent).toMatch(/Alle 1 Einheiten abgerückt/);
    expect(document.querySelector(".lm-bewegung")!.textContent).toMatch(/Abgerückt: .*OV Fort/);
  });

  it("nennt Zahl der Einheiten und Fahrzeuge, abgerückte und das Alter der letzten Meldung (R6-K1, R6-K2)", () => {
    const e = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "OV Da";
    meldungHinzufuegen(e.id, b);
    render(<Lagemonitor einsatzId={e.id} />);
    const stand = document.querySelector(".lm-stand")!.textContent!;
    expect(stand).toMatch(/1 Einheit · \d+ Fahrzeuge?/);
    expect(stand).toMatch(/letzte Meldung gerade eben/);
    expect(screen.getByText(/Stärke Führer \/ Unterführer \/ Mannschaft = gesamt/)).toBeTruthy();
  });

  it("kennzeichnet eine Übung im Hauptbild, auch wenn der Name es nicht tut (R6-K3)", () => {
    const e = einsatzAnlegen("Heilbronn", EinsatzArt.UEBUNG, "Neckarvorland");
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.getByRole("status").textContent).toMatch(/ÜBUNG/);
  });

  it("zeigt im Fehlerzustand weiter die Uhr und eine Taste in Monitorschrift (R6-L6)", () => {
    render(<Lagemonitor einsatzId="gibt-es-nicht" />);
    expect(screen.getByLabelText("Uhrzeit und Datum")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Schließen" }).className).toContain("lm-knopf");
  });

  it("setzt den Funkrufnamen in die erste Zeile und den Einsatznamen in die zweite", () => {
    const e = einsatzAnlegen("Wattsturm 2026", EinsatzArt.UEBUNG);
    einsatzFunkrufSetzen(e.id, "Salus Übungsleitung", [e.id]);
    render(<Lagemonitor einsatzId={e.id} />);
    const kopf = screen.getByRole("heading", { level: 1 });
    expect(kopf.textContent).toBe("Salus Übungsleitung");
    expect(kopf.nextElementSibling?.textContent).toBe("Wattsturm 2026");
  });

  it("zeigt ohne Funkrufnamen nur den Einsatznamen als erste Zeile", () => {
    const e = einsatzAnlegen("Wattsturm 2026", EinsatzArt.UEBUNG);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Wattsturm 2026");
    expect(screen.getAllByText("Wattsturm 2026")).toHaveLength(1);
  });

  it("listet die Einheiten als Tabelle: Orga, Ort, Funkrufname, Einheitentyp, F/U/M", () => {
    const e = einsatzAnlegen("Wattsturm 2026", EinsatzArt.UEBUNG);
    const mit = neuerBogen();
    mit.einheit.hierarchie[0]!.name = "Jever";
    mit.einheit.einheitsTyp = { freitext: "Zugtrupp" };
    mit.staerkeManuell = { fuehrer: 1, unterfuehrer: 2, mannschaft: 5, gesamt: 8 };
    const fz = neuesFahrzeug();
    fz.funkrufname = { kennwort: { freitext: "Heros" }, eigenerStandort: true, teile: [21, 10] };
    mit.fahrzeuge = [fz];
    meldungHinzufuegen(e.id, mit);
    const ohne = neuerBogen();
    ohne.einheit.hierarchie[0]!.name = "Aurich";
    ohne.staerkeManuell = { fuehrer: 0, unterfuehrer: 0, mannschaft: 3, gesamt: 3 };
    meldungHinzufuegen(e.id, ohne);

    render(<Lagemonitor einsatzId={e.id} />);
    const zeilen = within(screen.getByRole("table")).getAllByRole("row");
    expect(zeilen).toHaveLength(3); // Kopf + zwei Einheiten
    const zellen = (i: number) => within(zeilen[i]!).getAllByRole("cell").map((c) => c.textContent);
    const alle = [zellen(1), zellen(2)];
    const jever = alle.find((z) => z[1] === "Jever")!;
    expect(jever[0]).toBe("THW");
    expect(jever[2]).toMatch(/Heros/);
    expect(jever[3]).toBe("Zugtrupp");
    expect(jever.slice(4)).toEqual(["1", "2", "5"]);
    const aurich = alle.find((z) => z[1] === "Aurich")!;
    expect(aurich[2]).toBe("–"); // kein Fahrzeug mit Funkrufname
    expect(aurich.slice(4)).toEqual(["0", "0", "3"]);
  });

  it("sagt statt einer leeren Tabelle, dass noch keine Einheit gemeldet ist", () => {
    const e = einsatzAnlegen("Leer", EinsatzArt.EINSATZ);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("Noch keine Einheit gemeldet.")).toBeTruthy();
  });

  it("zeigt die Einsatzdauer, sobald ein Beginn gesetzt ist", () => {
    const e = einsatzAnlegen("Übungstag", EinsatzArt.UEBUNG);
    einsatzbeginnSetzen(e.id, Date.now() - 95 * 60_000, [e.id]);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.getByText(/1 Stunde, 3\d Minuten/)).toBeTruthy();
  });
});

describe("Lagemonitor, Runde 7", () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.classList.remove("nacht-modus"); });
  afterEach(() => { cleanup(); document.documentElement.classList.remove("nacht-modus"); });

  function mitEinheiten(n: number) {
    const e = einsatzAnlegen("Lage", EinsatzArt.EINSATZ, "Heilbronn");
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const b = neuerBogen();
      b.einheit.hierarchie[0]!.name = `Ort${i}`;
      ids.push(meldungHinzufuegen(e.id, b)!.eintrag.id);
    }
    return { e, ids };
  }

  it("nennt mehr als drei Bewegungen mit „+ n weitere“ am Ende der letzten Zeile (R7-K2, R17-K3)", () => {
    const { e, ids } = mitEinheiten(5);
    for (const id of ids) statusMitZeitSetzen(e.id, id, MeldeStatus.ABGERUECKT);
    // Großes Bild (1080p): drei Zeilen; der Rest steht in der dritten, nicht in einer eigenen.
    vi.stubGlobal("innerHeight", 1080);
    vi.stubGlobal("innerWidth", 1920);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelectorAll(".lm-bewegung")).toHaveLength(3);
    expect(document.querySelector(".lm-bewegung:last-child .lm-weitere-bewegungen")!.textContent).toBe(" · + 2 weitere Bewegungen");
    vi.unstubAllGlobals();
  });

  it("zeigt bei 720p und am Telefon nur eine Bewegungszeile und lässt der Einheitentabelle den Platz (R17-K3)", () => {
    const { e, ids } = mitEinheiten(5);
    for (const id of ids) statusMitZeitSetzen(e.id, id, MeldeStatus.ABGERUECKT);
    vi.stubGlobal("innerHeight", 720);
    vi.stubGlobal("innerWidth", 1280);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelectorAll(".lm-bewegung")).toHaveLength(1);
    expect(document.querySelector(".lm-weitere-bewegungen")!.textContent).toBe(" · + 4 weitere Bewegungen");
    vi.unstubAllGlobals();
  });

  it("führt das Eintreffen einer neuen Einheit als Bewegung (R7-W4) und setzt die Folgemeldung mit Betrag (R7-K2)", () => {
    const { e } = mitEinheiten(1);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelector(".lm-bewegung")!.textContent).toMatch(/^Eingetroffen: .*Ort0/);
  });

  it("widerspricht sich bei Meldezeiten in der Zukunft nicht (R7-K3)", () => {
    const { e } = mitEinheiten(2);
    const liste = structuredClone(einsaetzeLaden());
    for (const x of liste.find((s) => s.id === e.id)!.eintraege) x.empfangenAm = Date.now() + 2 * 3_600_000;
    einsaetzeSpeichern(liste);
    render(<Lagemonitor einsatzId={e.id} />);
    const text = document.body.textContent!;
    expect(text).not.toMatch(/gerade eben/);
    expect(text).not.toMatch(/Noch nichts gemeldet/);
    expect(text).toMatch(/Zeiten prüfen \(Geräteuhr\?\)/);
  });

  it("sagt je Zustand nur eine Sache und nennt den Ort im Hauptbild (R7-K8)", () => {
    const leer = einsatzAnlegen("Leer", EinsatzArt.EINSATZ, "Heilbronn");
    render(<Lagemonitor einsatzId={leer.id} />);
    expect(screen.getAllByText(/Noch nichts gemeldet/)).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Leer.*Heilbronn/);
    cleanup();
    const { e, ids } = mitEinheiten(1);
    for (const id of ids) statusMitZeitSetzen(e.id, id, MeldeStatus.ABGERUECKT);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.queryByText("Noch keine Einheit gemeldet.")).toBeNull();
    expect(screen.getByText("Alle Einheiten sind abgerückt.")).toBeTruthy();
  });

  it("beschriftet die Dauer mit Wort und die Uhr als „Uhr“ (R7-K8, R7-N5)", () => {
    const e = einsatzAnlegen("Tag", EinsatzArt.UEBUNG);
    einsatzbeginnSetzen(e.id, Date.now() - 5 * 60_000, [e.id]);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.getByText(/^seit Beginn: 0 Stunden, 5 Minuten/)).toBeTruthy();
    // R10-H3: Uhrzeit mit Doppelpunkt, Datum getrennt und beschriftet.
    expect(screen.getByText("Uhrzeit · Datum")).toBeTruthy();
    expect(document.querySelector(".lm-dtg-text strong")!.textContent).toMatch(/^\d{2}:\d{2}$/);
    expect(document.querySelector(".lm-dtg-text span")!.textContent).toMatch(/^\d{1,2}\. \S+ \d{4}$/);
  });

  it("hebt einen Datenstand ab einer Stunde hervor (R7-K8)", () => {
    const { e } = mitEinheiten(1);
    const liste = structuredClone(einsaetzeLaden());
    for (const x of liste.find((s) => s.id === e.id)!.eintraege) x.empfangenAm = Date.now() - 5 * 3_600_000;
    einsaetzeSpeichern(liste);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelector(".lm-stand .lm-veraltet")!.textContent).toMatch(/vor 5 Std/);
  });

  it("übernimmt den Nacht-Modus als Stufe „Gedimmt“, merkt die Wahl und führt nie mit einem Tipp auf Hell (R7-L3, R8-L4, R9-M9)", () => {
    document.documentElement.classList.add("nacht-modus");
    let uhr = 1_000_000;
    const jetzt = vi.spyOn(Date, "now").mockImplementation(() => uhr);
    const e = einsatzAnlegen("Nacht", EinsatzArt.EINSATZ);
    render(<Lagemonitor einsatzId={e.id} />);
    const klasse = () => document.querySelector("main.lm")!.className;
    const stufe = () => document.querySelector(".lm-stufe")!.textContent;
    const heller = () => screen.getByRole("button", { name: /^Heller/ });
    const dunkler = () => screen.getByRole("button", { name: "Dunkler" });
    expect(klasse()).toContain("lm-gedimmt");
    // R9-M9: Der Zustand steht als Text, die Knöpfe tragen nur die Aktion.
    expect(stufe()).toBe("Stufe: Gedimmt");
    expect(dunkler().getAttribute("aria-disabled")).toBe("true"); // am Ende der Leiter
    fireEvent.click(heller()); // Gedimmt -> Dunkel
    expect(stufe()).toBe("Stufe: Dunkel");
    expect(klasse()).not.toContain("lm-hell");
    expect(localStorage.getItem(STUFE_SCHLUESSEL)).toBe("dunkel");
    // R9-L1: Doppeltipp, Prellen und zweiter Tipp innerhalb von 1,5 s führen nie auf Hell.
    const nachWechsel = uhr;
    for (const abstand of [0, 120, 350, 700, STUFEN_SPERRE_MS - 1]) {
      uhr = nachWechsel + abstand;
      fireEvent.click(heller());
      expect(klasse()).not.toContain("lm-hell");
    }
    uhr = nachWechsel + STUFEN_SPERRE_MS + 1; // bewusster zweiter Tipp nach der Sperre
    fireEvent.click(heller()); // -> Hell, wird nicht gemerkt
    expect(klasse()).toContain("lm-hell");
    expect(localStorage.getItem(STUFE_SCHLUESSEL)).toBe("dunkel");
    expect(heller().getAttribute("aria-disabled")).toBe("true");
    // Zurück geht sofort, ohne Sperre, und mit einem Tipp (kein zweites helles Bild).
    fireEvent.click(dunkler());
    expect(klasse()).not.toContain("lm-hell");
    expect(stufe()).toBe("Stufe: Dunkel");
    uhr += STUFEN_SPERRE_MS + 1;
    fireEvent.click(dunkler());
    expect(localStorage.getItem(STUFE_SCHLUESSEL)).toBe("gedimmt");
    cleanup();
    render(<Lagemonitor einsatzId={e.id} />);
    expect(klasse()).toContain("lm-gedimmt");
    jetzt.mockRestore();
  });

  it("nennt den Ort am Telefon nicht doppelt, wenn der Funkrufname ihn schon enthält (R9-K5)", () => {
    expect(ortImFunkruf({ ort: "Albstadt", funkruf: "Heros Albstadt 21/10" })).toBe(true);
    expect(ortImFunkruf({ ort: "albstadt", funkruf: "Heros  Albstadt 21/10" })).toBe(true);
    expect(ortImFunkruf({ ort: "", funkruf: "" })).toBe(true);
    expect(ortImFunkruf({ ort: "Hamburg Mitte", funkruf: "Heros Hamburg 1/63/44" })).toBe(false);
    const e = einsatzAnlegen("Orte", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Aurich";
    meldungHinzufuegen(e.id, b);
    render(<Lagemonitor einsatzId={e.id} />);
    // Ort ohne Funkruf: bleibt als Zusatz der Funkrufzelle für das Telefon erhalten, der Zelltext ändert sich nicht.
    const zelle = document.querySelector(".lm-einheiten tbody tr td:nth-child(3)")!;
    expect(zelle.getAttribute("data-ort")).toBe("Aurich");
    expect(zelle.textContent).toBe("–");
  });

  it("ordnet die Einheiten nach „zuletzt gemeldet zuerst“ (R8-K5)", () => {
    const e = einsatzAnlegen("Reihenfolge", EinsatzArt.EINSATZ);
    for (const name of ["OV Alt", "OV Neu"]) {
      const b = neuerBogen();
      b.einheit.hierarchie[0]!.name = name;
      meldungHinzufuegen(e.id, b);
    }
    const liste = structuredClone(einsaetzeLaden());
    const eintraege = liste.find((s) => s.id === e.id)!.eintraege;
    const t = Date.now();
    eintraege.forEach((x, i) => { x.empfangenAm = t - (eintraege.length - i) * 60_000 * (i === 0 ? 5 : 1); });
    einsaetzeSpeichern(liste);
    render(<Lagemonitor einsatzId={e.id} />);
    const zeilen = Array.from(document.querySelectorAll(".lm-einheiten tbody tr")).map((r) => r.textContent ?? "");
    expect(zeilen).toHaveLength(2);
    expect(zeilen[0]).toContain("OV Neu");
    expect(zeilen[1]).toContain("OV Alt");
    expect(document.querySelector(".lm-weitere")!.textContent).toMatch(/zuletzt gemeldete zuerst/);
  });
});

describe("einsatzbeginn speichern", () => {
  beforeEach(() => localStorage.clear());

  it("merkt den Beginn je Einsatz und entfernt ihn wieder", () => {
    expect(einsatzbeginnLaden("a")).toBeNull();
    expect(einsatzbeginnSetzen("a", 1000, ["a", "b"])).toBe(true);
    expect(einsatzbeginnSetzen("b", 2000, ["a", "b"])).toBe(true);
    expect(einsatzbeginnLaden("a")).toBe(1000);
    expect(einsatzbeginnLaden("b")).toBe(2000);
    einsatzbeginnSetzen("a", null, ["a", "b"]);
    expect(einsatzbeginnLaden("a")).toBeNull();
    expect(einsatzbeginnLaden("b")).toBe(2000);
  });

  it("räumt Einträge zu verschwundenen Einsätzen beim Schreiben ab", () => {
    einsatzbeginnSetzen("alt", 1, ["alt"]);
    einsatzbeginnSetzen("neu", 2, ["neu"]);
    expect(einsatzbeginnLaden("alt")).toBeNull();
    einsatzbeginnSetzen("neu", null, ["neu"]);
    expect(localStorage.getItem(BEGINN_SCHLUESSEL)).toBeNull();
  });

  it("übersteht beschädigten Speicher", () => {
    localStorage.setItem(BEGINN_SCHLUESSEL, "{kaputt");
    expect(einsatzbeginnLaden("a")).toBeNull();
    localStorage.setItem(BEGINN_SCHLUESSEL, JSON.stringify({ a: "x", b: 5 }));
    expect(einsatzbeginnLaden("a")).toBeNull();
    expect(einsatzbeginnLaden("b")).toBe(5);
  });
});

describe("Funkrufname speichern", () => {
  beforeEach(() => localStorage.clear());

  it("merkt den Namen je Einsatz, trimmt ihn und entfernt ihn bei leerer Eingabe", () => {
    expect(einsatzFunkrufLaden("a")).toBeNull();
    expect(einsatzFunkrufSetzen("a", "  Salus Übungsleitung ", ["a", "b"])).toBe(true);
    expect(einsatzFunkrufSetzen("b", "Heros 21/10", ["a", "b"])).toBe(true);
    expect(einsatzFunkrufLaden("a")).toBe("Salus Übungsleitung");
    expect(einsatzFunkrufLaden("b")).toBe("Heros 21/10");
    einsatzFunkrufSetzen("a", "   ", ["a", "b"]);
    expect(einsatzFunkrufLaden("a")).toBeNull();
    expect(einsatzFunkrufLaden("b")).toBe("Heros 21/10");
  });

  it("kürzt zu lange Namen und räumt Einträge verschwundener Einsätze ab", () => {
    einsatzFunkrufSetzen("a", "x".repeat(FUNKRUF_MAX + 20), ["a"]);
    expect(einsatzFunkrufLaden("a")).toHaveLength(FUNKRUF_MAX);
    einsatzFunkrufSetzen("neu", "Neu", ["neu"]);
    expect(einsatzFunkrufLaden("a")).toBeNull();
    einsatzFunkrufSetzen("neu", "", ["neu"]);
    expect(localStorage.getItem(FUNKRUF_SCHLUESSEL)).toBeNull();
  });

  it("lässt Funkrufname und Beginn einander in Ruhe", () => {
    einsatzbeginnSetzen("a", 1000, ["a"]);
    einsatzFunkrufSetzen("a", "Salus", ["a"]);
    einsatzFunkrufSetzen("a", "", ["a"]);
    expect(einsatzbeginnLaden("a")).toBe(1000);
  });
});

// Stilregeln der Runde 9: jsdom rechnet kein Layout, also wird der Stil selbst geprüft (Messung im Browser: docs/audits/runde-9).
describe("Lagemonitor, Stil Runde 9", () => {
  const css = readFileSync("src/app/lagemonitor.css", "utf8");
  const telefon = css.slice(css.indexOf("@media (max-width: 640px), (max-height: 480px)"));

  it("leitet die Telefon-Größen aus einer rem-Basis ab, Zahlen nie kleiner als Beschriftungen (R9-K2, R9-L2)", () => {
    expect(telefon).toMatch(/--lm-b:\s*min\(1rem,/);
    expect(telefon).toMatch(/--lm-min:\s*calc\(var\(--lm-b\) \* 0\.875\)/);
    for (const k of [".lm-r3", ".lm-bewegungen", ".lm-einheiten-block", ".lm-dtg"]) {
      expect(telefon, k).toMatch(new RegExp(`${k.replace(".", "\\.")} \\{ font-size:[^}]*var\\(--lm-(b|min)\\)`));
    }
    // Tabellenkopf auf Zellenhöhe, nicht kleiner (R9-L2).
    expect(telefon).toMatch(/\.lm-einheiten th \{ font-size: 1em; \}/);
    expect(css).not.toMatch(/\.lm-einheiten th \{ font-size: 0\.75em/);
  });

  it("bricht Wörter nicht mitten im Wort, außer als Notfall der Messung (R9-K5, R9-L3)", () => {
    expect(css).not.toMatch(/overflow-wrap:\s*anywhere;\s*\n\s*hyphens/);
    expect(telefon).toMatch(/\.lm-einheiten td \{ overflow-wrap: normal; hyphens: manual; \}/);
    expect(telefon).toMatch(/\.lm-einheiten\.lm-bruch td \{ overflow-wrap: anywhere; \}/);
  });

  it("setzt Uhr neutral und die Warnung in eigener Farbe mit Zeichen und Fettschrift (R9-K6)", () => {
    expect(css).toMatch(/\.lm-dtg \{[^}]*color: var\(--lm-text\);/s);
    expect(css).toMatch(/\.lm-label\.lm-veraltet \{[^}]*color: var\(--lm-warn\); font-weight: 700;/);
    expect(css).toContain('.lm-label.lm-veraltet::before { content: "\\26A0');
    expect(css).not.toMatch(/--lm-warn:\s*#ff0000/);
  });
});

// Runde 10 (R10-H3, R10-L3, R10-L4, R10-K4, R10-K5): Stilregeln werden gerechnet, Layout misst die Browserprüfung.
describe("Lagemonitor, Runde 10", () => {
  const css = readFileSync("src/app/lagemonitor.css", "utf8");
  const farbe = (selektor: string, name: string): string => {
    const block = css.slice(css.indexOf(selektor + " {"));
    const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,6})\\b`).exec(block.slice(0, block.indexOf("}")));
    if (!m) return selektor === "main.lm" ? (() => { throw new Error(name); })() : farbe("main.lm", name); // nicht überschrieben: gilt die Grundstufe
    return m[1]!.length === 4 ? "#" + [...m[1]!.slice(1)].map((c) => c + c).join("") : m[1]!;
  };
  const kanaele = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const luma = (hex: string) => { const [r, g, b] = kanaele(hex); return 0.299 * r! + 0.587 * g! + 0.114 * b!; };
  const hellsterPunkt = (st: string) => Math.max(...kanaele(farbe(st, "--lm-text")));
  const rel = (hex: string) => {
    const l = kanaele(hex).map((c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * l[0]! + 0.7152 * l[1]! + 0.0722 * l[2]!;
  };
  const kontrast = (a: string, b: string) => { const [x, y] = [rel(a), rel(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
  const gedimmt = "main.lm.lm-gedimmt";
  const dunkel = "main.lm";
  const hell = "main.lm.lm-hell";

  it("ordnet die Stufen nach Leuchtdichte: Gedimmt < Dunkel < Hell, Dunkel höchstens ~200 (R10-L4)", () => {
    // Mittlere Leuchtdichte des Bildes: Fläche in Grund- und Textfarbe, Text mit etwa 12 % Anteil.
    const mittel = (st: string) => 0.88 * luma(farbe(st, "--lm-grund")) + 0.12 * luma(farbe(st, "--lm-text"));
    expect(mittel(gedimmt)).toBeLessThan(mittel(dunkel));
    expect(mittel(dunkel)).toBeLessThan(mittel(hell));
    expect(hellsterPunkt(gedimmt)).toBeLessThan(hellsterPunkt(dunkel));
    expect(hellsterPunkt(dunkel)).toBeLessThanOrEqual(205);
    // Lesbarkeit bleibt auf jeder Stufe erhalten.
    for (const st of [gedimmt, dunkel]) {
      for (const n of ["--lm-text", "--lm-zeit", "--lm-warn"]) expect(kontrast(farbe(st, n), "#000000"), `${st} ${n}`).toBeGreaterThanOrEqual(4.5);
      expect(kontrast(farbe(st, "--lm-rahmen"), "#000000"), `${st} Rahmen`).toBeGreaterThanOrEqual(3);
    }
  });

  it("zeigt „Optionen“ mit Aufklappzeichen und die Helligkeit außerhalb davon (R10-L3)", () => {
    expect(css).toContain('.lm-klapp > summary::before { content: "\\25B8"');
    expect(css).toContain('.lm-klapp[open] > summary::before { content: "\\25BE"');
    const e = einsatzAnlegen("Leiste", EinsatzArt.EINSATZ);
    render(<Lagemonitor einsatzId={e.id} />);
    const optionen = Array.from(document.querySelectorAll("details.lm-klapp")).find((d) => d.querySelector("summary")!.textContent === "Optionen")!;
    expect(within(optionen as HTMLElement).queryByRole("button", { name: "Dunkler" })).toBeNull();
    expect(document.querySelector(".lm-stufenleiste")!.contains(screen.getByRole("button", { name: "Dunkler" }))).toBe(true);
    // Telefon: Leiste hinter allem anderen (order 99, R17-K11), Fuß löst sich in die Spalte auf.
    expect(css).toMatch(/\.lm-fuss \{ display: contents; \}/);
    expect(css).toMatch(/\.lm-stufenleiste \{ order: 99;/);
  });

  it("markiert Soll-Einheiten in der Tabelle mit „S“, der Vorbehalt steht in der Stärkezeile (R10-K4)", () => {
    const e = einsatzAnlegen("Soll", EinsatzArt.EINSATZ);
    const bogen = neuerBogen();
    bogen.einheit.organisation = 0 as never;
    bogen.fahrzeuge = [neuesFahrzeug()];
    meldungHinzufuegen(e.id, bogen);
    render(<Lagemonitor einsatzId={e.id} />);
    const soll = einsaetzeLaden().find((s) => s.id === e.id)!;
    expect(soll.eintraege.length).toBe(1);
    const markiert = document.querySelectorAll(".lm-einheiten .lm-soll").length;
    const vorbehalt = document.querySelector(".lm-r3 .lm-veraltet");
    // Beides gehört zusammen: ohne Sollstärke weder Marke noch Vorbehalt.
    expect(vorbehalt != null).toBe(markiert > 0);
    if (vorbehalt) expect(vorbehalt.textContent).toMatch(/Sollstärke \(S\)/);
    expect(document.querySelectorAll(".lm-stand .lm-veraltet").length).toBeLessThanOrEqual(1);
  });
});
