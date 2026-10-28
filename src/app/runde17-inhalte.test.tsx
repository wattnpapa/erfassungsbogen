/**
 * Runde 17, Block Inhalte: Unterbringung/WC in der Änderungsspalte (A1), Alter der Meldung bei Handänderungen (K1), eine Zahl ein Wort
 * (K8, W4), Anführungszeichen (W3), Nachtrag-CSV (A3, W2, K9), Abgerückte am Ende (E6, K4), Einzelbogen-Dateiname (A2), eigene
 * CSV beim Einlesen (A5), ungültiger Zeitraum (A6), einzeilige Quittung (W1), Kurzzeile nach „Stärke ändern…“ (K2), Lagemonitor
 * (K3, K11), Reihenfolge der Einsatzansicht am Telefon (K12), Aufklappzeichen (K10), ein Einsatz auf der Startseite (A7, K5, N2).
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jetztZeitpunkt, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, MeldeStatus, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { neuerBogen, neuePerson, datumAnzeige, zeitraumDeutsch, pruefpunkte } from "./hilfen";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { DaumenQuittung, QUITTUNG_ENDE_NACH_MS } from "./daumen-quittung";
import { anfuehrung, anfuehrungWaechterStarten } from "./typografie";
import { csvFeld, mitNachtragSpalte } from "./csv";
import { xmlText } from "./xlsx";
import { winAnsiText, bemerkungKurz, einsatzPdfDokument, lageblattAenderungen } from "./pdf-dokument";
import { bogenDiff, istMwdFeld } from "./diff-lage";
import { nurStaerkeUebernehmen } from "./nur-staerke";
import { einheitenSortieren } from "./einheiten-liste";
import { einheitenZahl, folgeAenderung, vergleichKurztext } from "./einheiten-tabelle";
import { angabenZeit, angabenAlterWort } from "./angaben-alter";
import { meldungAufnehmen } from "./eintrag-zeiten";
import { dateiFehlerText } from "./datei-fehler";
import { bewegungenMax } from "./lagemonitor-ui";
import { einsatzCsvInhalt } from "./einsatz-csv";
import { einsatzDetailCsvInhalt } from "./bogen-csv";
import { einzelDateiname } from "./pdf";
import { PRELLSCHUTZ_MS } from "./tipp-schutz";

vi.mock("./pdf", async () => {
  const echt = await vi.importActual<typeof import("./pdf")>("./pdf");
  return {
    ...echt,
    pdfErzeugen: async () => {},
    pdfBlobUrl: async () => "blob:pdf-vorschau",
    einsatzPdfErzeugen: async () => true,
    einsatzLageblattErzeugen: async () => true,
    blankoPdfErzeugen: async () => true,
    meldungPdfAnzeigen: async () => "eeb-test.pdf",
  };
});
vi.mock("./nativ", async () => {
  const echt = await vi.importActual<typeof import("./nativ")>("./nativ");
  return {
    istNativ: () => false,
    plattform: () => "web",
    imWebBrowser: () => true,
    bogenLinksEmpfangen: () => () => {},
    qrScannen: async () => "",
    binaerTeilen: async () => {},
    linkTeilen: async () => {},
    textTeilen: async () => {},
    shareSheetVerfuegbar: () => false,
    nahbereichDienst: echt.nahbereichDienst,
    pdfEinbettbar: () => true,
  };
});
vi.mock("./pdf-qr", () => ({ qrTexteAusPdfBytes: async () => [] }));

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const lmCss = readFileSync(`${process.cwd()}/src/app/lagemonitor.css`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 17 (Inhalte) ===== */");
  const bis = html.indexOf("/* ===== Ende Runde 17 (Inhalte) ===== */");
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

function bogen(ort: string, mod: (b: Erfassungsbogen) => void = () => {}): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  mod(b);
  return b;
}

function mitPersonen(b: Erfassungsbogen, n: number): void {
  b.personal = Array.from({ length: n }, (_, i) => ({ ...neuePerson(), nachname: `P${i}`, vorname: "X" }));
}

type Props = Parameters<typeof EinsatzDetail>[0];

function Wirt({ id, extra }: { id: string; extra?: Partial<Props> }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  return (
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={() => setEinsatz(einsaetzeLaden().find((s) => s.id === id)!)}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={() => {}}
        onBilderImport={() => {}}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onGeloescht={() => {}}
        {...extra}
      />
      <Dialogschicht />
    </>
  );
}

function karteVon(name: string): HTMLElement {
  return [...document.querySelectorAll<HTMLElement>(".einheit-zeile")].find((k) => k.textContent!.includes(name))!;
}

/** Texte eines pdfmake-Baums. */
function texte(node: unknown, acc: string[] = []): string[] {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => texte(n, acc));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => texte(v, acc));
  return acc;
}

