/**
 * Runde 14, Block Inhalte: reine Logik der Behebungen aus arbeitsablauf (W1, W3 bis W5), fuehrungssicht (K1, K3, K4),
 * neuer-nutzer (N1, N2) und zerstoerende-handlungen (D2). W2 steht in einsatz-abgleich.test.ts, die gesetzten
 * Lageblätter in runde14-inhalte-pdf.test.ts, die Oberfläche in runde14-inhalte-ui.test.tsx.
 */
import { afterEach, describe, expect, it } from "vitest";
import { PersonalErfassung, StaerkeRolle, type Erfassungsbogen } from "@bos/eeb-format/model";
import { MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { neuePerson, neuerBogen, pruefpunkte } from "./hilfen";
import { bedarfNichtErfasst } from "./auswertung";

afterEach(() => localStorage.clear());

function eintrag(id: string, bogen: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return { id, einheitSchluessel: id, empfangenAm: Date.now(), quelle: "scan", status: MeldeStatus.ANWESEND, bogen, ...over } as MeldeEintrag;
}

function bogenMit(ort: string, personen = 3): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  b.personal = Array.from({ length: personen }, (_, k) => ({ ...neuePerson(), vorname: `V${k}`, nachname: `N${ort}${k}` }));
  return b;
}

/** Schnellerfassung: nur Stärke, nichts sonst. */
function schnell(ort: string, gesamt: number): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  b.personalErfassung = PersonalErfassung.NUR_STAERKE;
  b.personal = [];
  b.fahrzeuge = [];
  b.staerkeManuell = { fuehrer: 0, unterfuehrer: 3, mannschaft: gesamt - 3, gesamt };
  return b;
}

describe("R14-A1 Wann ist die Eintreffzeit nur die Zeit des Einlesens?", () => {
  it("gestempelt: erste Fassung und Folgemeldung erben sie; von Hand gesetzt oder manuell erfasst: nicht", async () => {
    const { zeitEingelesen } = await import("./pdf");
    const t0 = new Date(2026, 9, 26, 9, 56).getTime();
    const erste = eintrag("e1", bogenMit("Ulm"), { einheitSchluessel: "u", empfangenAm: t0 });
    const folge = eintrag("e2", bogenMit("Ulm"), { einheitSchluessel: "u", empfangenAm: t0 + 600_000, eingetroffenAm: t0 });
    expect(zeitEingelesen(erste, [erste])).toBe(true);
    expect(zeitEingelesen(folge, [folge, erste])).toBe(true);
    const korrigiert = { ...erste, eingetroffenAm: new Date(2026, 9, 26, 8, 0).getTime() };
    expect(zeitEingelesen(korrigiert, [korrigiert])).toBe(false);
    const handErfasst = eintrag("m", bogenMit("Verden"), { einheitSchluessel: "v", quelle: "manuell", empfangenAm: t0 });
    expect(zeitEingelesen(handErfasst, [handErfasst])).toBe(false);
  });
});

describe("R14-W1 Schnell erfasste Einheiten: Bedarf „nicht erfasst“ statt „keine“", () => {
  it("bedarfNichtErfasst erkennt die Schnellerfassung, nicht den gemeldeten Bogen", () => {
    expect(bedarfNichtErfasst(schnell("Sinsheim", 11))).toBe(true);
    const voll = bogenMit("Albstadt");
    voll.sofortbedarf = { verpflegungPersonen: 3, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    expect(bedarfNichtErfasst(voll)).toBe(false);
    const mitDiesel = schnell("Sinsheim", 11);
    mitDiesel.sofortbedarf = { verpflegungPersonen: 11, dieselLiter: 80, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    expect(bedarfNichtErfasst(mitDiesel)).toBe(false);
  });
});

describe("R14-N1 Warnung und Knopf zählen dieselben Personenkarten", () => {
  it("zwei Plätze mit Funktion, sieben ganz leer: die Warnung nennt 9 ohne Namen und 7 davon ganz leer", () => {
    const b = neuerBogen();
    b.personal = Array.from({ length: 9 }, () => neuePerson());
    b.personal[0]!.staerkeRolle = StaerkeRolle.FUEHRER;
    b.personal[1]!.staerkeRolle = StaerkeRolle.UNTERFUEHRER;
    const warnung = pruefpunkte(b, false).map((p) => p.text).find((t) => /Personenkarten/.test(t))!;
    expect(warnung).toMatch(/^9 Personenkarten ohne Namen zählen in die Stärke \(7 davon ganz leer\)/);
  });

  it("sind alle Karten ganz leer, bleibt es bei der bisherigen Zahl", () => {
    const b = neuerBogen();
    b.personal = Array.from({ length: 4 }, () => neuePerson());
    expect(pruefpunkte(b, false).map((p) => p.text).find((t) => /Personenkarten/.test(t))).toMatch(/^4 Personenkarten ohne Angaben zählen/);
  });
});
