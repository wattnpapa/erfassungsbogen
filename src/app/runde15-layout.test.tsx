/**
 * Runde 15, Block Layout: aufgeklappte Karte (M1), Bedarfsposten (M4), Doppeltipp nach „Zur Kenntnis genommen" (G1),
 * Quittung des übersprungenen Empfangs (W1), Kasten nach Stapelimport (S2), Hinweis über rollenden Tabellen und
 * „Ausstattung (StAN)" (N2) sowie die Stilregeln für Fußleiste (M2), Ansichtswahl (M3), Reiter (G2) und
 * Quittungsleiste (H1). Die Maße wurden zusätzlich im Produktionsbuild mit Playwright gemessen (Chromium, Touch).
 */
import { readFileSync } from "node:fs";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { neuerBogen, neuesFahrzeug } from "./hilfen";
import { kenntnisVermerken } from "./export-stand";
import { TabellenScroll } from "./tabellen-scroll";
import { uebersprungenText } from "./uebersprungen-text";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 15 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 15 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

function bogenMitName(name: string, aendern?: (b: Erfassungsbogen) => void): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  aendern?.(b);
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

/** Einsatz, in dem schon „zur Kenntnis genommen" ist; die danach aufgenommenen Einheiten sind neu. */
function einsatzMitNeuen(namen: string[], aendern?: (b: Erfassungsbogen, name: string) => void) {
  const s = einsatzAnlegen("Hochwasser Layout", EinsatzArt.EINSATZ);
  kenntnisVermerken(einsaetzeLaden().find((x) => x.id === s.id)!);
  for (const n of namen) meldungHinzufuegen(s.id, bogenMitName(n, (b) => aendern?.(b, n)));
  return s.id;
}