const QR = {
  teile: [{ datenUrl: "data:image/png;base64,QR", url: "https://x.example/#T", teilNr: 1, anzahl: 1, version: 7 }],
  segmentiert: false,
  zeichen: 1,
  version: 7,
  vollUrl: "https://x.example/#T",
  stufen: 1,
  weitergeleitet: false,
};

describe("R17-A1 Änderungsspalte: WC/Dusche statt erfundener Unterbringung", () => {
  function paar(unterbringung: boolean): { vorher: Erfassungsbogen; nachher: Erfassungsbogen } {
    const vorher = bogen("Crailsheim", (b) => {
      mitPersonen(b, 12);
      b.sofortbedarf = { verpflegungPersonen: 12, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung, ruhezeitErforderlich: false };
    });
    const nachher = nurStaerkeUebernehmen(vorher, { fuehrer: 0, unterfuehrer: 0, mannschaft: 9, gesamt: 9 }, vorher.stand + 5);
    return { vorher, nachher };
  }

  it("nennt die M/W/D-Zeile „WC/Dusche“, wenn keine Unterbringung angefordert ist", () => {
    const { vorher, nachher } = paar(false);
    const d = bogenDiff(vorher, nachher);
    const mwd = d.bedarf.filter((a) => istMwdFeld(a.feld));
    expect(mwd.length).toBeGreaterThan(0);
    expect(mwd.every((a) => a.feld === "WC/Dusche M/W/D")).toBe(true);
    expect(d.bedarf.some((a) => a.feld === "Unterbringung M/W/D")).toBe(false);
  });

  it("belässt „Unterbringung M/W/D“, wenn die Einheit Unterbringung angefordert hat", () => {
    const { vorher, nachher } = paar(true);
    const mwd = bogenDiff(vorher, nachher).bedarf.filter((a) => istMwdFeld(a.feld));
    expect(mwd.length).toBeGreaterThan(0);
    expect(mwd.every((a) => a.feld === "Unterbringung M/W/D")).toBe(true);
  });

  it("das Lageblatt behauptet ohne Anforderung keine Änderung der Unterbringung", () => {
    const { vorher, nachher } = paar(false);
    const zeilen = lageblattAenderungen(bogenDiff(vorher, nachher)).join("\n");
    expect(zeilen).not.toContain("Unterbringung");
    expect(zeilen).toContain("WC/Dusche");
  });
});

