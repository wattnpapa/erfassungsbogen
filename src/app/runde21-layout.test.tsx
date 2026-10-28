/**
 * Runde 21, Block Layout: erste Einheitenkarte höher (A4, W4, E5, H4, K3, G5, M5, L4, N4, O3, S3, D4), Assistent quer in „Feld" (W5, E6, H5, G3,
 * M4, L7), Fußleiste Schritt 5 quer (A6) und bei Tastaturhöhe (G2), Platzhalter beim Nachladen (A2, E2, M2, N5), Tabelle bei 320/360 px (G7, M6, L6,
 * D3, S4), Wortbrüche in Rückfragen und Titeln (E7, L5, H8), „Zur Kenntnis genommen" (G4) und die feste Ansichtsleiste (G6).
 *
 * Die Maße stammen aus Messungen im Produktionsbuild mit Playwright (Chromium, Touch; siehe Bericht); jsdom rechnet kein Layout. Hier stehen das
 * Verhalten (was wann im Baum steht, was Tippen auslöst) und die Stilregeln in index.html, Abschnitt „Runde 21 (Layout)".
 */
import { readFileSync } from "node:fs";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail, KERN_KOPF, KERN_KOPF_TRENNUNG, bedarfTeilFest } from "./einsaetze-ui";
import { weicheTrennstellen } from "./einheiten-tabelle";
import { kenntnisVermerken } from "./export-stand";
import { neuerBogen } from "./hilfen";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 21 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 21 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
  document.documentElement.className = "";
});