function alsTelefon() {
  const vorher = window.matchMedia;
  window.matchMedia = ((abfrage: string) => ({
    matches: abfrage === "(max-width: 600px)",
    media: abfrage,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  return () => {
    if (vorher) window.matchMedia = vorher;
    else delete (window as { matchMedia?: unknown }).matchMedia;
  };
}

describe("R15-M1 aufgeklappte Karte am Telefon", () => {
  let zurueck: () => void;
  beforeEach(() => {
    zurueck = alsTelefon();
  });
  afterEach(() => zurueck());

  it("trägt die Klasse für Rahmen und Innenrand, solange sie offen ist, und gibt sie beim Zuklappen ab", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["Alpha", "Beta"]);
    render(<Wirt id={id} />);
    const karte = () => [...document.querySelectorAll<HTMLElement>("li.einheit-zeile")].find((k) => k.textContent!.includes("Alpha"))!;
    expect(karte().className).toContain("kompakt");
    expect(karte().className).not.toContain("karte-offen");
    await nutzer.click(within(karte()).getByRole("button", { name: /Aufklappen/ }));
    expect(karte().className).toContain("karte-offen");
    expect(karte().className).not.toContain("kompakt");
    await nutzer.click(within(karte()).getByRole("button", { name: "Zuklappen" }));
    expect(karte().className).toContain("kompakt");
    expect(karte().className).not.toContain("karte-offen");
  });

  it("Stilregel: Rahmen in der Kennfarbe, linker Rand schon offen 3 px (kein Springen beim Abrücken)", () => {
    expect(abschnitt).toMatch(/\.einheit-zeile\.karte-offen:not\(\.kompakt\)\s*\{[^}]*border:\s*var\(--strich\) solid var\(--akzent\);\s*border-left:\s*3px solid var\(--akzent\)/);
    expect(abschnitt).toMatch(/\.einheit-zeile\.gestrichen\.karte-offen:not\(\.kompakt\)\s*\{\s*border-left:\s*3px dashed/);
  });
});

describe("R15-M4 Bedarfszeile: jeder Posten unteilbar", () => {
  it("setzt jeden Posten in einen eigenen Block samt folgendem Punkt; der Text bleibt wie zuvor", () => {
    const s = einsatzAnlegen("Hochwasser Bedarf", EinsatzArt.EINSATZ);
    meldungHinzufuegen(
      s.id,
      bogenMitName("Wardenburg", (b) => {
        b.sofortbedarf = { verpflegungPersonen: 5, dieselLiter: 580, benzinLiter: 160, gemischLiter: 10, unterbringung: false, ruhezeitErforderlich: true };
      }),
    );
    const restore = alsTelefon();
    try {
      render(<Wirt id={s.id} />);
    } finally {
      restore();
    }
    const werte = document.querySelector(".bedarf-block summary .bedarf-werte")!;
    const posten = [...werte.querySelectorAll(".bedarf-posten")].map((e) => e.textContent);
    expect(posten.length).toBeGreaterThanOrEqual(4);
    expect(posten).toContain("Diesel 580 l ·");
    expect(posten).toContain("Benzin 160 l ·");
    expect(posten[posten.length - 1]).toMatch(/^Ruhezeit 1 Einheit$/);
    // Kein Posten beginnt oder endet mit einem losen Trenner; zusammengelesen steht dieselbe Zeile da wie vorher.
    expect(werte.textContent).toBe(posten.join(" "));
    expect(werte.textContent).toContain("Diesel 580 l · Benzin 160 l · Gemisch 10 l");
    expect(abschnitt).toMatch(/\.bedarf-posten\s*\{\s*white-space:\s*nowrap/);
    expect(abschnitt).toMatch(/details\.bedarf-block > summary\s*\{\s*align-items:\s*flex-start/);
  });
});

describe("R15-G1 Doppeltipp nach „Zur Kenntnis genommen“", () => {
  it("sperrt die Stelle des Tipps: ein zweiter Tipp dort trifft nichts, einer daneben schon", () => {
    const id = einsatzMitNeuen(["Alpha", "Beta", "Gamma"]);
    render(<Wirt id={id} />);
    const tabelle = screen.getByRole("button", { name: "Tabelle" });
    const karten = screen.getByRole("button", { name: "Karten" });
    // Der erste Tipp: Zeiger-Klick mit Ort (detail > 0, nicht 0/0), wie vom Finger.
    fireEvent.click(screen.getByRole("button", { name: "Zur Kenntnis genommen" }), { detail: 1, clientX: 120, clientY: 300 });
    expect(document.body.textContent).toContain("Zur Kenntnis genommen: 3 Einheiten");
    // Die Liste ist nachgerückt; an derselben Stelle liegt jetzt etwas anderes (hier: „Tabelle"). Der zweite Tipp verfällt.
    fireEvent.click(tabelle, { detail: 1, clientX: 120, clientY: 300 });
    expect(tabelle.getAttribute("aria-pressed")).toBe("false");
    expect(karten.getAttribute("aria-pressed")).toBe("true");
    expect(document.getElementById("tipp-moment")).not.toBeNull();
    // Ein Tipp an anderer Stelle wirkt sofort.
    fireEvent.click(tabelle, { detail: 1, clientX: 320, clientY: 600 });
    expect(tabelle.getAttribute("aria-pressed")).toBe("true");
  });

  it("die Sperre hält länger als der 1-Sekunden-Takt eines zögernden Doppeltipps (QUITTUNG_SPERRE_MS; R18: 1,2 s)", async () => {
    const { QUITTUNG_SPERRE_MS } = await import("./tipp-schutz");
    expect(QUITTUNG_SPERRE_MS).toBeGreaterThanOrEqual(1100);
  });
});

describe("R15-W1 Empfang übersprungen: sichtbare Quittung", () => {
  it("Text: nichts geändert; bei anderer geltender Fassung beide Stärken", () => {
    expect(uebersprungenText("THW Alpha", 11, null)).toBe("Schon da, nichts geändert: „THW Alpha\" (übersprungen).");
    const t = uebersprungenText("THW Alpha", 11, 9);
    expect(t).toContain("Alte Fassung (Stärke 11)");
    expect(t).toContain("übersprungen");
    expect(t).toContain("es gilt weiter Stärke 9");
  });

  it("steht in der Quittungsleiste statt als „Zuletzt eingelesen“; ✕ schließt sie", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["Alpha"]);
    const e = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!;
    render(<Wirt id={id} extra={{ eingang: { schluessel: e.einheitSchluessel, nonce: 1, uebersprungen: uebersprungenText("Alpha", 3, null) } }} />);
    const leiste = document.querySelector(".quittung-daumen")!;
    expect(leiste.textContent).toContain("Schon da, nichts geändert");
    expect(document.querySelector(".eingang-quittung")).toBeNull();
    await nutzer.click(within(leiste as HTMLElement).getByRole("button"));
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });

  it("geht nach zwölf Sekunden von selbst", () => {
    vi.useFakeTimers();
    const id = einsatzMitNeuen(["Alpha"]);
    const e = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!;
    render(<Wirt id={id} extra={{ eingang: { schluessel: e.einheitSchluessel, nonce: 2, uebersprungen: "Schon da, nichts geändert." } }} />);
    expect(document.querySelector(".quittung-daumen")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(12_100);
    });
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });

  it("eine neu aufgenommene Meldung zeigt weiter „Zuletzt eingelesen“ ohne Quittungsleiste", () => {
    const id = einsatzMitNeuen(["Alpha"]);
    const e = einsaetzeLaden().find((s) => s.id === id)!.eintraege[0]!;
    render(<Wirt id={id} extra={{ eingang: { schluessel: e.einheitSchluessel, nonce: 3 } }} />);
    expect(document.querySelector(".eingang-quittung")!.textContent).toContain("Zuletzt");
    expect(document.querySelector(".quittung-daumen")).toBeNull();
  });
});

describe("R15-S2 Kasten „Neu seit der letzten Kenntnisnahme“ nach Stapelimport", () => {
  it("bis fünf Einheiten steht jede als Satz da", () => {
    const id = einsatzMitNeuen(["A1", "A2", "A3"]);
    render(<Wirt id={id} />);
    const kasten = document.querySelector<HTMLElement>(".stapel-eingang")!;
    expect(kasten.querySelectorAll("ul > li").length).toBe(3);
    expect(within(kasten).queryByRole("button", { name: /einzeln anzeigen/ })).toBeNull();
    expect(within(kasten).queryByRole("button", { name: /Zur Liste springen/ })).toBeNull();
  });

  it("ab sechs bleiben Zahl und Hinweis; „Alle … einzeln anzeigen“ klappt die Sätze auf und wieder zu", async () => {
    const nutzer = userEvent.setup();
    const id = einsatzMitNeuen(["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]);
    render(<Wirt id={id} />);
    const kasten = () => document.querySelector<HTMLElement>(".stapel-eingang")!;
    expect(kasten().textContent).toContain("Neu seit dem letzten Mal (8)");
    expect(kasten().querySelectorAll("ul > li").length).toBe(1);
    expect(kasten().textContent).toContain("8 Einheiten neu gemeldet — Zeilen je Einheit ausgeblendet, siehe Liste");
    expect(within(kasten()).getByRole("button", { name: "Zur Liste springen ↓" })).toBeTruthy();
    // Zug und Kenntnisnahme bleiben im Kasten erreichbar.
    expect(within(kasten()).getByRole("button", { name: "Zur Kenntnis genommen" })).toBeTruthy();
    await nutzer.click(within(kasten()).getByRole("button", { name: "Alle 8 einzeln anzeigen" }));
    expect(kasten().querySelectorAll("ul > li").length).toBe(8);
    await nutzer.click(within(kasten()).getByRole("button", { name: "Weniger zeigen" }));
    expect(kasten().querySelectorAll("ul > li").length).toBe(1);
  });
});

describe("R15-N2 Tabellen in den Details", () => {
  const sw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
  const cw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  afterEach(() => {
    if (sw) Object.defineProperty(HTMLElement.prototype, "scrollWidth", sw);
    else delete (HTMLElement.prototype as { scrollWidth?: unknown }).scrollWidth;
    if (cw) Object.defineProperty(HTMLElement.prototype, "clientWidth", cw);
    else delete (HTMLElement.prototype as { clientWidth?: unknown }).clientWidth;
  });
  function breite(scroll: number, sichtbar: number) {
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get: () => scroll });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => sichtbar });
  }

  it("zeigt den Hinweis zum Wischen nur, wenn die Tabelle über den Rand reicht", () => {
    breite(418, 313);
    const mit = render(
      <TabellenScroll titel="Personal">
        <table />
      </TabellenScroll>,
    );
    expect(mit.container.querySelector(".tabellen-hinweis")!.textContent).toBe("Zum Weiterlesen seitlich wischen →");
    mit.unmount();
    breite(300, 313);
    const ohne = render(
      <TabellenScroll titel="Personal">
        <table />
      </TabellenScroll>,
    );
    expect(ohne.container.querySelector(".tabellen-hinweis")).toBeNull();
  });

  it("die Fahrzeugtabelle in „Details“ nennt die Spalte „Ausstattung (StAN)“ statt „StAN“", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Details", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitName("Alpha", (b) => { b.fahrzeuge = [{ ...neuesFahrzeug(), kennzeichen: "THW-80125", stanKonform: true }]; }));
    render(<Wirt id={s.id} />);
    await nutzer.click(screen.getByRole("button", { name: "Details" }));
    const kopf = [...document.querySelectorAll(".bogen-details th")].map((th) => th.textContent);
    expect(kopf).toContain("Ausstattung (StAN)");
    expect(kopf).not.toContain("StAN");
  });
});

