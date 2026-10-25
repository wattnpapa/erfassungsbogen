import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { EinsatzArt, MeldeStatus, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { statusMitZeitSetzen } from "./eintrag-zeiten";
import { neuerBogen, neuesFahrzeug } from "./hilfen";
import { Lagemonitor, lagemonitorKennung, STUFE_SCHLUESSEL } from "./lagemonitor-ui";
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
    expect(screen.getByText(/Stärke F \/ U \/ M/)).toBeTruthy();
  });

  it("kennzeichnet eine Übung im Hauptbild, auch wenn der Name es nicht tut (R6-K3)", () => {
    const e = einsatzAnlegen("Heilbronn", EinsatzArt.UEBUNG, "Neckarvorland");
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.getByRole("status").textContent).toMatch(/ÜBUNG/);
  });

  it("zeigt im Fehlerzustand weiter die Uhr und eine Taste in Monitorschrift (R6-L6)", () => {
    render(<Lagemonitor einsatzId="gibt-es-nicht" />);
    expect(screen.getByLabelText("Datum-Zeit-Gruppe")).toBeTruthy();
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

  it("nennt mehr als drei Bewegungen mit „+ n weitere“ (R7-K2)", () => {
    const { e, ids } = mitEinheiten(5);
    for (const id of ids) statusMitZeitSetzen(e.id, id, MeldeStatus.ABGERUECKT);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelectorAll(".lm-bewegung:not(.lm-weitere-bewegungen)")).toHaveLength(3);
    expect(document.querySelector(".lm-weitere-bewegungen")!.textContent).toBe("+ 2 weitere Bewegungen");
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
    expect(screen.getByText("Uhr")).toBeTruthy();
  });

  it("hebt einen Datenstand ab einer Stunde hervor (R7-K8)", () => {
    const { e } = mitEinheiten(1);
    const liste = structuredClone(einsaetzeLaden());
    for (const x of liste.find((s) => s.id === e.id)!.eintraege) x.empfangenAm = Date.now() - 5 * 3_600_000;
    einsaetzeSpeichern(liste);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelector(".lm-stand .lm-veraltet")!.textContent).toMatch(/vor 5 Std/);
  });

  it("übernimmt den Nacht-Modus als Stufe „Gedimmt“, merkt die Wahl und führt nie mit einem Tipp auf Hell (R7-L3, R8-L4)", () => {
    document.documentElement.classList.add("nacht-modus");
    const e = einsatzAnlegen("Nacht", EinsatzArt.EINSATZ);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelector("main.lm")!.className).toContain("lm-gedimmt");
    expect(screen.queryByRole("button", { name: /dunkler/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Stufe: Gedimmt · heller: Dunkel/ })); // Gedimmt -> Dunkel, nicht Hell
    const klasse = () => document.querySelector("main.lm")!.className;
    expect(klasse()).not.toContain("lm-hell");
    expect(klasse()).not.toContain("lm-gedimmt");
    expect(localStorage.getItem(STUFE_SCHLUESSEL)).toBe("dunkel");
    fireEvent.click(screen.getByRole("button", { name: /Stufe: Dunkel · heller: Hell/ })); // -> Hell, wird nicht gemerkt
    expect(klasse()).toContain("lm-hell");
    expect(localStorage.getItem(STUFE_SCHLUESSEL)).toBe("dunkel");
    expect(screen.queryByRole("button", { name: /heller/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Stufe: Hell · dunkler: Dunkel/ })); // ein Tipp zurück, ohne zweites helles Bild
    expect(klasse()).not.toContain("lm-hell");
    fireEvent.click(screen.getByRole("button", { name: /dunkler: Gedimmt/ }));
    expect(localStorage.getItem(STUFE_SCHLUESSEL)).toBe("gedimmt");
    cleanup();
    render(<Lagemonitor einsatzId={e.id} />);
    expect(klasse()).toContain("lm-gedimmt");
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
    expect(document.querySelector(".lm-weitere")!.textContent).toMatch(/zuletzt gemeldet zuerst/);
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