function telefon() {
  window.matchMedia = ((q: string) => ({
    matches: true,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

function bogenMitName(name: string) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

function Wirt({ id, manuell = () => {}, schnell }: { id: string; manuell?: () => void; schnell?: () => void }) {
  const [einsatz, setEinsatz] = useState(() => einsaetzeLaden().find((s) => s.id === id)!);
  return (
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={() => setEinsatz({ ...einsaetzeLaden().find((s) => s.id === id)! })}
        onScannen={() => {}}
        onManuell={manuell}
        onSchnell={schnell}
        onDateiImport={() => {}}
        onBilderImport={() => {}}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onWeitergeben={() => {}}
        onGeloescht={() => {}}
      />
      <Dialogschicht />
    </>
  );
}

const WEGE = ["Einheit manuell erfassen…", "Einheit schnell erfassen (nur Stärke)…", "Bögen einlesen…"];

describe("Runde 21 (Layout): die Stilregeln sind da", () => {
  it("der Abschnitt ist da", () => {
    expect(abschnitt.length).toBeGreaterThan(3000);
  });

  it("R21-A4 u. a.: Einsatzansicht am Telefon: Zweierraster der Aufnahme, Aufklapper, Kennzahlen in einer Zeile, 10 px zwischen den Blöcken", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 47\.999rem\) \{[\s\S]*main\.einsatz-detail \.einsatz-seite > \* \{ margin-block: 0 10px; \}/);
    expect(abschnitt).toMatch(/\.einsatz-seite \.aktionen \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(abschnitt).toMatch(/\.aktionen > \.primaer,\s*:root:root main\.einsatz-detail \.einsatz-seite \.aktionen > details\.aufnahme-weitere \{ grid-column: 1 \/ -1; \}/);
    expect(abschnitt).toMatch(/details\.aufnahme-weitere > summary \{[^}]*min-height: calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    // Eine Zeile ab 360 px (22,5 rem) bis 480 px, nicht in „Feld" und nicht bei großer Schrift; bei 320 px bleiben zwei Reihen.
    expect(abschnitt).toMatch(/@media \(min-width: 22\.5rem\) and \(max-width: 30rem\) \{\s*:root:root:root:not\(\.schrift-gross\):not\(\.feld-modus\) main\.einsatz-detail \.staerke-leiste:has\(> div:nth-child\(5\)\) \{ grid-template-columns: 1\.3fr repeat\(4, minmax\(0, 1fr\)\); \}/);
    // Das Menü von „Bögen einlesen…" öffnet nach links, damit es in der rechten Spalte nicht aus dem Bild ragt.
    expect(abschnitt).toMatch(/\.aktionen \.einlese-menue \{ left: auto; right: 0; \}/);
  });

  it("R21-G6: die feste Ansichtsleiste entfällt am Telefon (der Kopf trägt die Wahl), ihre Höhe auch", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 47\.999rem\) \{\s*:root:root \.anzeige-balken \{ display: none; \}\s*:root:root:has\(\.anzeige-balken\) \{ --balken-hoehe: 0px; \}/);
  });

  it("R21-G7, M6, L6, D3, S4: Tabelle bei 320/360 px: Bedarfsposten und Zugzelle brechen vor der Zahl, Spaltenbreiten, alles oben ausgerichtet", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\) \{[\s\S]*tabelle-kern \.bedarf-teil \{ white-space: normal; \}/);
    expect(abschnitt).toMatch(/tabelle-kern td\.zug-zelle \{ white-space: normal; \}/);
    expect(abschnitt).toMatch(/tabelle-kern tbody > tr > \* \{ vertical-align: top; \}/);
    expect(abschnitt).toMatch(/@media \(max-width: 22\.5rem\) \{\s*:root:root table\.einheiten-tabelle\.tabelle-kern > \* > tr > :first-child \{ width: 35%; \}/);
    expect(abschnitt).toMatch(/th\[data-spalte="gesamt"\] \{ width: 16%; \}/);
    // Der Kopf „Eingetroffen": am Telefon die Fassung mit weicher Trennstelle, sonst die glatte.
    expect(abschnitt).toMatch(/table\.einheiten-tabelle \.spalten-kopf > \.kopf-weich \{ display: none; \}/);
    expect(abschnitt).toMatch(/\.spalten-kopf > \.kopf-glatt:has\(\+ \.kopf-weich\) \{ display: none; \}/);
  });

  it("R21-E7, L5: Rückfragen bei 320 px: Antwort und „Abbrechen“ untereinander, nicht in 119-px-Knöpfen", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 22\.5rem\) \{\s*:root:root dialog\.abfrage \.abfrage-fuss:has\(> \.abfrage-weg:first-child:nth-last-child\(2\)\) \{ flex-direction: column; gap: 24px; \}/);
    expect(abschnitt).toMatch(/dialog\.abfrage form > \.abfrage-aktionen:has\(> button \+ button\) \{ flex-direction: column; \}/);
  });

  it("R21-H8: Titel der Fußzeilen-Fenster bricht nie im Wort; „Schließen“ rutscht in die Zeile darunter", () => {
    expect(abschnitt).toMatch(/dialog\.rollhinweis > \.kopfzeile:first-child \{ flex-wrap: wrap; \}/);
    expect(abschnitt).toMatch(/dialog\.rollhinweis > \.kopfzeile:first-child h2 \{ flex: 1 1 0; min-width: min-content; overflow-wrap: normal;/);
  });

  it("R21-A6, G2: Fußleiste mit „In Einsatz übernehmen“ in niedrigen Fenstern: nie im Wort, „Ansicht“ und „In Einsatz“ fallen zuerst weg", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\) \{\s*:root:root footer\.nav\.assistent-nav\.mit-uebernehmen \{ grid-template-columns: auto auto minmax\(max-content, 1fr\) auto; \}/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav\.mit-uebernehmen > \.uebernehmen \{ white-space: nowrap; min-width: max-content;/);
    expect(abschnitt).toMatch(/\(max-width: 45rem\) \{\s*:root:root footer\.nav\.assistent-nav\.mit-uebernehmen \.anzeige-leiste-text \{ display: none; \}/);
    expect(abschnitt).toMatch(/\(max-width: 26rem\) \{\s*:root:root footer\.nav\.assistent-nav\.mit-uebernehmen \.nav-einsatz \{ display: none; \}/);
  });

  it("R21-W5, E6, H5, G3, M4, L7: Assistent quer in „Feld“: Schrittüberschrift nur für Vorlesesoftware, Abstände klein", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 30rem\) \{\s*:root:root\.feld-modus main \{ padding-top: 4px; \}/);
    expect(abschnitt).toMatch(/:root:root\.feld-modus \.schritt-inhalt > \.karte > h2:first-child \{\s*position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset\(50%\);/);
  });

  it("R21-M2, N5, E2, A2: Platzhalter mit Ladehinweis und einer Bildschirmhöhe; Wiedereinstieg zeigt nicht die Startseite", () => {
    expect(abschnitt).toMatch(/\.einsatz-laedt\.detail \{ min-height: 100vh; \}/);
    expect(abschnitt).toMatch(/\.einsatz-laedt-text \{/);
    expect(abschnitt).toMatch(/html\.einsatz-wiedereinstieg #app > \.kopfnav,\s*html\.einsatz-wiedereinstieg #app > main\.start > p,\s*html\.einsatz-wiedereinstieg #app > main\.start > \.start-seo \{ display: none; \}/);
    expect(abschnitt).toMatch(/html\.einsatz-wiedereinstieg #app > header\.start-kopf h1::after \{ content: "Einsatz wird geladen …";/);
  });

  it("R21-G4: die Zeile an Stelle des Kastens ist mindestens so hoch wie der Bereich unter dem Finger", () => {
    expect(abschnitt).toMatch(/p\.kenntnis-spur \{[^}]*min-height: 104px/);
  });
});

describe("R21-A4, W4, E5, H4, K3, G5, M5, L4, N4, O3, S3, D4: Aufnahmewege am Telefon", () => {
  beforeEach(() => {
    telefon();
  });

  it("mit Meldungen steht „Bogen scannen…“ offen da, die drei anderen Wege liegen im Aufklapper „Weitere Wege“", () => {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} schnell={() => {}} />);
    const block = document.querySelector<HTMLElement>(".einsatz-seite > .aktionen")!;
    const scan = within(block).getByRole("button", { name: /Bogen scannen…/ });
    expect(scan.closest("details")).toBeNull();
    const weitere = block.querySelector<HTMLDetailsElement>("details.aufnahme-weitere")!;
    expect(weitere).not.toBeNull();
    expect(weitere.open).toBe(false);
    expect(weitere.querySelector("summary")!.textContent).toBe("Weitere Wege: von Hand, schnell, Datei");
    for (const name of WEGE) expect(within(weitere).getByRole("button", { name: new RegExp(name.replace(/[()]/g, "\\$&")) })).toBeTruthy();
    // Das Gerüst für das Zweierraster der aufgeklappten Wege trägt dieselbe Klasse wie der äußere Block.
    expect(weitere.querySelector(":scope > .aktionen.aufnahme-weitere-knoepfe")).not.toBeNull();
  });

  it("die Wege im Aufklapper lösen aus, was ihr Name sagt", async () => {
    const nutzer = userEvent.setup();
    const manuell = vi.fn();
    const schnell = vi.fn();
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} manuell={manuell} schnell={schnell} />);
    const weitere = document.querySelector<HTMLElement>("details.aufnahme-weitere")!;
    await nutzer.click(within(weitere).getByRole("button", { name: /Einheit manuell erfassen…/ }));
    await nutzer.click(within(weitere).getByRole("button", { name: /Einheit schnell erfassen \(nur Stärke\)…/ }));
    expect(manuell).toHaveBeenCalledTimes(1);
    expect(schnell).toHaveBeenCalledTimes(1);
  });

  it("eine leere Sammlung zeigt alle vier Wege offen (nichts zu verdrängen, ein Neuling soll sie sehen)", () => {
    const s = einsatzAnlegen("Leer", EinsatzArt.EINSATZ);
    render(<Wirt id={s.id} schnell={() => {}} />);
    const block = document.querySelector<HTMLElement>(".einsatz-seite > .aktionen")!;
    expect(block.querySelector("details")).toBeNull();
    expect(within(block).getByRole("button", { name: /Bogen scannen…/ })).toBeTruthy();
    for (const name of WEGE) expect(within(block).getByRole("button", { name: new RegExp(name.replace(/[()]/g, "\\$&")) }).parentElement).not.toBeNull();
    // Direkte Kinder des Blocks (das Raster der Stilregeln greift auf `> button` und `> .einlese`).
    expect([...block.children].filter((k) => k.tagName === "BUTTON")).toHaveLength(3);
  });

  it("am großen Fenster bleibt es bei vier Knöpfen, auch mit Meldungen", () => {
    delete (window as { matchMedia?: unknown }).matchMedia;
    const s = einsatzAnlegen("Gross", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} schnell={() => {}} />);
    expect(document.querySelector("details.aufnahme-weitere")).toBeNull();
    expect(screen.getByRole("button", { name: /Einheit manuell erfassen…/ })).toBeTruthy();
  });

  it("die Zahlen über der Liste stehen in eigenem Span, der Text der Überschrift bleibt derselbe", () => {
    const s = einsatzAnlegen("Zahlen", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    render(<Wirt id={s.id} />);
    const h2 = document.getElementById("einheiten-liste")!;
    expect(h2.querySelector(".einheiten-zahlen")!.textContent).toMatch(/^\(1 gemeldet · 1 anwesend\)$/);
    expect(h2.textContent!.replace(/\s+/g, " ").trim()).toBe("Einheiten (1 gemeldet · 1 anwesend)");
  });
});

