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

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht } from "./dialoge";
import { Fusszeile } from "./fusszeile";
import { OrganisationsTyp, PersonalErfassung, jetztZeitpunkt, staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import {
  EinsatzArt,
  MeldeStatus,
  einsatzAnlegen,
  einsaetzeSpeichern,
  meldungHinzufuegen,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { stanFahrzeugVorbelegung } from "@bos/vokabulare/thw-stan-fahrzeuge";
import { einsaetzeLaden } from "./einsaetze-lesen";
import { meldungAufnehmen } from "./eintrag-zeiten";
import { fassungenJeEinheit } from "./fassung-vorrang";
import { Fehlerfaenger } from "./fehlerfaenger";
import { Lagemonitor, ortImFunkruf } from "./lagemonitor-ui";
import { lagebild } from "./lagemonitor";
import { einheitenSortieren, SORTIERUNGEN } from "./einheiten-liste";
import { TABELLEN_SPALTEN, tabellenSumme, tabellenZeilen } from "./einheiten-tabelle";
import { quelleText } from "./einsaetze-ui";
import { aggregiereNachZug } from "./auswertung";
import { funkrufText, neuePerson, neuerBogen, neuesFahrzeug, ortOhneZusatz } from "./hilfen";
import { nurStaerkeUebernehmen } from "./nur-staerke";
import { zeitEingelesen } from "./pdf";
import { fahrzeugVorbelegung } from "../vokabulare/thw-funkrufname-ort";
import { Uebersicht } from "./schritte/uebersicht";
import {
  EINGELESEN_FUSSNOTE,
  STIFT_KAESTCHEN,
  STIFT_KAESTCHEN_ANGEKREUZT,
  einsatzLageblattDokument,
  einsatzPdfDokument,
  pdfDokument,
  staerkeVonHand,
  type SammelBogen,
  type UebersichtEintrag,
} from "./pdf-dokument";
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

// ------------------------------------------------------------------ W2

describe("R15-W2 Tabelle: Unterbringung nur bei Anforderung, WC/Dusche getrennt", () => {
  it("eine Einheit ohne Unterbringungsanforderung steht mit 0 / 0 / 0 unter Unterbringung und mit ihren Zahlen unter WC/Dusche", () => {
    const ohne = bogenMit("Albstadt", 4);
    const mit = bogenMit("Biberach", 5);
    mit.sofortbedarf = { dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, verpflegungPersonen: 5, unterbringung: true, ruhezeitErforderlich: false };
    const zeilen = tabellenZeilen([eintrag("a", ohne), eintrag("b", mit)]);
    expect(zeilen[0]).toMatchObject({ unterbringungM: 0, unterbringungW: 0, unterbringungD: 0 });
    expect(zeilen[0]!.wcM + zeilen[0]!.wcW + zeilen[0]!.wcD).toBe(4);
    expect(zeilen[1]!.unterbringungM + zeilen[1]!.unterbringungW + zeilen[1]!.unterbringungD).toBe(5);
    // Die Summe der Spalten „Unterbringung" ist die Zahl der Bedarfszeile („Unterbringung 5 Personen").
    const summe = tabellenSumme(zeilen);
    expect(summe.unterbringungAngefordert.personen).toBe(5);
    expect(summe.unterbringung.m + summe.unterbringung.w + summe.unterbringung.d).toBe(9);
  });

  it("die Spaltenköpfe sagen „angefordert“ bzw. „WC/Dusche“", () => {
    const titel = Object.fromEntries(TABELLEN_SPALTEN.map((s) => [s.schluessel, s.titel]));
    expect(titel.unterbringungM).toMatch(/angefordert/);
    expect(titel.wcM).toMatch(/WC\/Dusche/);
    expect(titel.wcD).toMatch(/alle Anwesenden/);
  });
});

// ------------------------------------------------------------------ A1

describe("R15-A1 „Stärke ändern…“ lässt die Kennzeichnung der Eintreffzeit stehen", () => {
  function sammlungMitKorrektur() {
    const s = einsatzAnlegen("Korrektur", EinsatzArt.EINSATZ);
    const scan = bogenMit("Ulm", 12);
    meldungHinzufuegen(s.id, scan);
    const erste = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege[0]!;
    // Stärke von 12 auf 9, wie in der Einsatzansicht: neue Fassung mit Quelle „manuell".
    const neu = nurStaerkeUebernehmen(erste.bogen, { fuehrer: 0, unterfuehrer: 1, mannschaft: 8, gesamt: 9 }, jetztZeitpunkt() + 1);
    const r = meldungAufnehmen(s.id, neu, { quelle: "manuell", einheitSchluesselOverride: erste.einheitSchluessel });
    expect(r?.neu).toBe(true);
    return einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
  }

  it("die korrigierte Fassung gilt weiter als „Zeit des Einlesens“; eine von Hand gesetzte Zeit nicht", () => {
    const alle = sammlungMitKorrektur();
    const revs = fassungenJeEinheit(alle, alle[0]!.einheitSchluessel);
    expect(revs).toHaveLength(2);
    const geltend = revs[0]!;
    expect(geltend.quelle).toBe("manuell");
    expect(zeitEingelesen(geltend, revs)).toBe(true);
    // „ändern" an der Eintreffzeit: nur diese Einheit ohne Kennzeichnung.
    const gesetzt = { ...geltend, eingetroffenAm: geltend.empfangenAm - 3_600_000 };
    expect(zeitEingelesen(gesetzt, [gesetzt, ...revs.slice(1)])).toBe(false);
  });

  it("eine ganz von Hand erfasste Einheit trägt die Kennzeichnung weiterhin nicht", () => {
    const manuell = eintrag("m", bogenMit("Verden"), { quelle: "manuell" });
    expect(zeitEingelesen(manuell, [manuell])).toBe(false);
  });

  it("die Karte nennt die Herkunft „aus Datei/Scan, am Meldekopf von Hand geändert“, nicht „von Hand erfasst“", () => {
    const scan = eintrag("a", bogenMit("Ulm"), { quelle: "scan" });
    const korr = eintrag("b", bogenMit("Ulm"), { quelle: "manuell" });
    expect(quelleText(korr, [korr, scan])).toBe("von der Einheit empfangen, per Scan oder Link, am Meldekopf von Hand geändert");
    expect(quelleText(korr, [korr])).toBe("am Meldekopf von Hand erfasst");
    expect(quelleText(scan, [scan])).toBe("von der Einheit empfangen, per Scan oder Link");
    const datei = eintrag("c", bogenMit("Ulm"), { quelle: "pdf-import" });
    expect(quelleText(korr, [korr, datei])).toMatch(/^aus Datei übernommen, am Meldekopf von Hand geändert$/);
  });
});

// ------------------------------------------------------------------ A2

describe("R15-A2 Seite 1 der Sammel-PDF kennzeichnet die gestempelte Eintreffzeit", () => {
  function sammel(zeitEingelesenGesetzt: boolean): SammelBogen[] {
    return [0, 1].map((i) => ({
      bogen: bogenMit(`Ortsverband ${i}`, 3),
      eingetroffenAm: new Date(2026, 9, 26, 13, 41).getTime(),
      empfangenAm: new Date(2026, 9, 26, 13, 41).getTime(),
      nummer: i + 1,
      ...(zeitEingelesenGesetzt ? { zeitEingelesen: true } : {}),
      qr: QR,
    }));
  }

  it("Stern in der Spalte „Eingetroffen“ und Fußnote unter dem Kopf der Übersichtsseite", () => {
    const dd = einsatzPdfDokument("Hochwasser", sammel(true));
    // Seite 1 = alles vor dem ersten Seitenumbruch (dahinter folgen die Bögen).
    const inhalt = dd.content as { pageBreak?: string }[];
    const seite1 = texte(inhalt.slice(0, inhalt.findIndex((n) => n.pageBreak)));
    expect(seite1.some((t) => /13:41 \*/.test(t))).toBe(true);
    expect(seite1.some((t) => t.includes(EINGELESEN_FUSSNOTE))).toBe(true);
  });

  it("ohne gestempelte Zeit weder Stern noch Fußnote", () => {
    const dd = einsatzPdfDokument("Hochwasser", sammel(false));
    const alle = texte(dd.content).join("\n");
    expect(alle).not.toContain(EINGELESEN_FUSSNOTE);
    expect(alle).not.toMatch(/13:41 \*/);
  });
});

// ------------------------------------------------------------------ A3

describe("R15-A3 Einzelbogen nach „Stärke ändern…“", () => {
  it("kreuzt „von Hand geändert“ an und nennt die Korrektur unter „Sonstiges“", () => {
    const vorher = bogenMit("Crailsheim", 12);
    const neu = nurStaerkeUebernehmen(vorher, { fuehrer: 0, unterfuehrer: 1, mannschaft: 8, gesamt: 9 });
    expect(staerke(neu).gesamt).toBe(9);
    expect(staerkeVonHand(neu)).toBe(true);
    const t = texte(pdfDokument(neu, QR).content).join("\n");
    expect(t).toContain(STIFT_KAESTCHEN_ANGEKREUZT);
    expect(t).not.toContain(STIFT_KAESTCHEN);
    expect(t).toMatch(/Stärke am Meldekopf auf 9 korrigiert/);
    expect(t).toMatch(/Namensliste führt 12 und ist nicht angepasst/);
  });

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

// ------------------------------------------------------------------ K1

describe("R15-K1 Sortierung nach dem Alter der Angaben", () => {
  it("„Älteste Angaben zuerst“ ordnet nach dem früheren von Stand und Eingang, nicht nach der Eingangsminute", () => {
    const t = Date.now();
    const bogen = (ort: string, standVorMin: number) => {
      const b = bogenMit(ort);
      b.stand = jetztZeitpunkt() - standVorMin;
      return b;
    };
    // Alle drei in derselben Minute eingegangen, Stand vor 105, 840 und 5 Minuten.
    const a = eintrag("a", bogen("Crailsheim", 105), { empfangenAm: t });
    const b = eintrag("b", bogen("Hassmersheim", 840), { empfangenAm: t });
    const c = eintrag("c", bogen("Biberach", 5), { empfangenAm: t });
    const ortsname = (e: MeldeEintrag) => e.bogen.einheit.hierarchie[0]!.name;
    expect(einheitenSortieren([a, b, c], "aelteste").map(ortsname)).toEqual(["Hassmersheim", "Crailsheim", "Biberach"]);
    expect(einheitenSortieren([a, b, c], "zuletzt").map(ortsname)).toEqual(["Biberach", "Crailsheim", "Hassmersheim"]);
    expect(SORTIERUNGEN.find((s) => s.wert === "aelteste")!.label).toBe("Älteste Angaben zuerst");
  });

  it("die Kartenliste zeigt dieselbe Reihenfolge wie die Tabellenspalte „Meldung vor“ (sortiertNach angabenAm)", () => {
    const t = Date.now();
    const mk = (id: string, min: number) => {
      const b = bogenMit(id);
      b.stand = jetztZeitpunkt() - min;
      return eintrag(id, b, { empfangenAm: t });
    };
    const liste = [mk("a", 300), mk("b", 5), mk("c", 840)];
    const karten = einheitenSortieren(liste, "aelteste").map((e) => e.id);
    const tabelle = [...tabellenZeilen(liste)].sort((x, y) => x.angabenAm - y.angabenAm).map((z) => z.eintrag.id);
    expect(karten).toEqual(tabelle);
  });
});

// ------------------------------------------------------------------ K2

describe("R15-K2 Lagemonitor kürzt nicht die Zeilen mit ⚠", () => {
  it("die Zeilen mit Stand älter als 1 Std stehen vorn, älteste zuerst; danach die frischen, zuletzt gemeldet zuerst", () => {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const jetzt = Date.now();
    const namen = ["Biberach", "Radolfzell", "Hassmersheim", "Freiburg", "Crailsheim"];
    const standVor = [2, 3, 840, 410, 105];
    namen.forEach((n, i) => {
      const b = bogenMit(n);
      b.stand = jetztZeitpunkt() - standVor[i]!;
      meldungHinzufuegen(s.id, b);
    });
    const liste = structuredClone(einsaetzeLaden());
    const eintraege = liste.find((x) => x.id === s.id)!.eintraege;
    // Eingang: Biberach vor 1 Min, Radolfzell vor 2 Min, die übrigen alle vor 3 Min.
    eintraege.forEach((e, i) => { e.empfangenAm = jetzt - (i === 0 ? 1 : i === 1 ? 2 : 3) * 60_000; });
    einsaetzeSpeichern(liste);
    const bild = lagebild(liste.find((x) => x.id === s.id)!, jetzt);
    const orte = bild.einheiten.map((e) => e.ort);
    expect(orte).toEqual(["Hassmersheim", "Freiburg", "Crailsheim", "Biberach", "Radolfzell"]);
    expect(bild.einheiten.slice(0, 3).every((e) => e.alterMin != null)).toBe(true);
    expect(bild.einheiten.slice(3).every((e) => e.alterMin == null)).toBe(true);
  });
});

// ------------------------------------------------------------------ K3

describe("R15-K3 Ruhezeit in den Zugsummen", () => {
  function zweiZuege() {
    const bed = (ruhe: boolean) => ({ dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, verpflegungPersonen: 3, unterbringung: false, ruhezeitErforderlich: ruhe });
    const e = (id: string, zug: string, ruhe: boolean) => {
      const b = bogenMit(id);
      b.sofortbedarf = bed(ruhe);
      return eintrag(id, b, { zugEtikett: zug });
    };
    return [e("a", "1. Zug", true), e("b", "2. Zug", true), e("c", "2. Zug", true), e("d", "2. Zug", false)];
  }

  it("aggregiereNachZug führt die Ruhezeit je Zug, die Summe geht mit dem Gesamtbedarf auf", () => {
    const gruppen = aggregiereNachZug(zweiZuege());
    expect(gruppen.map((g) => g.summen.ruhezeitErforderlich)).toEqual([1, 2]);
    expect(gruppen.reduce((n, g) => n + g.summen.ruhezeitErforderlich, 0)).toBe(3);
  });

  it("das Lageblatt hat eine Spalte „Ruhezeit“ in den Zwischensummen nach Zug", () => {
    const ue: UebersichtEintrag[] = zweiZuege().map((e, i) => ({
      bogen: e.bogen,
      zugEtikett: e.zugEtikett,
      eingetroffenAm: Date.now(),
      empfangenAm: Date.now(),
      nummer: i + 1,
    }));
    const t = texte(einsatzLageblattDokument("Hochwasser", ue).content);
    expect(t).toContain("Ruhe-\nzeit");
  });
});

// ------------------------------------------------------------------ K4, K5

describe("R15-K4/K5 Lagemonitor: Warnung nur am alten Teil, Auftrag am Telefon", () => {
  function monitor() {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const alt = bogenMit("Freiburg");
    alt.stand = jetztZeitpunkt() - 410;
    meldungHinzufuegen(s.id, alt);
    meldungHinzufuegen(s.id, bogenMit("Biberach"));
    const liste = structuredClone(einsaetzeLaden());
    const eintraege = liste.find((x) => x.id === s.id)!.eintraege;
    eintraege[0]!.notiz = "Pumpen Unterführung Nord, bis 20 Uhr";
    einsaetzeSpeichern(liste);
    render(<Lagemonitor einsatzId={s.id} />);
  }

  it("„letzte Meldung“ bleibt in Normalfarbe, nur „älteste Meldung …“ trägt ⚠ und die Warnklasse", () => {
    monitor();
    const zeile = document.querySelector(".lm-stand .lm-label")!;
    expect(zeile.classList.contains("lm-veraltet")).toBe(false);
    expect(zeile.firstChild!.textContent).toMatch(/^letzte Meldung (gerade eben|vor \d+ Min)$/);
    const warn = zeile.querySelector(".lm-warnteil")!;
    expect(warn.textContent).toMatch(/^⚠ älteste Meldung vor 6 Std/);
  });

  it("der Auftrag steht in der Funkruf-Zelle (am Telefon sichtbar), nicht nur in der ausgeblendeten Typ-Spalte", () => {
    monitor();
    const zellen = Array.from(document.querySelectorAll(".lm-einheiten tbody tr")).map((r) => r.children[2]!);
    const mit = zellen.filter((z) => z.querySelector(".lm-auftrag-tel"));
    expect(mit).toHaveLength(1);
    expect(mit[0]!.querySelector(".lm-auftrag-tel")!.textContent).toBe("Pumpen Unterführung Nord, bis 20 Uhr");
  });

  it("ortImFunkruf kennt den Klammerzusatz des Ortes nicht als Teil des Rufnamens", () => {
    expect(ortImFunkruf({ ort: "Oldenburg (NI)", funkruf: "Heros Oldenburg 22/51" })).toBe(true);
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

// ------------------------------------------------------------------ N3

describe("R15-N3 Schnellerfassung: Rückknopf der Übersicht", () => {
  function uebersicht(fremd: boolean, nurStaerke: boolean) {
    const b = neuerBogen();
    if (nurStaerke) {
      b.personalErfassung = PersonalErfassung.NUR_STAERKE;
      b.staerkeManuell = { fuehrer: 0, unterfuehrer: 1, mannschaft: 7, gesamt: 8 };
    }
    const geheZu = vi.fn();
    render(<Uebersicht bogen={b} geheZu={geheZu} neu={() => {}} fremdeErfassung={fremd} />);
    return geheZu;
  }

  it("Schnellerfassung führt zurück zu Schritt 3 (Fahrzeuge) der eigenen Zählung, nicht zum übersprungenen Sofortbedarf", () => {
    const geheZu = uebersicht(true, true);
    expect(screen.queryByRole("button", { name: /Zurück zu Schritt 5/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "← Zurück zu Schritt 3 (Fahrzeuge)" }));
    expect(geheZu).toHaveBeenCalledWith(3);
  });

  it("jeder andere Bogen behält „Zurück zu Schritt 5 (Sofortbedarf)“", () => {
    const geheZu = uebersicht(false, false);
    fireEvent.click(screen.getByRole("button", { name: "← Zurück zu Schritt 5 (Sofortbedarf)" }));
    expect(geheZu).toHaveBeenCalledWith(4);
  });
});