describe("R17-K1 Handänderung behält das Alter der Meldung", () => {
  const vorStunden = (h: number) => jetztZeitpunkt() - h * 60;

  it("„Als Einsatzmeldung zählen…“ lässt die Warnung „Stand vor 3 Std“ stehen, zählt nicht als Folgemeldung und erhält die Quelle", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Alt", EinsatzArt.EINSATZ);
    meldungAufnehmen(s.id, bogen("Albstadt", (b) => { b.uebung = true; mitPersonen(b, 4); b.stand = vorStunden(3); }), { quelle: "pdf-import" });
    render(<Wirt id={s.id} />);
    expect(karteVon("Albstadt").textContent).toMatch(/⚠ (Stand|Meldung) vor 3 Std/);

    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: "Als Einsatzmeldung zählen…" }));
    const frage = await screen.findByRole("dialog", { name: "Als Einsatzmeldung zählen?" });
    expect(frage.textContent).toContain("das Alter der Meldung bleibt");
    await nutzer.click(within(frage).getByRole("button", { name: "Als Einsatzmeldung zählen" }));

    await waitFor(() => expect(document.body.textContent).toContain("Zählt jetzt als Einsatzmeldung"));
    const kopf = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege.sort((a, b) => b.empfangenAm - a.empfangenAm)[0]!;
    expect(kopf.bogen.uebung).toBeFalsy();
    expect(kopf.quelle).toBe("pdf-import");
    // Alter bleibt: drei Stunden, nicht „gerade eben“.
    expect(Date.now() - angabenZeit(kopf)).toBeGreaterThanOrEqual(3 * 3_600_000 - 120_000);
    expect(karteVon("Albstadt").textContent).toMatch(/⚠ (Stand|Meldung) vor 3 Std/);
    // Inhaltlich keine Folgemeldung: keine Marke „Folgem.“, keine Folgeänderung.
    expect(karteVon("Albstadt").textContent).not.toContain("Folgem.");
    expect(folgeAenderung(kopf, einsaetzeLaden().find((x) => x.id === s.id)!.eintraege)).toBeNull();
    // Quelle bleibt „aus Datei“, mit dem Zusatz der Handänderung.
    await nutzer.click(within(karteVon("Albstadt")).getByRole("button", { name: /Historie|Fassungen/ }));
    expect(karteVon("Albstadt").textContent).toContain("Meldung der Einheit");
  }, 20000);

  it("„Stärke ändern…“ setzt den Stand nicht auf „jetzt“: Alter und Wort bleiben (die letzte Meldung rückt vor, R18-K2)", async () => {
    const s = einsatzAnlegen("Hochwasser Alt", EinsatzArt.EINSATZ);
    const erste = meldungAufnehmen(s.id, bogen("Ulm", (b) => { mitPersonen(b, 6); b.stand = vorStunden(2); }), { quelle: "scan" })!.eintrag;
    const alterVorher = angabenZeit(erste);
    const wortVorher = angabenAlterWort(erste);
    const { angabenVermerken } = await import("./fassung-vorrang");
    const neu = nurStaerkeUebernehmen(erste.bogen, { fuehrer: 0, unterfuehrer: 0, mannschaft: 5, gesamt: 5 }, jetztZeitpunkt());
    const r = meldungAufnehmen(s.id, neu, { quelle: "manuell", einheitSchluesselOverride: erste.einheitSchluessel })!;
    angabenVermerken(s.id, r.eintrag.id, erste);
    const gespeichert = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege.find((e) => e.id === r.eintrag.id)!;
    expect(angabenZeit(gespeichert)).toBe(alterVorher);
    expect(angabenAlterWort(gespeichert)).toBe(wortVorher);
    // Eine zweite Handänderung erbt dasselbe Alter.
    const { angabenErben } = await import("./angaben-alter");
    expect(angabenErben(gespeichert).seit).toBe(alterVorher);
    const { letzteMeldung } = await import("./einheiten-tabelle");
    // R18-K2: Die Stärkeänderung am Meldekopf ist eine Folgemeldung und zählt für „letzte Meldung" — wie in der Liste.
    // (Nur das Umstellen der Kennzeichnung zählt nicht.)
    expect(letzteMeldung(einsaetzeLaden().find((x) => x.id === s.id)!.eintraege)).toBe(r.eintrag.empfangenAm);
  });

  it("das Alter übersteht Weitergabe und Import der Sammlung (kein Schemawechsel, optionales Feld am Eintrag)", async () => {
    const { einsatzDateiInhalt, einsatzAusDatei } = await import("./einsatz-transport");
    const s = einsatzAnlegen("Hochwasser Weitergabe", EinsatzArt.EINSATZ);
    const e = meldungAufnehmen(s.id, bogen("Ulm", (b) => mitPersonen(b, 3)), { quelle: "scan" })!.eintrag;
    const { angabenVermerken } = await import("./fassung-vorrang");
    const neu = nurStaerkeUebernehmen(e.bogen, { fuehrer: 0, unterfuehrer: 0, mannschaft: 2, gesamt: 2 }, jetztZeitpunkt());
    const r = meldungAufnehmen(s.id, neu, { quelle: "manuell", einheitSchluesselOverride: e.einheitSchluessel })!;
    angabenVermerken(s.id, r.eintrag.id, e);
    const gesamt = einsaetzeLaden().find((x) => x.id === s.id)!;
    const zurueck = einsatzAusDatei(einsatzDateiInhalt(gesamt));
    const kopie = zurueck.eintraege.find((x) => x.id === r.eintrag.id)!;
    expect(kopie.angaben).toEqual(gesamt.eintraege.find((x) => x.id === r.eintrag.id)!.angaben);
    expect(kopie.angaben?.seit).toBe(angabenZeit(e));
  });

  it("das Lageblatt rechnet nach einer Handänderung mit dem Alter der Meldung", () => {
    const b = bogen("Ulm", (x) => { mitPersonen(x, 3); });
    const erstellt = Date.now();
    const dd = einsatzPdfDokument("Lage", [{ bogen: b, qr: QR, empfangenAm: erstellt, angaben: { seit: erstellt - 5 * 3_600_000, wort: "Meldung", geaendertAm: erstellt } }]);
    expect(texte(dd.content).join("\n")).toMatch(/5 Std|vor 5/);
  });
});