describe("R21-G4: „Zur Kenntnis genommen“ lässt unter dem Finger nichts Wirksames", () => {
  it("an die Stelle des Kastens tritt eine Zeile ohne Knopf; „Rückgängig“ bringt den Kasten zurück", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Kenntnis", EinsatzArt.EINSATZ);
    kenntnisVermerken(einsaetzeLaden().find((x) => x.id === s.id)!);
    meldungHinzufuegen(s.id, bogenMitName("Alpha"));
    meldungHinzufuegen(s.id, bogenMitName("Beta"));
    render(<Wirt id={s.id} />);
    expect(document.querySelector(".kenntnis-spur")).toBeNull();
    const kasten = document.querySelector<HTMLElement>(".stapel-eingang")!;
    const vorgaenger = kasten.previousElementSibling;
    await nutzer.click(screen.getByRole("button", { name: "Zur Kenntnis genommen" }));
    expect(document.querySelector(".stapel-eingang")).toBeNull();
    const spur = document.querySelector<HTMLElement>(".kenntnis-spur")!;
    expect(spur).not.toBeNull();
    // Nur zum Sehen: für Vorlesesoftware ist die Quittung unten die Auskunft, und Knöpfe gibt es dort nicht.
    expect(spur.getAttribute("aria-hidden")).toBe("true");
    expect(spur.querySelectorAll("button, a, input, select, summary").length).toBe(0);
    expect(spur.textContent).toBe("✓ 2 Einheiten als gesehen vermerkt.");
    // Sie steht an der Stelle des Kastens: derselbe Vorgänger.
    expect(spur.previousElementSibling).toBe(vorgaenger);

    await nutzer.click(screen.getByRole("button", { name: "Zur Kenntnis genommen rückgängig machen" }));
    await waitFor(() => expect(document.querySelector(".stapel-eingang")).not.toBeNull());
    expect(document.querySelector(".kenntnis-spur")).toBeNull();
  });
});

