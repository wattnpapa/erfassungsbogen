/**
 * Runde 12, Block Layout: neuer-nutzer.md (R12-N1 bis N7), mobile-ui.md (R12-M1 bis M3), handschuh-bedienung.md (R12-G3).
 * Verhalten, wo jsdom es prüfen kann; Stylesheet und Begleitseiten als Quelltext (jsdom rechnet kein Layout).
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuePerson, neuerBogen, neuesFahrzeug } from "./hilfen";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittEinheit } from "./schritte/einheit";
import { SchrittFahrzeuge } from "./schritte/fahrzeuge";
import { SchrittPersonal } from "./schritte/personal";
import { LagemonitorBlock } from "./lagemonitor-ui";
import { Dialogschicht } from "./dialoge";
import { kennzeichenSchreibweise } from "./schreibweise";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

const lies = (pfad: string) => readFileSync(new URL(pfad, import.meta.url), "utf8");
const html = lies("../../index.html");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 12 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 12 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

describe("Anleitung folgt der App (R12-N1)", () => {
  const anleitung = lies("../../public/anleitung.html");
  const text = anleitung.replace(/\s+/g, " ");
  it("Schritt 2 nennt die Felder, die es gibt: Zeitraum, Auftrag, Übung; kein Feld „Meldekopf“ im Bogen", () => {
    expect(text).toContain("Zeitraum von/bis");
    expect(text).toContain("„Dies ist eine Übung“");
    expect(text).not.toMatch(/Einsatzstichwort, Auftrag, Meldekopf/);
    expect(text).not.toContain("Zeitpunkt des Eintreffens ein.");
  });
  it("die Signatur ist automatisch, nicht optional", () => {
    expect(text).not.toMatch(/Optional versiehst du/);
    expect(text).not.toContain("Optionale Ed25519-Signatur");
    expect(text).toContain("trägt automatisch eine Ed25519-Signatur");
  });
  it("das PDF steht im Dialog „Bogen übergeben…“, nicht am Ende der Übersicht", () => {
    expect(text).not.toContain("Am Ende der Gesamtübersicht steht „PDF erzeugen“");
    expect(text).toContain("„Bogen übergeben…“ einen Dialog; dort steht „PDF erzeugen“");
  });
  it("das JSON-LD der Seite sagt dasselbe wie der Text", () => {
    expect(anleitung).not.toMatch(/"text": "Trag Einsatzstichwort/);
    expect(anleitung).toContain("Dies ist eine Übung“.\" }");
  });
  it("die Herkunftsprüfung heißt auch auf den Rollenseiten nicht mehr „optional“", () => {
    expect(lies("../../public/asb.html").replace(/\s+/g, " ")).not.toContain("versiehst du einen Bogen mit einer Ed25519-Signatur");
    expect(lies("../../public/meldekopf.html").replace(/\s+/g, " ")).not.toContain("können eine Ed25519-Signatur tragen");
  });
  it("jede in der Anleitung genannte Beschriftung kommt in der App vor", () => {
    const quelle = lies("./app.tsx") + lies("./schritte/einsatz.tsx") + lies("./schritte/uebersicht.tsx");
    for (const b of ["Bogen übergeben…", "PDF erzeugen", "Dies ist eine Übung", "Zeitraum von"]) expect(quelle).toContain(b);
  });
});

describe("Organisationswechsel: die Zeile nennt die letzte Wahl und das Ziel von „Rückgängig“ (R12-N2)", () => {
  it("dreimal gewechselt: die Zeile nennt die letzte Wahl, „Rückgängig“ benennt THW und führt dorthin", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittEinheit} />);
    const wahl = screen.getByLabelText("Organisation") as HTMLSelectElement;
    const namen = [...wahl.options].map((o) => o.textContent!).filter((n) => n !== "THW");
    const [a, b, c] = namen;
    await nutzer.selectOptions(wahl, a!);
    await nutzer.selectOptions(wahl, b!);
    await nutzer.selectOptions(wahl, c!);
    expect(wahl.selectedOptions[0]?.textContent).toBe(c);

    const zeile = document.querySelector(".quittung-daumen")!;
    expect(zeile.textContent).toContain(`Organisation auf „${c}" gewechselt`);
    expect(zeile.textContent).not.toContain(`Organisation auf „${a}" gewechselt`);
    expect(zeile.textContent).toContain(`Rückgängig stellt „THW" wieder her.`);
    // Keine Zahl, die sich nicht ändert.
    expect(zeile.textContent).not.toMatch(/Stärke 0 → 0/);

    await nutzer.click(within(zeile as HTMLElement).getByRole("button", { name: "Rückgängig" }));
    expect((screen.getByLabelText("Organisation") as HTMLSelectElement).selectedOptions[0]?.textContent).toBe("THW");
  });
});

describe("Schritt 4: Fahrzeugtyp und Sitzplätze (R12-N3)", () => {
  it("der Platzhalter ist kurz genug für das 112 px breite Feld, die Langform des Typs steht ungekürzt darunter", () => {
    const start = neuerBogen();
    start.fahrzeuge = [{ ...neuesFahrzeug(), typ: { code: 3 } }];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);
    const sitz = screen.getByLabelText("Sitzplätze") as HTMLInputElement;
    expect(sitz.placeholder).toMatch(/^\d+ \(Richtw\.\)$/);
    expect(sitz.placeholder.length).toBeLessThanOrEqual(12);
    const lang = screen.getByTestId("typ-langform");
    expect(lang.textContent!.length).toBeGreaterThan(3);
    // Die Langform ist der Name des Typs, nicht Kürzel und Name.
    expect((screen.getByLabelText("Fahrzeugtyp") as HTMLInputElement).value).toContain(lang.textContent!);
  });
  it("ohne gewählten Typ steht keine Langform da", () => {
    const start = neuerBogen();
    start.fahrzeuge = [neuesFahrzeug()];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);
    expect(screen.queryByTestId("typ-langform")).toBeNull();
  });
});

describe("Schritt 1: der Knopf nennt, was er anlegt (R12-N4)", () => {
  it("„Regionalbereich und Landesverband anlegen“ legt genau zwei Ebenen an", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittEinheit} />);
    expect(screen.queryByRole("button", { name: /Vorlage/ })).toBeNull();
    const ebenen = () => screen.getAllByLabelText(/^(Ort der Einheit|Name)/).length;
    const vorher = ebenen();
    await nutzer.click(screen.getByRole("button", { name: "Regionalbereich und Landesverband anlegen" }));
    expect(ebenen()).toBe(vorher + 2);
    expect(screen.queryByRole("button", { name: "Regionalbereich und Landesverband anlegen" })).toBeNull();
  });
});

describe("Lagemonitor: Zweck und Wirkung von Beginn, „Jetzt“ und „Beginn entfernen“ (R12-N5)", () => {
  it("ein Satz erklärt die Dauer seit Beginn und beide Knöpfe; „Löschen“ heißt „Beginn entfernen“", async () => {
    const nutzer = userEvent.setup();
    render(
      <>
        <LagemonitorBlock einsatzId="e1" alleIds={["e1"]} />
        <Dialogschicht />
      </>,
    );
    const satz = document.querySelector(".lm-beginn-erklaerung")!.textContent!;
    expect(satz).toContain("Dauer seit dem Einsatzbeginn");
    expect(satz).toContain("„Jetzt“");
    expect(satz).toContain("„Beginn entfernen“");
    expect(screen.queryByRole("button", { name: "Löschen" })).toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "Jetzt" }));
    await nutzer.click(screen.getByRole("button", { name: "Beginn entfernen" }));
    // Seit R13-D1 fragt „Beginn entfernen“ nach, wie „Jetzt“ bei vorhandenem Beginn.
    const frage = await screen.findByRole("dialog", { name: "Einsatzbeginn entfernen?" });
    await nutzer.click(within(frage).getByRole("button", { name: "Beginn entfernen" }));
    expect(screen.queryByRole("button", { name: "Beginn entfernen" })).toBeNull();
  });
});

describe("Namen einfügen lässt die gewählte Ansicht stehen (R12-N6)", () => {
  it("Karten gewählt, Namen übernommen: weiter Karten", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} />);
    await nutzer.click(screen.getByLabelText("Alle Angaben (Karten)"));
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.type(within(dialog).getByRole("textbox"), "Muster, Max\nErika Musterfrau");
    await nutzer.click(within(dialog).getByRole("radio", { name: "Vorname Nachname" })); // R18-S7: keine Vorauswahl
    await nutzer.click(within(dialog).getByRole("button", { name: "2 Personen übernehmen" }));
    expect((screen.getByLabelText("Alle Angaben (Karten)") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Kurz-Liste (Tabelle)") as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByText(/Person \d+ von 2/).length).toBeGreaterThan(0);
  });
  it("Kurz-Liste gewählt, Namen übernommen: weiter Kurz-Liste", async () => {
    const nutzer = userEvent.setup();
    const start = neuerBogen();
    start.personal = [{ ...neuePerson(), nachname: "Alt" }];
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={start} />);
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.type(within(dialog).getByRole("textbox"), "Muster, Max");
    await nutzer.click(within(dialog).getByRole("button", { name: /übernehmen$/ }));
    expect((screen.getByLabelText("Kurz-Liste (Tabelle)") as HTMLInputElement).checked).toBe(true);
  });
});

describe("Kennzeichen in einheitlicher Schreibweise (R12-N7)", () => {
  it("THW-Kennzeichen: Großbuchstaben und Trennstrich", () => {
    expect(kennzeichenSchreibweise("thw 80101")).toBe("THW-80101");
    expect(kennzeichenSchreibweise("THW80101")).toBe("THW-80101");
    expect(kennzeichenSchreibweise(" thw–80101 ")).toBe("THW-80101");
    expect(kennzeichenSchreibweise("THW-80101")).toBe("THW-80101");
  });
  it("andere Kennzeichen: nur groß, Leerraum zusammengezogen, Gliederung bleibt", () => {
    expect(kennzeichenSchreibweise("ol  fw 2041")).toBe("OL FW 2041");
    expect(kennzeichenSchreibweise("OL-FW 2041")).toBe("OL-FW 2041");
    expect(kennzeichenSchreibweise("thw")).toBe("THW");
    expect(kennzeichenSchreibweise("")).toBe("");
  });
  it("beim Verlassen des Feldes steht „THW-80101“ im Feld und im Bogen", async () => {
    const nutzer = userEvent.setup();
    const start = neuerBogen();
    start.fahrzeuge = [neuesFahrzeug()];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);
    const feld = screen.getByLabelText("Kennzeichen") as HTMLInputElement;
    await nutzer.type(feld, "thw 80101");
    expect(feld.value).toBe("thw 80101"); // beim Tippen wird nichts umgeschrieben
    fireEvent.blur(feld);
    expect(feld.value).toBe("THW-80101");
  });
  it("ein leeres Feld bleibt leer", () => {
    const start = neuerBogen();
    start.fahrzeuge = [neuesFahrzeug()];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);
    const feld = screen.getByLabelText("Kennzeichen") as HTMLInputElement;
    fireEvent.blur(feld);
    expect(feld.value).toBe("");
  });
});

describe("Stilregeln der Einsatzansicht am Telefon (R12-M1, R12-M2, R12-M3, R12-G3)", () => {
  it("„Suchen, sortieren, filtern“ trägt Marke und Rahmen, aufgeklappt ▾ (R12-M1)", () => {
    expect(abschnitt).toMatch(/details\.einheiten-filter-wahl > summary::before\s*\{\s*content:\s*"▸"/);
    expect(abschnitt).toMatch(/details\.einheiten-filter-wahl\[open\] > summary::before\s*\{\s*content:\s*"▾"/);
    expect(abschnitt).toMatch(/details\.einheiten-filter-wahl > summary\s*\{[^}]*border:\s*var\(--strich\) solid var\(--linie-stark\)/);
  });
  it("Kachelbeschriftungen bleiben quer bei mindestens 12 px (R12-M2)", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\) and \(width > 30rem\)/);
    expect(abschnitt).toMatch(/\.staerke-leiste:has\(> div:nth-child\(5\)\) span\s*\{\s*font-size:\s*max\(var\(--t-xs\), 12px\)/);
    expect(abschnitt).not.toMatch(/font-size:\s*min\([^)]*11px\)/);
  });
  it("die klebende Namensspalte belegt am Telefon höchstens ein Drittel des Rahmens (R12-M3)", () => {
    expect(abschnitt).toMatch(/@container \(min-width: 12\.5rem\) and \(max-width: 30rem\)\s*\{\s*table\.einheiten-tabelle > \* > tr > :first-child\s*\{[^}]*max-width:\s*34cqw/);
  });
  it("die Karte trägt den Rand schon vor dem Abrücken, der Statusknopf behält seine Breite (R12-G3)", () => {
    expect(abschnitt).toMatch(/\.einheit-zeile:not\(\.gestrichen\):not\(\.kompakt\)\s*\{\s*border-left:\s*3px solid transparent;\s*padding-left:\s*var\(--r-2\)/);
    expect(abschnitt).toMatch(/\.einheit-zeile button\.wechsel-knopf\s*\{\s*min-width:\s*9rem/);
    // Der gestrichelte Rand der abgerückten Karte hat dieselben Maße wie der durchsichtige.
    expect(html).toMatch(/\.einheit-zeile\.gestrichen\s*\{\s*border-left:\s*3px dashed var\(--linie-stark\);\s*padding-left:\s*var\(--r-2\)/);
  });
  it("alle drei Zustände des Statusknopfes tragen die Klasse wechsel-knopf (R12-G3, Markup)", () => {
    const quelle = lies("./einsaetze-ui.tsx");
    expect(quelle).toMatch(/className="wechsel-knopf" aria-describedby=\{nameId\} disabled=\{prellt\} onClick=\{\(\) => void statusSetzen\(MeldeStatus\.ABGERUECKT\)\}/);
    expect(quelle).toMatch(/className="wechsel-knopf" aria-describedby=\{nameId\} disabled=\{prellt\} onClick=\{\(\) => void statusSetzen\(MeldeStatus\.ANWESEND\)\}/);
    expect(quelle).toContain('className="wechsel-knopf wechsel-quittiert"');
  });
});
