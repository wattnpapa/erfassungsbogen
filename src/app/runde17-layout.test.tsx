/**
 * Runde 17, Block Layout (Handschuh, Mobile-UI, Nacht, Feldtauglichkeit): Fußleiste und Kopf des Assistenten (G2, G3, G4, M1,
 * M2, M3, M4, H6, L2, N7), Tabelle am Telefon (H8, K7, G7), Quittungs- und Ansichtsleiste (H7, K6, G5, N3), Abstände (G1, G6,
 * G9, G10), Verweise der Startseite (G8, H9), Scanner quer (G12), Einlese-Meldung (G13), Doppeltipp (G11, H3, G14),
 * Offline-Zeile (H1), gesperrte Knöpfe (L1), Aufnahmeknöpfe (N6).
 *
 * Die Maße stehen im Bericht und sind im Produktionsbuild mit Playwright gemessen (Chromium, Touch); jsdom rechnet kein
 * Layout. Hier prüfen die Tests Verhalten (Bedienung, Zustände, Texte) und die Stilregeln in index.html. Die Tests der ganzen
 * App (Fußleiste, Kopf, Weiter-Takt, Einlese-Meldung) stehen in runde17-layout-app.test.tsx.
 */
import { readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { Dialogschicht, frageFelder } from "./dialoge";
import { Fusszeile } from "./fusszeile";
import { neuerBogen } from "./hilfen";
import { SchrittEinheit } from "./schritte/einheit";
import { ASSISTENT_SCHRITT_SPERRE_MS, ORTSSPERRE_MS, ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";
import { offlineText, offlineZeileOffen, type OfflineZustand } from "./offline-bereit";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 17 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 17 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

describe("Fußleiste des Assistenten (R17-G4, M3, G2, G3, N7, H6)", () => {
  it("am Telefon eine Zeile: Zurück, Abschluss, Weiter; „◐“ entfällt (die Wahl steht im Kopf), „Weiter“ bleibt ein Wort", () => {
    expect(abschnitt).toMatch(
      /@media \(min-width: 17rem\) and \(max-width: 35\.99rem\) and \(not \(\(orientation: landscape\) and \(max-height: 31\.25rem\)\)\)/,
    );
    expect(abschnitt).toMatch(/grid-template-areas:\s*"zurueck mitte weiter";\s*grid-template-columns:\s*auto minmax\(0, 1fr\) auto/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav > \.anzeige-leiste\s*\{\s*display:\s*none/);
  });

  it("niedriges Querformat behält „◐“ (der Kopf trägt die Wahl dort nicht): kein Ausblenden außerhalb der Hochformat-Abfrage", () => {
    // Die Regel zum Ausblenden steht in genau einem Medienblock, und der schließt das niedrige Querformat aus.
    const blockStart = abschnitt.indexOf("@media (min-width: 17rem)");
    const ausblenden = abschnitt.indexOf("> .anzeige-leiste { display: none; }");
    expect(blockStart).toBeGreaterThan(-1);
    expect(ausblenden).toBeGreaterThan(blockStart);
    expect(abschnitt.slice(0, blockStart)).not.toMatch(/\.anzeige-leiste\s*\{\s*display:\s*none/);
  });

  it("jeder Knopf der Leiste misst mindestens 44 px: Abschluss und „◐“ tragen ein Mindestmaß", () => {
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav > \.uebernehmen\s*\{\s*min-height:\s*min\(calc\(var\(--ziel-basis\) \+ var\(--ziel\)\), calc\(44px \+ var\(--ziel\)\)\)/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav \.anzeige-leiste-knopf\s*\{\s*min-width:\s*calc\(44px \+ var\(--ziel\)\)/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav > \.nav-zurueck\s*\{[^}]*min-width:\s*calc\(44px \+ var\(--ziel\)\)/);
  });

});

describe("Kopf des Assistenten am Telefon (R17-M1, L2, M2)", () => {
  it("der Rücksprung bricht den Einsatznamen um, statt ihn zu kürzen; die Marke mit demselben Namen entfällt", () => {
    expect(abschnitt).toMatch(/\.kopf-oberzeile \.zur-start\s*\{\s*display:\s*flex;\s*white-space:\s*normal;\s*overflow:\s*visible;\s*text-overflow:\s*clip;\s*overflow-wrap:\s*break-word/);
  });

  it("Erklärzeile und Speicherzeile teilen sich keine Zeile mit dem Rücksprung und bleiben einzeilig", () => {
    expect(abschnitt).toMatch(/\.kopf-oberzeile\s*\{\s*flex:\s*1 1 100%/);
    expect(abschnitt).toMatch(/\.autosave:not\(\.speicher-fehler\):not\(\.fest-warnung\)\s*\{\s*font-size:\s*min\(var\(--t-xs\), 13px\)/);
  });
});

describe("Platzhalter im Feld „Einheitstyp“ (R17-M4)", () => {
  it("passt am Telefon: kurzes Beispiel, und was nicht passt, endet mit „…“", () => {
    render(<SchrittEinheit bogen={neuerBogen()} aendern={() => {}} />);
    const feld = screen.getByRole("combobox", { name: "Einheitstyp" }) as HTMLInputElement;
    expect(feld.placeholder).toBe("z. B. Bergungsgruppe, FGr WP");
    expect(feld.placeholder.length).toBeLessThanOrEqual(30);
    expect(abschnitt).toMatch(/input::placeholder, textarea::placeholder\s*\{\s*text-overflow:\s*ellipsis/);
  });
});

describe("Ansichtsleiste zieht sich beim Lesen ein (R17-N3, H7, G5, K6)", () => {

  it("Stilregeln: weg = unsichtbar (außer im Fokus), Quittung verdrängt die Leiste, Quittung steht nebeneinander", () => {
    expect(abschnitt).toMatch(/html:has\(\.quittung-daumen\) \.anzeige-balken\s*\{\s*display:\s*none/);
    expect(abschnitt).toMatch(/html:has\(\.anzeige-balken\):has\(\.quittung-daumen\) \.quittung-daumen\s*\{\s*bottom:\s*max\(var\(--r-3\), env\(safe-area-inset-bottom\)\)/);
    expect(abschnitt).toMatch(/\.quittung-daumen:not\(\.quittung-kompakt\)\s*\{\s*flex-wrap:\s*nowrap/);
    expect(abschnitt).toMatch(/\.quittung-daumen > \.quittung-text\s*\{\s*flex:\s*1 1 0;\s*min-width:\s*0/);
  });
});

describe("Offline-Zeile in den ersten Sekunden (R17-H1)", () => {
  const basis: OfflineZustand = { stand: "bereit", frischBereit: true, online: true };

  it("ist „offen“, solange sie wechselt: Laden, bereit ohne Zählung, Beispielbögen n von m", () => {
    expect(offlineZeileOffen({ ...basis, stand: "laedt" })).toBe(true);
    expect(offlineZeileOffen({ ...basis, zweiStufen: true })).toBe(true);
    expect(offlineZeileOffen({ ...basis, zweiStufen: true, zusatz: { fertig: 12, gesamt: 549 } })).toBe(true);
  });

  it("ist in der Endfassung nicht mehr offen und hält dann nichts frei", () => {
    expect(offlineZeileOffen({ ...basis, zweiStufen: true, zusatz: { fertig: 549, gesamt: 549 } })).toBe(false);
    expect(offlineZeileOffen(basis)).toBe(false);
    expect(offlineZeileOffen({ ...basis, stand: "ohne" })).toBe(false);
  });

  it("die längste Fassung ist höchstens so lang wie die Reserve (6 Zeilen bei 360 px)", () => {
    const hakt = offlineText({ ...basis, zweiStufen: true, zusatz: { fertig: 12, gesamt: 549 }, zusatzHakt: true, zusatzVersuch: 2 });
    // Rund 38 Zeichen je Zeile bei 360 px und 14 px Schrift.
    expect(Math.ceil(hakt.length / 38)).toBeLessThanOrEqual(7);
    expect(abschnitt).toMatch(/\.offline-badge\.offline-offen\s*\{\s*min-height:\s*9rem/);
  });
});

describe("Doppeltipp (R17-G11, H3, G14)", () => {
  beforeEach(() => {
    localStorage.clear();
    tippSchutzZuruecksetzen();
  });

  it("G11 (R18-G3: 0,3 s): „Weiter →“ im Assistenten sperrt 0,3 s; ein Tipp nach 0,4 s kommt an, der Doppeltipp (≤ 0,2 s) nicht", () => {
    expect(ASSISTENT_SCHRITT_SPERRE_MS).toBe(300);
    expect(ASSISTENT_SCHRITT_SPERRE_MS).toBeLessThan(ORTSSPERRE_MS);
    const knopf = document.createElement("button");
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    const t0 = 1_800_000_000_000;
    const uhr = vi.spyOn(Date, "now").mockReturnValue(t0);
    const tipp = () => knopf.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 290, clientY: 606, detail: 1 }));
    tipp();
    ortSperren(ASSISTENT_SCHRITT_SPERRE_MS);
    uhr.mockReturnValue(t0 + 200);
    tipp(); // Doppeltipp: gesperrt
    expect(getroffen).toHaveBeenCalledTimes(1);
    uhr.mockReturnValue(t0 + 400);
    tipp(); // bewusstes Weitertippen: kommt an
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });
});

describe("Gesperrte Knöpfe bleiben lesbar und nennen den Grund (R17-L1)", () => {
  it("„Alle Daten löschen“: bis zum Haken steht, was „Endgültig löschen“ braucht", async () => {
    const nutzer = userEvent.setup();
    render(
      <>
        <Fusszeile onBogenOeffnen={async () => true} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Alle Daten löschen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Alle lokalen Daten löschen']")!;
    const knopf = within(dialog).getByRole("button", { name: "Endgültig löschen" }) as HTMLButtonElement;
    expect(knopf.disabled).toBe(true);
    expect(within(dialog).getByText(/„Endgültig löschen“ geht erst, wenn der Haken gesetzt ist\./)).toBeDefined();
    await nutzer.click(within(dialog).getByLabelText(/Ja, alle lokalen Daten/));
    expect(knopf.disabled).toBe(false);
    expect(within(dialog).queryByText(/geht erst, wenn der Haken gesetzt ist/)).toBeNull();
  });

  it("„Einsatz anlegen“: der gesperrte Knopf nennt das fehlende Feld", async () => {
    render(<Dialogschicht />);
    void frageFelder({ titel: "Neue Einsatz-Sammlung anlegen", ok: "Einsatz anlegen", felder: [{ name: "name", label: "Name" }] });
    const dialog = await screen.findByRole("dialog", { name: "Neue Einsatz-Sammlung anlegen" });
    expect((within(dialog).getByRole("button", { name: "Einsatz anlegen" }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(dialog).getByText(/Einsatz anlegen geht erst, wenn das Feld „Name“ ausgefüllt ist/)).toBeDefined();
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Hochwasser" } });
    await act(async () => {});
    expect((within(dialog).getByRole("button", { name: "Einsatz anlegen" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("Stilregel: Text in der Nebentextfarbe und gestrichelter Rand statt Deckkraft 0,4; Bestätigung und Fortschritt bleiben ausgenommen", () => {
    expect(abschnitt).toMatch(
      /button:disabled:not\(\.arbeitet\):not\(\.wechsel-quittiert\)\s*\{\s*opacity:\s*1;\s*color:\s*var\(--text-2\);\s*background:\s*var\(--flaeche-2\);\s*border:\s*var\(--strich-stark\) dashed var\(--linie-stark\)/,
    );
  });
});

describe("Abstände und Tippflächen (R17-G1, G6, G9, G10, G8, H9, N6, G12)", () => {

  it("G6: Schrittleiste, Karten | Tabelle, Vorschläge und Fußzeilenlisten berühren sich nicht", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf \.schritte\s*\{\s*gap:\s*4px/);
    expect(abschnitt).toMatch(/ul\.vorschlaege li \+ li\s*\{\s*margin-top:\s*4px/);
    expect(abschnitt).toMatch(/\.fuss-gruppe\s*\{\s*gap:\s*4px/);
    expect(abschnitt).toMatch(/footer\.seite \.fuss-werkzeuge\s*\{\s*row-gap:\s*4px/);
  });

  it("G9: „−“ und „+“ der Stärkefelder liegen 10 px auseinander", () => {
    expect(abschnitt).toMatch(/\.stepper\s*\{\s*gap:\s*10px/);
  });

  it("G8, H9: Verweise im Fließtext der Startseite sind 44-px-Ziele mit Abstand zur Nachbarzeile", () => {
    expect(abschnitt).toMatch(
      /\.start-seo a\s*\{\s*display:\s*inline-flex;\s*align-items:\s*center;\s*min-height:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\);\s*margin-block:\s*4px/,
    );
  });

  it("G12: Scanner ohne Kamera quer: Leiste einzeilig, Anleitung zweispaltig, Hinweiszeile frei", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 30rem\)\s*\{\s*\.scanner\s*\{\s*padding-top:\s*6px/);
    expect(abschnitt).toMatch(/\.scanner > \.scanner-aktionen\s*\{\s*flex-wrap:\s*nowrap/);
    expect(abschnitt).toMatch(/grid-template-areas:\s*"titel titel" "schritte lampe" "schritte hinweise"/);
  });
});