describe("R21-G7, M6, L6, D3, S4: Tabelle am Telefon", () => {
  it("bedarfTeilFest schützt die Leerstelle zwischen Zahl und Einheit und lässt anderes unberührt", () => {
    expect(bedarfTeilFest("Diesel 80 l")).toBe("Diesel 80 l");
    expect(bedarfTeilFest("Gemisch 10 l ·")).toBe("Gemisch 10 l ·");
    expect(bedarfTeilFest("Ruhezeit")).toBe("Ruhezeit");
    expect(bedarfTeilFest("Unterbr.")).toBe("Unterbr.");
    // Nur zwischen Ziffer und Buchstabe: eine Klammer bleibt, wo sie ist.
    expect(bedarfTeilFest("Verpfl. 12 (St. 14)")).toBe("Verpfl. 12 (St. 14)");
  });

  function tabelleRendern(): HTMLElement {
    telefon();
    localStorage.setItem("eeb.einheiten-ansicht", "tabelle");
    const s = einsatzAnlegen("Tabelle", EinsatzArt.EINSATZ);
    const b = bogenMitName("Alpha");
    b.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 180, benzinLiter: 80, gemischLiter: 10, unterbringung: true, ruhezeitErforderlich: true };
    meldungHinzufuegen(s.id, b);
    render(<Wirt id={s.id} />);
    return document.querySelector<HTMLElement>("table.tabelle-kern")!;
  }

  it("die Bedarfsposten tragen ihren Punkt, die Einheit „l“ bleibt an der Zahl; der Text bleibt für Suche und Vorlesen derselbe", () => {
    const tabelle = tabelleRendern();
    const zelle = tabelle.querySelector<HTMLElement>("td.bedarf-zelle");
    // Kernspalten: Bedarf steht dort nur ohne Auftrag; sonst über „Alle Spalten".
    if (!zelle) {
      expect(tabelle.querySelector("th[data-spalte='bedarf']")).toBeNull();
      return;
    }
    const posten = [...zelle.querySelectorAll(".bedarf-teil")].map((p) => p.textContent!);
    expect(posten.slice(0, -1).every((p) => p.endsWith(" ·"))).toBe(true);
    expect(posten[posten.length - 1]!.endsWith("·")).toBe(false);
    expect(posten.join(" ")).toContain("Diesel 180 l");
    expect(zelle.textContent!.replace(/\s+/g, " ")).toBe("Ruhezeit · Unterbr. · Diesel 180 l · Benzin 80 l · Gemisch 10 l");
  });

  it("der Kopf „Eingetroffen“ hat eine glatte und eine Fassung mit weicher Trennstelle; Vorlesesoftware liest den Titel", () => {
    const tabelle = tabelleRendern();
    const kopf = tabelle.querySelector<HTMLElement>("th[data-spalte='eingetroffen'] .spalten-kopf")!;
    expect(KERN_KOPF.eingetroffen).toBe("Eingetroffen");
    expect(KERN_KOPF_TRENNUNG.eingetroffen).toBe("Einge­troffen");
    expect(kopf.querySelector(".kopf-glatt")!.textContent).toBe("Eingetroffen");
    expect(kopf.querySelector(".kopf-weich")!.textContent).toBe("Einge­troffen");
    expect(kopf.querySelector(".kopf-glatt")!.getAttribute("aria-hidden")).toBe("true");
    expect(kopf.querySelector(".kopf-weich")!.getAttribute("aria-hidden")).toBe("true");
    expect(kopf.querySelector(".nur-sr")!.textContent).toBe("Eingetroffen");
    // „Stärke“ hat keine Trennfassung.
    expect(tabelle.querySelector("th[data-spalte='gesamt'] .kopf-weich")).toBeNull();
  });

  it("lange zusammengesetzte Namen haben eine Trennstelle vor „wirtschaft“ und anderen Bausteinen (kein „Materialwirtsch / aft“)", () => {
    expect(weicheTrennstellen("Materialwirtschaft")).toBe("Material­wirtschaft");
    expect(weicheTrennstellen("Fahrzeuginstandhaltung")).toBe("Fahrzeug­instandhaltung");
    expect(weicheTrennstellen("Bergung")).toBe("Bergung");
  });
});