describe("R17-K8 / R17-W4 eine Zahl, ein Wort", () => {
  it("einheitenZahl kennt Einzahl und Mehrzahl", () => {
    expect(einheitenZahl(1)).toBe("1 Einheit");
    expect(einheitenZahl(0)).toBe("0 Einheiten");
    expect(einheitenZahl(3)).toBe("3 Einheiten");
  });

  it("das Blatt schreibt „1 Einheit“ im Kasten Bedarf gesamt und bei der Ruhezeit", () => {
    const b = bogen("Müllheim", (x) => {
      mitPersonen(x, 2);
      x.sofortbedarf = { verpflegungPersonen: 2, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: true };
    });
    const t = texte(einsatzPdfDokument("Lage", [{ bogen: b, qr: QR }]).content).join("\n");
    expect(t).toContain("Bedarf gesamt (1 Einheit, 2 Personen)");
    expect(t).toContain("Ruhezeit erforderlich bei 1 Einheit");
    expect(t).not.toContain("Einheit(en)");
    expect(t).not.toContain("1 Einheiten");
  });

  it("kürzt die Bemerkung an der Wortgrenze und setzt keine Klammer in die Klammer", () => {
    const lang = "(2 Helfer über StAN-Soll (Reserve aktiviert). PKW OV zusätzlich über Staffelkommandant angefordert, Rest folgt später)";
    const kurz = bemerkungKurz(lang, 70);
    expect(kurz.endsWith("… Rest: Sammel-PDF)")).toBe(true);
    const vorRest = kurz.slice(1, kurz.indexOf(" …"));
    // Nie mitten im Wort: der gekürzte Text endet an einer Wortgrenze des Originals.
    expect(lang.replace(/[()]/g, (z) => (z === "(" ? "[" : "]"))).toMatch(new RegExp(`${vorRest.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`));
    // Keine verschachtelten runden Klammern.
    expect(kurz.slice(1, -1)).not.toMatch(/[()]/);
    // Kurze Bemerkungen bleiben ganz.
    expect(bemerkungKurz("Sandsäcke", 70)).toBe("(Sandsäcke)");
    expect(bemerkungKurz("", 70)).toBe("");
  });
});

