/**
 * Runde 15, Block Zustand: Logik und Hooks ohne App — eine Quittung zur Zeit (D1), Doppelzählung nur für Übernommenes (D3),
 * Signatur im Lageblatt (E1), später eingegangene Meldung mit älterem Stand (E2), Satzbau mehrteiliger Codes (E3),
 * THW-Kennzeichen (E5), Dauer der Sammel-PDF (O1), unterbrochener Stapel (S1), offene Folgeschritte (S4),
 * Zwischenstand des Papierabgleichs (A4), Tab-Text der Einzel-PDF (A5).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { SegmentTeil } from "@bos/eeb-format/codec";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungAufteilen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { abgeteiltDoppeltImStapel } from "./abgeteilt-doppelt";
import { fassungInHistorieLegen, geltendeJeEinheit } from "./fassung-vorrang";
import { neuereNichtUebernommen } from "./neuere-eingabe";
import { useJuengsteQuittung } from "./juengste-quittung";
import { neuePerson, neuerBogen, neuesFahrzeug } from "./hilfen";
import { teilGelesenSatz, verworfeneTeileSatz } from "./teil-quittung";
import { kennzeichenHinweis } from "./schreibweise";
import { sammelPdfDauerText } from "./arbeitet";
import { importBeginnt, importEndet, unterbrochenerImport } from "./import-unterbrochen";
import { offeneFolgeschritte } from "./folgeschritte";
import {
  ENTWURF_FRIST_MS,
  abgleichEntwurfLaden,
  abgleichEntwurfLoeschen,
  abgleichEntwurfSpeichern,
  abgleichSchluessel,
  type AbgleichZeile,
} from "./papier-abgleich-entwurf";
import { signaturUngueltigScan } from "./signatur-warnung";
import { SIGNATUR_UNGUELTIG_PAPIER, einsatzLageblattDokument } from "./pdf-dokument";
import { TAB_ERZEUGT_TEXT, TAB_FERTIG_TEXT, tabNachErzeugung } from "./pdf";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  importEndet();
});

function bogenMitName(name: string, aendern?: (b: Erfassungsbogen) => void): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  aendern?.(b);
  return b;
}

describe("R15-D1 Eine Quittungsleiste zur Zeit: die zuletzt ausgelöste", () => {
  it("die jüngste gesetzte Leiste gilt; ältere weichen und kommen nicht zurück — nur der Stapel „entfernt“ schon", () => {
    const { result, rerender } = renderHook((z: Record<string, unknown>) => useJuengsteQuittung(z, "entfernt"), { initialProps: { entfernt: null, zurueck: null, kenntnis: null } as Record<string, unknown> });
    expect(result.current).toBeNull();
    const a = { n: 1 };
    rerender({ entfernt: null, zurueck: a, kenntnis: null });
    expect(result.current).toBe("zurueck");
    // „Zur Kenntnis genommen" nach dem Zurücknehmen: die neue Leiste gilt, auch wenn sie in der Liste hinten steht.
    const k = { n: 2 };
    rerender({ entfernt: null, zurueck: a, kenntnis: k });
    expect(result.current).toBe("kenntnis");
    // Dieselben Objekte noch einmal übergeben: nichts ändert die Reihenfolge.
    rerender({ entfernt: null, zurueck: a, kenntnis: k });
    expect(result.current).toBe("kenntnis");
    // Eine neue Info-Leiste (anderes Objekt) wird wieder zur jüngsten.
    rerender({ entfernt: null, zurueck: { n: 3 }, kenntnis: k });
    expect(result.current).toBe("zurueck");
    // Ist die jüngste weg, kommt die ältere NICHT zurück (ihr Rückgängig nähme etwas anderes zurück als die letzte Handlung).
    rerender({ entfernt: null, zurueck: null, kenntnis: k });
    expect(result.current).toBeNull();
    // Ausnahme: der Stapel entfernter Meldungen bleibt unter der jüngeren Leiste und kommt danach wieder.
    const e = { n: 4 };
    rerender({ entfernt: e, zurueck: null, kenntnis: null });
    expect(result.current).toBe("entfernt");
    rerender({ entfernt: e, zurueck: null, kenntnis: { n: 5 } });
    expect(result.current).toBe("kenntnis");
    rerender({ entfernt: e, zurueck: null, kenntnis: null });
    expect(result.current).toBe("entfernt");
    rerender({ entfernt: null, zurueck: null, kenntnis: null });
    expect(result.current).toBeNull();
  });
});

describe("R15-D3 Ältere Datei nach dem Aufteilen: keine Warnung vor Doppelzählung", () => {
  function aufgeteilt() {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const b = bogenMitName("Sinsheim", (x) => {
      x.personal = Array.from({ length: 11 }, (_, i) => ({ ...neuePerson(), nachname: `Person${i}`, vorname: "Max" }));
      x.stand = x.stand + 120;
    });
    meldungHinzufuegen(s.id, b);
    meldungAufteilen(s.id, einsaetzeLaden()[0]!.eintraege[0]!.id, { teilEtikett: "Trupp 2", personal: [0, 1, 2, 3], fahrzeuge: [] }, {});
    return { s, b };
  }
  function stapel(b: Erfassungsbogen, stand: number, id: string) {
    const vorher = einsaetzeLaden()[0]!.eintraege;
    const neu = structuredClone(b);
    neu.stand = stand;
    meldungHinzufuegen(id, neu);
    const nachher = einsaetzeLaden()[0]!.eintraege;
    const neueIds = nachher.filter((e) => !vorher.some((v) => v.id === e.id)).map((e) => e.id);
    return { vorher, nachher, neueIds };
  }

  it("eine Datei mit älterem Stand liegt nur in der Historie: nichts zählt doppelt, keine Zeile", () => {
    const { s, b } = aufgeteilt();
    const { vorher, nachher, neueIds } = stapel(b, b.stand - 30, s.id);
    expect(neueIds).toHaveLength(1);
    // Sie gilt nicht: die geltende Fassung der Einheit ist eine andere.
    expect(geltendeJeEinheit(nachher).some((e) => e.id === neueIds[0])).toBe(false);
    expect(abgeteiltDoppeltImStapel(vorher, nachher, neueIds)).toEqual([]);
  });

  it("eine Datei mit neuerem Stand warnt wie bisher", () => {
    const { s, b } = aufgeteilt();
    const { vorher, nachher, neueIds } = stapel(b, b.stand + 30, s.id);
    const zeilen = abgeteiltDoppeltImStapel(vorher, nachher, neueIds);
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]).toContain("zählen jetzt doppelt");
  });
});

describe("R15-E1 Signatur ungültig: Lageblatt und Scan-Satz", () => {
  it("der Hinweis steht im Lageblatt an der Einheit, nur bei ungültiger Signatur", () => {
    const text = (e: object) => JSON.stringify(einsatzLageblattDokument("Lage", [{ bogen: bogenMitName("Albstadt"), ...e }]).content);
    expect(text({ signaturUngueltig: true })).toContain("SIGNATUR UNG");
    expect(text({})).not.toContain("SIGNATUR UNG");
    expect(SIGNATUR_UNGUELTIG_PAPIER).toContain("beim Absender prüfen");
  });

  it("der Scan-Satz ist eine Warnung ohne Haken und sagt, dass nichts aufgenommen wurde", () => {
    const satz = signaturUngueltigScan("THW Oldenburg");
    expect(satz).toMatch(/^⚠ „THW Oldenburg" nicht aufgenommen/);
    expect(satz).not.toContain("✓");
    expect(satz).toContain("Nochmal scannen");
  });
});

describe("R15-E2 Später eingegangene Meldung mit älterem Stand bleibt sichtbar", () => {
  function zweiMeldungen() {
    const s = einsatzAnlegen("Uhr", EinsatzArt.EINSATZ);
    const jetzt = neuerBogen().stand;
    const a = bogenMitName("Albstadt", (x) => { x.stand = jetzt + 2 * 1440; x.sofortbedarf = { ...x.sofortbedarf!, dieselLiter: 80 }; }); // Absenderuhr zwei Tage vor
    const b = bogenMitName("Albstadt", (x) => { x.stand = jetzt - 5; x.sofortbedarf = { ...x.sofortbedarf!, dieselLiter: 500 }; }); // richtig, aber „älter"
    // Die Eingangszeit ist die Geräteuhr: zwei Meldungen in derselben Millisekunde sind kein Fall der Wirklichkeit.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now());
    meldungHinzufuegen(s.id, a);
    vi.setSystemTime(Date.now() + 5000);
    meldungHinzufuegen(s.id, b);
    return { s, a, b };
  }

  it("die Karte der geltenden Fassung kennt die später eingegangene mit anderem Inhalt", () => {
    const { s } = zweiMeldungen();
    const alle = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const kopf = geltendeJeEinheit(alle)[0]!;
    expect(kopf.bogen.sofortbedarf?.dieselLiter).toBe(80);
    const nicht = neuereNichtUebernommen(kopf, alle);
    expect(nicht?.bogen.sofortbedarf?.dieselLiter).toBe(500);
  });

  it("auch wenn die Fassung schon in der Historie liegt (verdrängt), und nicht bei gleichem Inhalt", () => {
    const { s } = zweiMeldungen();
    const alle0 = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const kopf0 = geltendeJeEinheit(alle0)[0]!;
    const b = alle0.find((e) => e.id !== kopf0.id)!;
    fassungInHistorieLegen(s.id, b.id, kopf0.id);
    const alle = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    expect(neuereNichtUebernommen(geltendeJeEinheit(alle)[0]!, alle)?.id).toBe(b.id);

    // Gleicher Inhalt mit anderem Stand: keine Marke.
    const t = einsatzAnlegen("Gleich", EinsatzArt.EINSATZ);
    const x = bogenMitName("Ulm");
    meldungHinzufuegen(t.id, { ...structuredClone(x), stand: x.stand + 60 });
    meldungHinzufuegen(t.id, x);
    const alleT = einsaetzeLaden().find((e) => e.id === t.id)!.eintraege;
    expect(neuereNichtUebernommen(geltendeJeEinheit(alleT)[0]!, alleT)).toBeNull();
  });

  it("nach „Diese Fassung gilt“ für die später eingegangene verschwindet die Marke", async () => {
    const { s } = zweiMeldungen();
    const alle0 = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const b = alle0.find((e) => e.id !== geltendeJeEinheit(alle0)[0]!.id)!;
    const { fassungGiltSetzen } = await import("./fassung-vorrang");
    fassungGiltSetzen(s.id, b.id);
    const alle = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const kopf = geltendeJeEinheit(alle)[0]!;
    expect(kopf.id).toBe(b.id);
    expect(neuereNichtUebernommen(kopf, alle)).toBeNull();
  });
});

describe("R15-E3 Mehrteilige Codes: Nummer des gelesenen Teils, verworfene Teile genannt", () => {
  const teil = (nr: number, anzahl: number): SegmentTeil => ({ teilNr: nr, anzahl, id: 1, chunk: new Uint8Array() });

  it("Teil 2 zuerst: „Teil 2 gelesen“, danach was fehlt — nicht „Teil 1 von 2 gescannt“", () => {
    expect(teilGelesenSatz(2, [teil(2, 2)])).toBe("Teil 2 gelesen — es fehlt noch Teil 1.");
    expect(teilGelesenSatz(3, [teil(2, 3), teil(3, 3)])).toBe("Teil 3 gelesen — es fehlt noch Teil 1.");
  });

  it("nennt, was ein Wechsel des Bogens oder „Abbrechen“ wegwirft; ohne Zwischenstand nichts", () => {
    expect(verworfeneTeileSatz([teil(1, 3), teil(2, 3)])).toBe("2 von 3 Teilen verworfen");
    expect(verworfeneTeileSatz([teil(2, 2)])).toBe("1 von 2 Teilen verworfen");
    expect(verworfeneTeileSatz([])).toBe("");
  });
});

describe("R15-E5 THW-Kennzeichen mit falscher Ziffernzahl", () => {
  it("fragt bei „THW-“ mit weniger oder mehr als fünf Ziffern, sonst nicht", () => {
    expect(kennzeichenHinweis("THW-8439")).toMatch(/fünf Ziffern.*„THW-8439“ hat 4\. Stimmt das\?/);
    expect(kennzeichenHinweis("thw 843970")).toMatch(/hat 6\. Stimmt das\?/);
    expect(kennzeichenHinweis("THW-84397")).toBeNull();
    expect(kennzeichenHinweis("thw84397")).toBeNull();
    // Andere Formate und freier Text werden nicht beanstandet.
    expect(kennzeichenHinweis("OL-FW 2041")).toBeNull();
    expect(kennzeichenHinweis("DAS IST KEIN KENNZEICHEN")).toBeNull();
    expect(kennzeichenHinweis("")).toBeNull();
  });
});

describe("R15-O1 Dauer der Sammel-PDF richtet sich nach der Zahl der Bögen", () => {
  it("nennt Sekunden bei kleinen und Minuten bei großen Einsätzen, nie eine feste Obergrenze, dazu den Bildschirm", () => {
    // Runde 17 (R17-O1): 2 s je Bogen (gemessen: 66 s für 30 Bögen bei sechsfach gedrosselter CPU).
    expect(sammelPdfDauerText(5)).toMatch(/bei 5 Bögen am Telefon etwa 10 Sekunden oder länger\. Nicht noch einmal tippen/);
    const dreissig = sammelPdfDauerText(30);
    expect(dreissig).not.toContain("halben Minute");
    expect(dreissig).toMatch(/bei 30 Bögen am Telefon etwa 1 Min\. oder länger/);
    expect(dreissig).toMatch(/Bildschirm und Seite offen lassen/);
    expect(sammelPdfDauerText(100)).toMatch(/bei 100 Bögen am Telefon etwa 4 Min\. oder länger/);
  });
});

describe("R15-S1 Unterbrochener Stapelimport", () => {
  it("nach einem Neuladen mitten im Stapel nennt der Einsatz die Teilaufnahme; ein beendeter Import hinterlässt nichts", () => {
    importBeginnt("e1", 40, 5);
    // Dieselbe Seite: der Import läuft noch, das ist kein Abbruch.
    expect(unterbrochenerImport("e1", 28)).toBeNull();
    // Neuladen: der Arbeitsspeicher ist weg, die Spur im Sitzungsspeicher bleibt.
    importEndet(); // setzt den Merker der Seite zurück …
    sessionStorage.setItem("eeb.import-laeuft.v1", JSON.stringify({ einsatzId: "e1", dateien: 40, meldungenVorher: 5 })); // … und die Spur steht wieder
    const satz = unterbrochenerImport("e1", 28);
    expect(satz).toMatch(/Import unterbrochen: 40 Dateien waren gewählt, 23 Meldungen kamen an/);
    expect(satz).toMatch(/nochmal über „Bögen einlesen…“/);
    expect(unterbrochenerImport("anderer", 28)).toBeNull();
    importEndet(); // „Verstanden“
    expect(unterbrochenerImport("e1", 28)).toBeNull();
    expect(sessionStorage.getItem("eeb.import-laeuft.v1")).toBeNull();
  });
});

describe("R15-S4 Offene Folgeschritte der Erfassung", () => {
  const leer = () => bogenMitName("Husum");
  it("auf den ersten Schritten (Kurzweg der Schnellerfassung) wird nicht gefragt", () => {
    expect(offeneFolgeschritte(leer(), 0)).toEqual([]);
    expect(offeneFolgeschritte(leer(), 2)).toEqual([]);
  });

  it("im Schritt Fahrzeuge fehlen Fahrzeuge und Sofortbedarf, im Schritt Sofortbedarf nur dieser", () => {
    expect(offeneFolgeschritte(leer(), 3)).toEqual(["Fahrzeuge", "Sofortbedarf"]);
    expect(offeneFolgeschritte(leer(), 4)).toEqual(["Sofortbedarf"]);
    expect(offeneFolgeschritte(leer(), 5)).toEqual([]);
  });

  it("was schon eingetragen ist, gilt nicht als offen", () => {
    const b = leer();
    b.fahrzeuge = [neuesFahrzeug()];
    b.sofortbedarf = { ...b.sofortbedarf!, dieselLiter: 100 };
    expect(offeneFolgeschritte(b, 3)).toEqual([]);
  });
});

describe("R15-A4 Zwischenstand des Papierabgleichs überlebt einen Browserstart", () => {
  const basis: AbgleichZeile[] = [
    { eintragId: "a", name: "Albstadt", eingetroffen: "", abgerueckt: false, abgerueckAm: "", zug: "", notiz: "", nummer: "" },
    { eintragId: "b", name: "Biberach", eingetroffen: "", abgerueckt: false, abgerueckAm: "", zug: "", notiz: "", nummer: "" },
  ];
  const ausgefuellt = [{ ...basis[0]!, zug: "1. Zug", nummer: "4" }, basis[1]!];

  it("liegt zusätzlich im dauerhaften Speicher und kommt zurück, wenn der Sitzungsspeicher leer ist", () => {
    abgleichEntwurfSpeichern("e1", ausgefuellt, basis);
    expect(localStorage.getItem(abgleichSchluessel("e1"))).not.toBeNull();
    // Browser neu gestartet: Sitzungsspeicher weg, dauerhafter Speicher bleibt.
    sessionStorage.clear();
    const geladen = abgleichEntwurfLaden("e1");
    expect(geladen).toHaveLength(1);
    expect(geladen[0]).toMatchObject({ eintragId: "a", zug: "1. Zug", nummer: "4" });
  });

  it("verfällt nach drei Tagen und wird mit „Abgleich übernehmen“ aus beiden Speichern entfernt", () => {
    abgleichEntwurfSpeichern("e1", ausgefuellt, basis);
    sessionStorage.clear();
    expect(abgleichEntwurfLaden("e1", Date.now() + ENTWURF_FRIST_MS + 60_000)).toEqual([]);
    expect(localStorage.getItem(abgleichSchluessel("e1"))).toBeNull();

    abgleichEntwurfSpeichern("e2", ausgefuellt, basis);
    abgleichEntwurfLoeschen("e2");
    expect(localStorage.getItem(abgleichSchluessel("e2"))).toBeNull();
    expect(sessionStorage.getItem(abgleichSchluessel("e2"))).toBeNull();
    // Wieder leer eingetragen: nichts Leeres im Speicher.
    abgleichEntwurfSpeichern("e3", ausgefuellt, basis);
    abgleichEntwurfSpeichern("e3", basis, basis);
    expect(localStorage.getItem(abgleichSchluessel("e3"))).toBeNull();
  });
});

describe("R15-A5 Der Tab der Einzel-PDF bleibt nicht bei „Bogen wird erzeugt…“ stehen", () => {
  function tab(text: string) {
    return { closed: false, document: { body: { textContent: text } } } as unknown as Window;
  }

  it("zeigt der Tab nach kurzer Zeit noch den Platzhalter (Download statt PDF-Anzeige), sagt er „Fertig“", () => {
    vi.useFakeTimers();
    const t = tab(TAB_ERZEUGT_TEXT);
    tabNachErzeugung(t, 1000);
    vi.advanceTimersByTime(999);
    expect(t.document.body.textContent).toBe(TAB_ERZEUGT_TEXT);
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(t.document.body.textContent).toBe(TAB_FERTIG_TEXT);
  });

  it("zeigt er schon etwas anderes (die PDF-Anzeige) oder ist er zu, bleibt er unberührt", () => {
    vi.useFakeTimers();
    const anderes = tab("%PDF");
    const zu = { ...tab(TAB_ERZEUGT_TEXT), closed: true } as Window;
    const wirft = { closed: false, get document(): Document { throw new Error("fremder Ursprung"); } } as unknown as Window;
    for (const t of [anderes, zu, wirft]) tabNachErzeugung(t, 10);
    expect(() => vi.advanceTimersByTime(20)).not.toThrow();
    expect(anderes.document.body.textContent).toBe("%PDF");
    expect(zu.document.body.textContent).toBe(TAB_ERZEUGT_TEXT);
  });
});