describe("R21-M2, N5, E2, A2: Platzhalter der Einsatzansicht", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("zeigt Kopf mit Rückweg, Name und Art sowie einen sichtbaren Ladehinweis; der Rückweg geht schon jetzt", async () => {
    const s = einsatzAnlegen("Sturm Nord", EinsatzArt.UEBUNG, "Celle");
    const zurueck = vi.fn();
    const { EinsatzDetail: Lazy } = await import("./einsaetze-lazy");
    render(
      <Lazy
        einsatz={s}
        onZurueck={zurueck}
        onGeaendert={() => {}}
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
      />,
    );
    // Gleich beim ersten Bild, vor dem Laden der Ansicht:
    const kopf = document.querySelector("header.einsatz-kopf")!;
    expect(kopf).not.toBeNull();
    expect(within(kopf as HTMLElement).getByRole("heading", { level: 1 }).textContent).toBe("Sturm Nord");
    expect(kopf.textContent).toContain("Übung · Celle");
    expect(within(kopf as HTMLElement).getByRole("button", { name: /Ansicht/ })).toBeTruthy();
    const flaeche = screen.getByRole("status", { name: "Einsatzansicht wird geladen" });
    expect(flaeche.className).toBe("einsatz-laedt detail");
    expect(flaeche.textContent).toBe("Einsatzansicht wird geladen …");
    // Die Fläche ist der Inhalt der Hauptmarke; Sprungmarke und Kopf sind wie in der Ansicht selbst.
    expect(flaeche.closest("main#inhalt.einsatz-detail")).not.toBeNull();

    // Sofort, ohne auf das Laden zu warten (ein Wechsel auf die Ansicht würde den Platzhalter austauschen).
    fireEvent.click(within(kopf as HTMLElement).getByRole("button", { name: "‹ Startseite" }));
    expect(zurueck).toHaveBeenCalledTimes(1);

    // Nach dem Laden ersetzt die Ansicht Kopf und Fläche; es bleibt genau ein Kopf und ein Haupttext.
    await waitFor(() => expect(screen.queryByRole("status", { name: "Einsatzansicht wird geladen" })).toBeNull(), { timeout: 20000 });
    expect(document.querySelectorAll("header.seiten-kopf").length).toBe(1);
    expect(document.querySelectorAll("main#inhalt").length).toBe(1);
  }, 40_000);
});

