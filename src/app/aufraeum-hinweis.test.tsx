/**
 * Audit Runde 2, R2-D5: Ruhende Sammlungen verschwanden nach 90 Tagen ohne
 * Nachricht. Geprüft wird der ganze Weg über den echten Speicher: Sammlung
 * zurückdatieren, Liste laden — die Startseite muss die Löschung beim Namen
 * nennen, und „Verstanden" nimmt die Nachricht weg.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AUFRAEUM_FRIST_MS,
  EinsatzArt,
  einsaetzeAusJson,
  einsaetzeLaden,
  einsaetzeZuJson,
  einsatzAnlegen,
} from "@bos/meldekopf/einsaetze";
import { EinsatzListe } from "./einsaetze-ui";
import { Dialogschicht } from "./dialoge";
import { aufgeraeumteLaden, aufraeumBeobachter, ruhendeVormerken } from "./aufraeum-hinweis";

const TAG = 24 * 60 * 60 * 1000;

/** Sammlungen im Speicher zurückdatieren (geaendert = vor n Tagen). */
function zurueckdatieren(tage: Record<string, number>) {
  const liste = einsaetzeAusJson(localStorage.getItem("eeb.einsaetze.v1"));
  for (const s of liste) if (tage[s.name] != null) s.geaendert = Date.now() - tage[s.name]! * TAG;
  localStorage.setItem("eeb.einsaetze.v1", einsaetzeZuJson(liste));
}

function zeigen() {
  render(
    <>
      <EinsatzListe einsaetze={einsaetzeLaden()} onOeffnen={() => {}} onGeaendert={() => {}} />
      <Dialogschicht />
    </>,
  );
}

describe("Nachricht nach automatischer Löschung (R2-D5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nennt die gelöschte Sammlung beim Namen und verschwindet nach „Verstanden“", async () => {
    const nutzer = userEvent.setup();
    einsatzAnlegen("Hochwasser Ulm", EinsatzArt.EINSATZ);
    einsatzAnlegen("Übung Aalen", EinsatzArt.UEBUNG);
    zurueckdatieren({ "Hochwasser Ulm": 91, "Übung Aalen": 70 });
    zeigen();

    // Ulm ist weg, Aalen steht mit Ankündigung und der echten Ruhezeit da.
    expect(einsaetzeLaden().map((s) => s.name)).toEqual(["Übung Aalen"]);
    const hinweis = screen.getByRole("status");
    expect(hinweis.textContent).toContain("Automatisch gelöscht");
    expect(hinweis.textContent).toContain("Hochwasser Ulm");
    expect(hinweis.textContent).toContain("0 Meldung(en)");
    expect(document.body.textContent).toContain("seit 70 Tagen unverändert");
    expect(document.body.textContent).toContain("Wird in 20 Tag(en) automatisch gelöscht.");

    await nutzer.click(screen.getByRole("button", { name: "Verstanden" }));
    expect(screen.queryByText(/Automatisch gelöscht/)).toBeNull();
    expect(aufgeraeumteLaden()).toEqual([]);
  });

  it("merkt sich eine Sammlung nur einmal und lässt Papierkorb-Einträge in Ruhe", () => {
    const jetzt = Date.now();
    const alt = { id: "a", name: "Alt", art: EinsatzArt.EINSATZ, angelegt: 0, geaendert: jetzt - AUFRAEUM_FRIST_MS, eintraege: [] };
    const korb = { ...alt, id: "k", name: "Korb", geloeschtAm: jetzt };
    const frisch = { ...alt, id: "f", name: "Frisch", geaendert: jetzt };
    const text = einsaetzeZuJson([alt, korb, frisch]);
    ruhendeVormerken(text, localStorage, jetzt);
    ruhendeVormerken(text, localStorage, jetzt);
    expect(aufgeraeumteLaden().map((a) => a.name)).toEqual(["Alt"]);
  });

  it("reicht Lesen und Schreiben der Hülle unverändert durch", () => {
    const h = aufraeumBeobachter(localStorage);
    h.setItem("x", "1");
    expect(h.getItem("x")).toBe("1");
    expect(h.getItem("eeb.einsaetze.v1")).toBeNull();
  });
});
