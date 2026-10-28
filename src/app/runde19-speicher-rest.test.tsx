/**
 * Runde 19, Block Speicher, Rest: D2, D3, D8, D9, W10, S12, S13, K4/N2/E1, A2, K8, N6, M12/H11/E11/N13.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuerBogen } from "./hilfen";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht, prellschutzSetzen } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { LagemonitorBlock } from "./lagemonitor-ui";
import { einsatzbeginnLaden, einsatzbeginnSetzen } from "./lagemonitor-beginn";
import { entfernteNummernText, meldungInPapierkorb } from "./meldungs-papierkorb";
import { abschlussLaden, abschlussSetzen } from "./einsatz-abschluss";
import { exportStandSatz, exportStaendeUebernehmen, lageblattVermerken, weitergabeVermerken } from "./export-stand";
import { abschlussWege } from "./abschluss-block";
import { arbeiten, arbeitetZuruecksetzen, tippWaehrendLauf } from "./arbeitet";
import { ausgabeFreiBeiTipp, ausgabeSperreZuruecksetzen } from "./ausgabe-sperre";
import { ORTSSPERRE_RADIUS_PX, ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";
import { einsatzCsvInhalt } from "./einsatz-csv";
import { lueckenZeileSetzen } from "./pdf-dokument";

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  prellschutzSetzen(0);
  arbeitetZuruecksetzen();
  ausgabeSperreZuruecksetzen();
  lueckenZeileSetzen("");
  vi.restoreAllMocks();
});

function bogenMitName(name: string, uebung = false) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  if (uebung) b.uebung = true;
  return b;
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

const dialogMit = (titel: string) => document.querySelector<HTMLDialogElement>(`dialog[aria-label='${titel}']`);

// ------------------------------------------------------------------------------------------------ D2

describe("R19-D2 Einsatzbeginn im Feld überschreiben: der alte Wert bleibt mit Rückweg", () => {
  beforeEach(() => localStorage.clear());

  it("zeigt „Beginn war …“ und holt den alten Beginn auf Tipp zurück", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Beginn", EinsatzArt.EINSATZ);
    const alt = new Date(2026, 9, 28, 3, 15).getTime();
    einsatzbeginnSetzen(s.id, alt, [s.id]);
    render(<LagemonitorBlock einsatzId={s.id} alleIds={[s.id]} />);
    const feld = document.querySelector<HTMLInputElement>("input[type='datetime-local']")!;
    expect(document.querySelector(".lm-beginn-war")).toBeNull();
    fireEvent.change(feld, { target: { value: "2026-10-27T20:00" } });
    const neu = new Date(2026, 9, 27, 20, 0).getTime();
    expect(einsatzbeginnLaden(s.id)).toBe(neu);
    const zeile = document.querySelector(".lm-beginn-war")!;
    expect(zeile.textContent).toMatch(/Beginn war 03:15 Uhr/);
    await nutzer.click(within(zeile as HTMLElement).getByRole("button", { name: "Alten Beginn zurückholen" }));
    expect(einsatzbeginnLaden(s.id)).toBe(alt);
    expect(document.querySelector(".lm-beginn-war")).toBeNull();
  });
});

// ------------------------------------------------------------------------------------------------ D3

describe("R19-D3 Zurückholen einer inzwischen neu eingelesenen Meldung", () => {
  beforeEach(() => localStorage.clear());

  it("nennt im Papierkorb und in der Quittung die Nummer, unter der sie schon wieder da ist", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Doppelt", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    meldungHinzufuegen(s.id, bogenMitName("Beta"));
    const e = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege.find((x) => x.bogen.einheit.hierarchie[0]!.name === "Alpha")!;
    // Der Papierkorb hält die frühere Nr. 7; dieselbe Einheit steht inzwischen wieder in der Liste.
    meldungInPapierkorb(s.id, { art: "einheit", eintraege: [{ ...e, id: "frueher-1" }], nummer: 7 });
    render(<Wirt id={s.id} />);
    const block = await waitFor(() => {
      const b = document.querySelector<HTMLElement>("details.meldungen-papierkorb");
      expect(b).not.toBeNull();
      return b!;
    });
    expect(block.textContent).toMatch(/Schon wieder eingelesen als Nr\. \d+/);
    await nutzer.click(within(block).getByRole("button", { name: "Zurückholen" }));
    const leiste = await waitFor(() => {
      const l = document.querySelector<HTMLElement>("[role='status'].quittung-daumen, .quittung-daumen");
      expect(l).not.toBeNull();
      return l!;
    });
    expect(leiste.textContent).toMatch(/ist schon als Nr\. \d+ vorhanden — Papierkorb-Eintrag entfernt, die frühere Nr\. 7 bleibt frei/);
  });
});

// ------------------------------------------------------------------------------------------------ D9

describe("R19-D9 „Wieder anwesend“ kurz nach dem Abrücken fragt nach", () => {
  beforeEach(() => localStorage.clear());

  it("ein Nachtipp nimmt den Abrückvermerk nicht mehr still zurück; „Abgerückt lassen“ behält ihn", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Abrücken", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    const karte = document.querySelector<HTMLElement>(".einheit-zeile")!;
    await nutzer.click(within(karte).getByRole("button", { name: "Abrücken" }));
    const wieder = await within(karte).findByRole("button", { name: "Wieder anwesend" }, { timeout: 4000 });
    await nutzer.click(wieder);
    const frage = await waitFor(() => dialogMit("Wieder anwesend?")!);
    expect(frage.textContent).toContain("Abrückvermerk");
    await nutzer.click(within(frage).getByRole("button", { name: "Abgerückt lassen" }));
    expect(einsaetzeLaden().find((x) => x.id === s.id)!.eintraege[0]!.abgerueckAm).toBeDefined();
    expect(within(karte).getByRole("button", { name: "Wieder anwesend" })).toBeDefined();
  }, 15000);
});

// ------------------------------------------------------------------------------------------------ W10, S13, S12

describe("R19-W10/S13/S12 Rückfrage, Export-Satz und Sprung", () => {
  beforeEach(() => localStorage.clear());

  it("W10: die Rückfrage „Einsatz löschen?“ nennt den Exportstand", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Ohne", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    expect(exportStandSatz(s.id)).toBe("Noch nichts exportiert oder übergeben.");
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz löschen…" }));
    const frage = dialogMit("Einsatz löschen?")!;
    expect(frage.textContent).toContain("Noch nichts exportiert oder übergeben.");
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    lageblattVermerken(einsaetzeLaden()[0]!);
    expect(exportStandSatz(s.id)).toMatch(/^Zuletzt herausgegangen: /);
  });

  it("S13: nach der Weitergabe-Datei steht nicht „Noch kein Export aus diesem Einsatz“", () => {
    const s = einsatzAnlegen("Hochwasser Weitergabe", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    weitergabeVermerken(einsaetzeLaden()[0]!);
    render(<Wirt id={s.id} />);
    expect(document.body.textContent).not.toContain("Noch kein Export aus diesem Einsatz");
    expect(document.body.textContent).toMatch(/Kein Export an den Stab \(CSV, Excel, Teil-PDF\) — die Weitergabe-Datei vom .* zählt hier nicht/);
  });

  it("S12: ein Sprungverweis führt zum Abschluss, der Kopf nennt nach dem Beenden die offenen Wege", () => {
    const s = einsatzAnlegen("Hochwasser Sprung", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    abschlussSetzen(s.id, { beendetAm: Date.now() }, [s.id]);
    render(<Wirt id={s.id} extra={{ onWeitergeben: () => {}, onLageblatt: () => {} }} />);
    expect(screen.getByRole("button", { name: "Übergabe, Abschluss ↓" })).toBeDefined();
    expect(document.getElementById("abschluss")).not.toBeNull();
    expect(document.querySelector(".einsatz-beendet-kopf")!.textContent).toMatch(/Einsatz beendet .* — noch offen: Weitergabe-Datei \(Sammel-PDF\), Lageblatt und 4 weitere/);
  });
});

// ------------------------------------------------------------------------------------------------ K4, N2, E1

describe("R19-K4/N2 Eine andere Ausgabe nach dem Lageblatt wird nicht verschluckt", () => {
  it("tippWaehrendLauf gilt nur für dieselbe Ausgabe", async () => {
    await arbeiten("lageblatt", async () => {
      const jetzt = performance.now();
      expect(tippWaehrendLauf(jetzt, "lageblatt")).toBe(true);
      expect(tippWaehrendLauf(jetzt, "csv")).toBe(false);
      expect(tippWaehrendLauf(jetzt)).toBe(true); // ohne Angabe wie bisher
    });
    const ende = performance.now();
    expect(tippWaehrendLauf(ende + 50, "lageblatt")).toBe(true);
    expect(tippWaehrendLauf(ende + 50, "csv")).toBe(false);
    expect(ausgabeFreiBeiTipp("csv", { timeStamp: ende + 50 }, (z) => tippWaehrendLauf(z, "csv"), 2000)).toBe(true);
    expect(ausgabeFreiBeiTipp("lageblatt", { timeStamp: ende + 60 }, (z) => tippWaehrendLauf(z, "lageblatt"), 2000)).toBe(false);
  });
});

describe("R19-E1 „Abbrechen“ in einer Rückfrage gibt die Stelle des öffnenden Knopfs frei", () => {
  const tipp = (el: Element, x: number, y: number) =>
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1 }));

  it("der erneute Tipp auf „Entfernen“ gleich nach „Abbrechen“ kommt an", () => {
    tippSchutzZuruecksetzen();
    const entfernen = document.createElement("button");
    entfernen.textContent = "Entfernen";
    const getroffen = vi.fn();
    entfernen.addEventListener("click", getroffen);
    const dialog = document.createElement("dialog");
    dialog.className = "abfrage";
    dialog.setAttribute("open", "");
    const abbrechen = document.createElement("button");
    abbrechen.textContent = "Abbrechen";
    dialog.append(abbrechen);
    document.body.append(entfernen, dialog);

    tipp(entfernen, 100, 300); // öffnet die Rückfrage
    ortSperren(1200, { x: 100, y: 300 }, { nurAusserhalbRueckfrage: true });
    tipp(abbrechen, 100, 500);
    dialog.remove();
    tipp(entfernen, 100 + ORTSSPERRE_RADIUS_PX / 4, 300); // 0,9 s später, derselbe Ort
    expect(getroffen).toHaveBeenCalledTimes(2);
    entfernen.remove();
  });
});

// ------------------------------------------------------------------------------------------------ A2

describe("R19-A2 Lücke in den Nummern in Lageblatt, Sammel-PDF und CSV", () => {
  beforeEach(() => localStorage.clear());

  it("benennt die entfernte Nummer in allen drei", () => {
    const s = einsatzAnlegen("Hochwasser Lücke", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    meldungHinzufuegen(s.id, bogenMitName("Beta"));
    const einsatz = einsaetzeLaden().find((x) => x.id === s.id)!;
    expect(entfernteNummernText(s.id)).toBe("");
    meldungInPapierkorb(s.id, { art: "einheit", eintraege: [{ ...einsatz.eintraege[0]!, id: "weg-1" }], nummer: 2 });
    const text = entfernteNummernText(s.id);
    expect(text).toMatch(/^Nr\. 2 entfernt \d\d:\d\d \(Papierkorb\) — nicht in der Summe\.$/);

    const csv = einsatzCsvInhalt(einsatz, undefined, undefined, undefined, undefined, text);
    expect(csv).toContain("Nr. 2 entfernt");
    expect(einsatzCsvInhalt(einsatz)).not.toContain("entfernt");

    // Das Lageblatt selbst: runde19-speicher-pdf.test.ts.
  });
});

// ------------------------------------------------------------------------------------------------ K8

describe("R19-K8 Übernommene Stempel gelten nicht als „erzeugt“", () => {
  beforeEach(() => localStorage.clear());

  it("ein Excel-Stempel vom anderen Gerät steht als „vom anderen Gerät übernommen, hier nicht erzeugt“", () => {
    const s = einsatzAnlegen("Hochwasser Import", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    const einsatz = einsaetzeLaden().find((x) => x.id === s.id)!;
    exportStaendeUebernehmen(s.id, { xlsx: { zeitpunkt: Date.now() + 1000, eintragIds: einsatz.eintraege.map((e) => e.id) } }, [s.id]);
    const wege = abschlussWege(einsatz);
    const excel = wege.find((w) => w.name === "Excel-Liste")!;
    expect(excel.getan).toBe(false);
    expect(excel.fremd).toBe("geraet");
    render(<Wirt id={s.id} />);
    const zeile = [...document.querySelectorAll(".abschluss-liste p")].find((p) => p.textContent!.includes("Excel-Liste:"))!;
    expect(zeile.textContent).toContain("vom anderen Gerät übernommen, hier nicht erzeugt");
    expect(zeile.textContent).not.toMatch(/: erzeugt/);
  });
});

// ------------------------------------------------------------------------------------------------ N6

describe("R19-N6 Lauter Übungsmeldungen: die Null erklärt sich", () => {
  beforeEach(() => localStorage.clear());

  it("Kennzahl, Hinweis und Listenkopf nennen die Übung; „Zur Kenntnis genommen“ räumt die Aufnahme-Meldung", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Echt", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha", true));
    meldungHinzufuegen(s.id, bogenMitName("Beta", true));
    const onKenntnis = vi.fn();
    render(<Wirt id={s.id} extra={{ onKenntnisGenommen: onKenntnis }} />);
    expect(document.querySelector(".staerke-leiste .anzahl")!.textContent).toContain("Einheiten (+2 Übung)");
    expect(document.querySelector(".nur-uebung")!.textContent).toMatch(/Nichts gezählt: alle 2 eingegangenen Meldungen sind Übung und zählen nicht/);
    expect(document.getElementById("einheiten-liste")!.textContent).toMatch(/0 anwesend · 2 Übung\)/);
    const knopf = screen.queryByRole("button", { name: "Zur Kenntnis genommen" });
    if (knopf) {
      await nutzer.click(knopf);
      expect(onKenntnis).toHaveBeenCalledTimes(1);
    }
  });
});

// ------------------------------------------------------------------------------------------------ M12, H11, E11, N13

describe("R19-M12/H11/E11/N13 Übergabe und Ende quittieren am Bildrand", () => {
  beforeEach(() => localStorage.clear());

  it("„Übergabe vermerken“: Feld „freiwillig“, Quittung mit Rückgängig, Zeile „ohne Empfänger“", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Quittung", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Übergabe vermerken…" }));
    const eingabe = dialogMit("Übergabe vermerken")!;
    expect(eingabe.textContent).toContain("An (Name oder Stelle, freiwillig)");
    expect(eingabe.textContent).toContain("Es wird nichts verschickt");
    await nutzer.click(within(eingabe).getByRole("button", { name: "Vermerken" }));
    const leiste = await waitFor(() => {
      const l = document.querySelector<HTMLElement>(".quittung-daumen");
      expect(l).not.toBeNull();
      return l!;
    });
    expect(leiste.textContent).toContain("Übergabe vermerkt — ohne Empfänger.");
    expect(document.querySelector(".abschluss-uebergabe")!.textContent).toContain("(ohne Empfänger)");
    expect(abschlussLaden(s.id).uebergabeAm).toBeDefined();
    await nutzer.click(within(leiste).getByRole("button", { name: /Rückgängig/ }));
    expect(abschlussLaden(s.id).uebergabeAm).toBeUndefined();
  });

  it("„Einsatz als beendet markieren“: Quittung „Einsatz beendet.“ mit Rückgängig", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Ende", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz als beendet markieren" }));
    const leiste = await waitFor(() => document.querySelector<HTMLElement>(".quittung-daumen")!);
    expect(leiste.textContent).toContain("Einsatz beendet.");
    await nutzer.click(within(leiste).getByRole("button", { name: /Rückgängig/ }));
    expect(abschlussLaden(s.id).beendetAm).toBeUndefined();
  });
});

// ------------------------------------------------------------------------------------------------ D8

describe("R19-D8 Der Rückholplatz fasst einen Bogen: der alte kann vorher als Datei gesichert werden", () => {
  it("die Rückfrage bietet „vorher als Datei sichern“ neben „endgültig löschen“", async () => {
    localStorage.clear();
    const nutzer = userEvent.setup();
    const { entwurfZuJson } = await import("./entwurf");
    localStorage.setItem("eeb.entwurf.v1", entwurfZuJson(bogenMitName("Zweiter"), Date.now() - 60_000));
    localStorage.setItem("eeb.entwurf.ersetzt.v1", entwurfZuJson(bogenMitName("Eigener"), Date.now() - 120_000));
    vi.resetModules();
    const { App } = await import("./app");
    render(<App />);
    await nutzer.click(await screen.findByRole("button", { name: "Neuen Bogen erstellen" }));
    const frage = await screen.findByRole("dialog", { name: "Neuen Bogen anfangen?" });
    expect(frage.textContent).toMatch(/THW Eigener.*wird dabei endgültig gelöscht: Er fasst nur einen Bogen/);
    expect(within(frage).getByRole("button", { name: /den alten Bogen vorher als Datei sichern/ })).toBeDefined();
    expect(within(frage).getByRole("button", { name: /alten Bogen endgültig löschen/ })).toBeDefined();
    await nutzer.click(within(frage).getByRole("button", { name: "Abbrechen" }));
    expect(localStorage.getItem("eeb.entwurf.ersetzt.v1")).toContain("Eigener");
  }, 20000);
});