describe("R21-A2, E2: Wiedereinstieg zeigt statt der Startseite einen ruhigen Kopf", () => {
  /** Das erste Skript im Kopf der index.html, das die Klasse setzt (es muss ohne App laufen: vor dem ersten Malen). */
  function kopfSkript(): string {
    const treffer = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
    const s = treffer.find((t) => t.includes("einsatz-wiedereinstieg"));
    expect(s).toBeDefined();
    return s!;
  }
  function ausfuehren() {
    document.head.innerHTML = '<meta name="theme-color" content="#000">';
    new Function(kopfSkript())();
  }

  it("setzt die Klasse, wenn vor weniger als zwölf Stunden ein Einsatz offen war und kein Bogen im Link steht", () => {
    localStorage.setItem("eeb.letzterEinsatz.v1", JSON.stringify({ id: "abc", um: Date.now() - 60_000 }));
    ausfuehren();
    expect(document.documentElement.classList.contains("einsatz-wiedereinstieg")).toBe(true);
  });

  it("setzt sie nicht: ohne Vermerk, bei altem Vermerk, bei Müll im Speicher, mit Bogen im Link", () => {
    ausfuehren();
    expect(document.documentElement.classList.contains("einsatz-wiedereinstieg")).toBe(false);
    localStorage.setItem("eeb.letzterEinsatz.v1", JSON.stringify({ id: "abc", um: Date.now() - 13 * 60 * 60 * 1000 }));
    ausfuehren();
    expect(document.documentElement.classList.contains("einsatz-wiedereinstieg")).toBe(false);
    localStorage.setItem("eeb.letzterEinsatz.v1", "kein json");
    ausfuehren();
    expect(document.documentElement.classList.contains("einsatz-wiedereinstieg")).toBe(false);
    localStorage.setItem("eeb.letzterEinsatz.v1", JSON.stringify({ id: "abc", um: Date.now() }));
    location.hash = "#EEB1ABC";
    ausfuehren();
    expect(document.documentElement.classList.contains("einsatz-wiedereinstieg")).toBe(false);
    location.hash = "";
  });

  it("die Frist im Skript ist die der App (zwölf Stunden, derselbe Speicherschlüssel)", () => {
    const app = readFileSync(`${process.cwd()}/src/app/app.tsx`, "utf8");
    expect(app).toContain('const LETZTER_EINSATZ_SCHLUESSEL = "eeb.letzterEinsatz.v1";');
    expect(app).toContain("const LETZTER_EINSATZ_FRIST_MS = 12 * 60 * 60 * 1000;");
    expect(kopfSkript()).toContain('"eeb.letzterEinsatz.v1"');
    expect(kopfSkript()).toContain("12 * 60 * 60 * 1000");
  });

  it("die App nimmt die Klasse beim ersten Bild wieder weg (main.tsx)", () => {
    const main = readFileSync(`${process.cwd()}/src/app/main.tsx`, "utf8");
    expect(main).toMatch(/useEffect\(\(\) => \{\s*document\.documentElement\.classList\.remove\("einsatz-wiedereinstieg"\);\s*\}, \[\]\);/);
  });
});
