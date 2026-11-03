import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuePerson, neuerBogen } from "./hilfen";
import { KontaktArt, StaerkeRolle } from "@bos/eeb-format/model";
import { Lagemonitor, STUFE_SCHLUESSEL } from "./lagemonitor-ui";
import { ANSICHT_SCHLUESSEL, ANZEIGE_SCHLUESSEL, fuehrerName, kachelSpalten } from "./lagemonitor-v2";
import { notizSetzen } from "./eintrag-zeiten";
import { einsaetzeLaden } from "./einsaetze-lesen";
import { telefonAnzeige } from "./lagemonitor";

describe("kachelSpalten", () => {
  it("liefert genug Spalten, damit alle Einheiten ohne Rollen passen", () => {
    expect(kachelSpalten(1, 1920, 1080)).toBe(1);
    for (const n of [2, 6, 12, 30]) {
      const sp = kachelSpalten(n, 1920, 1080);
      expect(sp).toBeGreaterThanOrEqual(1);
      expect(sp).toBeLessThanOrEqual(n);
    }
    expect(kachelSpalten(30, 1920, 1080)).toBeGreaterThan(kachelSpalten(6, 1920, 1080));
  });
});

describe("Lagemonitor V2", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  function einsatzMitEinheit() {
    const e = einsatzAnlegen("Hochwasser Süd", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "OV Musterstadt";
    meldungHinzufuegen(e.id, b);
    return e;
  }

  it("bleibt ohne Wahl bei V1", () => {
    const e = einsatzMitEinheit();
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelector(".lm2")).toBeNull();
  });

  it("wechselt über die Optionen auf V2, merkt die Wahl und zeigt die Einheiten als Kacheln", () => {
    const e = einsatzMitEinheit();
    render(<Lagemonitor einsatzId={e.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Lagemonitor V2" }));
    expect(localStorage.getItem(ANSICHT_SCHLUESSEL)).toBe("v2");
    expect(document.querySelectorAll(".lm2-kachel").length).toBe(1);
    expect(screen.getByRole("heading", { name: /Hochwasser Süd/ })).toBeTruthy();
  });

  it("legt Einsatzdaten, Ansicht und Helligkeit ins Menü; Helligkeit wirkt", () => {
    localStorage.setItem(ANSICHT_SCHLUESSEL, "v2");
    const e = einsatzMitEinheit();
    render(<Lagemonitor einsatzId={e.id} />);
    expect(screen.queryByText("Einsatzdaten")).toBeNull();
    expect(screen.queryByRole("button", { name: "Heller (weiß)" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Menü/ }));
    const menu = screen.getByRole("dialog", { name: "Menü" });
    expect(within(menu).getByText("Einsatzdaten")).toBeTruthy();
    fireEvent.click(within(menu).getByRole("button", { name: "Dunkler" }));
    expect(localStorage.getItem(STUFE_SCHLUESSEL)).toBe("gedimmt");
    expect(document.querySelector("main.lm-gedimmt")).toBeTruthy();
    fireEvent.click(within(menu).getByRole("button", { name: "Lagemonitor V1" }));
    expect(document.querySelector(".lm2")).toBeNull();
  });

  it("zeigt den Auftrag vollständig, Einheitsführer und Telefon nach Menüwahl", () => {
    localStorage.setItem(ANSICHT_SCHLUESSEL, "v2");
    const e = einsatzAnlegen("Hochwasser Süd", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "OV Musterstadt";
    const p = neuePerson();
    p.vorname = "Patrick";
    p.nachname = "Muster";
    p.staerkeRolle = StaerkeRolle.FUEHRER;
    p.kontakte = [{ art: KontaktArt.MOBIL, dienstlich: true, wert: "01712345678" }];
    b.personal = [p];
    const auftrag = "Zug Beispielaufgabe: Einsatzstelle erkunden, Material bereitstellen und Bericht an die Leitung geben";
    meldungHinzufuegen(e.id, b);
    notizSetzen(e.id, einsaetzeLaden().find((x) => x.id === e.id)!.eintraege[0]!.id, auftrag);
    render(<Lagemonitor einsatzId={e.id} />);
    expect(document.querySelector(".lm2-auftrag")?.textContent).toBe(auftrag);
    expect(document.querySelector(".lm2-leiter")?.textContent).toContain("P. Muster");
    expect(document.querySelector(".lm2-leiter")?.textContent).toContain("0171 2345678");
    fireEvent.click(screen.getByRole("button", { name: /Menü/ }));
    const menu = screen.getByRole("dialog", { name: "Menü" });
    fireEvent.click(within(menu).getByRole("button", { name: "Muster" }));
    fireEvent.click(within(menu).getAllByRole("button", { name: "ausgeblendet" })[1]!);
    expect(JSON.parse(localStorage.getItem(ANZEIGE_SCHLUESSEL)!)).toEqual({ fuehrer: "nachname", kontakt: "aus" });
    expect(document.querySelector(".lm2-leiter")?.textContent).toBe("Muster");
  });
});

describe("fuehrerName / telefonAnzeige", () => {
  const l = { vorname: "Patrick", nachname: "Muster" };
  it("formatiert die fünf Darstellungen", () => {
    expect(fuehrerName(l, "voll")).toBe("Patrick Muster");
    expect(fuehrerName(l, "initialeNachname")).toBe("P. Muster");
    expect(fuehrerName(l, "vornameInitiale")).toBe("Patrick M.");
    expect(fuehrerName(l, "nachname")).toBe("Muster");
    expect(fuehrerName(l, "aus")).toBe("");
  });
  it("setzt die Vorwahl ab", () => {
    expect(telefonAnzeige("01712345678")).toBe("0171 2345678");
    expect(telefonAnzeige("112")).toBe("112");
  });
});