describe("R17-W3 Anführungszeichen", () => {
  it("ersetzt das schließende gerade Zeichen durch “ und lässt alles andere stehen", () => {
    expect(anfuehrung('Abgerückt: Nr. 1 „THW Biberach"')).toBe("Abgerückt: Nr. 1 „THW Biberach“");
    expect(anfuehrung('Einsatz „A" und „B" übernommen')).toBe("Einsatz „A“ und „B“ übernommen");
    expect(anfuehrung("Alles „gut“ und 5\" Zoll")).toBe("Alles „gut“ und 5\" Zoll");
    expect(anfuehrung("ohne Anführung")).toBe("ohne Anführung");
  });

  it("gilt in den Dateien: CSV, PDF, Excel", () => {
    expect(csvFeld('Hinweis „Nr. 2"')).toBe("Hinweis „Nr. 2“");
    expect(winAnsiText('Zug „1. Zug"')).toBe("Zug „1. Zug“");
    expect(xmlText('Spalte „Hinweis"')).toBe("Spalte „Hinweis“");
  });

  it("der Wächter richtet Text und Beschriftungen in der Oberfläche aus, auch später eingefügte", async () => {
    const wurzel = document.createElement("div");
    document.body.append(wurzel);
    wurzel.innerHTML = '<p id="a">Einsatz „Hochwasser" übernommen</p><button id="b">x</button><textarea id="t">„roh"</textarea>';
    wurzel.querySelector("#b")!.setAttribute("title", 'Zug „1. Zug" gesetzt');
    const stop = anfuehrungWaechterStarten(wurzel);
    expect(wurzel.querySelector("#a")!.textContent).toBe("Einsatz „Hochwasser“ übernommen");
    expect(wurzel.querySelector("#b")!.getAttribute("title")).toBe("Zug „1. Zug“ gesetzt");
    expect(wurzel.querySelector("#t")!.textContent).toBe('„roh"'); // Eingabefelder bleiben unberührt
    const neu = document.createElement("span");
    neu.textContent = 'Nr. 2 „THW"';
    wurzel.append(neu);
    wurzel.querySelector("#a")!.firstChild!.nodeValue = 'Nochmal „X"';
    await waitFor(() => expect(neu.textContent).toBe("Nr. 2 „THW“"));
    await waitFor(() => expect(wurzel.querySelector("#a")!.textContent).toBe("Nochmal „X“"));
    stop();
    wurzel.remove();
  });

  it("der Wächter schließt auch über mehrere Textknoten, wie React sie anlegt („, Name, \")", async () => {
    function Quittung({ name }: { name: string }) {
      return <p id="q"><strong>Abgerückt 17:50:</strong> Nr. 1 „{name}" und „{name}" noch einmal.</p>;
    }
    const wurzel = document.createElement("div");
    document.body.append(wurzel);
    const stop = anfuehrungWaechterStarten(wurzel);
    const r = render(<Quittung name="THW Biberach/Riß" />, { container: wurzel });
    await waitFor(() => expect(wurzel.querySelector("#q")!.textContent).toBe("Abgerückt 17:50: Nr. 1 „THW Biberach/Riß“ und „THW Biberach/Riß“ noch einmal."));
    // Ändert sich der Name, bleibt es dabei.
    r.rerender(<Quittung name="THW Ulm" />);
    await waitFor(() => expect(wurzel.querySelector("#q")!.textContent).toBe("Abgerückt 17:50: Nr. 1 „THW Ulm“ und „THW Ulm“ noch einmal."));
    // Ein gerades Zeichen ohne öffnendes „ bleibt, ebenso eines in einem neuen Satz nach Zeilenumbruch.
    expect(anfuehrung('5" Zoll')).toBe('5" Zoll');
    stop();
    wurzel.remove();
  });

  it("main.tsx startet den Wächter", () => {
    expect(readFileSync(`${process.cwd()}/src/app/main.tsx`, "utf8")).toMatch(/anfuehrungWaechterStarten\(/);
  });
});

describe("R17-A3 / W2 / K9 Nachtrag-CSV: der Vermerk steht in Zeile 1", () => {
  function nachtragSammlung() {
    const alt = bogen("Crailsheim", (b) => mitPersonen(b, 3));
    const neu = bogen("Bamberg", (b) => mitPersonen(b, 2));
    const mk = (id: string, b: Erfassungsbogen) => {
      const e = { id, einheitSchluessel: "", empfangenAm: 1, quelle: "scan" as const, status: MeldeStatus.ANWESEND, bogen: b } as MeldeEintrag;
      return e;
    };
    return { alt: mk("a", alt), neu: mk("b", neu) };
  }

  it("die Kopfzeile bleibt Zeile 1, trägt aber in der ersten Spalte den Vermerk; jede Datenzeile hat „NACHTRAG“; alle Zeilen gleich breit", async () => {
    const { einheitSchluessel } = await import("@bos/meldekopf/einsaetze");
    const { alt, neu } = nachtragSammlung();
    alt.einheitSchluessel = einheitSchluessel(alt.bogen.einheit);
    neu.einheitSchluessel = einheitSchluessel(neu.bogen.einheit);
    const s = {
      id: "e", name: "Lage", art: EinsatzArt.EINSATZ, angelegt: 1, geaendert: 1, eintraege: [alt, neu], nachtragSeit: 5000,
      nachtragGruende: { [alt.einheitSchluessel]: { neu: false, gruende: ["Zug"] }, [neu.einheitSchluessel]: { neu: true, gruende: ["neu"] } },
    };
    const zeilen = einsatzCsvInhalt(s).replace(/^﻿/, "").split("\r\n");
    expect(zeilen[0]!.startsWith("NACHTRAG seit")).toBe(true);
    expect(zeilen[0]).toContain("nicht die ganze Lage;");
    // Die eigentliche Kopfzeile folgt in derselben Zeile ab Spalte 2 — Tabellenprogramme finden sie in Zeile 1.
    expect(zeilen[0]).toContain(";Nr.;");
    expect(zeilen[1]!.startsWith("NACHTRAG;")).toBe(true);
    expect(zeilen[2]!.startsWith("NACHTRAG;")).toBe(true);
    // Summenzeile: leere erste Zelle und der Zusatz „kein Gesamtstand“.
    const summe = zeilen.find((z) => z.includes("Summe Nachtrag"))!;
    expect(summe.startsWith(";")).toBe(true);
    expect(summe).toContain("kein Gesamtstand");
    // Die Datenzeilen haben genauso viele Spalten wie die Kopfzeile.
    expect(zeilen[1]!.split(";").length).toBe(zeilen[0]!.split(";").length);
  });

  it("die Alle-Daten-CSV macht es genauso", async () => {
    const { einheitSchluessel } = await import("@bos/meldekopf/einsaetze");
    const { alt } = nachtragSammlung();
    alt.einheitSchluessel = einheitSchluessel(alt.bogen.einheit);
    const s = {
      id: "e", name: "Lage", art: EinsatzArt.EINSATZ, angelegt: 1, geaendert: 1, eintraege: [alt], nachtragSeit: 5000,
      nachtragGruende: { [alt.einheitSchluessel]: { neu: true, gruende: ["neu"] } },
    };
    const zeilen = einsatzDetailCsvInhalt(s).replace(/^﻿/, "").split("\r\n");
    expect(zeilen[0]!.startsWith("NACHTRAG seit")).toBe(true);
    expect(zeilen[1]!.startsWith("NACHTRAG;")).toBe(true);
    expect(zeilen[0]!.split(";").length).toBe(zeilen[1]!.split(";").length);
  });

  it("die erste Lieferung (kein Nachtrag) bleibt unverändert", async () => {
    const { alt } = nachtragSammlung();
    const { einheitSchluessel } = await import("@bos/meldekopf/einsaetze");
    alt.einheitSchluessel = einheitSchluessel(alt.bogen.einheit);
    const s = { id: "e", name: "Lage", art: EinsatzArt.EINSATZ, angelegt: 1, geaendert: 1, eintraege: [alt] };
    const kopf = einsatzCsvInhalt(s).replace(/^﻿/, "").split("\r\n")[0]!;
    expect(kopf).not.toContain("NACHTRAG");
  });

  it("mitNachtragSpalte setzt die Vorspalte nur vor Kopf, Daten und Schlusszeilen", () => {
    expect(mitNachtragSpalte(["k", "d1", "d2", "s"], "VERMERK", 2)).toEqual(["VERMERK;k", "NACHTRAG;d1", "NACHTRAG;d2", ";s"]);
  });
});

describe("R17-E6 / K4 Abgerückte am Ende der Liste", () => {
  function e(name: string, status: MeldeStatus, nr: number, zug?: string): MeldeEintrag {
    const b = bogen(name);
    return { id: name, einheitSchluessel: name, empfangenAm: nr, quelle: "scan", status, bogen: b, zugEtikett: zug } as MeldeEintrag;
  }

  it("stellt in jeder Sortierung die Anwesenden vor die Abgerückten, innerhalb der Gruppen in der gewählten Reihenfolge", () => {
    const liste = [e("A", MeldeStatus.ANWESEND, 1, "1. Zug"), e("B", MeldeStatus.ABGERUECKT, 2, "1. Zug"), e("C", MeldeStatus.ANWESEND, 3, "2. Zug")];
    const nummern = new Map([["A", 1], ["B", 2], ["C", 3]]);
    for (const s of ["nummer", "zuletzt", "aelteste", "eintreffzeit", "zug", "organisation", "name"] as const) {
      const namen = einheitenSortieren(liste, s, nummern).map((x) => x.id);
      expect(namen[namen.length - 1], s).toBe("B");
    }
    expect(einheitenSortieren(liste, "zug").map((x) => x.id)).toEqual(["A", "C", "B"]);
  });

  it("die Einsatzansicht zeigt unter den Anwesenden die Überschrift „Abgerückt (1)“ und danach die Karte", async () => {
    const s = einsatzAnlegen("Hochwasser Liste", EinsatzArt.EINSATZ);
    const ids = ["Alpha", "Beta", "Gamma"].map((n) => meldungHinzufuegen(s.id, bogen(n))!.eintrag);
    const { meldungStatusSetzen } = await import("@bos/meldekopf/einsaetze");
    meldungStatusSetzen(s.id, ids[1]!.id, MeldeStatus.ABGERUECKT);
    render(<Wirt id={s.id} />);
    const reihe = [...document.querySelectorAll("ul.einheiten-liste > li")].map((li) => li.textContent!);
    expect(reihe[0]).toContain("Alpha");
    expect(reihe[1]).toContain("Gamma");
    expect(reihe[2]).toBe("Abgerückt (1)");
    expect(reihe[3]).toContain("Beta");
    expect(abschnitt).toContain("li.einheiten-trenner");
  });
});

describe("R17-A2 Einzelbogen mit sprechendem Namen", () => {
  it("der Dateiname nennt Stand und Einheit; zwei Stände derselben Einheit unterscheiden sich", () => {
    const b1 = bogen("Wardenburg");
    b1.stand = 100_000;
    const b2 = { ...b1, stand: 100_000 + 95 };
    const n1 = einzelDateiname(b1);
    const n2 = einzelDateiname(b2);
    expect(n1).toMatch(/^\d{4}-\d{2}-\d{2}_\d{4}_eeb_[\w-]*Wardenburg[\w-]*\.pdf$/);
    expect(n1).not.toBe(n2);
    expect(n1).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/);
  });

  it("der Knopf lädt ohne Tab herunter und nennt die Datei in der Bestätigung", async () => {
    const nutzer = userEvent.setup();
    const oeffnen = vi.fn(() => null);
    vi.stubGlobal("open", oeffnen);
    const s = einsatzAnlegen("Hochwasser PDF", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Wardenburg"));
    render(<Wirt id={s.id} />);
    await nutzer.click(within(karteVon("Wardenburg")).getByRole("button", { name: "Bogen als PDF" }));
    const zeile = await waitFor(() => {
      const z = [...document.querySelectorAll("p.hinweis[role=status]")].find((p) => p.textContent!.startsWith("✓ Bogen als PDF"));
      expect(z).toBeTruthy();
      return z!;
    });
    expect(oeffnen).not.toHaveBeenCalled();
    expect(zeile.textContent).toContain("eeb-test.pdf");
  });
});

describe("R17-A5 eigene Auswertung beim Einlesen", () => {
  it("die CSV des Stabs verweist auf Sammel-PDF und Sicherung, nicht auf „Personal“", () => {
    for (const name of [
      "eeb-einsatz-271913okt26_Hochwasser_Test.csv",
      "eeb-einsatz-271913okt26_Hochwasser_Test-alle-daten.csv",
      "eeb-einsatz-271913okt26_Test-oldenburg.xlsx",
      "2026-10-27_1913_eeb-einsatz_Hochwasser_Test.csv",
      "2026-10-27_1913_eeb-einsatz-alle-daten-nachtrag_Hochwasser_Test.csv",
      "2026-10-27_1913_eeb-einsatz-oldenburg_Test.xlsx",
    ]) {
      const art = name.endsWith("xlsx") ? "fremd" : "tabelle";
      const t = dateiFehlerText(name, art, "einsatz")!;
      expect(t, name).toContain("Sammel-PDF");
      expect(t, name).toContain("Datensicherung");
      expect(t, name).not.toContain("Personal");
    }
  });

  it("eine fremde Liste bleibt bei ihrem bisherigen Satz", () => {
    expect(dateiFehlerText("liste.csv", "tabelle", "boegen")).toContain("Schritt „Personal“");
  });
});

describe("R17-A6 ungültiger Einsatzzeitraum", () => {
  it("nennt ein Datum außerhalb des Bereichs „ungültiges Datum“, nie „undefined“", () => {
    expect(datumAnzeige(Number.MAX_SAFE_INTEGER)).toBe("ungültiges Datum");
    expect(datumAnzeige(1e12)).toBe("ungültiges Datum");
    expect(datumAnzeige(200)).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    const b = bogen("Spinner", (x) => { x.einsatz = { ...x.einsatz, zeitraumVon: 1e12, zeitraumBis: 1e12 + 5 }; });
    expect(zeitraumDeutsch(b)).not.toContain("undefined");
    const hinweise = pruefpunkte(b, true, 100).map((p) => p.text).join("\n");
    expect(hinweise).toContain("mehr als ein Jahr entfernt");
    expect(hinweise).not.toMatch(/undefined|\+0\d{5}/);
  });
});

describe("R17-W1 → R18-S2/W1 Die Quittung nennt Einheit und Folge vollständig, bis sie verschwindet", () => {
  it("zeigt den vollen Satz mit Namen und fällt nicht auf eine Kurzfassung zurück", () => {
    vi.useFakeTimers();
    render(
      <DaumenQuittung kurz="Nr. 2 abgerückt 17:41" onRueckgaengig={() => {}} onSchliessen={() => {}}>
        <strong>Abgerückt 17:41:</strong> Nr. 2 „THW Biberach/Riß Fachgruppe Ortung (B)“
      </DaumenQuittung>,
    );
    expect(document.querySelector(".quittung-text")!.textContent).toContain("THW Biberach");
    act(() => { vi.advanceTimersByTime(QUITTUNG_ENDE_NACH_MS - 10); });
    expect(document.querySelector(".quittung-daumen")!.className).not.toContain("quittung-kompakt");
    expect(document.querySelector(".quittung-text")!.textContent).toContain("THW Biberach");
  });

  it("die Quittung des Abrückens in der Einsatzansicht trägt Nummer und Namen und ist nach 30 s weg", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const nutzer = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const s = einsatzAnlegen("Hochwasser Abrücken", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Crailsheim"));
    render(<Wirt id={s.id} />);
    await nutzer.click(within(karteVon("Crailsheim")).getByRole("button", { name: "Mehr…" }));
    await nutzer.click(within(karteVon("Crailsheim")).getByRole("button", { name: "Abrücken" }));
    await waitFor(() => expect(document.querySelector(".quittung-daumen")).not.toBeNull());
    expect(document.querySelector(".quittung-text")!.textContent).toMatch(/Abgerückt .*Nr\. \d+ „.*Crailsheim/);
    await act(async () => { vi.advanceTimersByTime(QUITTUNG_ENDE_NACH_MS - 1000); });
    expect(document.querySelector(".quittung-text")!.textContent).toMatch(/Nr\. \d+ „.*Crailsheim/);
    await act(async () => { vi.advanceTimersByTime(1500); });
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  }, 20000);
});

describe("R17-K2 Kurzzeile nach „Stärke ändern…“", () => {
  it("nennt Verpflegung und WC/Dusche als folgend, nicht „Bedarf übernommen“", () => {
    const s = einsatzAnlegen("Hochwasser Kurz", EinsatzArt.EINSATZ);
    const alt = meldungHinzufuegen(s.id, bogen("Biberach", (b) => {
      mitPersonen(b, 11);
      b.sofortbedarf = { verpflegungPersonen: 11, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
      b.fahrzeuge = [{ ...bogen("x").fahrzeuge[0]!, kennzeichen: "THW-1" } as never].filter(Boolean);
    }))!.eintrag;
    const neu = nurStaerkeUebernehmen(alt.bogen, { fuehrer: 0, unterfuehrer: 0, mannschaft: 8, gesamt: 8 }, alt.bogen.stand + 5);
    const r = meldungAufnehmen(s.id, neu, { quelle: "manuell", einheitSchluesselOverride: alt.einheitSchluessel })!;
    const kurz = vergleichKurztext(alt, r.eintrag);
    expect(kurz).toContain("Stärke 11 → 8");
    expect(kurz).not.toContain("Bedarf übernommen");
    expect(kurz).toMatch(/Verpflegung und WC\/Dusche folgen der Stärke|Namen, Fahrzeuge, Bedarf/);
  });
});

describe("R17-K3 / K11 Lagemonitor", () => {
  it("zeigt am 720p-Fernseher und am Telefon nur eine Bewegungszeile, sonst zwei bzw. drei", () => {
    expect(bewegungenMax(1280, 720)).toBe(1);
    expect(bewegungenMax(390, 844)).toBe(1);
    expect(bewegungenMax(1280, 900)).toBe(2);
    expect(bewegungenMax(1920, 1080)).toBe(3);
  });

  it("der Monitor bleibt aus dem Startbündel: main.tsx und die Einsatzansicht laden ihn nach (ADR-003 Aufnahmeregel 5)", () => {
    const main = readFileSync(`${process.cwd()}/src/app/main.tsx`, "utf8");
    const ui = readFileSync(`${process.cwd()}/src/app/einsaetze-ui.tsx`, "utf8");
    expect(main).not.toMatch(/import\s*\{[^}]*\bLagemonitor\b[^}]*\}\s*from\s*"\.\/lagemonitor-ui"/);
    expect(main).toMatch(/lazy\(\(\) => import\("\.\/lagemonitor-ui"\)/);
    expect(ui).not.toMatch(/^import[^\n]*from "\.\/lagemonitor-ui"/m);
    expect(ui).toMatch(/lazy\(\(\) => import\("\.\/lagemonitor-ui"\)/);
  });

  it("die Lageleiste des Telefons steht am Ende, die Angaben der Lagezeile bleiben ungeteilt", () => {
    expect(lmCss).toMatch(/\.lm-stufenleiste \{ order: 99;/);
    expect(lmCss).toMatch(/\.lm-nb \{ white-space: nowrap; \}/);
  });
});

describe("R17-K12 / K10 Einsatzansicht am Telefon", () => {
  it("die Erfassungsknöpfe folgen der Lage: erst Kennzahlen, Neues, Bedarf, dann die Knöpfe, dann die Liste (nur Darstellung)", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\) \{[\s\S]*main\.einsatz-detail \{ display: flex; flex-direction: column; \}/);
    expect(abschnitt).toMatch(/\.einsatz-seite > \.aktionen \{ order: 1;/);
    expect(abschnitt).toMatch(/main\.einsatz-detail > \.einsatz-liste, main\.einsatz-detail > \.einsatz-liste ~ \* \{ order: 2; \}/);
  });

  it("die Kennzahlen stehen am Telefon in drei Spalten, „Gesamt“ als breite Zelle", () => {
    expect(abschnitt).toMatch(/@media \(16rem < width <= 30rem\) \{[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
    expect(abschnitt).toMatch(/> div\.gesamt \{ grid-column: span 2; \}/);
  });

  it("„Angaben vom Zettel (optional)“ trägt ein Aufklappzeichen", () => {
    expect(abschnitt).toMatch(/details\.zettel-angaben > summary::before \{ content: "▸"/);
    expect(abschnitt).toMatch(/details\.zettel-angaben\[open\] > summary::before \{ content: "▾"/);
  });
});

describe("R17-A7 / K5 / N2 ein Einsatz, ein Eintrag auf der Startseite", () => {
  it("läuft ein Einsatz, steht er einmal da: als Karte über der Weiche, ohne zweiten Schnelleinstieg", () => {
    const s = einsatzAnlegen("Hochwasser Elbe", EinsatzArt.EINSATZ);
    for (const ort of ["Alpha", "Beta", "Gamma"]) meldungHinzufuegen(s.id, bogen(ort));
    render(<App />);
    expect(document.querySelectorAll("button.sammlung-oeffnen")).toHaveLength(0);
    const treffer = [...document.querySelectorAll("h2")].filter((h) => h.textContent === "Hochwasser Elbe");
    expect(treffer).toHaveLength(1);
    expect(document.body.textContent!.match(/Hochwasser Elbe/g)).toHaveLength(1);
    expect(document.body.textContent!.match(/3 Einheiten anwesend/g)).toHaveLength(1);
    // Die Karte steht vor der Weiche.
    const karte = treffer[0]!.closest(".karte")!;
    const weiche = document.querySelector(".weiche")!;
    expect(karte.compareDocumentPosition(weiche) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Einsatz-Sammlung (Meldekopf)" })).toBeTruthy();
  }, 20000);

  it("ohne Einsatz bleibt der erklärende Abschnitt an seiner Stelle", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Einsatz-Sammlung (Meldekopf)" })).toBeTruthy();
    expect(document.body.textContent).toContain("Fremde Bögen zu einem Einsatz");
  });

  it("öffnet den Einsatz über „Öffnen“ der Karte", async () => {
    const nutzer = userEvent.setup();
    einsatzAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
  });
});
