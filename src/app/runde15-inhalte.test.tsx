/**
 * Runde 15, Block Inhalte: arbeitsablauf (W2), analog-first (A1 bis A3), fuehrungssicht (K1 bis K5),
 * feldtauglichkeit (H2, H3) und neuer-nutzer (N1, N3). Layout und Zustand stehen in den Dateien ihrer Blöcke.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./nativ", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./nativ")>()),
  istNativ: () => false,
  textTeilen: async () => {},
  binaerTeilen: async () => {},
}));

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht } from "./dialoge";
import { Fusszeile } from "./fusszeile";
import { OrganisationsTyp, PersonalErfassung, type Erfassungsbogen } from "@bos/eeb-format/model";
import {
  EinsatzArt,
  MeldeStatus,
  einsatzAnlegen,
  meldungHinzufuegen,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { stanFahrzeugVorbelegung } from "@bos/vokabulare/thw-stan-fahrzeuge";
import { einsaetzeLaden } from "./einsaetze-lesen";
import { funkrufText, neuePerson, neuerBogen, neuesFahrzeug, ortOhneZusatz } from "./hilfen";
import { zeitEingelesen } from "./pdf";
import { fahrzeugVorbelegung } from "../vokabulare/thw-funkrufname-ort";
import { STIFT_KAESTCHEN, pdfDokument, staerkeVonHand } from "./pdf-dokument";
import type { QrSatz } from "./hilfen";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

function eintrag(id: string, bogen: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return { id, einheitSchluessel: id, empfangenAm: Date.now(), quelle: "scan", status: MeldeStatus.ANWESEND, bogen, ...over } as MeldeEintrag;
}

function bogenMit(ort: string, personen = 3): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  b.personal = Array.from({ length: personen }, (_, k) => ({ ...neuePerson(), vorname: `V${k}`, nachname: `N${ort}${k}` }));
  return b;
}

/** Wie alle Texte einer pdfmake-Struktur: rekursiv eingesammelt. */
function texte(node: unknown, acc: string[] = []): string[] {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => texte(n, acc));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => texte(v, acc));
  return acc;
}

const QR: QrSatz = {
  teile: [{ datenUrl: "data:image/png;base64,QRTESTBILD", url: "https://erfassungsbogen.app/#X", teilNr: 1, anzahl: 1, version: 7 }],
  segmentiert: false,
  zeichen: 123,
  version: 7,
  vollUrl: "https://erfassungsbogen.app/#X",
  stufen: 1,
  weitergeleitet: false,
};

// ------------------------------------------------------------------ A1

describe("R15-A1 „Stärke ändern…“ lässt die Kennzeichnung der Eintreffzeit stehen", () => {
  function sammlungMitKorrektur() {
    const s = einsatzAnlegen("Korrektur", EinsatzArt.EINSATZ);
    const scan = bogenMit("Ulm", 12);
    meldungHinzufuegen(s.id, scan);
    const erste = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege[0]!;
    return einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
  }

  it("eine ganz von Hand erfasste Einheit trägt die Kennzeichnung weiterhin nicht", () => {
    const manuell = eintrag("m", bogenMit("Verden"), { quelle: "manuell" });
    expect(zeitEingelesen(manuell, [manuell])).toBe(false);
  });
});

// ------------------------------------------------------------------ A3

describe("R15-A3 Einzelbogen nach „Stärke ändern…“", () => {

  it("ein unveränderter Bogen behält das leere Kästchen und den Satz nicht", () => {
    const b = bogenMit("Crailsheim", 12);
    expect(staerkeVonHand(b)).toBe(false);
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain(STIFT_KAESTCHEN);
    expect(t).not.toContain("korrigiert");
  });

  it("eine Schnellerfassung (nur Stärke) zählt nicht als von Hand geändert", () => {
    const b = bogenMit("Sinsheim", 0);
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 3, mannschaft: 8, gesamt: 11 };
    expect(staerkeVonHand(b)).toBe(false);
  });
});

// ------------------------------------------------------------------ H2, H3

describe("R15-H2 Funkrufname ohne Klammerzusatz des Ortes", () => {
  it("„Oldenburg (NI)“ wird zu „Heros Oldenburg 22/51“", () => {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Oldenburg (NI)";
    const f = { ...neuesFahrzeug(), funkrufname: { kennwort: { code: 1 }, eigenerStandort: true, teile: [22, 51] } };
    expect(funkrufText(f, b.einheit)).toBe("Heros Oldenburg 22/51");
    expect(ortOhneZusatz("Oldenburg (NI)")).toBe("Oldenburg");
    expect(ortOhneZusatz("Rottenburg am Neckar")).toBe("Rottenburg am Neckar");
    b.einheit.hierarchie[0]!.name = "Albstadt";
    expect(funkrufText(f, b.einheit)).toBe("Heros Albstadt 22/51");
  });
});

describe("R15-H3 „Alle Daten löschen“ ohne Fachbegriffe des Datenschutzes", () => {
  it("nennt die Einstellung „Nicht mitzählen“ statt „Widerspruch zur Reichweitenmessung“", async () => {
    const nutzer = userEvent.setup();
    render(
      <>
        <Fusszeile onBogenOeffnen={async () => true} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Alle Daten löschen" }));
    const text = document.querySelector<HTMLDialogElement>("dialog[aria-label='Alle lokalen Daten löschen']")!.textContent!.replace(/\s+/g, " ");
    expect(text).toContain("Die Einstellung „Nicht mitzählen“ aus dem Datenschutzhinweis bleibt erhalten.");
    expect(text).not.toMatch(/Widerspruch|Reichweitenmessung/);
  });
});

// ------------------------------------------------------------------ N1

describe("R15-N1 Vorbelegte Fahrzeuge tragen kein „Ausstattung nach StAN: ja“", () => {
  it("die Vorbelegung eines Einheitstyps mit Fahrzeugen lässt stanKonform offen, der Baustein setzt es", () => {
    const typ = [...Array(80).keys()].find((c) => stanFahrzeugVorbelegung(OrganisationsTyp.THW, { code: c }).length > 0)!;
    expect(typ).toBeDefined();
    expect(stanFahrzeugVorbelegung(OrganisationsTyp.THW, { code: typ }).every((f) => f.stanKonform === true)).toBe(true);
    const b = neuerBogen();
    b.einheit.einheitsTyp = { code: typ };
    const vorlage = fahrzeugVorbelegung(b.einheit);
    expect(vorlage.length).toBeGreaterThan(0);
    expect(vorlage.every((f) => f.stanKonform == null)).toBe(true);
    // Typ und Funkrufname bleiben erhalten.
    expect(vorlage.every((f) => f.typ.code != null || f.typ.freitext)).toBe(true);
  });
});