describe("Stilregeln Runde 15 (Layout)", () => {
  it("Quittungsleiste: Text in voller Breite, bis zu vier Zeilen (R15-H1)", () => {
    expect(abschnitt).toMatch(/\.quittung-daumen > \.quittung-text\s*\{[^}]*flex-basis:\s*12em;[^}]*-webkit-line-clamp:\s*4/);
  });
  it("Reiter bleiben gleich breit, „offen“ steht unter der Nummer (R15-G2)", () => {
    expect(abschnitt).toMatch(/\.schritte button\s*\{\s*flex:\s*1 1 0;\s*min-width:\s*0/);
    expect(abschnitt).toMatch(/\.schritte button\.status-begonnen\s*\{[^}]*flex-direction:\s*column/);
  });
  it("Ansichtswahl als Überlagerung: Kopf behält seine Höhe, Kacheln in Kopffarbe (R15-M3)", () => {
    expect(abschnitt).toMatch(/\.anzeige-schalter\.klappbar\.offen\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*30/);
    expect(abschnitt).toMatch(/\.anzeige-schalter\.klappbar\.offen > button:not\(\.anzeige-klappe\)\s*\{[^}]*background:\s*var\(--wahl-fond\)/);
  });
  it("Fußleiste mit „In Einsatz übernehmen“ am niedrigen Telefon einzeilig (R15-M2)", () => {
    expect(abschnitt).toMatch(/min-width:\s*20rem\) and \(max-width:\s*35\.99rem\) and \(max-height:\s*43\.75rem\)/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav\.mit-uebernehmen\s*\{\s*grid-template-areas:\s*"zurueck modus mitte weiter"/);
    expect(abschnitt).toMatch(/\.nav-weiter-wort\s*\{\s*display:\s*none/);
  });
});
